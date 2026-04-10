# 🚀 X402 Agent Gateway & Playground

## 🧠 Overview

**X402 Agent Gateway & Playground** is a payment-native infrastructure system built on the Stellar Testnet that enables autonomous agents to economically interact with APIs and collaborate on multi-step tasks.

The system introduces:
- **Pay-per-request APIs (x402-style)**
- **Agent-driven task execution**
- **Autonomous payment handling**
- **Multi-agent workflow orchestration**

This project demonstrates how AI agents can operate as independent economic actors — discovering services, paying for them, and collaborating to complete tasks.

---

## 🎯 Objectives

The system is composed of two tightly integrated modules:

### 1. X402 API Wrapper Gateway
A backend service that:
- Accepts any REST API
- Wraps endpoints with payment enforcement
- Requires payment before access is granted
- Verifies transactions on the Stellar Testnet

### 2. Agent Playground
A simulation environment where:
- Users define tasks in natural language
- Agents execute tasks step-by-step
- Agents autonomously call paid APIs
- Multi-agent workflows are coordinated and logged

---

## 🧱 System Architecture

### Core Components

#### 1. Gateway Service (Node.js / Express)
Handles API wrapping and payment enforcement.

**Responsibilities:**
- Register external APIs
- Intercept incoming requests
- Enforce payment before forwarding requests
- Return API responses upon successful payment

---

#### 2. Payment Layer (Stellar Testnet)
Handles payment generation and verification.

**Responsibilities:**
- Generate payment instructions (amount, address, memo)
- Verify transactions via Stellar Horizon API
- Link payments to API requests using unique identifiers

---

#### 3. Agent Orchestrator
Controls agent execution and workflow logic.

**Responsibilities:**
- Parse user-defined tasks
- Break tasks into sequential steps
- Assign steps to agents
- Manage API calls and payments
- Maintain execution state and logs

---

#### 4. Frontend Playground (React)
Provides a user interface for interaction and visualization.

**Features:**
- Task input interface
- Step-by-step execution logs
- Payment tracking
- API call visualization

---

## 🔌 Module 1: X402 API Wrapper

### Input

Users provide:
- Base API URL
- Endpoint path
- Price per request

Optional:
- OpenAPI specification (JSON)

---

### API Registration

**Endpoint:**
```

POST /register-api

````

**Request Body:**
```json
{
  "baseUrl": "https://api.example.com",
  "endpoint": "/news",
  "price": 0.01
}
````

---

### Wrapped Endpoint

Once registered, the system exposes:

```
GET /x402/news
```

---

### Payment Enforcement Flow

#### Case 1: No Payment Provided

Response:

```json
{
  "status": 402,
  "message": "Payment Required",
  "amount": 0.01,
  "address": "stellar_testnet_address",
  "memo": "unique_request_id"
}
```

---

#### Case 2: Payment Provided

The system verifies:

* Transaction exists
* Amount matches required fee
* Memo matches request ID

If valid:

* Forward request to original API
* Return API response

---

### Payment Verification Strategy

* Generate a unique `request_id`
* Require payment memo to match `request_id`
* Poll Stellar Horizon API for transaction confirmation
* Cache verified payments for request reuse

---

## 🤖 Module 2: Agent Playground

### Purpose

Simulate autonomous agents that:

* Interpret user tasks
* Execute multi-step workflows
* Interact with paid APIs
* Manage their own budgets

---

### Task Input Example

```
"Fetch 5 crypto news articles and summarize them"
```

---

### Execution Flow

#### Step 1: Task Decomposition

The system converts input into:

1. Fetch news data
2. Summarize content
3. Validate output

---

#### Step 2: Agent Assignment

* **Agent A** → Data retrieval (API call)
* **Agent B** → Summarization
* **Agent C** → Verification

---

#### Step 3: API Interaction

Agent attempts:

```
GET /x402/news
```

Receives:

```
402 Payment Required
```

Agent then:

* Generates Stellar transaction
* Sends required payment
* Retries request with payment proof

---

#### Step 4: Workflow Continuation

Each step:

* Produces output
* Logs execution
* Passes result to next agent

---

## 💰 Agent Budget System

Each agent maintains:

* `wallet_balance`
* `max_spend_per_task`

This ensures:

* Controlled spending
* Prevention of runaway API calls

---

## 🔁 Multi-Agent Workflow (Simplified)

Basic validation logic:

```
if (Agent_B validates Agent_A output):
    release payment to Agent_A
else:
    terminate workflow
```

Note:

* Escrow logic can be simulated off-chain for MVP
* Optional upgrade to Soroban smart contracts

---

## 📊 Demonstration Flow

### Step 1: Register API

* Add a public API (e.g., news API)

---

### Step 2: Test Payment Flow

* Call wrapped endpoint `/x402/news`
* Receive 402 response
* Simulate payment
* Retry request → success

---

### Step 3: Execute Agent Task

**Input:**

```
"Get crypto news and summarize"
```

**Execution Log:**

```
Agent A → paid 0.01 XLM → fetched news
Agent B → summarized content
Agent C → verified output
```

---

## 🧱 Technology Stack

### Backend

* Node.js (Express)
* Axios (API forwarding)

### Blockchain

* Stellar Testnet
* Horizon API (transaction verification)

### Frontend

* React (minimal UI)

---

## ⚙️ Optional Enhancements

* OpenAPI auto-import
* API marketplace dashboard
* Agent memory and context persistence
* Soroban escrow smart contract integration

---

## 🏁 Final Positioning

This project introduces a foundational layer for the emerging agent economy by:

* Enabling APIs to become **machine-payable services**
* Allowing agents to **transact autonomously**
* Supporting **collaborative multi-agent workflows**
* Embedding **payment logic directly into execution flows**

---

## 🔥 Key Insight

The system demonstrates a shift from:

> Static APIs and human-driven interactions

To:

> Dynamic, payment-aware infrastructure where autonomous agents can operate, collaborate, and transact independently.

---
