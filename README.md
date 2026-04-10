# ero. — X402 Agent Gateway & Playground

Payment-native infrastructure on the **Stellar Testnet**. Autonomous AI agents discover APIs, pay for access with USDC, and collaborate on multi-step tasks — all verified on-chain.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [System Diagram](#system-diagram)
  - [Core Modules](#core-modules)
- [The X402 Payment Protocol](#the-x402-payment-protocol)
- [Agent System](#agent-system)
  - [Task Lifecycle](#task-lifecycle)
  - [Agent Roles](#agent-roles)
  - [Cross-Step Data Flow](#cross-step-data-flow)
- [Smart Contract (Soroban)](#smart-contract-soroban)
- [Frontend Architecture](#frontend-architecture)
  - [Pages & Routing](#pages--routing)
  - [Design System — "Signal / Noise"](#design-system--signal--noise)
  - [Real-Time WebSocket Layer](#real-time-websocket-layer)
- [Backend Architecture](#backend-architecture)
  - [Route Map](#route-map)
  - [Service Layer](#service-layer)
  - [Data Persistence](#data-persistence)
  - [Security & Middleware](#security--middleware)
- [Wallet System](#wallet-system)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)

---

## Overview

**ero.** is a hackathon project built on two interlocking products:

| Product | What It Does |
|---------|-------------|
| **X402 API Gateway** | Wraps any REST API with HTTP 402 "Payment Required" enforcement. Callers pay USDC on Stellar before their request is forwarded upstream. |
| **Agent Playground** | A simulation environment where AI agents decompose natural-language tasks into multi-step workflows, autonomously pay for API access, and synthesize results. |

Both products share the same payment rail: USDC on the Stellar Testnet, verified through the Horizon API.

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                     │
│                                                                     │
│  ┌───────────┐  ┌───────────┐  ┌────────────┐  ┌───────────────┐  │
│  │ Dashboard  │  │  Gateway  │  │ Playground │  │   Payments    │  │
│  │  (stats)   │  │ (register │  │  (agents   │  │   (history)   │  │
│  │            │  │  + test)  │  │  + tasks)  │  │               │  │
│  └─────┬──────┘  └─────┬─────┘  └─────┬──────┘  └──────┬────────┘  │
│        │               │              │                │           │
│        └───────────┬───┴──────────────┴────────────────┘           │
│                    │              │                                  │
│              REST API        WebSocket                              │
│              (HTTP)          (ws://)                                 │
└────────────────┼──────────────┼─────────────────────────────────────┘
                 │              │
┌────────────────┼──────────────┼─────────────────────────────────────┐
│                ▼              ▼          BACKEND (Express + WS)      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      Route Layer                              │   │
│  │  /api (gateway) · /x402 (protocol) · /api/tasks (agents)    │   │
│  │  /api/wallet · /api/payments · /api/dashboard                │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                       │
│  ┌──────────┬───────────────┼──────────────┬──────────────────┐    │
│  │ Gateway  │   Stellar     │   Agent      │   OpenAI/LLM    │    │
│  │ Service  │   Service     │   Service    │   Service        │    │
│  │ (proxy)  │   (payments)  │   (tasks)    │   (reasoning)    │    │
│  └────┬─────┘   └────┬──────┘   └────┬─────┘   └──────────────┘    │
│       │              │              │                               │
│       ▼              ▼              ▼                               │
│  ┌─────────┐   ┌──────────┐   ┌──────────┐                        │
│  │ Upstream │   │ Stellar  │   │  SQLite  │                        │
│  │  APIs    │   │ Testnet  │   │   Store  │                        │
│  └─────────┘   └──────────┘   └──────────┘                        │
│                      │                                              │
│                      ▼                                              │
│               ┌──────────────┐                                      │
│               │   Soroban    │                                      │
│               │  (on-chain   │                                      │
│               │   registry)  │                                      │
│               └──────────────┘                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Core Modules

| Module | Description |
|--------|-------------|
| **Gateway Service** | Registers APIs, enforces 402 payment walls, proxies verified requests to upstream endpoints with retry logic. |
| **Stellar Service** | Wallet creation, USDC payments, trustline management, on-chain verification via Horizon, Friendbot funding, and a custom USDC faucet. |
| **Soroban Service** | Optional on-chain API registry. Builds unsigned transactions for Freighter signing, submits signed XDR, polls for confirmation. Auto-syncs local DB every 30s. |
| **Agent Service** | Task orchestrator. Decomposes prompts into steps via LLM, manages approval gates, executes steps sequentially, chains data between steps, handles autonomous x402 payments. |
| **Agent Wallet Service** | Per-user Stellar keypair management. Creates, encrypts (AES-256-GCM), activates, funds, and withdraws from agent wallets. |
| **OpenAI Service** | LLM interface via OpenRouter. Three call patterns: task decomposition (temp 0.3), step execution (temp 0.5), and template patching (temp 0). |
| **Events Service** | WebSocket broadcast hub and structured logger. Sends real-time updates for logs, task/step changes, payments, and stats. |

---

## The X402 Payment Protocol

The x402 protocol implements HTTP 402 "Payment Required" for machine-to-machine micropayments:

```
Step 1: REQUEST
  Client ──► GET /x402/{slug}/{path}

Step 2: 402 RESPONSE
  Server ──► {
               status: 402,
               amount: "0.01",
               asset: "USDC",
               network: "stellar:testnet",
               address: "GABC...",
               memo: "pay_abc123",
               paymentId: "uuid-..."
             }

Step 3: PAY ON STELLAR
  Client ──► Signs USDC payment TX with Freighter
         ──► Submits to Stellar Testnet

Step 4: VERIFY & ACCESS
  Server ──► Verifies payment on Horizon (memo + amount + destination)
         ──► Forwards request to upstream API
         ──► Marks payment as "consumed" (single-use)
```

**Payment lifecycle:** `pending` → `submitted` → `verified` → `consumed`
Payments expire after 10 minutes if not submitted. Consumed payments cannot be replayed.

**Manual flow** (Gateway page): User signs with Freighter wallet.
**Agent flow** (Playground): Agent wallet pays autonomously using server-signed transactions.

---

## Agent System

### Task Lifecycle

```
┌──────────┐    ┌──────────────┐    ┌────────────────────┐    ┌───────────┐    ┌───────────┐
│ pending  │ ──►│ decomposing  │ ──►│ awaiting_approval  │ ──►│ executing │ ──►│ completed │
└──────────┘    └──────────────┘    └────────────────────┘    └───────────┘    └───────────┘
                  LLM breaks            User reviews              Steps run         Result
                  prompt into           steps + costs             sequentially      stored
                  2-5 steps             (approve/deny/            with x402
                                        approve_always)           payments
```

1. **Create** — User submits a natural-language prompt with their Stellar public key.
2. **Decompose** — The LLM analyzes the prompt against the full API catalog (~120 APIs) and produces a plan of 2-5 sequential steps. Each step specifies an agent role, API endpoint, query parameters, and estimated cost.
3. **Approve** — Steps are presented to the user via WebSocket. The user can approve, deny, or set "approve always" for future tasks.
4. **Execute** — Steps run sequentially (one task at a time via promise queue):
   - If a step requires an API, the full x402 flow is executed autonomously
   - The LLM processes the API response according to the agent's role
   - Output from each step chains as input to the next
5. **Complete** — Final synthesized result is stored and displayed.

### Agent Roles

| Role | Name | Responsibility |
|------|------|---------------|
| `data_retrieval` | DataFetcher | Calls APIs, extracts structured data from responses |
| `summarization` | Summarizer | Condenses and synthesizes information from previous steps |
| `verification` | Verifier | Cross-references data across sources for accuracy |
| `analysis` | Analyst | Draws conclusions, identifies patterns, generates insights |

### Cross-Step Data Flow

Steps reference earlier results using template syntax:

```
{{step1.results[0].latitude}}  →  resolved from Step 1's API response
{{step2.summary}}              →  resolved from Step 2's output
```

The system navigates JSON paths including array indices. When template resolution fails, the LLM fallback (`patchStepWithData`) rewrites the endpoint and params using actual values from previous steps.

---

## Smart Contract (Soroban)

A Soroban smart contract provides an on-chain API registry on the Stellar network.

**Contract:** `contracts/api-registry/src/lib.rs`
**SDK:** `soroban-sdk 21.0.0`
**Compiled to:** WASM (cdylib)

### Data Model

```rust
pub struct ApiEntry {
    id: String,              // Auto-incrementing: "api_1", "api_2", ...
    base_url: String,        // Upstream API URL
    endpoint: String,        // Specific path being wrapped
    wrapped_path: String,    // Gateway-exposed path
    price: i128,             // Cost per call (base units: 1 USDC = 10,000,000)
    receiver_address: Address, // Payment recipient
    owner: Address,          // Registrant (for access control)
    status: u32,             // 1 = active
    created_at: u64,         // Ledger timestamp
}
```

### Contract Functions

| Function | Access | Description |
|----------|--------|-------------|
| `register_api` | Authenticated (caller) | Registers a new API entry, auto-assigns ID, extends TTL to ~30 days |
| `remove_api` | Owner only | Deletes an API entry (ownership verified) |
| `get_api` | Public (read-only) | Lookup by ID |
| `get_all_apis` | Public (read-only) | Returns all registered APIs |
| `update_status` | Owner only | Toggle API active/inactive |

### Integration Flow

The contract is optional for this hackathon — enabled when `SOROBAN_CONTRACT_ID` is set in `.env`.

1. Backend builds unsigned Soroban transaction
2. Frontend signs via Freighter wallet extension
3. Backend submits signed XDR and polls for confirmation (up to 60s)
4. Auto-sync every 30s: reads on-chain state and upserts into local SQLite

---

## Frontend Architecture

### Pages & Routing

```
/                →  Home (landing page — public)
/product         →  ProductDetails (documentation — public)
/dashboard       →  Dashboard (metrics & activity — wallet-gated)
/gateway         →  GatewayPanel (register & test APIs — wallet-gated)
/playground      →  Playground (agent tasks — wallet-gated)
/payments        →  Payments (payment history — wallet-gated)
```

Wallet-gated routes are wrapped in `<Layout>` which renders `<WalletGate>` if Freighter is not connected.

### Component Tree

```
<WalletProvider>
  <BrowserRouter>
    /           →  <Home> (hero, product cards, flow diagrams, DemoTerminal)
    /product    →  <ProductDetails> (architecture explainer, CodeBlock)
    <Layout>    →  <Navbar> + <WalletGate> (if disconnected)
      /dashboard   →  <Dashboard>
                        ├── <OverviewBar> (4x MetricCard + split bar)
                        ├── <GatewaySection> (HorizontalBarList, StackedStatusBar)
                        ├── <PlaygroundSection> (DonutRing, HorizontalBarList)
                        ├── <ActivityFeed> (filterable log viewer)
                        └── <RecentPayments> (condensed payment list)
      /gateway     →  <GatewayPanel>
                        ├── Register Form (Soroban + direct fallback)
                        ├── API Table (status, slug, price, calls, revenue)
                        └── <ApiTestPanel> (inline x402 test flow)
      /playground  →  <Playground>
                        ├── Agent Wallet (activate, fund, withdraw)
                        ├── <TaskTemplates> (6 pre-built prompts)
                        ├── <PromptInput> (textarea + execute)
                        ├── <DecomposingOverlay> (skeleton loading)
                        ├── <ApprovalGate> (step review + cost summary)
                        ├── <StepPipeline> (horizontal scrolling cards)
                        │     └── <PaymentFlowViz> (5-phase payment viz)
                        ├── <TaskResult> (markdown rendering)
                        ├── <LogTerminal> (color-coded live logs)
                        └── <AgentPanel> (agent status cards)
      /payments    →  <Payments> (full payment history table)
  </BrowserRouter>
</WalletProvider>
```

### Design System — "Signal / Noise"

A "classified-document-meets-mission-control" aesthetic.

| Element | Value |
|---------|-------|
| **Background** | Near-black `#08080A` with dot-matrix grid, SVG noise grain, orange radial bleed |
| **Accent** | International Orange `#FF4F00` (hover/muted/glow variants) |
| **Display Font** | **Syne** — bold, tight tracking, for headings and brand |
| **Body Font** | **Martian Mono** — monospace, for all body text, data, labels |
| **Hero Size** | `clamp(4rem, 10vw, 8rem)` |
| **Labels** | `9px uppercase tracking-[0.2em] font-mono` |
| **Corners** | Sharp — 0-4px radius maximum |
| **Transitions** | 80ms — mechanical, not fluid |
| **Borders** | Ultra-subtle `rgba(255,255,255,0.06)` |
| **Active State** | `scale(0.97)` — tactile press feedback |

**Status colors:**
- Success: `#34D399` (green)
- Warning: `#FBBF24` (yellow)
- Error: `#F87171` (red)
- Pending: `#525264` (gray)

**Atmospheric layers** (applied globally via CSS):
1. `dot-matrix` — 24px radial dot grid with slow drift animation
2. `noise-grain` — SVG `feTurbulence` film grain at 2% opacity
3. `orange-bleed` — Fixed radial gradient from top-right corner
4. Backdrop blur on Navbar and cards

### Real-Time WebSocket Layer

The frontend connects to `ws://localhost:3001/ws` with auto-reconnect (exponential backoff, 1s–30s).

| Event Type | Payload | Consumers |
|-----------|---------|-----------|
| `log` | `LogEntry` (level, source, message) | Dashboard (live feed), Playground (log terminal + payment phase parsing) |
| `task_update` | Full `Task` object | Playground (task state) |
| `step_update` | `{ taskId, step, agents? }` | Playground (step pipeline) |
| `payment_update` | `PaymentRequest` object | Payments page (table updates) |
| `stats_update` | `Partial<EnhancedDashboardStats>` | Dashboard (metric refresh) |
| `approval_required` | `{ taskId, steps, totalEstimatedCost, agentBalance }` | Playground (approval gate) |

### State Management

No external state library. Pure React Context + hooks:

- **WalletContext** — Global wallet connection state, agent wallet info, session-persisted via `sessionStorage`
- **useApi** — Generic data-fetching hook with `{ data, loading, error, refetch }`
- **useWebSocket** — WebSocket connection with auto-reconnect, takes `onEvent` callback
- **Page-level state** — Each page manages its own `useState` (Playground is the most stateful)

---

## Backend Architecture

### Route Map

#### Gateway (`/api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register-api` | Register API directly (no Soroban) |
| `POST` | `/register-api/prepare` | Build unsigned Soroban register TX |
| `POST` | `/register-api/submit` | Submit signed Soroban register TX |
| `POST` | `/apis/:id/remove/prepare` | Build unsigned Soroban remove TX |
| `POST` | `/apis/:id/remove/submit` | Submit signed remove TX |
| `GET` | `/apis` | List all APIs (optional `?owner=` filter) |
| `DELETE` | `/apis/:id` | Delete API (ownership check) |
| `GET` | `/agent-wallet` | Get or create per-user agent wallet |
| `POST` | `/fund-agent` | Build unsigned USDC funding TX |
| `POST` | `/fund-agent/submit` | Submit signed funding TX |
| `GET` | `/balance/:publicKey` | Get USDC balance for any Stellar account |
| `GET` | `/faucet/info` | USDC faucet metadata |
| `POST` | `/faucet` | Request USDC (max 10,000 per request) |
| `POST` | `/faucet/submit` | Submit signed trustline TX + mint USDC |

#### X402 Protocol (`/x402`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/prepare-payment` | Get 402 details + build unsigned payment TX |
| `POST` | `/submit-payment` | Submit signed TX, verify on-chain, forward request |
| `GET` | `/*` | Proxy: returns 402 if unpaid, forwards if verified |

#### Tasks (`/api/tasks`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Create task from prompt |
| `GET` | `/` | List all tasks |
| `GET` | `/:id` | Get single task |
| `POST` | `/:id/execute` | Start LLM decomposition → approval gate |
| `POST` | `/:id/approve` | Approve/deny/approve_always |

#### Wallet (`/api/wallet`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/activate` | Build unsigned createAccount TX |
| `POST` | `/activate/submit` | Submit activation + auto-setup USDC trustline |
| `POST` | `/withdraw` | Server-signed withdrawal to user wallet |

#### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/payments` | List all payments |
| `GET` | `/api/payments/:id` | Get single payment |
| `GET` | `/api/dashboard/stats` | Aggregated dashboard metrics |
| `GET` | `/api/health` | Health check |

### Service Layer

```
┌─────────────────────────────────────────────────────────┐
│                   Agent Service                          │
│  (task orchestrator — decompose, approve, execute)       │
│                                                          │
│  Uses:  OpenAI Service  ·  Gateway Service               │
│         Stellar Service  ·  Agent Wallet Service          │
│         Events Service   ·  Memory Store                  │
└───────────┬──────────────────────────────────────────────┘
            │
  ┌─────────┼─────────┬──────────────┬──────────────────┐
  ▼         ▼         ▼              ▼                  ▼
OpenAI    Gateway   Stellar       Agent Wallet       Events
Service   Service   Service       Service            Service
(LLM)    (proxy)   (payments)   (per-user keys)    (WebSocket)
  │         │         │              │                  │
  ▼         ▼         ▼              ▼                  ▼
OpenRouter  Upstream  Horizon     SQLite (encrypted)   WS Clients
(Gemini)    APIs      + Soroban   AES-256-GCM
```

| Service | File | Key Responsibilities |
|---------|------|---------------------|
| `stellar.service.ts` | Core blockchain | Keypair management, USDC asset issuance, payment TX building/submission/verification, trustlines, Friendbot funding, faucet |
| `soroban.service.ts` | Smart contract | Build register/remove TXs, simulate for resources, submit + poll, parse ScVal results |
| `gateway.service.ts` | API proxy | URL validation (blocks private IPs), 402 response generation, payment verification, upstream forwarding with retries |
| `agent.service.ts` | Task orchestration | LLM decomposition, approval management, sequential step execution, cross-step data resolution, autonomous payments |
| `agent-wallet.service.ts` | Wallet lifecycle | Create/encrypt/store keypairs, activation TX building, USDC trustline setup, fund/withdraw operations |
| `openai.service.ts` | LLM interface | Task decomposition (temp 0.3), agent step execution (temp 0.5), template patching (temp 0). Uses OpenRouter with `google/gemini-2.0-flash-001` |
| `events.service.ts` | Real-time | WebSocket client management, ping/pong heartbeat (30s), broadcast to all clients, structured logging to SQLite + WS |
| `seed.service.ts` | Bootstrap | Seeds ~120 free public APIs from the catalog on startup |

### Data Persistence

SQLite via `better-sqlite3` in WAL mode. Database at `data/wallets.db`.

**Tables:**

| Table | Purpose | Key Columns |
|-------|---------|------------|
| `apis` | Registered API endpoints | id, slug (unique), base_url, price, receiver_address, owner, call_count, total_revenue |
| `payments` | Payment records | id, api_id, amount, status (pending/submitted/verified/consumed/expired/failed), tx_hash, caller_type (manual/agent), task_id |
| `tasks` | Agent tasks | id, prompt, status, steps (JSON), agents (JSON), total_spent, result (JSON) |
| `logs` | Event log | timestamp, level (info/warn/error/payment/agent), source, message, data (JSON). Pruned to 2000 max. |
| `agent_wallets` | Encrypted keypairs | user_public_key (PK), agent_public_key, agent_secret_key_enc (AES-256-GCM), activated |

### Security & Middleware

| Layer | Implementation |
|-------|---------------|
| **Rate Limiting** | General: 100 req/min. Sensitive endpoints: 15 req/min. Faucet: 3 req/5min. |
| **CORS** | Origin-restricted to `config.frontendUrl` |
| **Security Headers** | Helmet.js |
| **Error Sanitization** | Whitelisted error prefixes pass through; others return "Something went wrong" |
| **URL Validation** | Blocks private IP ranges, localhost, link-local addresses in API registration |
| **Wallet Encryption** | AES-256-GCM for agent secret keys at rest |
| **Key Management** | Env var → persisted file → auto-generated (file is mode 0o600) |
| **Payment Replay Prevention** | Consumed payments cannot be reused |
| **Payment Expiry** | Pending payments expire after 10 minutes |

---

## Wallet System

Three wallet contexts exist in the system:

| Wallet | Type | Purpose |
|--------|------|---------|
| **User Wallet** | Freighter (browser extension) | Signs transactions, pays for API calls manually, funds agent wallets |
| **Per-User Agent Wallet** | Server-managed Stellar keypair | Autonomous payments during task execution. Created per user, encrypted at rest. |
| **Shared Server Wallet** | Server keypair from config | Fallback agent wallet when user hasn't activated their own |

**Agent wallet lifecycle:**
1. **Create** — `Keypair.random()`, encrypted with AES-256-GCM, stored in SQLite
2. **Activate** — User signs `createAccount` TX (1-20 XLM), server auto-adds USDC trustline
3. **Fund** — User signs USDC transfer to agent wallet
4. **Execute** — Agent sends server-signed payments during task steps
5. **Withdraw** — Server-signed USDC transfer back to user wallet

---

## Tech Stack

### Backend

| Technology | Purpose |
|-----------|---------|
| **Node.js + Express** | HTTP server and REST API |
| **TypeScript** | Type safety (ES2020, strict mode) |
| **@stellar/stellar-sdk 11** | Horizon + Soroban blockchain interaction |
| **better-sqlite3** | Embedded database (WAL mode) |
| **ws** | WebSocket server |
| **OpenAI SDK** | LLM calls via OpenRouter (Gemini Flash) |
| **Helmet** | Security headers |
| **express-rate-limit** | Request throttling |

### Frontend

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **Vite 5** | Build tool and dev server |
| **TypeScript 5** | Type safety |
| **Tailwind CSS 3** | Utility-first styling |
| **Framer Motion 12** | Animations and transitions |
| **React Router 6** | Client-side routing |
| **@stellar/freighter-api 6** | Wallet integration |
| **react-markdown + remark-gfm** | Task result rendering |
| **prism-react-renderer** | Syntax highlighting |
| **Lucide React** | Icon set |

### Smart Contract

| Technology | Purpose |
|-----------|---------|
| **Rust** | Contract language |
| **Soroban SDK 21** | Stellar smart contract framework |
| **WASM (cdylib)** | Compilation target |

### Infrastructure

| Component | Details |
|-----------|---------|
| **Network** | Stellar Testnet |
| **Asset** | Custom USDC (server-issued on testnet) |
| **LLM Provider** | OpenRouter (`google/gemini-2.0-flash-001`) |
| **Database** | SQLite (file-based, WAL mode) |
| **Monorepo** | npm workspaces with `concurrently` |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- [Freighter Wallet](https://www.freighter.app/) browser extension (set to **Testnet**)
- (Optional) Rust + `soroban-cli` for contract deployment

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd "Stellar Hackathon"

# Install all dependencies (backend + frontend)
npm install

# Copy environment template
cp .env.example .env
```

### Configuration

Edit `.env` with at minimum:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

All other values have sensible defaults. See [Environment Variables](#environment-variables) for the full list.

### Running

```bash
# Start both backend (port 3001) and frontend (port 5173)
npm run dev
```

Then open `http://localhost:5173`, connect your Freighter wallet (on Testnet), and use the faucet to get test USDC.

### Build

```bash
npm run build
```

Production frontend: ~485KB JS (146KB gzip), ~30KB CSS (7KB gzip).

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Backend server port |
| `FRONTEND_URL` | No | `http://localhost:5173` | CORS origin |
| `STELLAR_NETWORK` | No | `testnet` | Stellar network |
| `STELLAR_HORIZON_URL` | No | Testnet Horizon | Horizon API URL |
| `AGENT_SECRET_KEY` | No | Auto-generated | Shared agent wallet secret key |
| `USDC_ISSUER_SECRET` | No | Auto-generated | USDC issuer keypair secret |
| `SOROBAN_RPC_URL` | No | Testnet RPC | Soroban RPC endpoint |
| `SOROBAN_CONTRACT_ID` | No | _(disabled)_ | Deployed contract ID (enables on-chain registry) |
| `OPENROUTER_API_KEY` | **Yes** | — | API key for LLM calls via OpenRouter |
| `OPENROUTER_MODEL` | No | `google/gemini-2.0-flash-001` | LLM model identifier |
| `DEFAULT_AGENT_BALANCE` | No | `100` | Initial agent wallet balance |
| `DEFAULT_MAX_SPEND_PER_TASK` | No | `10` | Max USDC spend per task |
| `WALLET_ENCRYPTION_KEY` | No | Auto-generated | 64 hex chars for AES-256-GCM |
| `WALLET_DB_PATH` | No | `data/wallets.db` | SQLite database path |

---

## Project Structure

```
Stellar Hackathon/
├── package.json                    # Monorepo root (npm workspaces)
├── .env.example                    # Environment template
├── .gitignore
├── API_REFERENCE.md                # Test API cheat sheet
├── idea.md                         # Project specification
│
├── contracts/
│   └── api-registry/
│       ├── Cargo.toml              # Soroban contract manifest
│       └── src/
│           └── lib.rs              # On-chain API registry contract
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── nodemon.json
│   └── src/
│       ├── index.ts                # Express + WebSocket entry point
│       ├── config.ts               # Environment configuration
│       ├── config/
│       │   └── api-catalog.ts      # ~120 free API definitions for seeding
│       ├── middleware/
│       │   ├── errorHandler.ts     # Error sanitization
│       │   └── rateLimiter.ts      # 3-tier rate limiting
│       ├── routes/
│       │   ├── gateway.routes.ts   # API registration, faucet, balance
│       │   ├── x402.routes.ts      # Payment protocol endpoints
│       │   ├── tasks.routes.ts     # Task CRUD and execution
│       │   ├── wallet.routes.ts    # Agent wallet activation/withdrawal
│       │   ├── payments.routes.ts  # Payment history
│       │   └── dashboard.routes.ts # Aggregated statistics
│       ├── services/
│       │   ├── stellar.service.ts  # Stellar SDK: wallets, payments, verification
│       │   ├── soroban.service.ts  # Soroban smart contract integration
│       │   ├── gateway.service.ts  # x402 proxy logic
│       │   ├── agent.service.ts    # Task orchestration
│       │   ├── agent-wallet.service.ts # Per-user wallet management
│       │   ├── openai.service.ts   # LLM calls via OpenRouter
│       │   ├── events.service.ts   # WebSocket + structured logging
│       │   └── seed.service.ts     # API catalog seeding
│       ├── store/
│       │   ├── memory.store.ts     # SQLite: APIs, payments, tasks, logs
│       │   └── wallet.store.ts     # SQLite: encrypted agent wallets
│       ├── types/
│       │   └── index.ts            # All TypeScript interfaces
│       └── utils/
│           └── crypto.ts           # AES-256-GCM encryption
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts              # Dev server + proxy config
│   ├── tailwind.config.js          # Design system tokens
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── index.html                  # Entry HTML (Google Fonts: Syne, Martian Mono)
│   └── src/
│       ├── main.tsx                # React 18 entry point
│       ├── App.tsx                 # Router + WalletProvider
│       ├── index.css               # CSS imports + Tailwind directives
│       ├── context/
│       │   └── WalletContext.tsx    # Global wallet state
│       ├── hooks/
│       │   ├── useApi.ts           # Generic data-fetching hook
│       │   └── useWebSocket.ts     # WebSocket with auto-reconnect
│       ├── services/
│       │   ├── api.ts              # Backend API client
│       │   └── freighter.ts        # Freighter wallet wrapper
│       ├── pages/
│       │   ├── Home.tsx            # Landing page
│       │   ├── ProductDetails.tsx  # Architecture explainer
│       │   ├── Dashboard.tsx       # Metrics + activity
│       │   ├── GatewayPanel.tsx    # Register + test APIs
│       │   ├── Playground.tsx      # Agent task execution
│       │   └── Payments.tsx        # Payment history
│       ├── components/
│       │   ├── layout/             # Navbar, Layout, WalletGate, NavItem, Sidebar
│       │   ├── dashboard/          # MetricCard, DonutRing, HorizontalBarList,
│       │   │                       # StackedStatusBar, OverviewBar, GatewaySection,
│       │   │                       # PlaygroundSection, ActivityFeed, RecentPayments
│       │   ├── playground/         # PromptInput, TaskTemplates, DecomposingOverlay,
│       │   │                       # ApprovalGate, StepPipeline, PaymentFlowViz,
│       │   │                       # LogTerminal, AgentPanel, TaskResult
│       │   └── shared/             # Badge, Button, CodeBlock, DemoTerminal,
│       │                           # Input, Modal, StatusDot, TerminalWindow
│       ├── types/
│       │   └── index.ts            # Frontend TypeScript interfaces
│       └── styles/
│           ├── theme.css           # CSS custom properties (design tokens)
│           ├── typography.css      # Font rules and text styles
│           ├── animations.css      # Keyframes and animation utilities
│           └── atmosphere.css      # Dot-matrix, noise grain, orange bleed
│
└── data/                           # Runtime data (gitignored)
    ├── .wallet-key                 # Encryption key
    ├── wallets.db                  # SQLite database
    ├── wallets.db-shm              # SQLite shared memory
    └── wallets.db-wal              # SQLite write-ahead log
```
