# API Gateway — Test APIs Cheat Sheet

Copy-paste these into the **Register New API** form on the Gateway page, then hit **Try It** with the suggested sub-path.

---

## Form Fields

| Field | What to enter |
|-------|---------------|
| **Base URL** | The root URL of the public API |
| **Slug** | A short unique name (becomes `/x402/{slug}/*`) |
| **Price (USDC)** | Cost per call (use `0.01` for testing) |
| **Receiver Address** | Leave blank (defaults to agent wallet) |

---

## Test APIs

### 1. JSONPlaceholder (Fake REST API)

| Field | Value |
|-------|-------|
| Base URL | `https://jsonplaceholder.typicode.com` |
| Slug | `jsonplaceholder` |
| Price | `0.01` |

**Try It sub-paths:**
```
/posts/1
/users
/todos?userId=1
/comments?postId=1
```

---

### 2. Dexscreener (DEX Market Data)

| Field | Value |
|-------|-------|
| Base URL | `https://api.dexscreener.com` |
| Slug | `dexscreener` |
| Price | `0.01` |

**Try It sub-paths:**
```
/latest/dex/search?q=bitcoin
/latest/dex/search?q=ethereum
/latest/dex/search?q=stellar
```

---

### 3. Open-Meteo (Weather)

| Field | Value |
|-------|-------|
| Base URL | `https://api.open-meteo.com/v1` |
| Slug | `open-meteo` |
| Price | `0.01` |

**Try It sub-paths:**
```
/forecast?latitude=40.71&longitude=-74.01&current_weather=true
/forecast?latitude=51.51&longitude=-0.13&hourly=temperature_2m&forecast_days=3
```

---

### 4. PokéAPI (Pokemon Data)

| Field | Value |
|-------|-------|
| Base URL | `https://pokeapi.co/api/v2` |
| Slug | `pokeapi` |
| Price | `0.01` |

**Try It sub-paths:**
```
/pokemon/pikachu
/pokemon?limit=10
/type/fire
```

---

### 5. JokeAPI (Random Jokes)

| Field | Value |
|-------|-------|
| Base URL | `https://v2.jokeapi.dev` |
| Slug | `jokeapi` |
| Price | `0.01` |

**Try It sub-paths:**
```
/joke/Programming
/joke/Any?amount=3
```

---

### 6. Wikipedia (Article Summaries)

| Field | Value |
|-------|-------|
| Base URL | `https://en.wikipedia.org/api/rest_v1` |
| Slug | `wikipedia` |
| Price | `0.01` |

**Try It sub-paths:**
```
/page/summary/Stellar_(payment_network)
/page/summary/Bitcoin
/page/summary/Blockchain
```

---

### 7. Dog CEO (Random Dog Images)

| Field | Value |
|-------|-------|
| Base URL | `https://dog.ceo/api` |
| Slug | `dogapi` |
| Price | `0.01` |

**Try It sub-paths:**
```
/breeds/image/random
/breeds/list/all
/breed/husky/images/random
```

---

### 8. NASA (Space Data)

| Field | Value |
|-------|-------|
| Base URL | `https://api.nasa.gov` |
| Slug | `nasa` |
| Price | `0.02` |

**Try It sub-paths:**
```
/planetary/apod?api_key=DEMO_KEY
/mars-photos/api/v1/rovers/curiosity/photos?sol=1000&page=1&api_key=DEMO_KEY
```

---

### 9. Exchange Rate (Currency Conversion)

| Field | Value |
|-------|-------|
| Base URL | `https://open.er-api.com/v6` |
| Slug | `exchangerate` |
| Price | `0.01` |

**Try It sub-paths:**
```
/latest/USD
/latest/EUR
```

---

### 10. Cat Facts

| Field | Value |
|-------|-------|
| Base URL | `https://catfact.ninja` |
| Slug | `catfact` |
| Price | `0.01` |

**Try It sub-paths:**
```
/fact
/facts?limit=3
```

---

## Quick Start

1. Connect wallet (Freighter) or proceed without one
2. Get testnet USDC from the faucet if needed
3. Pick any API above, paste the **Base URL** and **Slug** into the form
4. Set price to `0.01`, leave receiver blank
5. Click **Wrap API**
6. Click **Try It** on the registered API
7. Enter a sub-path from the list above
8. Click **Pay & Test** — the gateway handles the 402 flow automatically
