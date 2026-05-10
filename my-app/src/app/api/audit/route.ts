// src/app/api/audit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runAudit } from '@/lib/auditEngine'
import { ToolEntry } from '@/lib/tools'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ---------------------------------------------------------------------------
// Generate AI summary via Anthropic API
// Falls back to templated summary if API fails or times out
// ---------------------------------------------------------------------------
async function generateSummary(
  entries: ToolEntry[],
  teamSize: string,
  useCase: string,
  totalMonthlySaving: number,
  totalCurrentSpend: number
): Promise<string> {
  const toolList = entries.map((e) => `${e.company} (${e.plan})`).join(', ')
  const savingPercent = totalCurrentSpend > 0
    ? Math.round((totalMonthlySaving / totalCurrentSpend) * 100)
    : 0

  const prompt = `You are an AI spend analyst. Write a 80-100 word personalized audit summary for a startup.

Team details:
- Tools: ${toolList}
- Team size: ${teamSize}
- Primary use case: ${useCase}
- Current monthly spend: $${totalCurrentSpend}
- Potential monthly saving: $${totalMonthlySaving} (${savingPercent}%)

Write in second person ("your team", "you are"). Be specific about their tools. Be honest — if savings are low, say they are spending well. Do not use bullet points. Do not mention Credex. Output only the paragraph, no preamble.`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`)

    const data = await res.json()
    const text = data.content?.[0]?.text?.trim()
    if (!text) throw new Error('Empty response from Anthropic')

    return text
  } catch (err) {
    // Graceful fallback — templated summary
    console.error('Anthropic API failed, using fallback:', err)
    return generateFallbackSummary(toolList, teamSize, useCase, totalMonthlySaving, totalCurrentSpend)
  }
}

function generateFallbackSummary(
  toolList: string,
  teamSize: string,
  useCase: string,
  totalMonthlySaving: number,
  totalCurrentSpend: number
): string {
  if (totalMonthlySaving < 100) {
    return `Your team is running a well-optimised AI stack. With ${toolList} for ${useCase} work, your current spend of $${totalCurrentSpend}/mo is appropriate for a ${teamSize} team. There are no significant immediate savings identified — the tools and plans you have chosen are a good fit for your use case. Keep reviewing quarterly as pricing and alternatives evolve.`
  }
  return `Your audit identified $${totalMonthlySaving}/mo in potential savings across your AI stack. Your team of ${teamSize} is currently using ${toolList} for ${useCase} work, spending $${totalCurrentSpend}/mo. The recommendations above show where plan mismatches and cheaper alternatives can reduce your bill without impacting capability. Implementing all changes could save $${totalMonthlySaving * 12}/year.`
}

// ---------------------------------------------------------------------------
// Rate limiting — simple in-memory store (upgrade to Redis at scale)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute window
  const maxRequests = 5

  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return false
  }
  if (entry.count >= maxRequests) return true
  entry.count++
  return false
}

// ---------------------------------------------------------------------------
// POST /api/audit
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // Honeypot check
  const body = await req.json()
  if (body.website) {
    // Bot filled the honeypot field — silently reject
    return NextResponse.json({ uuid: 'bot-detected' }, { status: 200 })
  }

  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a minute.' },
      { status: 429 }
    )
  }

  const { entries, teamSize, useCase } = body as {
    entries: ToolEntry[]
    teamSize: string
    useCase: string
  }

  // Validate
  if (!entries?.length || !teamSize || !useCase) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Run audit engine
  const auditSummary = runAudit(entries, teamSize, useCase)

  // Generate AI summary (with fallback)
  const aiSummary = await generateSummary(
    entries,
    teamSize,
    useCase,
    auditSummary.totalMonthlySaving,
    auditSummary.totalCurrentSpend
  )

  // Save to Supabase
  const { data, error } = await supabase
    .from('audits')
    .insert({
      entries,
      team_size: teamSize,
      use_case: useCase,
      results: auditSummary.results,
      total_current_spend: auditSummary.totalCurrentSpend,
      total_monthly_saving: auditSummary.totalMonthlySaving,
      total_annual_saving: auditSummary.totalAnnualSaving,
      high_savings: auditSummary.highSavings,
      already_optimal: auditSummary.alreadyOptimal,
      ai_summary: aiSummary,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Supabase insert error:', error)
    return NextResponse.json({ error: 'Failed to save audit' }, { status: 500 })
  }

  return NextResponse.json({ uuid: data.id })
}