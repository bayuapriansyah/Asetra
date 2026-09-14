# AssetFlow — Product Requirements Document (PRD)

**Version:** 1.1  
**Status:** Final Product Blueprint  
**Hackathon:** Girl Meets Tech — Build Week Hackathon Vol.2  
**Blockchain:** BOT Chain (EVM)  
**Primary Use Case:** Invoice Financing / Receivables  
**Product Type:** RWA + DeFi + Web3 dApp

---

# 1. Product Summary

## 1.1 Product Name
**AssetFlow**

## 1.2 Tagline
> **Real-world assets, made programmable.**

## 1.3 Product One-Liner
AssetFlow is an on-chain financial lifecycle platform that transforms verified real-world assets into programmable positions that can be invested in, traded, used as collateral, generate yield, and eventually settled.

## 1.4 Simple Explanation
AssetFlow brings real-world assets such as invoices onto the blockchain. Tokenization is not the endpoint.

An asset continues through a programmable lifecycle:

```text
REAL-WORLD ASSET
      ↓
REGISTER
      ↓
VERIFY
      ↓
TOKENIZE
      ↓
LIST
      ↓
INVEST
      ↓
HOLD / TRADE
      ↓
COLLATERAL
      ↓
BORROW / REPAY
      ↓
YIELD
      ↓
MATURE
      ↓
SETTLE
```

The defining concept is:

> **The asset has a lifecycle, and its current state determines which financial actions are available.**

---

# 2. Product Vision

> **Give every verified real-world asset a programmable financial lifecycle.**

AssetFlow is designed around the idea that an RWA should not become a static token after tokenization. The asset should evolve through explicit states, while the smart contract controls the rules and financial actions associated with each state.

---

# 3. Product Differentiation

AssetFlow can be inspired by the broader RWA/DeFi ecosystem, including The Open Assets, but it must have a distinct product identity and implementation.

## 3.1 Core Differentiator — Lifecycle-First Architecture

AssetFlow is centered around:

> **Asset Lifecycle Engine + State-Based Financial Actions**

The lifecycle is not only a UI visualization. It is part of the smart-contract logic.

```text
CREATED
   ↓
VERIFIED
   ↓
TOKENIZED
   ↓
LISTED
   ↓
FUNDED
   ↓
ACTIVE
   ↓
MATURED
   ↓
SETTLED
```

The current state controls available actions.

Example:

```text
ACTIVE
→ Invest
→ Trade
→ View Yield
→ Use as Collateral
→ Borrow

MATURED
→ Settlement

SETTLED
→ Lifecycle closed
```

## 3.2 Position Journey

AssetFlow shows how an individual investor's position evolves through time.

Example:

```text
Bought 1,000 units
        ↓
Position became active
        ↓
Yield accrued
        ↓
Position used as collateral
        ↓
Borrowed
        ↓
Loan repaid
        ↓
Asset matured
        ↓
Settlement completed
```

## 3.3 Asset Risk Lens

AssetFlow presents contextual asset information:

- Verification status
- Funding progress
- Maturity
- Liquidity indication
- Maximum LTV
- Lifecycle health

This is a decision-support interface, not a claim of real-world creditworthiness.

---

# 4. Problem Statement

## 4.1 Tokenization Is Not Enough

A real-world asset can be represented on-chain, but tokenization alone does not solve:

- discovery
- investment
- liquidity
- collateral use
- borrowing
- yield accounting
- maturity
- settlement

AssetFlow continues the workflow beyond token creation.

## 4.2 Fragmented Financial Lifecycle

A real-world asset may move through:

```text
Document
→ Verification
→ Financing
→ Trading
→ Lending
→ Yield
→ Settlement
```

AssetFlow brings these major activities into one lifecycle-oriented application.

## 4.3 Poor Visibility Into Asset State

Investors need to know:

- whether an asset is verified
- whether it is tokenized
- whether funding is complete
- whether it is currently active
- whether it can be used as collateral
- how long remains to maturity
- whether it has settled

AssetFlow exposes this state directly.

## 4.4 Real-World Truth vs On-Chain State

Blockchain cannot independently prove that a physical document is genuine.

Therefore AssetFlow separates responsibilities.

### Off-chain
- PDF/document processing
- AI extraction
- document storage/reference
- metadata
- indexing
- search
- analytics

### On-chain
- asset registration
- lifecycle state
- verification status
- ownership/position
- investment
- trading records
- collateral
- debt
- repayment
- yield state
- maturity
- settlement

This distinction must be maintained in implementation and documentation.

---

# 5. Target Users

## 5.1 Issuer

A business or asset owner that wants to finance a real-world asset.

Example:

**PT Nusantara Manufacturing**

Example asset:

```text
Invoice #INV-2048
Face Value: $100,000
Due: 90 days
```

Capabilities:
- Create asset
- Upload document
- Analyze document
- Review extracted data
- Submit for verification
- Tokenize
- List
- Monitor funding
- Monitor lifecycle
- View settled assets

## 5.2 Investor

A user who wants exposure to verified RWA positions.

Capabilities:
- Discover assets
- Inspect asset details
- Invest
- View portfolio
- Track yield
- Trade
- Deposit collateral
- Borrow
- Repay
- Track Position Journey
- Follow maturity
- View settlement

## 5.3 Verifier / Admin

A controlled role responsible for reviewing and approving asset information.

For the hackathon prototype, this may be the deployer/admin wallet.

Capabilities:
- Review asset
- Approve verification
- Reject verification
- Trigger allowed state transitions

---

# 6. Primary Use Case — Invoice Financing

Use one invoice as the canonical demo asset.

```text
Invoice #INV-2048

Issuer:
PT Nusantara Manufacturing

Buyer:
Global Industrial Corp.

Face Value:
$100,000

Maturity:
90 days

Expected Yield:
8.2%

Tokenized Units:
100,000
```

AssetFlow turns this into an on-chain financial position.

---

# 7. End-to-End Product Flow

```text
ISSUER
  ↓
Create Invoice
  ↓
AI Extracts Data
  ↓
Verifier Reviews
  ↓
VERIFY
  ↓
TOKENIZE
  ↓
LIST
  ↓
INVESTOR
  ↓
INVEST
  ↓
POSITION CREATED
  ↓
┌───────────────┬─────────────┬───────────────┐
│               │             │
TRADE          YIELD       COLLATERAL
                              ↓
                           BORROW
                              ↓
                           REPAY
└───────────────┬─────────────┘
                ↓
             MATURITY
                ↓
            SETTLEMENT
```

---

# 8. Asset Lifecycle Engine

This is the core product mechanism.

## 8.1 States

```text
CREATED
VERIFIED
TOKENIZED
LISTED
FUNDED
ACTIVE
MATURED
SETTLED
```

Optional UI/risk labels:

```text
HEALTHY
WATCH
AT_RISK
```

These should not replace the fundamental lifecycle states without a technical reason.

## 8.2 Valid Transitions

```text
CREATED → VERIFIED
VERIFIED → TOKENIZED
TOKENIZED → LISTED
LISTED → FUNDED
FUNDED → ACTIVE
ACTIVE → MATURED
MATURED → SETTLED
```

Invalid transitions must revert.

Example:

```text
CREATED → SETTLED
```

must fail.

## 8.3 State-Based Actions

### CREATED
- Review information
- Submit for verification

### VERIFIED
- Tokenization

### TOKENIZED
- Listing

### LISTED / FUNDING
- Investment

### ACTIVE
- View position
- Trade
- Yield accrual
- Collateral
- Borrow, subject to rules
- Repayment

### MATURED
- Settlement

Restricted after maturity:
- New investment
- New collateralization
- New borrowing
- Invalid trading

### SETTLED
Lifecycle closed.

---

# 9. Core Features

## 9.1 RWA Registration

Issuer creates an asset record.

Data:
- asset id
- asset type
- name/title
- invoice number/reference
- issuer
- buyer/counterparty
- face value
- maturity date
- expected yield
- document hash/reference
- funding target
- current lifecycle state

### Acceptance Criteria
- Issuer can submit asset data.
- Contract creates a unique asset ID.
- State becomes `CREATED`.
- Asset can be retrieved on-chain.
- `AssetCreated` event is emitted.

---

# 10. AI Document Extraction

AI assists the document workflow.

## Flow

```text
PDF
 ↓
AI extraction
 ↓
Extract fields
 ↓
Review
 ↓
Verification
 ↓
On-chain registration
```

Fields:
- invoice number
- issuer
- buyer
- amount
- due date

Example:

```text
Invoice Number: INV-2048
Issuer: PT Nusantara Manufacturing
Buyer: Global Industrial Corp.
Amount: $100,000
Due Date: Dec 18, 2026
Confidence: 94%
```

### Important Rule

AI does not guarantee authenticity. The UI must present AI as data-extraction assistance.

---

# 11. Verification

Verifier approves the asset.

On-chain data:
- verification status
- verifier address
- verification timestamp
- document hash/reference

### Acceptance Criteria
- Unauthorized accounts cannot verify.
- Verified state is stored on-chain.
- Asset transitions `CREATED → VERIFIED`.
- Event is emitted.

---

# 12. Tokenization

After verification, the asset becomes a tokenized position.

Example:

```text
Face Value:
$100,000

Tokenized Units:
100,000

Unit Accounting Value:
$1
```

For hackathon simplicity, tokenized asset balances can initially be tracked inside `AssetFlow.sol` instead of deploying one ERC-20 contract for every asset.

### Acceptance Criteria
- Only verified assets can be tokenized.
- Tokenized supply is stored.
- Position balances can be tracked.
- Asset transitions `VERIFIED → TOKENIZED`.

---

# 13. Marketplace

Marketplace lets investors discover listed assets.

Each asset card should show:
- Asset
- Issuer
- Verification
- Price
- Yield
- Maturity
- Funding
- Lifecycle

Example:

```text
Invoice #INV-2048
PT Nusantara Manufacturing

Face Value:
$100,000

Token Price:
$0.94

Expected Yield:
8.2%

Maturity:
84 days

Funding:
82%

Status:
ACTIVE

[ View Asset ]
[ Invest ]
```

---

# 14. Investment

Investment is a primary hackathon action.

## Flow

```text
Marketplace
 ↓
Asset Detail
 ↓
Invest
 ↓
Enter amount
 ↓
MetaMask
 ↓
BOT Chain
 ↓
Position updated
 ↓
Portfolio updated
```

Example:

```text
Units: 1,000
Price: $0.94
Total: $940
```

### Acceptance Criteria
- MetaMask connects.
- User selects amount.
- Transaction executes on BOT Chain.
- Position balance changes.
- Portfolio reflects investment.
- Transaction hash is visible.
- Relevant event is emitted.

Do not fake successful blockchain transactions.

---

# 15. Portfolio

Investor dashboard displays:

```text
Total Portfolio Value
Accrued Yield
Collateral
Borrowed
```

Each position:
- Asset
- Units
- Invested
- Current Value
- Holding Duration
- Accrued Yield
- Collateral Status
- Lifecycle

Example:

```text
Invoice #INV-2048

1,000 units

Invested:
$940

Current Value:
$958

Holding:
21 days

Accrued Yield:
$18.42

Status:
ACTIVE
```

---

# 16. Position Journey

Signature UI feature.

Example:

```text
YOUR POSITION JOURNEY

Sep 20
Bought 1,000 units

Sep 20
Position became ACTIVE

Oct 10
$12.40 yield accrued

Oct 15
500 units deposited as collateral

Oct 16
$300 borrowed

Nov 10
Loan repaid

Dec 18
Asset matured

Dec 18
Settlement completed
```

Use actual application/contract events where possible.

---

# 17. Secondary Trading

Support simple trading.

Functions:

```text
createSellOrder()
cancelSellOrder()
executeTrade()
```

Example UI:

```text
SELL
1,000 @ $0.98
2,500 @ $0.97
3,000 @ $0.96

BUY
2,000 @ $0.95
1,500 @ $0.94
800 @ $0.93
```

Do not let a sophisticated order book block the core investment flow.

---

# 18. Yield Engine

AssetFlow provides time-aware yield accounting.

## 18.1 Holding Score

Concept:

```text
Holding Score =
Asset Units × Holding Duration
```

Example:

```text
1,000 units × 30 days
= 30,000 Holding Score
```

Use the AssetFlow terminology **Holding Score** rather than copying external product terminology.

## 18.2 Yield UI

```text
Accrued
$428.20

Claimable
$302.40

Projected
$517.80
```

Per asset:

```text
Invoice #2048

Units:
1,000

Held:
31 days

Holding Score:
30,000

Accrued:
$18.42
```

### Important Implementation Requirement

Before finalizing the yield engine, define behavior for:
- additional purchases
- transfers
- partial sales
- multiple holding periods
- claim checkpoints

Avoid an inconsistent yield calculation.

---

# 19. Collateral

Eligible RWA positions can be used as collateral.

Example:

```text
Position Value:
$2,000

Maximum LTV:
60%

Credit Capacity:
$1,200
```

Capabilities:
- deposit collateral
- withdraw collateral
- view collateral value
- view LTV
- view available credit

Withdrawals must not violate debt/collateral rules.

---

# 20. Borrowing

Investor can borrow against collateral.

Example:

```text
Collateral:
$2,000

Borrowed:
$500

Available Credit:
$700

Health Factor:
2.4

Status:
HEALTHY
```

Functions:
- `borrow()`
- `repay()`
- `getHealth()`

Use a simple, transparent prototype risk formula.

Do not build a production-grade lending protocol.

---

# 21. Risk Lens

Every asset can show:

```text
ASSET LENS

Verification     VERIFIED
Funding          82%
Maturity         84 days
Liquidity        MEDIUM
Max LTV          60%
Lifecycle        HEALTHY
```

The Risk Lens is descriptive and should not falsely claim validated real-world creditworthiness.

---

# 22. Maturity

When the maturity timestamp is reached:

```text
ACTIVE → MATURED
```

After maturity:
- new investments are disabled
- new borrowing is disabled
- invalid trading is disabled
- settlement becomes available

For the hackathon, use configurable test assets or a controlled demo mechanism so the demo does not require waiting 90 real days.

Do not bypass lifecycle validation just to make the demo easy.

---

# 23. Settlement

Settlement closes the asset lifecycle.

```text
MATURED
   ↓
SETTLED
```

Requirements:
- settlement only after maturity
- settlement can happen once
- final state recorded
- applicable economic result reflected
- settlement event emitted
- transaction visible on BOT Chain

Example:

```text
Principal:
$940

Accrued Yield:
$77.08

Settlement:
$1,017.08
```

Exact economics must match the implemented prototype model.

---

# 24. UI / UX Architecture

## 24.1 Landing Page

URL:

```text
/
```

Sections:
1. Navbar
2. Hero
3. Problem
4. Solution
5. How It Works
6. Asset Lifecycle
7. Marketplace Preview
8. For Issuers
9. For Investors
10. Verification / Risk
11. CTA
12. Footer

## 24.2 Application

URL:

```text
/app
```

Sidebar:

```text
ASSETFLOW

OVERVIEW

MARKET
  Marketplace
  My Orders

PORTFOLIO
  My Assets
  My Yield
  My Trades

CREDIT
  Collateral
  Borrow

ISSUER
  Create Asset
  My Offerings

Activity
Settings
```

---

# 25. Required Screens

```text
/
├── Landing

/app
├── Overview
├── Marketplace
├── Asset Detail
├── Portfolio
├── My Yield
├── Trading
├── Collateral
├── Borrow
├── Create Asset
├── My Offerings
├── Activity
└── Settings
```

---

# 26. Asset Detail Page

This should be one of the most important pages.

Header:

```text
INVOICE #INV-2048

✓ VERIFIED
● ACTIVE

PT Nusantara Manufacturing
→ Global Industrial Corp.
```

Financial data:

```text
Face Value
$100,000

Current Price
$0.94

Expected Yield
8.2%

Maturity
84 days

Funding
82%
```

### Lifecycle

```text
✓ Created
✓ Verified
✓ Tokenized
✓ Listed
✓ Funded
● Active
○ Matured
○ Settled
```

### Verification

```text
Document
invoice_INV2048.pdf

Document Hash
0x82A...91BC

Verified By
0x71F...32AE
```

### Risk Lens
- Verification
- Funding
- Maturity
- Liquidity
- LTV
- Lifecycle

### Available Actions

When `ACTIVE`:

```text
[ INVEST ]
[ TRADE ]
[ USE AS COLLATERAL ]
```

When `MATURED`:

```text
[ SETTLE ]
```

The UI must reflect smart-contract state.

---

# 27. Visual Design

AssetFlow should feel like:

> **Premium institutional fintech + modern RWA + Web3**

Prefer:
- strong typography
- generous whitespace
- structured cards
- financial data hierarchy
- subtle motion
- lifecycle visualization
- professional color usage
- clear statuses
- clear transaction states

Avoid:
- excessive neon
- meme-coin styling
- generic crypto UI
- overcrowded dashboards
- unnecessary animations
- excessive gradients

---

# 28. Landing Page Copy Direction

Hero:

> **REAL-WORLD ASSETS, MADE PROGRAMMABLE.**

Subheadline:

> Turn verified real-world assets into programmable financial positions.

Buttons:

```text
[ Explore Assets ]
[ Launch App ]
```

Problem:

> **Tokenization is only the beginning.**

Solution:

> **Give every asset a lifecycle.**

Key statement:

> **The state of an asset determines what users can do with it.**

Closing:

> **We don't just tokenize real-world assets. We make their lifecycle programmable.**

Do not use unsupported superlatives such as "first", "only", or "world's first".

---

# 29. Technical Architecture

```text
                        USER
                          |
                          v
                  AssetFlow Frontend
                          |
                   wagmi / viem
                          |
                       MetaMask
                          |
                          v
                     BOT Chain
                          |
                          v
                   AssetFlow.sol
```

Off-chain:

```text
Frontend
   |
   +-- AI document extraction
   +-- document/reference storage
   +-- metadata
   +-- indexing
   +-- search
   +-- analytics
```

---

# 30. Smart Contract Architecture

Initial implementation should use:

```text
AssetFlow.sol
```

One main contract is preferred for hackathon simplicity.

Organize into:

```text
1. Imports
2. Enums
3. Structs
4. Errors
5. State
6. Roles
7. Asset Registry
8. Verification
9. Tokenization
10. Marketplace
11. Investment
12. Trading
13. Collateral
14. Credit
15. Yield
16. Maturity
17. Settlement
18. Views
19. Internal Helpers
20. Events
```

Split into multiple contracts only when technically necessary.

---

# 31. Smart Contract Data Model

## Asset

Conceptual fields:

```solidity
struct Asset {
    uint256 id;
    address issuer;
    string assetType;
    string name;
    string externalReference;
    address counterparty;
    uint256 faceValue;
    uint256 tokenSupply;
    uint256 fundedAmount;
    uint256 fundingTarget;
    uint256 maturity;
    uint256 expectedYieldBps;
    bytes32 documentHash;
    AssetState state;
    address verifier;
    bool verified;
    uint256 createdAt;
    uint256 verifiedAt;
}
```

## Position

Conceptual fields:

```solidity
struct Position {
    uint256 amount;
    uint256 totalInvested;
    uint256 holdingStart;
    uint256 accruedYield;
    uint256 claimedYield;
    uint256 collateralAmount;
}
```

Exact fields may be optimized during implementation.

---

# 32. Smart Contract Functions

## Core

```text
createAsset()
getAsset()

verifyAsset()
tokenizeAsset()

listAsset()
buyTokens()

getPosition()

matureAsset()
settleAsset()
```

## Trading

```text
createSellOrder()
cancelSellOrder()
executeTrade()
```

## Credit

```text
depositCollateral()
withdrawCollateral()

borrow()
repay()

getHealth()
```

## Yield

```text
calculateYield()
claimYield()
```

---

# 33. Events

Implement events for major state changes:

```text
AssetCreated
AssetVerified
AssetTokenized
AssetListed
InvestmentMade

SellOrderCreated
SellOrderCancelled
TradeExecuted

CollateralDeposited
CollateralWithdrawn

Borrowed
Repaid

YieldClaimed

AssetMatured
AssetSettled
```

Events are useful for:
- frontend updates
- activity history
- debugging
- explorer verification

---

# 34. Access Control

At minimum:

### Admin / Verifier
- verification
- controlled administrative actions

### Issuer
- create own assets
- issuer-specific actions

### Investor
- invest
- trade owned positions
- collateralize eligible positions
- borrow
- repay

State-changing functions must enforce permissions.

---

# 35. Blockchain Responsibility

Blockchain provides the source of truth for:

```text
- asset lifecycle
- ownership
- investment
- collateral
- debt
- repayment
- yield state
- maturity
- settlement
```

Off-chain services provide:

```text
- documents
- AI processing
- metadata
- analytics
- search
```

Key narrative:

> **Blockchain is the execution and source-of-truth layer for financial state, while off-chain services handle information that blockchain cannot directly know.**

---

# 36. BOT Chain Configuration

## Testnet

```text
RPC:
https://rpc.bohr.life

Chain ID:
968

Native Token:
BOT

Explorer:
https://scan.bohr.life/

Faucet:
https://faucet.botchain.ai/basic
```

## Mainnet

```text
RPC:
https://rpc.botchain.ai

Chain ID:
677

Native Token:
BOT

Explorer:
https://scan.botchain.ai/

DEX:
https://dex.botchain.ai/#/swap
```

Network configuration must be centralized.

---

# 37. Wallet UX

Support MetaMask-compatible EVM wallets.

Wallet flow:

1. Connect wallet
2. Check network
3. Prompt network switch if needed
4. Show balance
5. Execute transaction
6. Show pending state
7. Show confirmation
8. Show explorer link

---

# 38. Transaction UX

Every blockchain transaction:

```text
Preparing
   ↓
Waiting for Wallet
   ↓
Pending
   ↓
Confirmed
```

Failure:

```text
Transaction Failed
```

After confirmation:
- refresh state
- show transaction hash
- provide explorer link

---

# 39. Error Handling

Use meaningful custom errors and frontend messages.

Examples:

```text
Asset must be verified before tokenization.

Asset is not in an investable state.

Insufficient asset units.

Borrow amount exceeds available credit.

Collateral withdrawal would violate health requirements.

Asset has matured.

Asset is already settled.

Unauthorized verifier.
```

Avoid raw low-level error dumps where possible.

---

# 40. Demo Experience

The demo should use ONE asset and tell ONE coherent story.

## Demo Asset

```text
Invoice #INV-2048
$100,000
90-day maturity
8.2% expected yield
```

## Demo Sequence

```text
1. Create Invoice
2. AI extracts document fields
3. Review
4. Verify
5. Tokenize
6. List
7. Investor connects wallet
8. Invest 1,000 units
9. Confirm MetaMask transaction
10. Portfolio updates
11. Show Position Journey
12. Show Holding Score / Yield
13. Deposit position as collateral
14. Borrow $500
15. Repay
16. Mature asset
17. Settle
18. Show final lifecycle
19. Show BOT Chain explorer transaction
```

Demo headline:

> **Watch an asset come alive.**

Demo narrative:

> “This is an invoice worth $100,000. AssetFlow registers and verifies it, turns it into an on-chain position, allows investors to finance it, gives that position financial utility, and finally closes its lifecycle through settlement.”

---

# 41. Hackathon Priority

## Must Work

```text
1. Smart contract deployment
2. Wallet connection
3. Create Asset
4. Verification
5. Tokenization
6. Marketplace
7. Investment
8. Portfolio
9. Lifecycle
10. Settlement
```

## Should Work

```text
11. Yield
12. Holding Score
13. Collateral
14. Borrow
15. Repay
16. Trading
```

## Nice to Have

```text
17. AI extraction
18. Risk Lens
19. Advanced order book
20. Auction
21. Multiple RWA types
```

A reliable end-to-end core is more valuable than many incomplete features.

---

# 42. Development Plan — 10 Days

## Day 1 — Foundation

- inspect repository
- identify framework
- identify package manager
- inspect smart contract setup
- configure BOT Chain
- configure wallet
- create initial `AssetFlow.sol`
- create frontend layout

**Deliverable:** frontend runs, wallet connects, contract compiles.

## Day 2 — Asset Registry

### Contract
- Asset struct
- lifecycle enum
- `createAsset()`
- `getAsset()`
- events

### Frontend
- Create Asset
- Asset Detail
- Lifecycle component

**Deliverable:** asset is created on-chain.

## Day 3 — Verification + Tokenization

### Contract
- access control
- `verifyAsset()`
- `tokenizeAsset()`
- state validation

### Frontend
- verification
- document hash/reference
- tokenization
- lifecycle updates

**Deliverable:**

```text
CREATED
→ VERIFIED
→ TOKENIZED
```

works on BOT Chain.

## Day 4 — Marketplace + Investment

### Contract
- listing
- investment

### Frontend
- Marketplace
- asset cards
- Asset Detail
- Invest modal
- MetaMask flow

**Deliverable:**

```text
Marketplace
→ Invest
→ MetaMask
→ BOT Chain
→ Position
```

## Day 5 — Portfolio + Position Journey

### Contract
- `getPosition()`
- position accounting
- events

### Frontend
- Overview
- My Assets
- Position Detail
- Activity
- Position Journey

**Deliverable:** investment changes portfolio state.

## Day 6 — Yield

### Contract
- holding duration
- Holding Score
- yield calculation
- claim state

### Frontend
- My Yield
- Holding Score
- accrued yield
- claimable yield

**Deliverable:** time-aware yield state.

## Day 7 — Collateral + Borrow

### Contract
- collateral
- withdrawal rules
- borrow
- repay
- health

### Frontend
- Collateral
- Borrow
- Health Factor
- Credit Capacity

**Deliverable:** eligible RWA can support prototype collateralized borrowing.

## Day 8 — Trading + Maturity + Settlement

### Contract
- sell orders
- trade
- maturity
- settlement

### Frontend
- Trading
- My Orders
- My Trades
- Maturity
- Settlement

**Deliverable:** lifecycle reaches settlement.

## Day 9 — Integration + Testing

### Smart contract
Test:
- lifecycle transitions
- invalid transitions
- access control
- investment
- ownership
- trading
- collateral
- borrowing
- repayment
- yield
- maturity
- settlement

### Frontend
Test:
- wallet
- network
- pending transaction
- success
- failure
- refresh
- empty state
- loading
- responsive layouts

### Deployment
- testnet deployment
- verify contract where possible
- record address
- inspect explorer activity

## Day 10 — Polish + Submission

### UI
- typography
- spacing
- responsiveness
- loading states
- transaction states
- error states
- success states
- subtle animations

### Demo

```text
Create
→ Verify
→ Tokenize
→ Invest
→ Position
→ Yield
→ Collateral
→ Borrow
→ Repay
→ Mature
→ Settle
```

### README
Include:
- overview
- problem
- solution
- core feature
- architecture
- smart contract
- frontend
- BOT Chain
- contract address
- deployment
- local setup
- demo flow
- limitations
- future improvements

### Submission
Verify:
- contract deployed
- website live
- GitHub live
- Solidity source included
- README complete
- deployment address included
- X post prepared
- explorer links available

---

# 43. Development Operating Rules for Coding Agent

Before coding:

1. Inspect repository.
2. Identify current architecture.
3. Reuse valid existing code.
4. Avoid unnecessary rewrites.
5. Confirm package manager.
6. Confirm framework.
7. Confirm smart contract tooling.
8. Confirm network configuration.

Then work in small milestones.

After every meaningful implementation batch:

```text
Run tests
Run typecheck
Run build
Fix errors
Check integration
```

Never claim a blockchain feature works without testing it.

Do not fake transactions.

Do not create mock success behavior for the core blockchain flow.

---

# 44. If Time Runs Short

Priority:

```text
★★★★★ Contract deployment
★★★★★ Wallet
★★★★★ Create Asset
★★★★★ Verify
★★★★★ Tokenize
★★★★★ Marketplace
★★★★★ Invest
★★★★★ Portfolio
★★★★★ Lifecycle
★★★★☆ Settlement
★★★★☆ Yield
★★★☆☆ Collateral
★★★☆☆ Borrow
★★★☆☆ Repay
★★★☆☆ Trading
★★☆☆☆ AI
★☆☆☆☆ Advanced order book
★☆☆☆☆ Auction
```

If a low-priority feature threatens the core flow, stop it and restore core functionality.

---

# 45. Testing Strategy

## Unit Tests
Cover contract logic.

## Integration Tests
Cover:

```text
Frontend
→ Wallet
→ Contract
→ BOT Chain
→ UI state update
```

## Manual Demo Test
Run the exact final demo flow before submission.

Verify every core transaction from a clean test state.

---

# 46. Success Criteria

AssetFlow is ready when a judge can:

1. Open the live site.
2. Understand the value proposition quickly.
3. Connect a MetaMask wallet.
4. Connect to BOT Chain.
5. Create or inspect an invoice asset.
6. See verification state.
7. See lifecycle.
8. Invest in the asset.
9. Confirm a real BOT Chain transaction.
10. See the resulting portfolio position.
11. Use at least one additional financial utility.
12. Follow the lifecycle toward maturity.
13. Complete or inspect settlement.
14. Verify contract activity on explorer.
15. Explain what AssetFlow does within a few minutes.

---

# 47. Core Product Story

AssetFlow should always tell the same story:

```text
REAL-WORLD ASSET
        ↓
     CREATE
        ↓
     VERIFY
        ↓
    TOKENIZE
        ↓
      LIST
        ↓
     INVEST
        ↓
   POSITION
   ↙    ↓    ↘
TRADE  YIELD  COLLATERAL
               ↓
             BORROW
               ↓
             REPAY
               ↓
            MATURITY
               ↓
           SETTLEMENT
```

The key mechanic is:

```text
ASSET STATE
     ↓
AVAILABLE ACTIONS
     ↓
FINANCIAL STATE
     ↓
NEXT LIFECYCLE STATE
```

---

# 48. Final Product Definition

**AssetFlow is a lifecycle-driven RWA financial platform.**

It turns:

```text
Real-world asset
→ Verified asset
→ Tokenized position
```

and continues the lifecycle into:

```text
Investment
→ Trading
→ Yield
→ Collateral
→ Borrow
→ Repayment
→ Maturity
→ Settlement
```

The core technical principle:

> **The blockchain enforces and records financial state, ownership, lifecycle rules, and settlement. Off-chain services handle documents, AI extraction, metadata, search, and analytics.**

The core differentiation:

> **AssetFlow makes the lifecycle itself programmable and uses the asset's current state to determine which financial actions are available.**

The core demo:

> **Take one invoice from creation to settlement and show how its state changes the financial actions available throughout its lifecycle.**

---

# 49. Future Expansion

Potential future asset classes:
- real estate
- trade receivables
- equipment financing
- revenue-sharing assets
- renewable energy assets

Potential future infrastructure:
- institutional compliance
- advanced risk models
- external verification
- oracle integrations
- advanced order books
- auctions
- multi-asset portfolios
- institutional credit

These are not required for the hackathon MVP.
