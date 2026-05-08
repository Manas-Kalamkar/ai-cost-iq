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