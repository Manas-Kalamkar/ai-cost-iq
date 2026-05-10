# DEVLOG

## Day 1 — 2026-05-07

**Hours worked:** 0

**What I did:** Was out of station and unable to work on the project today. Used the travel time to read through the assignment requirements PDF carefully.

**What I learned:** N/A

**Blockers / what I'm stuck on:** N/A

**Plan for tomorrow:** Set up the repo, CI pipeline, Next.js + TypeScript project scaffold, Supabase, and begin PRICING_DATA.md with official vendor sources.

---

## Day 2 — 2026-05-08

**Hours worked:** 6

**What I did:** Initialized the GitHub repo and pushed the Next.js + TypeScript + Tailwind scaffold. Set up the GitHub Actions CI workflow with lint, test, and build steps. Configured Supabase for lead storage and created the leads table schema. Started PRICING_DATA.md — pulled official pricing for Cursor, GitHub Copilot, Claude, and ChatGPT with source URLs. 

**What I learned:** How Next.js routing works. Unlike React (which I am familiar with), Next.js does not need an external router — it has file-based routing built in, so there is no central App.tsx that imports all pages. Each file in the `app/` directory is its own route automatically.

**Blockers / what I'm stuck on:** Choosing between Resend and Postmark for transactional email — leaning toward Resend because the free tier is more generous and the developer experience looks cleaner. Could not fully complete PRICING_DATA.md with all official vendor sources today.

**Plan for tomorrow:** Complete PRICING_DATA.md with all official vendor sources. Draft ARCHITECTURE.md with a Mermaid system diagram and stack justification. Build the full spend input form (all 8 tools, plan picker, seats, spend, team size, use case) with localStorage persistence. Start the audit engine logic.

---

## Day 3 — 2026-05-09
Hours worked: 6
What I did: Completed PRICING_DATA.md with verified pricing for all 8 tools — Cursor, GitHub Copilot, Claude, ChatGPT, Anthropic API, OpenAI API, Gemini, and Windsurf — with official source URLs and verification dates. Finalized ARCHITECTURE.md with a full Mermaid system diagram covering the user journey from form input to audit result, data flow documentation, stack justification table, and a scaling analysis for 10k audits/day. Created src/lib/tools.ts defining all tool and plan types used across the app. Built the spend input form at src/app/audit/page.tsx with dependent dropdowns — selecting a company dynamically renders only that company's plans, and selecting a per-seat plan auto-calculates monthly spend from seats × price. Built src/components/ToolEntryCard.tsx as a reusable card component handling the company → plan → seats → spend flow per tool. Wired up localStorage persistence so form state survives page reloads.
What I learned: Dependent dropdowns in React require careful state management — when the company changes, the plan, seats, and spend must all reset, otherwise stale values from the previous company carry over silently. Resetting child fields explicitly on parent change is the correct pattern. Also learned that readonly inputs in React still need an onChange handler to avoid a controlled/uncontrolled component warning, even when the value is auto-calculated.
Blockers / what I'm stuck on: The @ path alias (@/lib/tools) does not resolve automatically in Vitest without a custom vitest.config.ts — need to add the alias config before the tests will run. Also need to decide whether the audit API route (/api/audit) saves to Supabase before or after generating the AI summary, since a slow Anthropic response could delay the redirect to the results page.
Plan for tomorrow: Build the audit engine (src/lib/auditEngine.ts) with defensible plan-fit logic for all 8 tools. Write 5+ Vitest unit tests covering the engine. Set up the /api/audit API route. Start the audit results page at src/app/audit/[uuid]/page.tsx.


## Day 4 — 2026-05-10
Hours worked: 6
What I did: Created the Supabase audits and leads tables with proper schema and row-level security policies allowing public inserts and selects. Built the /api/audit POST route which runs the audit engine, calls the Anthropic API for a personalized summary with a 5-second timeout and templated fallback, saves the full audit to Supabase, and returns a UUID. Built the /api/leads POST route which saves email captures to Supabase and fires a transactional confirmation email via Resend. Built the audit results page at /audit/[uuid]/page.tsx — server-rendered for Open Graph and Twitter Card meta tags so link previews work on social media. Built ResultsClient.tsx with the savings hero block, per-tool breakdown cards with severity colours, Credex CTA for audits showing >$500/mo savings, shareable URL with copy button, and email capture form shown after results. Added honeypot field to both the audit and lead forms for basic bot protection. Wrote PROMPTS.md documenting the full AI summary prompt, design decisions, and what did not work.
What I learned: Next.js generateMetadata must be in a server component — it cannot be used in a 'use client' file. The correct pattern is to split the page into a server component (page.tsx) that fetches data and generates metadata, and a client component (ResultsClient.tsx) that handles all interactivity. Also learned that Supabase row-level security blocks all operations by default — even inserts fail silently without an explicit create policy statement, which cost time to debug.
Blockers / what I'm stuck on: The Resend from address requires a verified domain — cannot use a custom domain on the free tier without DNS setup. Temporarily using Resend's onboarding address for testing. Need to set up environment variables on Vercel (ANTHROPIC_API_KEY, RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_APP_URL) before the deployed URL works end-to-end.
Plan for tomorrow: Set up all environment variables on Vercel and test the full end-to-end flow on the deployed URL. Write the audit engine unit tests and get them passing with npm test. Write GTM.md, ECONOMICS.md, LANDING_COPY.md, METRICS.md. Start REFLECTION.md.