// src/lib/auditEngine.test.ts
import { describe, it, expect } from 'vitest'
import { runAudit } from './auditEngine'
import { ToolEntry } from './tools'

// ---------------------------------------------------------------------------
// Helper to build a minimal ToolEntry
// ---------------------------------------------------------------------------
function entry(overrides: Partial<ToolEntry> & { company: string; plan: string }): ToolEntry {
  return {
    id: 1,
    seats: '1',
    spend: '0',
    ...overrides,
  }
}

// ===========================================================================
// 1. Cursor — Teams plan overkill for small teams
// ===========================================================================
describe('Cursor audit', () => {
  it('recommends downgrade from Teams to Pro for a 2-person team', () => {
    const entries: ToolEntry[] = [
      entry({ company: 'Cursor', plan: 'Teams', seats: '2', spend: '80' }),
    ]
    const result = runAudit(entries, '2–5 people', 'Coding / engineering')
    const r = result.results[0]

    expect(r.recommendedAction).toBe('downgrade_plan')
    expect(r.recommendedPlan).toContain('Pro')
    expect(r.monthlySaving).toBeGreaterThan(0)
    expect(r.annualSaving).toBe(r.monthlySaving * 12)
  })

  it('marks Cursor Pro as optimal for a solo developer', () => {
    const entries: ToolEntry[] = [
      entry({ company: 'Cursor', plan: 'Pro', seats: '1', spend: '20' }),
    ]
    const result = runAudit(entries, 'Just me (1)', 'Coding / engineering')
    const r = result.results[0]

    expect(r.recommendedAction).toBe('optimal')
    expect(r.monthlySaving).toBe(0)
  })

  it('flags Ultra plan for teams of 5+ as high severity', () => {
    const entries: ToolEntry[] = [
      entry({ company: 'Cursor', plan: 'Ultra', seats: '5', spend: '1000' }),
    ]
    const result = runAudit(entries, '6–10 people', 'Coding / engineering')
    const r = result.results[0]

    expect(r.recommendedAction).toBe('downgrade_plan')
    expect(r.severity).toBe('high')
    expect(r.monthlySaving).toBeGreaterThan(0)
  })
})

// ===========================================================================
// 2. GitHub Copilot — Enterprise overkill for small teams
// ===========================================================================
describe('GitHub Copilot audit', () => {
  it('recommends downgrade from Enterprise to Business for a team under 10', () => {
    const entries: ToolEntry[] = [
      entry({ company: 'GitHub Copilot', plan: 'Enterprise', seats: '5', spend: '195' }),
    ]
    const result = runAudit(entries, '2–5 people', 'Coding / engineering')
    const r = result.results[0]

    expect(r.recommendedAction).toBe('downgrade_plan')
    expect(r.recommendedPlan).toContain('Business')
    expect(r.monthlySaving).toBe(195 - 19 * 5) // $100/mo saving
  })

  it('marks Copilot Business as optimal for a 10-person team', () => {
    const entries: ToolEntry[] = [
      entry({ company: 'GitHub Copilot', plan: 'Business', seats: '10', spend: '190' }),
    ]
    const result = runAudit(entries, '6–10 people', 'Coding / engineering')
    const r = result.results[0]

    expect(r.recommendedAction).toBe('optimal')
    expect(r.monthlySaving).toBe(0)
  })
})

// ===========================================================================
// 3. Claude — Team plan for 1-2 users
// ===========================================================================
describe('Claude audit', () => {
  it('recommends individual Pro over Team Standard for 2 users', () => {
    const entries: ToolEntry[] = [
      entry({ company: 'Claude', plan: 'Team – Standard', seats: '2', spend: '50' }),
    ]
    const result = runAudit(entries, '2–5 people', 'Writing / content')
    const r = result.results[0]

    expect(r.recommendedAction).toBe('downgrade_plan')
    expect(r.projectedMonthlySpend).toBe(17 * 2)
    expect(r.monthlySaving).toBe(50 - 34)
  })

  it('recommends downgrading Max to Pro for small non-power-user teams', () => {
    const entries: ToolEntry[] = [
      entry({ company: 'Claude', plan: 'Max', seats: '1', spend: '100' }),
    ]
    const result = runAudit(entries, 'Just me (1)', 'Writing / content')
    const r = result.results[0]

    expect(r.recommendedAction).toBe('downgrade_plan')
    expect(r.recommendedPlan).toBe('Pro')
    expect(r.monthlySaving).toBe(100 - 17)
  })
})

// ===========================================================================
// 4. ChatGPT — Pro plan almost always overkill
// ===========================================================================
describe('ChatGPT audit', () => {
  it('recommends downgrade from Pro to Plus', () => {
    const entries: ToolEntry[] = [
      entry({ company: 'ChatGPT', plan: 'Pro (~$128/mo)', seats: '1', spend: '128' }),
    ]
    const result = runAudit(entries, 'Just me (1)', 'Mixed / general')
    const r = result.results[0]

    expect(r.recommendedAction).toBe('downgrade_plan')
    expect(r.recommendedPlan).toContain('Plus')
    expect(r.monthlySaving).toBe(128 - 24)
    expect(r.severity).toBe('high')
  })
})

// ===========================================================================
// 5. API tools — high spend flags credits recommendation
// ===========================================================================
describe('API tool audit', () => {
  it('flags Anthropic API spend over $500/mo for credits recommendation', () => {
    const entries: ToolEntry[] = [
      entry({ company: 'Anthropic API', plan: 'Pay-as-you-go', spend: '800' }),
    ]
    const result = runAudit(entries, '6–10 people', 'Coding / engineering')
    const r = result.results[0]

    expect(r.recommendedAction).toBe('switch_to_credits')
    expect(r.severity).toBe('high')
    expect(r.monthlySaving).toBeGreaterThan(0)
  })

  it('flags OpenAI API spend between $200-$500 as medium severity credits opportunity', () => {
    const entries: ToolEntry[] = [
      entry({ company: 'OpenAI API', plan: 'Pay-as-you-go', spend: '300' }),
    ]
    const result = runAudit(entries, '6–10 people', 'Coding / engineering')
    const r = result.results[0]

    expect(r.recommendedAction).toBe('switch_to_credits')
    expect(r.severity).toBe('medium')
  })

  it('marks low API spend as optimal — not worth switching for small bills', () => {
    const entries: ToolEntry[] = [
      entry({ company: 'Anthropic API', plan: 'Pay-as-you-go', spend: '50' }),
    ]
    const result = runAudit(entries, 'Just me (1)', 'Coding / engineering')
    const r = result.results[0]

    expect(r.recommendedAction).toBe('optimal')
    expect(r.monthlySaving).toBe(0)
  })
})

// ===========================================================================
// 6. Summary totals are calculated correctly
// ===========================================================================
describe('Audit summary totals', () => {
  it('calculates total monthly and annual savings correctly', () => {
    const entries: ToolEntry[] = [
      entry({ company: 'ChatGPT', plan: 'Pro (~$128/mo)', seats: '1', spend: '128' }),
      entry({ company: 'GitHub Copilot', plan: 'Enterprise', seats: '5', spend: '195' }),
    ]
    const result = runAudit(entries, '2–5 people', 'Coding / engineering')

    expect(result.totalCurrentSpend).toBe(128 + 195)
    expect(result.totalMonthlySaving).toBeGreaterThan(0)
    expect(result.totalAnnualSaving).toBe(result.totalMonthlySaving * 12)
  })

  it('sets highSavings flag when total monthly saving exceeds $500', () => {
    const entries: ToolEntry[] = [
      entry({ company: 'Anthropic API', plan: 'Pay-as-you-go', spend: '2000' }),
    ]
    const result = runAudit(entries, '6–10 people', 'Coding / engineering')

    expect(result.highSavings).toBe(true)
  })

  it('sets alreadyOptimal flag when total saving is under $100', () => {
    const entries: ToolEntry[] = [
      entry({ company: 'Cursor', plan: 'Pro', seats: '1', spend: '20' }),
      entry({ company: 'Claude', plan: 'Pro', seats: '1', spend: '17' }),
    ]
    const result = runAudit(entries, 'Just me (1)', 'Coding / engineering')

    expect(result.alreadyOptimal).toBe(true)
  })
})

// ===========================================================================
// 7. Cross-tool alternative recommendations
// ===========================================================================
describe('Cross-tool alternatives', () => {
  it('recommends Claude over ChatGPT for coding teams when Claude is cheaper', () => {
    const entries: ToolEntry[] = [
      entry({ company: 'ChatGPT', plan: 'Plus (~$24/mo)', seats: '1', spend: '24' }),
    ]
    const result = runAudit(entries, 'Just me (1)', 'Coding / engineering')
    const r = result.results[0]

    // Claude Pro is $17 vs ChatGPT Plus $24 — should recommend switch
    expect(r.recommendedAction).toBe('switch_tool')
    expect(r.monthlySaving).toBe(24 - 17)
  })
})