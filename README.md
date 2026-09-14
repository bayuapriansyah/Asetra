# AssetFlow

> **Real-world assets, made programmable.**

AssetFlow is a lifecycle-driven RWA (Real-World Asset) financial platform built on BOT Chain. It transforms verified real-world assets — such as invoices — into programmable on-chain positions that can be invested in, traded, used as collateral, generate yield, and eventually settled.

---

## Problem

Tokenization alone does not solve the full financial lifecycle of a real-world asset. Once an asset is tokenized, there is no standard on-chain mechanism for:

- Investment and financing
- Secondary trading
- Collateral use and borrowing
- Yield accounting and claiming
- Maturity enforcement
- Settlement

AssetFlow continues the workflow beyond token creation.

---

## Solution

AssetFlow gives every verified real-world asset a **programmable financial lifecycle**:

```
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

The asset's **current state determines which financial actions are available**. The smart contract enforces the rules at every step.

---

## Core Feature: Lifecycle Engine

The lifecycle is not just a UI visualization — it is enforced by the smart contract:

| State | Available Actions |
|-------|-------------------|
| CREATED | Verify |
| VERIFIED | Tokenize |
| TOKENIZED | List |
| LISTED | Invest |
| ACTIVE | Trade, Yield, Collateral, Borrow, Repay |
| MATURED | Settle |
| SETTLED | None (closed) |

Invalid state transitions revert on-chain.

---

## Architecture

```
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
                 BOT Chain (968)
                      |
                      v
              AssetFlow.sol (deployed)
```

### Frontend

- **Framework:** Next.js 16 + React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **Web3:** wagmi v2 + viem
- **Network:** BOT Chain Testnet (Chain ID 968)

### Smart Contract

- **Language:** Solidity 0.8.20
- **Testing:** Foundry (28/28 tests passing)
- **Deployment:** BOT Chain Testnet via Remix IDE

---

## Smart Contract

**Address:** `0x20a755b4aE0AB9bE9d1D7b456018ddb7F0dA6669`

**Explorer:** [View on BOT Chain Explorer](https://scan.bohr.life/address/0x20a755b4aE0AB9bE9d1D7b456018ddb7F0dA6669)

### Functions

| Category | Functions |
|----------|-----------|
| Core | `createAsset()`, `verifyAsset()`, `tokenizeAsset()`, `listAsset()`, `buyTokens()` |
| Lifecycle | `matureAsset()`, `settleAsset()` |
| Trading | `createSellOrder()`, `cancelSellOrder()`, `executeTrade()` |
| Credit | `depositCollateral()`, `withdrawCollateral()`, `borrow()`, `repay()` |
| Yield | `calculateYield()`, `claimYield()` |
| Views | `getPosition()`, `getAvailableUnits()`, `getBorrowedAmount()`, `getHealth()`, `getHoldingScore()` |

### Events

`AssetCreated`, `AssetVerified`, `AssetTokenized`, `AssetListed`, `InvestmentMade`, `SellOrderCreated`, `SellOrderCancelled`, `TradeExecuted`, `CollateralDeposited`, `CollateralWithdrawn`, `Borrowed`, `Repaid`, `YieldClaimed`, `AssetMatured`, `AssetSettled`

---

## Frontend Pages

| Page | URL | Description |
|------|-----|-------------|
| Landing | `/` | Hero, lifecycle visualization, marketplace preview |
| Overview | `/app` | Portfolio summary, active positions |
| Marketplace | `/app/marketplace` | Browse and filter listed assets |
| Asset Detail | `/app/assets/[id]` | Full asset info, lifecycle, actions |
| Portfolio | `/app/portfolio` | Investment positions table |
| Yield | `/app/yield` | Yield accrual, holding scores |
| Trading | `/app/trading` | Secondary market buy/sell |
| Collateral | `/app/collateral` | Deposit/withdraw collateral |
| Borrow | `/app/borrow` | Borrow/repay with health factor |
| Create Asset | `/app/issuer/create` | Register new asset |
| My Offerings | `/app/issuer/assets` | Issuer's created assets |
| Activity | `/app/activity` | Transaction history from events |
| Settings | `/app/settings` | Wallet and network info |

---

## BOT Chain Configuration

| Parameter | Value |
|-----------|-------|
| Network | BOT Chain Testnet |
| Chain ID | 968 |
| RPC | `https://rpc.bohr.life` |
| Explorer | `https://scan.bohr.life` |
| Faucet | `https://faucet.botchain.ai/basic` |
| Native Token | BOT |

---

## Local Setup

### Prerequisites

- Node.js v18+
- npm or yarn
- MetaMask browser extension

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd AssetFlow

# Install frontend dependencies
cd web
npm install

# Run development server
npm run dev
```

### Smart Contract (Foundry)

```bash
cd contracts
forge install
forge test
```

### Environment Variables

Create `web/.env.local`:

```
NEXT_PUBLIC_ASSETFLOW_ADDRESS=0x20a755b4aE0AB9bE9d1D7b456018ddb7F0dA6669
```

### MetaMask Setup

1. Add BOT Chain Testnet:
   - Network Name: BOT Chain Testnet
   - RPC URL: `https://rpc.bohr.life`
   - Chain ID: `968`
   - Currency Symbol: BOT
   - Block Explorer: `https://scan.bohr.life`

2. Get testnet BOT tokens from the faucet

---

## Demo Flow

The full demo follows one invoice through its entire lifecycle:

```
1. Create Invoice        → Form submit → MetaMask → Created state
2. Verify                → Admin wallet → Verified state
3. Tokenize              → Set supply → Tokenized state
4. List on Marketplace   → Listed state → Visible to investors
5. Invest                → Buy tokens → Position created → Portfolio updates
6. Claim Yield           → Yield accrues over time → Claim to wallet
7. Deposit Collateral    → Use position as collateral
8. Borrow                → Borrow against collateral → Health factor
9. Repay                 → Repay loan
10. Mature Asset         → ACTIVE → MATURED state
11. Settle Asset         → MATURED → SETTLED state → Lifecycle complete
```

Every transaction is recorded on BOT Chain and verifiable on the explorer.

---

## Demo Asset

```text
Invoice #INV-2048
PT Nusantara Manufacturing → Global Industrial Corp.
Face Value: $100,000
Expected Yield: 8.2%
Maturity: 90 days
Token Supply: 100,000 units
```

---

## Testing

### Smart Contract Tests

```bash
cd contracts
forge test
# 28/28 tests passing
```

Test coverage:
- Lifecycle state transitions
- Invalid state reverts
- Access control (admin, issuer, investor)
- Investment and position accounting
- Trading (create, cancel, execute)
- Collateral (deposit, withdraw, LTV enforcement)
- Borrowing (borrow, repay, health)
- Yield calculation
- Maturity and settlement

### Frontend Build

```bash
cd web
npm run build
# 15/15 pages compiled
```

---

## Project Structure

```
AssetFlow/
├── contracts/
│   ├── src/
│   │   └── AssetFlow.sol          # Main smart contract
│   ├── test/
│   │   └── AssetFlow.t.sol        # 28 Foundry tests
│   └── foundry.toml
├── web/
│   ├── app/                        # Next.js pages
│   │   ├── page.tsx                # Landing page
│   │   ├── app/
│   │   │   ├── page.tsx            # Overview
│   │   │   ├── marketplace/
│   │   │   ├── assets/[id]/
│   │   │   ├── portfolio/
│   │   │   ├── yield/
│   │   │   ├── trading/
│   │   │   ├── collateral/
│   │   │   ├── borrow/
│   │   │   ├── issuer/
│   │   │   ├── activity/
│   │   │   └── settings/
│   ├── components/                 # Reusable components
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utilities
│   ├── config/                     # ABI + contract address
│   └── types/                      # TypeScript types
└── README.md
```

---

## Limitations

- Single contract for all assets (not separate ERC-20 per asset)
- No off-chain document storage or AI extraction in MVP
- No advanced order book or auction mechanism
- Yield uses simple annual calculation (not compound)
- No institutional compliance layer

---

## Future Improvements

- Off-chain document storage and AI extraction
- Multiple RWA types (real estate, trade receivables, equipment)
- Advanced order book with limit orders
- Oracle integration for real-world price feeds
- Multi-asset portfolio management
- Institutional compliance and KYC

---

## Built For

**Girl Meets Tech — Build Week Hackathon Vol.2**

Built on BOT Chain (EVM) with Next.js, wagmi, viem, and Foundry.
