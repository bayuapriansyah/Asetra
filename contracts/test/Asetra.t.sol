// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Asetra} from "../src/Asetra.sol";
import {IERC20} from "../src/Asetra.sol";

contract MockUSDT is IERC20 {
    string public name = "Tether USD";
    string public symbol = "USDT";
    uint8 public constant decimals = 6;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;

    function totalSupply() external view returns (uint256) { return _totalSupply; }

    function balanceOf(address account) external view returns (uint256) { return _balances[account]; }

    function allowance(address owner, address spender) external view returns (uint256) { return _allowances[owner][spender]; }

    function transfer(address to, uint256 amount) external returns (bool) {
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        _allowances[from][msg.sender] -= amount;
        _balances[from] -= amount;
        _balances[to] += amount;
        return true;
    }

    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        _totalSupply += amount;
    }
}

contract AsetraTest is Test {
    Asetra public asetra;
    MockUSDT public usdt;

    address public admin = address(this);
    address public issuer = address(0x1);
    address public investor = address(0x2);
    address public investor2 = address(0x3);
    address public buyer = address(0x4);

    uint256 public constant FACE_VALUE = 100000e6;
    uint256 public constant TOKEN_SUPPLY = 100000;
    uint256 public constant YIELD_BPS = 820;
    uint256 public maturity;

    function setUp() public {
        usdt = new MockUSDT();
        asetra = new Asetra(address(usdt));
        maturity = block.timestamp + 90 days;

        usdt.mint(investor, 1_000_000e6);
        usdt.mint(investor2, 1_000_000e6);
    }

    function _createAsset() internal returns (uint256) {
        vm.prank(issuer);
        return asetra.createAsset(
            "Invoice",
            "INV-2048",
            "INV-2048-REF",
            buyer,
            FACE_VALUE,
            maturity,
            YIELD_BPS,
            keccak256("document-hash")
        );
    }

    function _verifyAsset(uint256 assetId) internal {
        asetra.verifyAsset(assetId);
    }

    function _tokenizeAsset(uint256 assetId) internal {
        vm.prank(issuer);
        asetra.tokenizeAsset(assetId, TOKEN_SUPPLY);
    }

    function _listAsset(uint256 assetId) internal {
        vm.prank(issuer);
        asetra.listAsset(assetId);
    }

    function _invest(uint256 assetId, uint256 units) internal {
        uint256 assetPrice = asetra.assetPricePerUnit(assetId);
        uint256 cost = units * assetPrice;
        vm.prank(investor);
        usdt.approve(address(asetra), cost);
        vm.prank(investor);
        asetra.buyTokens(assetId, units);
    }

    function test_CreateAsset() public {
        uint256 assetId = _createAsset();
        assertEq(asetra.assetName(assetId), "INV-2048");
        assertEq(asetra.assetIssuer(assetId), issuer);
        assertEq(asetra.assetFaceValue(assetId), FACE_VALUE);
        assertEq(asetra.assetState(assetId), uint8(Asetra.AssetState.CREATED));
    }

    function test_VerifyAsset() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        assertEq(asetra.assetState(assetId), uint8(Asetra.AssetState.VERIFIED));
        assertEq(asetra.assetVerifier(assetId), admin);
    }

    function test_TokenizeAsset() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        assertEq(asetra.assetState(assetId), uint8(Asetra.AssetState.TOKENIZED));
        assertEq(asetra.assetTokenSupply(assetId), TOKEN_SUPPLY);
    }

    function test_ListAsset() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        assertEq(asetra.assetState(assetId), uint8(Asetra.AssetState.LISTED));
    }

    function test_BuyTokens() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, 1000);

        (uint256 amt, , , , , , , bool active) = asetra.getPosition(assetId, investor);
        assertEq(amt, 1000);
        assertTrue(active);
    }

    function test_InvestmentTransitionsToFundedThenActive() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);
        assertEq(asetra.assetState(assetId), uint8(Asetra.AssetState.ACTIVE));
    }

    function test_Revert_CannotVerifyWithoutAsset() public {
        vm.expectRevert(Asetra.AssetNotFound.selector);
        asetra.verifyAsset(999);
    }

    function test_Revert_CannotVerifyTwice() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        vm.expectRevert(Asetra.InvalidStateTransition.selector);
        asetra.verifyAsset(assetId);
    }

    function test_Revert_CannotTokenizeUnverified() public {
        uint256 assetId = _createAsset();
        vm.prank(issuer);
        vm.expectRevert(Asetra.InvalidStateTransition.selector);
        asetra.tokenizeAsset(assetId, TOKEN_SUPPLY);
    }

    function test_Revert_CannotListUnTokenized() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        vm.prank(issuer);
        vm.expectRevert(Asetra.InvalidStateTransition.selector);
        asetra.listAsset(assetId);
    }

    function test_Revert_OnlyIssuerCanTokenize() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        vm.expectRevert(Asetra.Unauthorized.selector);
        asetra.tokenizeAsset(assetId, TOKEN_SUPPLY);
    }

    function test_Revert_OnlyIssuerCanList() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        vm.expectRevert(Asetra.Unauthorized.selector);
        asetra.listAsset(assetId);
    }

    function test_Revert_UnauthorizedVerifier() public {
        uint256 assetId = _createAsset();
        vm.prank(investor);
        vm.expectRevert(Asetra.Unauthorized.selector);
        asetra.verifyAsset(assetId);
    }

    function test_CreateSellOrder() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, 1000);

        vm.prank(investor);
        uint256 orderId = asetra.createSellOrder(assetId, 500, 0.98e6);
        (, , , uint256 amt, , bool isActive, ) = asetra.getSellOrder(orderId);
        assertEq(amt, 500);
        assertTrue(isActive);
    }

    function test_CancelSellOrder() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, 1000);

        vm.prank(investor);
        uint256 orderId = asetra.createSellOrder(assetId, 500, 0.98e6);
        vm.prank(investor);
        asetra.cancelSellOrder(orderId);

        (, , , , , bool isActive, ) = asetra.getSellOrder(orderId);
        assertFalse(isActive);
    }

    function test_ExecuteTrade() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, 1000);

        vm.prank(investor);
        uint256 orderId = asetra.createSellOrder(assetId, 500, 0.94e6);

        uint256 cost = 500 * 0.94e6;
        usdt.mint(investor2, cost);
        vm.prank(investor2);
        usdt.approve(address(asetra), cost);
        vm.prank(investor2);
        asetra.executeTrade(orderId, 500);

        (uint256 amt, , , , , , , ) = asetra.getPosition(assetId, investor2);
        assertEq(amt, 500);
    }

    function test_DepositCollateral() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, 1000);

        vm.prank(investor);
        asetra.depositCollateral(assetId, 500);

        (, , , , , uint256 collateralAmt, , ) = asetra.getPosition(assetId, investor);
        assertEq(collateralAmt, 500);
    }

    function test_WithdrawCollateral() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, 1000);

        vm.prank(investor);
        asetra.depositCollateral(assetId, 500);
        vm.prank(investor);
        asetra.withdrawCollateral(assetId, 200);

        (, , , , , uint256 collateralAmt, , ) = asetra.getPosition(assetId, investor);
        assertEq(collateralAmt, 300);
    }

    function test_Revert_WithdrawCollateralViolatesDebt() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.prank(investor);
        asetra.depositCollateral(assetId, 100);
        vm.prank(investor);
        asetra.borrow(assetId, 57e6);

        vm.prank(investor);
        vm.expectRevert(Asetra.CollateralWithdrawalViolatesDebt.selector);
        asetra.withdrawCollateral(assetId, 100);
    }

    function test_Borrow() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.prank(investor);
        asetra.depositCollateral(assetId, 100);

        uint256 balBefore = usdt.balanceOf(investor);
        vm.prank(investor);
        asetra.borrow(assetId, 0.05e6);

        assertEq(asetra.getBorrowedAmount(assetId, investor), 0.05e6);
        assertEq(usdt.balanceOf(investor) - balBefore, 0.05e6);
    }

    function test_Repay() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.prank(investor);
        asetra.depositCollateral(assetId, 100);
        vm.prank(investor);
        asetra.borrow(assetId, 0.05e6);

        vm.prank(investor);
        usdt.approve(address(asetra), 0.05e6);
        vm.prank(investor);
        asetra.repay(assetId, 0.05e6);

        assertEq(asetra.getBorrowedAmount(assetId, investor), 0);
    }

    function test_GetHealth() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.prank(investor);
        asetra.depositCollateral(assetId, 100);

        (, bool healthy) = asetra.getHealth(assetId, investor);
        assertTrue(healthy);
    }

    function test_CalculateYield() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.warp(block.timestamp + 30 days);
        uint256 yield_ = asetra.calculateYield(assetId, investor);
        assertTrue(yield_ > 0);
    }

    function test_GetHoldingScore() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.warp(block.timestamp + 30 days);
        uint256 score = asetra.getHoldingScore(assetId, investor);
        assertEq(score, TOKEN_SUPPLY * 30);
    }

    function test_MatureAsset() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.warp(maturity);
        asetra.matureAsset(assetId);
        assertEq(asetra.assetState(assetId), uint8(Asetra.AssetState.MATURED));
    }

    function test_Revert_CannotMatureEarly() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.expectRevert(Asetra.MaturityNotReached.selector);
        asetra.matureAsset(assetId);
    }

    function test_SettleAsset() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.warp(maturity);
        asetra.matureAsset(assetId);

        vm.warp(block.timestamp + 1 days);
        vm.prank(investor);
        asetra.settleAsset(assetId);

        assertEq(asetra.assetState(assetId), uint8(Asetra.AssetState.SETTLED));
    }

    function test_Revert_CannotSettleBeforeMaturity() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.prank(investor);
        vm.expectRevert(Asetra.InvalidStateTransition.selector);
        asetra.settleAsset(assetId);
    }

    function test_WithdrawRaisedFunds() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        uint256 expectedFunds = TOKEN_SUPPLY * asetra.assetPricePerUnit(assetId);
        uint256 balBefore = usdt.balanceOf(issuer);

        vm.prank(issuer);
        asetra.withdrawRaisedFunds(assetId);

        assertEq(usdt.balanceOf(issuer) - balBefore, expectedFunds);
        assertEq(asetra.assetFundedAmount(assetId), 0);
    }

    function test_Revert_OnlyIssuerCanWithdraw() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.prank(investor);
        vm.expectRevert(Asetra.Unauthorized.selector);
        asetra.withdrawRaisedFunds(assetId);
    }

    function test_Revert_CannotWithdrawZero() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.prank(issuer);
        asetra.withdrawRaisedFunds(assetId);

        vm.prank(issuer);
        vm.expectRevert(Asetra.InvalidAmount.selector);
        asetra.withdrawRaisedFunds(assetId);
    }

    // ========== PAYMENT ENGINE TESTS ==========

    function _fundInvestorForPayment(address user) internal {
        usdt.mint(user, 100_000e6);
    }

    function test_RecordPayment() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.prank(admin);
        asetra.recordPayment(assetId, 20_000e6, keccak256("evidence-1"));

        assertEq(asetra.totalPaid(assetId), 20_000e6);
        assertEq(asetra.getPaymentCount(assetId), 1);

        (uint256 amt, , bytes32 hash, address recorder) = asetra.getPayment(assetId, 0);
        assertEq(amt, 20_000e6);
        assertEq(hash, keccak256("evidence-1"));
        assertEq(recorder, admin);
    }

    function test_FundSettlement() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        _fundInvestorForPayment(admin);
        vm.prank(admin);
        usdt.approve(address(asetra), 20_000e6);
        vm.prank(admin);
        asetra.fundSettlement(assetId, 20_000e6);

        assertEq(asetra.paymentFunded(assetId), 20_000e6);
        assertEq(usdt.balanceOf(address(asetra)), TOKEN_SUPPLY * asetra.assetPricePerUnit(assetId) + 20_000e6);
    }

    function test_ClaimProceeds() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.prank(admin);
        asetra.recordPayment(assetId, 20_000e6, keccak256("evidence-1"));

        _fundInvestorForPayment(admin);
        vm.prank(admin);
        usdt.approve(address(asetra), 20_000e6);
        vm.prank(admin);
        asetra.fundSettlement(assetId, 20_000e6);

        uint256 balBefore = usdt.balanceOf(investor);
        vm.prank(investor);
        asetra.claimProceeds(assetId);

        uint256 expectedClaim = (20_000e6 * 1e18 / TOKEN_SUPPLY) * TOKEN_SUPPLY / 1e18;
        assertEq(usdt.balanceOf(investor) - balBefore, expectedClaim);
    }

    function test_Revert_OnlyAdminCanRecordPayment() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);

        vm.prank(investor);
        vm.expectRevert(Asetra.Unauthorized.selector);
        asetra.recordPayment(assetId, 20_000e6, keccak256("evidence-1"));
    }

    function test_Revert_PaymentExceedsFaceValue() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);

        vm.prank(admin);
        vm.expectRevert(Asetra.PaymentExceedsFaceValue.selector);
        asetra.recordPayment(assetId, FACE_VALUE + 1, keccak256("evidence-1"));
    }

    function test_Revert_ClaimProceedsNoPayment() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.prank(investor);
        vm.expectRevert(Asetra.InvalidAmount.selector);
        asetra.claimProceeds(assetId);
    }

    function test_MultiplePaymentsAndClaims() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.prank(admin);
        asetra.recordPayment(assetId, 20_000e6, keccak256("evidence-1"));

        _fundInvestorForPayment(admin);
        vm.prank(admin);
        usdt.approve(address(asetra), 50_000e6);
        vm.prank(admin);
        asetra.fundSettlement(assetId, 20_000e6);

        vm.prank(investor);
        asetra.claimProceeds(assetId);

        vm.prank(admin);
        asetra.recordPayment(assetId, 15_000e6, keccak256("evidence-2"));

        vm.prank(admin);
        asetra.fundSettlement(assetId, 15_000e6);

        vm.prank(investor);
        asetra.claimProceeds(assetId);

        assertEq(asetra.totalPaid(assetId), 35_000e6);
        assertEq(asetra.getPaymentCount(assetId), 2);
    }

    function test_ClaimCappedAtSettlementPool() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.prank(admin);
        asetra.recordPayment(assetId, 50_000e6, keccak256("evidence-1"));

        _fundInvestorForPayment(admin);
        vm.prank(admin);
        usdt.approve(address(asetra), 50_000e6);
        vm.prank(admin);
        asetra.fundSettlement(assetId, 40_000e6);

        uint256 claimable = asetra.getClaimableProceeds(assetId, investor);
        assertEq(claimable, 40_000e6);

        uint256 balBefore = usdt.balanceOf(investor);
        vm.prank(investor);
        asetra.claimProceeds(assetId);

        assertEq(usdt.balanceOf(investor) - balBefore, 40_000e6);
        assertEq(asetra.totalSettled(assetId), 40_000e6);
    }

    function test_TotalRaisedPersistsAfterWithdraw() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        uint256 expectedRaised = TOKEN_SUPPLY * asetra.assetPricePerUnit(assetId);
        assertEq(asetra.totalRaised(assetId), expectedRaised);
        assertEq(asetra.assetFundedAmount(assetId), expectedRaised);

        vm.prank(issuer);
        asetra.withdrawRaisedFunds(assetId);

        assertEq(asetra.assetFundedAmount(assetId), 0);
        assertEq(asetra.totalRaised(assetId), expectedRaised);
    }
}
