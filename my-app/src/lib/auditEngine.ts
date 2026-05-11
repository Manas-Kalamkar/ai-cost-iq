// src/lib/auditEngine.ts

import { TOOLS, ToolEntry } from './tools'

export type Recommendation =
  | 'downgrade_plan'
  | 'upgrade_plan'
  | 'switch_to_annual'
  | 'switch_tool'
  | 'reduce_seats'
  | 'switch_to_credits'
  | 'optimal'

export type AuditResult = {
  toolName: string
  plan: string
  seats: number
  currentMonthlySpend: number
  recommendedAction: Recommendation
  recommendedPlan?: string
  recommendedTool?: string
  projectedMonthlySpend: number
  monthlySaving: number
  annualSaving: number
  reason: string
  severity: 'high' | 'medium' | 'low' | 'ok'
}

export type AuditSummary = {
  results: AuditResult[]
  totalCurrentSpend: number
  totalProjectedSpend: number
  totalMonthlySaving: number
  totalAnnualSaving: number
  highSavings: boolean // true if saving > $500/mo → show Credex CTA
  alreadyOptimal: boolean // true if saving < $100/mo
}

// ---------------------------------------------------------------------------
// Cheaper alternative tools by use case
// Logic: if a team is paying for X but use case Y has a cheaper tool
// that covers the same capability, flag it.
// ---------------------------------------------------------------------------
const ALTERNATIVES: Record<
  string,
  Record<string, { tool: string; plan: string; price: number; reason: string }>
> = {
  'Coding / engineering': {
    'GitHub Copilot': {
      tool: 'Windsurf',
      plan: 'Pro',
      price: 20,
      reason:
        'Windsurf Pro ($20/mo) offers comparable AI code completion to Copilot Business ($19/seat). For a team paying per-seat on Copilot Business, Windsurf Pro per-seat saves ~0% but Windsurf Teams at $40/seat includes more agentic features.',
    },
    ChatGPT: {
      tool: 'Claude',
      plan: 'Pro',
      price: 17,
      reason:
        'Claude Pro ($17/mo) outperforms ChatGPT Plus on coding benchmarks (SWE-bench) at a lower price. For coding-focused teams, Claude is a more cost-efficient choice.',
    },
  },
  'Writing / content': {
    Cursor: {
      tool: 'Claude',
      plan: 'Pro',
      price: 17,
      reason:
        'Cursor is optimised for code editing. For writing/content teams, Claude Pro ($17/mo) provides superior long-form generation without paying for an IDE.',
    },
    Windsurf: {
      tool: 'Claude',
      plan: 'Pro',
      price: 17,
      reason:
        'Windsurf is a code editor — not the right tool for writing teams. Claude Pro ($17/mo) is purpose-built for content generation.',
    },
  },
  'Data / analytics': {
    Cursor: {
      tool: 'ChatGPT',
      plan: 'Plus (~$24/mo)',
      price: 24,
      reason:
        'Cursor is a code editor optimised for software development. For data/analytics, ChatGPT Plus ($24/mo) with code interpreter and data analysis is a better fit at a lower cost.',
    },
  },
}

// ---------------------------------------------------------------------------
// Per-tool audit logic
// ---------------------------------------------------------------------------

function auditCursor(entry: ToolEntry, teamSize: number): AuditResult {
  const seats = parseInt(entry.seats || '1')
  const spend = parseFloat(entry.spend || '0')
  const plan = entry.plan

  // Teams plan for very small teams is overkill
  if (plan === 'Teams' && teamSize <= 2) {
    const projectedSpend = 20 * seats // Pro per person
    return {
      toolName: 'Cursor',
      plan,
      seats,
      currentMonthlySpend: spend,
      recommendedAction: 'downgrade_plan',
      recommendedPlan: 'Pro (individual)',
      projectedMonthlySpend: projectedSpend,
      monthlySaving: spend - projectedSpend,
      annualSaving: (spend - projectedSpend) * 12,
      reason: `Cursor Teams ($40/seat) is designed for larger teams with admin controls and centralised billing. With only ${teamSize} users, individual Pro plans ($20/seat) provide the same AI features at half the cost. Teams plan overhead is not justified below 5 users.`,
      severity: spend - projectedSpend > 50 ? 'high' : 'medium',
    }
  }

  // Hobby plan but paying (shouldn't happen — flag data entry error)
  if (plan === 'Hobby (Free)' && spend > 0) {
    return {
      toolName: 'Cursor',
      plan,
      seats,
      currentMonthlySpend: spend,
      recommendedAction: 'optimal',
      projectedMonthlySpend: 0,
      monthlySaving: 0,
      annualSaving: 0,
      reason: 'Cursor Hobby is free. If you are being charged, review your billing — you may have been auto-upgraded.',
      severity: 'ok',
    }
  }

  // Ultra plan check — very high cost, only justified for power users
  if (plan === 'Ultra' && teamSize >= 5) {
    const projectedSpend = 40 * seats // Teams plan
    return {
      toolName: 'Cursor',
      plan,
      seats,
      currentMonthlySpend: spend,
      recommendedAction: 'downgrade_plan',
      recommendedPlan: 'Teams',
      projectedMonthlySpend: projectedSpend,
      monthlySaving: spend - projectedSpend,
      annualSaving: (spend - projectedSpend) * 12,
      reason: `Cursor Ultra ($200/mo) is designed for individual power users with maximum usage limits. For a team of ${teamSize}, Cursor Teams ($40/seat) provides centralised billing and admin controls at significantly lower cost. Ultra limits are rarely saturated in team workflows.`,
      severity: 'high',
    }
  }

  return optimal('Cursor', plan, seats, spend)
}

function auditCopilot(entry: ToolEntry, teamSize: number): AuditResult {
  const seats = parseInt(entry.seats || '1')
  const spend = parseFloat(entry.spend || '0')
  const plan = entry.plan

  // Enterprise for small teams
  if (plan === 'Enterprise' && teamSize < 10) {
    const projectedSpend = 19 * seats // Business plan
    return {
      toolName: 'GitHub Copilot',
      plan,
      seats,
      currentMonthlySpend: spend,
      recommendedAction: 'downgrade_plan',
      recommendedPlan: 'Business',
      projectedMonthlySpend: projectedSpend,
      monthlySaving: spend - projectedSpend,
      annualSaving: (spend - projectedSpend) * 12,
      reason: `GitHub Copilot Enterprise ($39/seat) adds SAML SSO, audit logs, and policy controls — features that matter at 10+ employees. With ${teamSize} users, Copilot Business ($19/seat) covers the same AI completion features at half the price. Enterprise overhead is not justified at this team size.`,
      severity: spend - projectedSpend > 100 ? 'high' : 'medium',
    }
  }

  // Pro+ is very expensive for what it offers
  if (plan === 'Pro+' && teamSize > 1) {
    const projectedSpend = 19 * seats
    return {
      toolName: 'GitHub Copilot',
      plan,
      seats,
      currentMonthlySpend: spend,
      recommendedAction: 'downgrade_plan',
      recommendedPlan: 'Business',
      projectedMonthlySpend: projectedSpend,
      monthlySaving: spend - projectedSpend,
      annualSaving: (spend - projectedSpend) * 12,
      reason: `Copilot Pro+ ($39/user) is an individual plan with access to premium models. For teams of ${teamSize}+, Copilot Business ($19/seat) includes team management and the same core code completion at half the cost. Pro+ premium model access is rarely the bottleneck in team workflows.`,
      severity: 'medium',
    }
  }

  return optimal('GitHub Copilot', plan, seats, spend)
}

function auditClaude(entry: ToolEntry, teamSize: number): AuditResult {
  const seats = parseInt(entry.seats || '1')
  const spend = parseFloat(entry.spend || '0')
  const plan = entry.plan

  // Team plan for 1-2 users — individual Pro is cheaper
  if ((plan === 'Team – Standard' || plan === 'Team – Premium') && seats <= 2) {
    const isPremium = plan === 'Team – Premium'
    const projectedSpend = isPremium ? 100 * seats : 17 * seats
    const projectedPlan = isPremium ? 'Max (individual)' : 'Pro (individual)'
    return {
      toolName: 'Claude',
      plan,
      seats,
      currentMonthlySpend: spend,
      recommendedAction: 'downgrade_plan',
      recommendedPlan: projectedPlan,
      projectedMonthlySpend: projectedSpend,
      monthlySaving: spend - projectedSpend,
      annualSaving: (spend - projectedSpend) * 12,
      reason: `Claude Team requires a minimum of 5 seats but is priced at $${isPremium ? 100 : 20}/seat/month. With only ${seats} user(s), individual ${projectedPlan} plans ($${isPremium ? 100 : 17}/month) provide identical Claude access without the team plan overhead. Team plan is only cost-justified at 5+ seats where centralised billing and admin controls add value.`,
      severity: spend - projectedSpend > 30 ? 'high' : 'medium',
    }
  }

  // Max plan for non-power users
  if (plan === 'Max' && teamSize <= 2) {
    const projectedSpend = 17 * seats
    return {
      toolName: 'Claude',
      plan,
      seats,
      currentMonthlySpend: spend,
      recommendedAction: 'downgrade_plan',
      recommendedPlan: 'Pro',
      projectedMonthlySpend: projectedSpend,
      monthlySaving: spend - projectedSpend,
      annualSaving: (spend - projectedSpend) * 12,
      reason: `Claude Max ($100/mo) provides 5× more usage than Pro — justified only for users who consistently hit Pro's message limits daily. For most users, Claude Pro ($17/mo) is sufficient. Downgrade to Pro and upgrade back only if you hit limits within the first week.`,
      severity: 'medium',
    }
  }

  return optimal('Claude', plan, seats, spend)
}

function auditChatGPT(entry: ToolEntry, teamSize: number): AuditResult {
  const seats = parseInt(entry.seats || '1')
  const spend = parseFloat(entry.spend || '0')
  const plan = entry.plan

  // Pro plan — extremely expensive, rarely justified
  if (plan === 'Pro (~$128/mo)') {
    const projectedSpend = 24 * Math.max(seats, 1)
    return {
      toolName: 'ChatGPT',
      plan,
      seats,
      currentMonthlySpend: spend,
      recommendedAction: 'downgrade_plan',
      recommendedPlan: 'Plus (~$24/mo)',
      projectedMonthlySpend: projectedSpend,
      monthlySaving: spend - projectedSpend,
      annualSaving: (spend - projectedSpend) * 12,
      reason: `ChatGPT Pro ($128/mo) provides unlimited o1 Pro and maximum Codex access — features primarily useful for researchers and heavy Codex users. ChatGPT Plus ($24/mo) covers GPT-5.5 Thinking, deep research, and standard Codex for the vast majority of professional use cases at 81% lower cost.`,
      severity: 'high',
    }
  }

  // Business plan for solo/duo
  if (plan === 'Business' && seats <= 2) {
    const projectedSpend = 24 * seats
    return {
      toolName: 'ChatGPT',
      plan,
      seats,
      currentMonthlySpend: spend,
      recommendedAction: 'downgrade_plan',
      recommendedPlan: 'Plus (~$24/mo)',
      projectedMonthlySpend: projectedSpend,
      monthlySaving: spend - projectedSpend,
      annualSaving: (spend - projectedSpend) * 12,
      reason: `ChatGPT Business ($22/seat) adds SAML SSO and admin controls — worthwhile for teams managing multiple users. With only ${seats} user(s), individual Plus plans ($24/mo) provide the same model access without the business overhead. The $2/seat savings don't justify the added complexity for small teams.`,
      severity: 'low',
    }
  }

  return optimal('ChatGPT', plan, seats, spend)
}

function auditApiTool(entry: ToolEntry, toolName: string): AuditResult {
  const spend = parseFloat(entry.spend || '0')

  // High API spend → flag for credits via Credex
  if (spend > 500) {
    return {
      toolName,
      plan: 'Pay-as-you-go',
      seats: 1,
      currentMonthlySpend: spend,
      recommendedAction: 'switch_to_credits',
      projectedMonthlySpend: spend * 0.75, // conservative 25% discount estimate via credits
      monthlySaving: spend * 0.25,
      annualSaving: spend * 0.25 * 12,
      reason: `At $${spend}/mo in direct API spend, your team is paying full retail token rates. Pre-purchased AI credits (available via Credex from companies that overforecast usage) typically offer 20–30% discounts on the same API capacity. At your current spend level, that is approximately $${Math.round(spend * 0.25)}/mo in potential savings.`,
      severity: 'high',
    }
  }

  if (spend > 200) {
    return {
      toolName,
      plan: 'Pay-as-you-go',
      seats: 1,
      currentMonthlySpend: spend,
      recommendedAction: 'switch_to_credits',
      projectedMonthlySpend: spend * 0.8,
      monthlySaving: spend * 0.2,
      annualSaving: spend * 0.2 * 12,
      reason: `At $${spend}/mo in API spend, pre-purchased credits could save approximately 20% ($${Math.round(spend * 0.2)}/mo). Credits are worth exploring once monthly API spend consistently exceeds $200.`,
      severity: 'medium',
    }
  }

  return optimal(toolName, 'Pay-as-you-go', 1, spend)
}

function auditGemini(entry: ToolEntry, teamSize: number, useCase: string): AuditResult {
  const seats = parseInt(entry.seats || '1')
  const spend = parseFloat(entry.spend || '0')
  const plan = entry.plan

  // Premium plan for coding teams — Claude or Cursor is better fit
  if (plan === 'AI Premium ($20/mo)' && useCase === 'Coding / engineering') {
    return {
      toolName: 'Gemini',
      plan,
      seats,
      currentMonthlySpend: spend,
      recommendedAction: 'switch_tool',
      recommendedTool: 'Cursor (Pro)',
      projectedMonthlySpend: 20 * seats,
      monthlySaving: Math.max(spend - 20 * seats, 0),
      annualSaving: Math.max(spend - 20 * seats, 0) * 12,
      reason: `Gemini AI Premium is bundled with Google One storage and Workspace features — not optimised for coding. For a coding-focused team, Cursor Pro ($20/mo) provides a purpose-built IDE with AI completion trained on code. Same price, better tool-use case fit.`,
      severity: 'low',
    }
  }

  return optimal('Gemini', plan, seats, spend)
}

function auditWindsurf(entry: ToolEntry, teamSize: number): AuditResult {
  const seats = parseInt(entry.seats || '1')
  const spend = parseFloat(entry.spend || '0')
  const plan = entry.plan

  if (plan === 'Teams' && seats <= 2) {
    const projectedSpend = 20 * seats
    return {
      toolName: 'Windsurf',
      plan,
      seats,
      currentMonthlySpend: spend,
      recommendedAction: 'downgrade_plan',
      recommendedPlan: 'Pro (individual)',
      projectedMonthlySpend: projectedSpend,
      monthlySaving: spend - projectedSpend,
      annualSaving: (spend - projectedSpend) * 12,
      reason: `Windsurf Teams ($40/seat) adds admin controls and centralised billing — unnecessary overhead for ${seats} user(s). Individual Pro plans ($20/seat) provide the same AI coding features at half the price.`,
      severity: spend - projectedSpend > 30 ? 'medium' : 'low',
    }
  }

  return optimal('Windsurf', plan, seats, spend)
}

// ---------------------------------------------------------------------------
// Helper — mark tool as already optimal
// ---------------------------------------------------------------------------
function optimal(
  toolName: string,
  plan: string,
  seats: number,
  spend: number
): AuditResult {
  return {
    toolName,
    plan,
    seats,
    currentMonthlySpend: spend,
    recommendedAction: 'optimal',
    projectedMonthlySpend: spend,
    monthlySaving: 0,
    annualSaving: 0,
    reason: `${toolName} ${plan} is appropriate for the current team size and use case. No immediate optimisation identified.`,
    severity: 'ok',
  }
}

// ---------------------------------------------------------------------------
// Check cross-tool alternatives
// ---------------------------------------------------------------------------
function checkAlternative(
  result: AuditResult,
  entry: ToolEntry,
  useCase: string
): AuditResult {
  // Only suggest alternatives if the tool is already "optimal" — avoid double recommendations
  if (result.recommendedAction !== 'optimal') return result

  const alts = ALTERNATIVES[useCase]
  if (!alts) return result

  const alt = alts[entry.company]
  if (!alt) return result

  const seats = parseInt(entry.seats || '1')
  const spend = parseFloat(entry.spend || '0')
  const projectedSpend = alt.price * Math.max(seats, 1)

  if (projectedSpend >= spend) return result // no saving — don't recommend

  return {
    ...result,
    recommendedAction: 'switch_tool',
    recommendedTool: `${alt.tool} (${alt.plan})`,
    projectedMonthlySpend: projectedSpend,
    monthlySaving: spend - projectedSpend,
    annualSaving: (spend - projectedSpend) * 12,
    reason: alt.reason,
    severity: spend - projectedSpend > 100 ? 'high' : 'medium',
  }
}

// ---------------------------------------------------------------------------
// Main audit function — call this from your API route
// ---------------------------------------------------------------------------
export function runAudit(
  entries: ToolEntry[],
  teamSizeLabel: string,
  useCase: string
): AuditSummary {
  // Parse team size from label
  const teamSizeMap: Record<string, number> = {
    'Just me (1)': 1,
    '2–5 people': 3,
    '6–10 people': 8,
    '11–25 people': 15,
    '26–50 people': 35,
    '50+ people': 75,
  }
  const teamSize = teamSizeMap[teamSizeLabel] ?? 5

  const results: AuditResult[] = entries.map((entry) => {
    let result: AuditResult

    switch (entry.company) {
      case 'Cursor':
        result = auditCursor(entry, teamSize)
        break
      case 'GitHub Copilot':
        result = auditCopilot(entry, teamSize)
        break
      case 'Claude':
        result = auditClaude(entry, teamSize)
        break
      case 'ChatGPT':
        result = auditChatGPT(entry, teamSize)
        break
      case 'Anthropic API':
        result = auditApiTool(entry, 'Anthropic API')
        break
      case 'OpenAI API':
        result = auditApiTool(entry, 'OpenAI API')
        break
      case 'Gemini':
        result = auditGemini(entry, teamSize, useCase)
        break
      case 'Windsurf':
        result = auditWindsurf(entry, teamSize)
        break
      default:
        result = optimal(entry.company, entry.plan, parseInt(entry.seats || '1'), parseFloat(entry.spend || '0'))
    }

    // Check cross-tool alternatives after per-tool audit
    return checkAlternative(result, entry, useCase)
  })

  const totalCurrentSpend = results.reduce((s, r) => s + r.currentMonthlySpend, 0)
  const totalProjectedSpend = results.reduce((s, r) => s + r.projectedMonthlySpend, 0)
  const totalMonthlySaving = totalCurrentSpend - totalProjectedSpend
  const totalAnnualSaving = totalMonthlySaving * 12

  return {
    results,
    totalCurrentSpend,
    totalProjectedSpend,
    totalMonthlySaving,
    totalAnnualSaving,
    highSavings: totalMonthlySaving > 500,
    alreadyOptimal: totalMonthlySaving < 100,
  }
}