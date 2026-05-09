# PRICING_DATA
 

## Cursor

Source: https://cursor.com/pricing — verified 2026-05-09

### Individual Plans
- Hobby: $0/month (limited usage)
- Pro: $20/month
- Pro+: $60/month
- Ultra: $200/month

### Business Plans
- Teams: $40/user/month
- Enterprise: Custom pricing (contact sales)

### Bugbot Add-on
- Pro: $20/user/month
- Teams: $40/user/month
- Enterprise: Custom pricing (contact sales)

---

## GitHub Copilot

Source: https://github.com/features/copilot#pricing — verified 2026-05-09

### Individual Plans
- Free: $0/month (limited completions)
- Pro: $10/user/month
- Pro+: $39/user/month

### Business Plans
- Business: $19/user/month
- Enterprise: $39/user/month

---

## Claude (Anthropic)

Source: https://www.anthropic.com/pricing — verified 2026-05-09

### Subscription Plans
- Free: $0/month
- Pro: $17/user/month (annual) · $20/user/month (monthly)
- Max: $100/user/month (annual) · $125/user/month (monthly)

### Business Plans
- Team (5–150 members):
  - Standard seat: $20/user/month (annual) · $25/user/month (monthly)
  - Premium seat: $100/user/month (annual) · $125/user/month (monthly)
- Enterprise: Custom pricing (contact sales) — seat cost + API usage at API rates

### API — Pay as you go

| Model | Input | Output | Cache Write | Cache Read |
|---|---|---|---|---|
| claude-opus-4 | $5/MTok | $25/MTok | $6.25/MTok | $0.50/MTok |
| claude-sonnet-4-5 | $3/MTok | $15/MTok | $3.75/MTok | $0.30/MTok |
| claude-haiku-4-5 | $1/MTok | $5/MTok | $1.25/MTok | $0.10/MTok |

**Batch processing:** 50% discount on all models (async, higher latency)

---

## ChatGPT (OpenAI)

Source: https://openai.com/chatgpt/pricing — verified 2026-05-09


### Subscription Plans
- Free: $0/month — limited GPT-5.5 Instant access
- Go: ₹399/month (~$4.22/month) — more messages, no advanced reasoning
- Plus: ₹1,999/month (~$21.17/month) — GPT-5.5 Thinking, deep research, Codex access
- Pro: ₹10,699/month (~$113.29/month) — maximum usage, GPT-5.5 Pro

### Business Plans
- Business Codex: Pay-as-you-go, no fixed seat fee — usage-based only
- Business (ChatGPT + Codex): ₹1,800/user/month (~$19.06) billed annually · ₹2,250/user/month (~$23.82) billed monthly · minimum 2 users
- Enterprise: Custom pricing (contact sales)

### API — Pay as you go

Source: https://openai.com/api/pricing — verified 2026-05-09

| Model | Input | Cached Input | Output |
|---|---|---|---|
| GPT-5.5 | $5.00/MTok | $0.50/MTok | $30.00/MTok |
| GPT-5.4 | $2.50/MTok | $0.25/MTok | $15.00/MTok |
| GPT-5.4 mini | $0.75/MTok | $0.075/MTok | $4.50/MTok |

**Batch processing:** 50% discount (async)
**Data residency:** 10% premium

---

## Gemini (Google)
## Gemini (Google)
 
Source: https://ai.google.dev/pricing — verified 2026-05-09
 
> Note: Gemini 2.0 Flash and 2.0 Flash-Lite are deprecated — shut down June 1, 2026.
> Audit engine will not recommend these models.
 
### Subscription Plan
 
- Google One AI Premium: $19.99/user/month
  Source: https://one.google.com/about/ai-premium — verified 2026-05-09
  Includes Gemini Advanced (1.5 Pro), 2TB storage, Gemini in Gmail/Docs/Sheets
---
 
### API — Pay as you go (Paid Tier)
 
> Free tier available for all models below but rate-limited — not suitable for production use.
 
#### Gemini 3.x (Latest)
 
| Model | Input (text) | Output | Context Cache |
|---|---|---|---|
| Gemini 3.1 Pro Preview | $2.00/MTok (≤200k) · $4.00/MTok (>200k) | $12.00/MTok (≤200k) · $18.00/MTok (>200k) | $0.20/MTok |
| Gemini 3.1 Flash-Lite | $0.25/MTok | $1.50/MTok | $0.025/MTok |
| Gemini 3 Flash Preview | $0.50/MTok | $3.00/MTok | $0.05/MTok |
 
#### Gemini 2.5 (Stable — Recommended)
 
| Model | Input (text) | Output | Context Cache |
|---|---|---|---|
| Gemini 2.5 Pro | $1.25/MTok (≤200k) · $2.50/MTok (>200k) | $10.00/MTok (≤200k) · $15.00/MTok (>200k) | $0.125/MTok |
| Gemini 2.5 Flash | $0.30/MTok | $2.50/MTok | $0.03/MTok |
| Gemini 2.5 Flash-Lite | $0.10/MTok | $0.40/MTok | $0.01/MTok |
 
---
 
## Windsurf (Codeium)

Source: https://windsurf.com/pricing — verified 2026-05-09

### Individual Plans
- Free: $0/month
- Pro: $20/month
- Max: $200/month

### Business Plans
- Teams: $40/user/month
- Enterprise: Custom pricing (contact sales)

---

## Notes for the audit engine

- For API-only tools (Anthropic API, OpenAI API), there are no seats — only monthly spend input.
- Enterprise pricing across all vendors requires contacting sales. Where used in audit logic, the engine flags this and uses the highest published plan price as a conservative floor estimate.
- Batch processing discounts (Anthropic 50%, OpenAI 50%) are surfaced as a recommendation for high-volume API users.
- All subscription prices are monthly rates. Annual billing discounts are noted where available and used in the "switch to annual" recommendation logic.