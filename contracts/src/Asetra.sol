// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Asetra {

    enum AssetState {
        CREATED,
        VERIFIED,
        TOKENIZED,
        LISTED,
        FUNDED,
        ACTIVE,
        MATURED,
        SETTLED
    }

    struct Position {
        uint256 amount;
        uint256 totalInvested;
        uint256 holdingStart;
        uint256 accruedYield;
        uint256 claimedYield;
        uint256 collateralAmount;
        uint256 lastClaimedPPU;
        bool active;
    }

    struct SellOrder {
        uint256 orderId;
        uint256 assetId;
        address seller;
        uint256 amount;
        uint256 pricePerUnit;
        bool active;
        uint256 createdAt;
    }

    struct Payment {
        uint256 amount;
        uint256 timestamp;
        bytes32 evidenceHash;
        address recordedBy;
    }

    error Unauthorized();
    error InvalidStateTransition();
    error AssetNotFound();
    error InsufficientUnits();
    error InsufficientFunds();
    error InsufficientCredit();
    error CollateralWithdrawalViolatesDebt();
    error AssetNotInvestable();
    error MaturityNotReached();
    error InvalidAmount();
    error OrderNotFound();
    error OrderNotActive();
    error CannotTradeWithSelf();
    error TransferFailed();
    error InsufficientFunding();
    error PaymentExceedsFaceValue();

    address public admin;
    IERC20 public immutable tUSDT;
    uint256 public nextAssetId;
    uint256 public nextOrderId = 1;

    // Asset fields stored individually (no large struct)
    mapping(uint256 => uint256) public assetId_;
    mapping(uint256 => address) public assetIssuer;
    mapping(uint256 => string) public assetName;
    mapping(uint256 => string) public assetType;
    mapping(uint256 => string) public assetExternalRef;
    mapping(uint256 => address) public assetCounterparty;
    mapping(uint256 => uint256) public assetFaceValue;
    mapping(uint256 => uint256) public assetTokenSupply;
    mapping(uint256 => uint256) public assetFundedAmount;
    mapping(uint256 => uint256) public assetFundingTarget;
    mapping(uint256 => uint256) public assetMaturity;
    mapping(uint256 => uint256) public assetYieldBps;
    mapping(uint256 => bytes32) public assetDocHash;
    mapping(uint256 => uint8) public assetState;
    mapping(uint256 => address) public assetVerifier;
    mapping(uint256 => bool) public assetVerified;
    mapping(uint256 => uint256) public assetCreatedAt;
    mapping(uint256 => uint256) public assetVerifiedAt;
    mapping(uint256 => uint256) public assetTokenizedAt;
    mapping(uint256 => uint256) public assetListedAt;
    mapping(uint256 => uint256) public assetPricePerUnit;

    mapping(uint256 => mapping(address => Position)) public positions;
    mapping(uint256 => SellOrder) public sellOrders;
    mapping(uint256 => uint256) public totalInvested;
    mapping(uint256 => uint256) public totalUnitsSold;
    mapping(uint256 => mapping(address => uint256)) private borrowedAmounts;

    // Payment tracking
    mapping(uint256 => uint256) public totalPaid;
    mapping(uint256 => uint256) public paidPerUnit;
    mapping(uint256 => uint256) public paymentFunded;
    mapping(uint256 => uint256) public totalSettled;
    mapping(uint256 => Payment[]) public payments;

    event AssetCreated(uint256 indexed id, address indexed issuer, string name);
    event AssetVerified(uint256 indexed id, address indexed verifier);
    event AssetTokenized(uint256 indexed id, uint256 tokenSupply);
    event AssetListed(uint256 indexed id, uint256 pricePerUnit);
    event InvestmentMade(uint256 indexed id, address indexed investor, uint256 units, uint256 amount);
    event SellOrderCreated(uint256 indexed orderId, uint256 indexed assetId, address indexed seller, uint256 amount, uint256 pricePerUnit);
    event SellOrderCancelled(uint256 indexed orderId);
    event TradeExecuted(uint256 indexed orderId, uint256 indexed assetId, address indexed buyer, uint256 units, uint256 amount);
    event CollateralDeposited(uint256 indexed assetId, address indexed user, uint256 amount);
    event CollateralWithdrawn(uint256 indexed assetId, address indexed user, uint256 amount);
    event Borrowed(uint256 indexed assetId, address indexed user, uint256 amount);
    event Repaid(uint256 indexed assetId, address indexed user, uint256 amount);
    event YieldClaimed(uint256 indexed assetId, address indexed user, uint256 amount);
    event AssetMatured(uint256 indexed id);
    event AssetSettled(uint256 indexed id, address indexed investor, uint256 principal, uint256 yield_);
    event FundsWithdrawn(uint256 indexed assetId, address indexed issuer, uint256 amount);
    event PaymentRecorded(uint256 indexed assetId, uint256 amount, bytes32 evidenceHash, address indexed recordedBy);
    event SettlementFunded(uint256 indexed assetId, uint256 amount, address indexed funder);
    event ProceedsClaimed(uint256 indexed assetId, address indexed user, uint256 amount);

    constructor(address _tUSDT) {
        admin = msg.sender;
        tUSDT = IERC20(_tUSDT);
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    // =========================================================================
    // INTERNAL HELPERS
    // =========================================================================

    function _requireAssetExists(uint256 assetId) internal view {
        if (assetIssuer[assetId] == address(0)) revert AssetNotFound();
    }

    function _isInvestable(uint8 state) internal pure returns (bool) {
        return state == uint8(AssetState.LISTED) || state == uint8(AssetState.FUNDED);
    }

    function _getCollateralValue(uint256 assetId, address user) internal view returns (uint256) {
        return positions[assetId][user].collateralAmount * assetPricePerUnit[assetId];
    }

    function _getAvailableCredit(uint256 assetId, address user) internal view returns (uint256) {
        uint256 collateralAmt = positions[assetId][user].collateralAmount;
        if (collateralAmt == 0) return 0;
        uint256 collateralValue = collateralAmt * assetPricePerUnit[assetId];
        uint256 creditCapacity = (collateralValue * 60) / 100;
        uint256 currentBorrowed = borrowedAmounts[assetId][user];
        if (creditCapacity <= currentBorrowed) return 0;
        return creditCapacity - currentBorrowed;
    }

    function _updatePositionStart(uint256 assetId, address user) internal {
        Position storage pos = positions[assetId][user];
        if (pos.holdingStart == 0) {
            pos.holdingStart = block.timestamp;
            pos.active = true;
        }
    }

    function _getHoldingDays(uint256 assetId, address user) internal view returns (uint256) {
        Position storage pos = positions[assetId][user];
        if (pos.amount == 0 || pos.holdingStart == 0) return 0;
        uint256 duration = block.timestamp > pos.holdingStart ? block.timestamp - pos.holdingStart : 0;
        return duration / 1 days;
    }

    function _settleProceeds(uint256 assetId, address user) internal {
        Position storage pos = positions[assetId][user];
        uint256 currentPPU = paidPerUnit[assetId];
        uint256 lastPPU = pos.lastClaimedPPU;

        if (currentPPU <= lastPPU || pos.amount == 0) {
            pos.lastClaimedPPU = currentPPU;
            return;
        }

        uint256 owed = (currentPPU - lastPPU) * pos.amount / 1e18;
        pos.lastClaimedPPU = currentPPU;

        if (owed > 0) {
            uint256 available = paymentFunded[assetId] - totalSettled[assetId];
            if (available > 0) {
                if (owed > available) owed = available;
                totalSettled[assetId] += owed;
                tUSDT.transfer(user, owed);
            }
        }
    }

    // =========================================================================
    // ASSET REGISTRY
    // =========================================================================

    function createAsset(
        string calldata _assetType,
        string calldata _name,
        string calldata _externalRef,
        address _counterparty,
        uint256 _faceValue,
        uint256 _maturity,
        uint256 _yieldBps,
        bytes32 _docHash
    ) external returns (uint256) {
        if (_faceValue == 0) revert InvalidAmount();

        uint256 id = nextAssetId++;

        assetId_[id] = id;
        assetIssuer[id] = msg.sender;
        assetName[id] = _name;
        assetType[id] = _assetType;
        assetExternalRef[id] = _externalRef;
        assetCounterparty[id] = _counterparty;
        assetFaceValue[id] = _faceValue;
        assetMaturity[id] = _maturity;
        assetYieldBps[id] = _yieldBps;
        assetDocHash[id] = _docHash;
        assetState[id] = uint8(AssetState.CREATED);
        assetCreatedAt[id] = block.timestamp;

        emit AssetCreated(id, msg.sender, _name);
        return id;
    }

    function getAssetCount() external view returns (uint256) {
        return nextAssetId;
    }

    // =========================================================================
    // VERIFICATION
    // =========================================================================

    function verifyAsset(uint256 assetId) external onlyAdmin {
        _requireAssetExists(assetId);
        if (assetState[assetId] != uint8(AssetState.CREATED)) revert InvalidStateTransition();

        assetState[assetId] = uint8(AssetState.VERIFIED);
        assetVerified[assetId] = true;
        assetVerifier[assetId] = msg.sender;
        assetVerifiedAt[assetId] = block.timestamp;

        emit AssetVerified(assetId, msg.sender);
    }

    // =========================================================================
    // TOKENIZATION
    // =========================================================================

    function tokenizeAsset(uint256 assetId, uint256 tokenSupply) external {
        _requireAssetExists(assetId);
        if (assetState[assetId] != uint8(AssetState.VERIFIED)) revert InvalidStateTransition();
        if (msg.sender != assetIssuer[assetId]) revert Unauthorized();
        if (tokenSupply == 0) revert InvalidAmount();

        assetState[assetId] = uint8(AssetState.TOKENIZED);
        assetTokenSupply[assetId] = tokenSupply;
        assetPricePerUnit[assetId] = assetFaceValue[assetId] / tokenSupply;
        assetTokenizedAt[assetId] = block.timestamp;
        assetFundingTarget[assetId] = assetFaceValue[assetId];

        emit AssetTokenized(assetId, tokenSupply);
    }

    // =========================================================================
    // LISTING
    // =========================================================================

    function listAsset(uint256 assetId) external {
        _requireAssetExists(assetId);
        if (assetState[assetId] != uint8(AssetState.TOKENIZED)) revert InvalidStateTransition();
        if (msg.sender != assetIssuer[assetId]) revert Unauthorized();

        assetState[assetId] = uint8(AssetState.LISTED);
        assetListedAt[assetId] = block.timestamp;

        emit AssetListed(assetId, assetPricePerUnit[assetId]);
    }

    // =========================================================================
    // INVESTMENT (tUSDT)
    // =========================================================================

    function buyTokens(uint256 assetId, uint256 units) external {
        _requireAssetExists(assetId);
        if (!_isInvestable(assetState[assetId])) revert AssetNotInvestable();
        if (units == 0) revert InvalidAmount();

        uint256 available = assetTokenSupply[assetId] - totalUnitsSold[assetId];
        if (units > available) revert InsufficientUnits();

        uint256 cost = units * assetPricePerUnit[assetId];
        if (cost == 0) revert InvalidAmount();

        // Pull tUSDT from buyer
        if (!tUSDT.transferFrom(msg.sender, address(this), cost)) revert TransferFailed();

        totalUnitsSold[assetId] += units;
        assetFundedAmount[assetId] += cost;
        totalInvested[assetId] += cost;

        Position storage pos = positions[assetId][msg.sender];
        pos.amount += units;
        pos.totalInvested += cost;
        _updatePositionStart(assetId, msg.sender);

        uint256 target = assetFundingTarget[assetId];
        if (target > 0 && assetFundedAmount[assetId] >= target) {
            if (assetState[assetId] == uint8(AssetState.LISTED)) {
                assetState[assetId] = uint8(AssetState.FUNDED);
            }
            if (assetState[assetId] == uint8(AssetState.FUNDED)) {
                assetState[assetId] = uint8(AssetState.ACTIVE);
            }
        }

        emit InvestmentMade(assetId, msg.sender, units, cost);
    }

    // =========================================================================
    // ISSUER WITHDRAWAL
    // =========================================================================

    function withdrawRaisedFunds(uint256 assetId) external {
        _requireAssetExists(assetId);
        if (msg.sender != assetIssuer[assetId]) revert Unauthorized();

        uint256 funded = assetFundedAmount[assetId];
        if (funded == 0) revert InvalidAmount();

        assetFundedAmount[assetId] = 0;
        if (!tUSDT.transfer(msg.sender, funded)) revert TransferFailed();

        emit FundsWithdrawn(assetId, msg.sender, funded);
    }

    // =========================================================================
    // PAYMENT ENGINE
    // =========================================================================

    function recordPayment(uint256 assetId, uint256 amount, bytes32 evidenceHash) external onlyAdmin {
        _requireAssetExists(assetId);
        if (amount == 0) revert InvalidAmount();
        if (totalPaid[assetId] + amount > assetFaceValue[assetId]) revert PaymentExceedsFaceValue();

        totalPaid[assetId] += amount;
        paidPerUnit[assetId] = (totalPaid[assetId] * 1e18) / assetTokenSupply[assetId];

        payments[assetId].push(Payment({
            amount: amount,
            timestamp: block.timestamp,
            evidenceHash: evidenceHash,
            recordedBy: msg.sender
        }));

        emit PaymentRecorded(assetId, amount, evidenceHash, msg.sender);
    }

    function fundSettlement(uint256 assetId, uint256 amount) external {
        _requireAssetExists(assetId);
        if (amount == 0) revert InvalidAmount();

        if (!tUSDT.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        paymentFunded[assetId] += amount;

        emit SettlementFunded(assetId, amount, msg.sender);
    }

    function claimProceeds(uint256 assetId) external {
        _requireAssetExists(assetId);

        Position storage pos = positions[assetId][msg.sender];
        if (pos.amount == 0) revert InsufficientUnits();

        uint256 currentPPU = paidPerUnit[assetId];
        uint256 lastPPU = pos.lastClaimedPPU;
        if (currentPPU <= lastPPU) revert InvalidAmount();

        uint256 owed = (currentPPU - lastPPU) * pos.amount / 1e18;
        if (owed == 0) revert InvalidAmount();

        // Cap at available settlement pool
        uint256 available = paymentFunded[assetId] - totalSettled[assetId];
        if (available == 0) revert InsufficientFunding();
        if (owed > available) owed = available;

        pos.lastClaimedPPU = currentPPU;
        totalSettled[assetId] += owed;

        if (!tUSDT.transfer(msg.sender, owed)) revert TransferFailed();

        emit ProceedsClaimed(assetId, msg.sender, owed);
    }

    // =========================================================================
    // TRADING (tUSDT)
    // =========================================================================

    function createSellOrder(uint256 assetId, uint256 amount, uint256 pricePerUnit_) external returns (uint256) {
        Position memory pos = positions[assetId][msg.sender];
        uint256 available = pos.amount - pos.collateralAmount;
        if (amount > available) revert InsufficientUnits();
        if (amount == 0 || pricePerUnit_ == 0) revert InvalidAmount();

        uint256 orderId = nextOrderId++;
        sellOrders[orderId] = SellOrder({
            orderId: orderId,
            assetId: assetId,
            seller: msg.sender,
            amount: amount,
            pricePerUnit: pricePerUnit_,
            active: true,
            createdAt: block.timestamp
        });

        emit SellOrderCreated(orderId, assetId, msg.sender, amount, pricePerUnit_);
        return orderId;
    }

    function cancelSellOrder(uint256 orderId) external {
        SellOrder storage order = sellOrders[orderId];
        if (order.orderId == 0) revert OrderNotFound();
        if (!order.active) revert OrderNotActive();
        if (order.seller != msg.sender) revert Unauthorized();

        order.active = false;
        emit SellOrderCancelled(orderId);
    }

    function executeTrade(uint256 orderId, uint256 units) external {
        SellOrder storage order = sellOrders[orderId];
        if (order.orderId == 0) revert OrderNotFound();
        if (!order.active) revert OrderNotActive();
        if (order.seller == msg.sender) revert CannotTradeWithSelf();
        if (units > order.amount) revert InsufficientUnits();
        if (units == 0) revert InvalidAmount();

        uint256 cost = units * order.pricePerUnit;

        // Pull tUSDT from buyer
        if (!tUSDT.transferFrom(msg.sender, address(this), cost)) revert TransferFailed();

        uint256 aid = order.assetId;
        uint256 aPrice = assetPricePerUnit[aid];

        Position storage sellerPos = positions[aid][order.seller];
        sellerPos.amount -= units;
        sellerPos.totalInvested -= units * aPrice;

        Position storage buyerPos = positions[aid][msg.sender];
        buyerPos.amount += units;
        buyerPos.totalInvested += cost;
        _updatePositionStart(aid, msg.sender);

        order.amount -= units;
        if (order.amount == 0) {
            order.active = false;
        }

        // Send tUSDT to seller
        if (!tUSDT.transfer(order.seller, cost)) revert TransferFailed();

        emit TradeExecuted(orderId, aid, msg.sender, units, cost);
    }

    // =========================================================================
    // COLLATERAL
    // =========================================================================

    function depositCollateral(uint256 assetId, uint256 amount) external {
        Position storage pos = positions[assetId][msg.sender];
        uint256 available = pos.amount - pos.collateralAmount;
        if (amount > available) revert InsufficientUnits();
        if (amount == 0) revert InvalidAmount();

        pos.collateralAmount += amount;
        emit CollateralDeposited(assetId, msg.sender, amount);
    }

    function withdrawCollateral(uint256 assetId, uint256 amount) external {
        Position storage pos = positions[assetId][msg.sender];
        if (amount > pos.collateralAmount) revert InvalidAmount();

        uint256 borrowed = borrowedAmounts[assetId][msg.sender];
        uint256 newCollateral = pos.collateralAmount - amount;

        if (borrowed > 0) {
            if (newCollateral == 0) revert CollateralWithdrawalViolatesDebt();
            uint256 newCollateralValue = newCollateral * assetPricePerUnit[assetId];
            uint256 ltv = (borrowed * 100) / newCollateralValue;
            if (ltv > 60) revert CollateralWithdrawalViolatesDebt();
        }

        pos.collateralAmount -= amount;
        emit CollateralWithdrawn(assetId, msg.sender, amount);
    }

    // =========================================================================
    // BORROW / REPAY (tUSDT)
    // =========================================================================

    function borrow(uint256 assetId, uint256 amount) external {
        if (assetState[assetId] != uint8(AssetState.ACTIVE)) revert AssetNotInvestable();

        Position storage pos = positions[assetId][msg.sender];
        if (pos.collateralAmount == 0) revert InsufficientCredit();
        if (amount == 0) revert InvalidAmount();

        uint256 available = _getAvailableCredit(assetId, msg.sender);
        if (amount > available) revert InsufficientCredit();

        borrowedAmounts[assetId][msg.sender] += amount;

        // Send tUSDT to borrower
        if (!tUSDT.transfer(msg.sender, amount)) revert TransferFailed();

        emit Borrowed(assetId, msg.sender, amount);
    }

    function repay(uint256 assetId, uint256 amount) external {
        if (amount == 0) revert InvalidAmount();

        uint256 borrowed = borrowedAmounts[assetId][msg.sender];
        if (borrowed == 0) revert InsufficientCredit();

        uint256 repayAmount = amount > borrowed ? borrowed : amount;

        // Pull tUSDT from repayer
        if (!tUSDT.transferFrom(msg.sender, address(this), repayAmount)) revert TransferFailed();

        borrowedAmounts[assetId][msg.sender] -= repayAmount;

        uint256 excess = amount - repayAmount;
        if (excess > 0) {
            if (!tUSDT.transfer(msg.sender, excess)) revert TransferFailed();
        }

        emit Repaid(assetId, msg.sender, repayAmount);
    }

    function getHealth(uint256 assetId, address user) external view returns (uint256 healthFactor, bool healthy) {
        uint256 collateralAmt = positions[assetId][user].collateralAmount;
        uint256 borrowed = borrowedAmounts[assetId][user];

        if (collateralAmt == 0 || borrowed == 0) {
            return (0, true);
        }

        uint256 collateralValue = collateralAmt * assetPricePerUnit[assetId];
        healthFactor = (collateralValue * 10000) / (borrowed * 60);
        healthy = healthFactor >= 100;
    }

    // =========================================================================
    // YIELD (tUSDT)
    // =========================================================================

    function calculateYield(uint256 assetId, address user) public view returns (uint256) {
        uint256 daysHeld = _getHoldingDays(assetId, user);
        if (daysHeld == 0) return 0;

        uint256 invested = positions[assetId][user].totalInvested;
        uint256 yieldBps = assetYieldBps[assetId];
        uint256 annualYield = (invested * yieldBps) / 10000;
        return (annualYield / 365) * daysHeld;
    }

    function getHoldingScore(uint256 assetId, address user) external view returns (uint256) {
        return positions[assetId][user].amount * _getHoldingDays(assetId, user);
    }

    function claimYield(uint256 assetId) external {
        Position storage pos = positions[assetId][msg.sender];
        if (pos.amount == 0) revert InsufficientUnits();

        uint256 yield_ = calculateYield(assetId, msg.sender);
        uint256 claimable = yield_ - pos.claimedYield;
        if (claimable == 0) revert InvalidAmount();

        pos.accruedYield = yield_;
        pos.claimedYield = yield_;

        // Send tUSDT yield to user
        if (!tUSDT.transfer(msg.sender, claimable)) revert TransferFailed();

        emit YieldClaimed(assetId, msg.sender, claimable);
    }

    // =========================================================================
    // MATURITY
    // =========================================================================

    function matureAsset(uint256 assetId) external {
        _requireAssetExists(assetId);
        if (assetState[assetId] != uint8(AssetState.ACTIVE)) revert InvalidStateTransition();
        if (block.timestamp < assetMaturity[assetId]) revert MaturityNotReached();

        assetState[assetId] = uint8(AssetState.MATURED);
        emit AssetMatured(assetId);
    }

    // =========================================================================
    // SETTLEMENT
    // =========================================================================

    function settleAsset(uint256 assetId) external {
        _requireAssetExists(assetId);
        if (assetState[assetId] != uint8(AssetState.MATURED)) revert InvalidStateTransition();

        Position storage pos = positions[assetId][msg.sender];
        if (pos.amount == 0) return;

        uint256 principal = pos.totalInvested;
        uint256 yield_ = calculateYield(assetId, msg.sender) - pos.claimedYield;
        pos.claimedYield = calculateYield(assetId, msg.sender);

        assetState[assetId] = uint8(AssetState.SETTLED);
        emit AssetSettled(assetId, msg.sender, principal, yield_);
    }

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    function getBorrowedAmount(uint256 assetId, address user) external view returns (uint256) {
        return borrowedAmounts[assetId][user];
    }

    function getPosition(uint256 assetId, address user) external view returns (uint256 amount, uint256 totalInv, uint256 holdingStart, uint256 accruedYield, uint256 claimedYield, uint256 collateralAmount, uint256 lastClaimedPPU, bool active) {
        Position storage pos = positions[assetId][user];
        return (pos.amount, pos.totalInvested, pos.holdingStart, pos.accruedYield, pos.claimedYield, pos.collateralAmount, pos.lastClaimedPPU, pos.active);
    }

    function getSellOrder(uint256 orderId) external view returns (uint256 oId, uint256 aId, address seller, uint256 amt, uint256 price, bool isActive, uint256 created) {
        SellOrder storage o = sellOrders[orderId];
        return (o.orderId, o.assetId, o.seller, o.amount, o.pricePerUnit, o.active, o.createdAt);
    }

    function getAvailableUnits(uint256 assetId) external view returns (uint256) {
        return assetTokenSupply[assetId] - totalUnitsSold[assetId];
    }

    function getAvailableCredit(uint256 assetId, address user) external view returns (uint256) {
        return _getAvailableCredit(assetId, user);
    }

    function getPaymentCount(uint256 assetId) external view returns (uint256) {
        return payments[assetId].length;
    }

    function getPayment(uint256 assetId, uint256 index) external view returns (uint256 amount, uint256 timestamp, bytes32 evidenceHash, address recordedBy) {
        Payment storage p = payments[assetId][index];
        return (p.amount, p.timestamp, p.evidenceHash, p.recordedBy);
    }

    function getClaimableProceeds(uint256 assetId, address user) external view returns (uint256) {
        Position storage pos = positions[assetId][user];
        if (pos.amount == 0) return 0;
        uint256 currentPPU = paidPerUnit[assetId];
        uint256 lastPPU = pos.lastClaimedPPU;
        if (currentPPU <= lastPPU) return 0;
        uint256 owed = (currentPPU - lastPPU) * pos.amount / 1e18;
        uint256 available = paymentFunded[assetId] - totalSettled[assetId];
        if (owed > available) return available;
        return owed;
    }
}
