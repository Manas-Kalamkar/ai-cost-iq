# PROMPTS

## AI summary prompt

Used in: `src/app/api/audit/route.ts` → `generateSummary()`

### Full prompt

```
You are an AI spend analyst. Write a 80-100 word personalized audit summary for a startup.

Team details:
- Tools: {toolList}
- Team size: {teamSize}
- Primary use case: {useCase}
- Current monthly spend: ${totalCurrentSpend}
- Potential monthly saving: ${totalMonthlySaving} ({savingPercent}%)

Write in second person ("your team", "you are"). Be specific about their tools. Be honest — if savings are low, say they are spending well. Do not use bullet points. Do not mention Credex. Output only the paragraph, no preamble.
```

### Why I wrote it this way

**Second person ("your team")** — makes the output feel personal and specific, not like a generic report. Users are more likely to share content that feels written for them.

**"Be specific about their tools"** — without this instruction, Claude tends to write generic sentences like "your AI tools may be costing more than necessary." With it, the output names actual tools from the user's stack.

**"Be honest — if savings are low, say they are spending well"** — critical for trust. The assignment explicitly says not to manufacture savings. Without this instruction, the model tends to find something to flag even when the stack is optimal.

**"Do not mention Credex"** — the summary is shown publicly on the shareable URL. Credex promotion belongs in the dedicated CTA block, not in the AI-generated paragraph, which should read as neutral analysis.

**"Output only the paragraph, no preamble"** — without this, Claude often starts with "Here is your audit summary:" which breaks the UI rendering. This instruction eliminates that.

**Word count (80-100 words)** — tested at 50, 100, and 150 words. 50 is too terse to be useful. 150 feels padded. 80-100 fits the results page card without scrolling on mobile.

---

### What I tried that did not work

**Attempt 1 — No persona instruction:**
Prompt started directly with "Write a summary of this team's AI spend." Output was inconsistent — sometimes bullet points, sometimes prose, sometimes started with "Certainly!" Fixed by adding the analyst persona and explicit format instructions.

**Attempt 2 — Asked for recommendations in the summary:**
Added "Include your top recommendation" to the prompt. Output duplicated the per-tool breakdown already shown on the page. Removed — the summary should be a narrative overview, not a second recommendations list.

**Attempt 3 — No word count:**
Output ranged from 40 to 200 words depending on how many tools were in the input. Added the 80-100 word constraint to make the UI predictable.

**Attempt 4 — Asked model to calculate savings:**
Passed raw tool data and asked the model to calculate potential savings itself. Output was mathematically inconsistent with the audit engine results. Correct approach: run the audit engine first, pass the calculated savings numbers into the prompt, and ask the model only to narrate — not calculate.

---

### Fallback behaviour

If the Anthropic API call fails or times out (5-second timeout), the route returns a templated string generated in `generateFallbackSummary()`. The fallback:
- Uses the same input variables (tool list, team size, savings)
- Produces grammatically correct prose
- Does not expose the error to the user
- Is logged server-side for monitoring

The UI never shows a blank or broken summary state.

---

### Model used

`claude-sonnet-4-20250514` — best balance of output quality and latency for a synchronous API call with a 5-second timeout. Opus would produce better prose but is too slow for a synchronous response. Haiku is fast but tends to produce generic summaries even with specific instructions.