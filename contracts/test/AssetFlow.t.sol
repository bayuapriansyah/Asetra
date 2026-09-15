// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AssetFlow} from "../src/AssetFlow.sol";
import {IERC20} from "../src/AssetFlow.sol";

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

contract AssetFlowTest is Test {
    AssetFlow public assetFlow;
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
        assetFlow = new AssetFlow(address(usdt));
        maturity = block.timestamp + 90 days;

        usdt.mint(investor, 1_000_000e6);
        usdt.mint(investor2, 1_000_000e6);
    }

    function _createAsset() internal returns (uint256) {
        vm.prank(issuer);
        return assetFlow.createAsset(
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
        assetFlow.verifyAsset(assetId);
    }

    function _tokenizeAsset(uint256 assetId) internal {
        vm.prank(issuer);
        assetFlow.tokenizeAsset(assetId, TOKEN_SUPPLY);
    }

    function _listAsset(uint256 assetId) internal {
        vm.prank(issuer);
        assetFlow.listAsset(assetId);
    }

    function _invest(uint256 assetId, uint256 units) internal {
        uint256 assetPrice = assetFlow.assetPricePerUnit(assetId);
        uint256 cost = units * assetPrice;
        vm.prank(investor);
        usdt.approve(address(assetFlow), cost);
        vm.prank(investor);
        assetFlow.buyTokens(assetId, units);
    }

    function test_CreateAsset() public {
        uint256 assetId = _createAsset();
        assertEq(assetFlow.assetName(assetId), "INV-2048");
        assertEq(assetFlow.assetIssuer(assetId), issuer);
        assertEq(assetFlow.assetFaceValue(assetId), FACE_VALUE);
        assertEq(assetFlow.assetState(assetId), uint8(AssetFlow.AssetState.CREATED));
    }

    function test_VerifyAsset() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        assertEq(assetFlow.assetState(assetId), uint8(AssetFlow.AssetState.VERIFIED));
        assertEq(assetFlow.assetVerifier(assetId), admin);
    }

    function test_TokenizeAsset() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        assertEq(assetFlow.assetState(assetId), uint8(AssetFlow.AssetState.TOKENIZED));
        assertEq(assetFlow.assetTokenSupply(assetId), TOKEN_SUPPLY);
    }

    function test_ListAsset() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        assertEq(assetFlow.assetState(assetId), uint8(AssetFlow.AssetState.LISTED));
    }

    function test_BuyTokens() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, 1000);

        (uint256 amt, , , , , , bool active) = assetFlow.getPosition(assetId, investor);
        assertEq(amt, 1000);
        assertTrue(active);
    }

    function test_InvestmentTransitionsToFundedThenActive() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);
        assertEq(assetFlow.assetState(assetId), uint8(AssetFlow.AssetState.ACTIVE));
    }

    function test_Revert_CannotVerifyWithoutAsset() public {
        vm.expectRevert(AssetFlow.AssetNotFound.selector);
        assetFlow.verifyAsset(999);
    }

    function test_Revert_CannotVerifyTwice() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        vm.expectRevert(AssetFlow.InvalidStateTransition.selector);
        assetFlow.verifyAsset(assetId);
    }

    function test_Revert_CannotTokenizeUnverified() public {
        uint256 assetId = _createAsset();
        vm.prank(issuer);
        vm.expectRevert(AssetFlow.InvalidStateTransition.selector);
        assetFlow.tokenizeAsset(assetId, TOKEN_SUPPLY);
    }

    function test_Revert_CannotListUnTokenized() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        vm.prank(issuer);
        vm.expectRevert(AssetFlow.InvalidStateTransition.selector);
        assetFlow.listAsset(assetId);
    }

    function test_Revert_OnlyIssuerCanTokenize() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        vm.expectRevert(AssetFlow.Unauthorized.selector);
        assetFlow.tokenizeAsset(assetId, TOKEN_SUPPLY);
    }

    function test_Revert_OnlyIssuerCanList() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        vm.expectRevert(AssetFlow.Unauthorized.selector);
        assetFlow.listAsset(assetId);
    }

    function test_Revert_UnauthorizedVerifier() public {
        uint256 assetId = _createAsset();
        vm.prank(investor);
        vm.expectRevert(AssetFlow.Unauthorized.selector);
        assetFlow.verifyAsset(assetId);
    }

    function test_CreateSellOrder() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, 1000);

        vm.prank(investor);
        uint256 orderId = assetFlow.createSellOrder(assetId, 500, 0.98e6);
        (, , , uint256 amt, , bool isActive, ) = assetFlow.getSellOrder(orderId);
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
        uint256 orderId = assetFlow.createSellOrder(assetId, 500, 0.98e6);
        vm.prank(investor);
        assetFlow.cancelSellOrder(orderId);

        (, , , , , bool isActive, ) = assetFlow.getSellOrder(orderId);
        assertFalse(isActive);
    }

    function test_ExecuteTrade() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, 1000);

        vm.prank(investor);
        uint256 orderId = assetFlow.createSellOrder(assetId, 500, 0.94e6);

        uint256 cost = 500 * 0.94e6;
        usdt.mint(investor2, cost);
        vm.prank(investor2);
        usdt.approve(address(assetFlow), cost);
        vm.prank(investor2);
        assetFlow.executeTrade(orderId, 500);

        (uint256 amt, , , , , , ) = assetFlow.getPosition(assetId, investor2);
        assertEq(amt, 500);
    }

    function test_DepositCollateral() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, 1000);

        vm.prank(investor);
        assetFlow.depositCollateral(assetId, 500);

        (, , , , , uint256 collateralAmt, ) = assetFlow.getPosition(assetId, investor);
        assertEq(collateralAmt, 500);
    }

    function test_WithdrawCollateral() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, 1000);

        vm.prank(investor);
        assetFlow.depositCollateral(assetId, 500);
        vm.prank(investor);
        assetFlow.withdrawCollateral(assetId, 200);

        (, , , , , uint256 collateralAmt, ) = assetFlow.getPosition(assetId, investor);
        assertEq(collateralAmt, 300);
    }

    function test_Revert_WithdrawCollateralViolatesDebt() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.prank(investor);
        assetFlow.depositCollateral(assetId, 100);
        vm.prank(investor);
        assetFlow.borrow(assetId, 57e6);

        vm.prank(investor);
        vm.expectRevert(AssetFlow.CollateralWithdrawalViolatesDebt.selector);
        assetFlow.withdrawCollateral(assetId, 100);
    }

    function test_Borrow() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.prank(investor);
        assetFlow.depositCollateral(assetId, 100);

        uint256 balBefore = usdt.balanceOf(investor);
        vm.prank(investor);
        assetFlow.borrow(assetId, 0.05e6);

        assertEq(assetFlow.getBorrowedAmount(assetId, investor), 0.05e6);
        assertEq(usdt.balanceOf(investor) - balBefore, 0.05e6);
    }

    function test_Repay() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.prank(investor);
        assetFlow.depositCollateral(assetId, 100);
        vm.prank(investor);
        assetFlow.borrow(assetId, 0.05e6);

        vm.prank(investor);
        usdt.approve(address(assetFlow), 0.05e6);
        vm.prank(investor);
        assetFlow.repay(assetId, 0.05e6);

        assertEq(assetFlow.getBorrowedAmount(assetId, investor), 0);
    }

    function test_GetHealth() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.prank(investor);
        assetFlow.depositCollateral(assetId, 100);

        (, bool healthy) = assetFlow.getHealth(assetId, investor);
        assertTrue(healthy);
    }

    function test_CalculateYield() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.warp(block.timestamp + 30 days);
        uint256 yield_ = assetFlow.calculateYield(assetId, investor);
        assertTrue(yield_ > 0);
    }

    function test_GetHoldingScore() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.warp(block.timestamp + 30 days);
        uint256 score = assetFlow.getHoldingScore(assetId, investor);
        assertEq(score, TOKEN_SUPPLY * 30);
    }

    function test_MatureAsset() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.warp(maturity);
        assetFlow.matureAsset(assetId);
        assertEq(assetFlow.assetState(assetId), uint8(AssetFlow.AssetState.MATURED));
    }

    function test_Revert_CannotMatureEarly() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.expectRevert(AssetFlow.MaturityNotReached.selector);
        assetFlow.matureAsset(assetId);
    }

    function test_SettleAsset() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.warp(maturity);
        assetFlow.matureAsset(assetId);

        vm.warp(block.timestamp + 1 days);
        vm.prank(investor);
        assetFlow.settleAsset(assetId);

        assertEq(assetFlow.assetState(assetId), uint8(AssetFlow.AssetState.SETTLED));
    }

    function test_Revert_CannotSettleBeforeMaturity() public {
        uint256 assetId = _createAsset();
        _verifyAsset(assetId);
        _tokenizeAsset(assetId);
        _listAsset(assetId);
        _invest(assetId, TOKEN_SUPPLY);

        vm.prank(investor);
        vm.expectRevert(AssetFlow.InvalidStateTransition.selector);
        assetFlow.settleAsset(assetId);
    }
}
