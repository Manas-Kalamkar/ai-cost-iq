'use client'
// src/app/audit/[uuid]/ResultsClient.tsx

import { useState } from 'react'
import { AuditResult } from '@/lib/auditEngine'

type Audit = {
  id: string
  results: AuditResult[]
  total_current_spend: number
  total_monthly_saving: number
  total_annual_saving: number
  high_savings: boolean
  already_optimal: boolean
  ai_summary: string
  use_case: string
  team_size: string
  created_at: string
}

type Props = { audit: Audit; uuid: string }

const SEVERITY_COLOR: Record<string, string> = {
  high: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
  medium: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
  low: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
  ok: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800',
}

const SEVERITY_BADGE: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
}

const ACTION_LABEL: Record<string, string> = {
  downgrade_plan: 'Downgrade plan',
  upgrade_plan: 'Upgrade plan',
  switch_to_annual: 'Switch to annual',
  switch_tool: 'Switch tool',
  reduce_seats: 'Reduce seats',
  switch_to_credits: 'Buy credits',
  optimal: 'Already optimal',
}

export default function ResultsClient({ audit, uuid }: Props) {
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/audit/${uuid}`
      : `/audit/${uuid}`

  async function handleEmailSubmit() {
    if (!email) return
    setSubmitting(true)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId: uuid,
          email,
          companyName: company,
          role,
          teamSize: audit.team_size,
        }),
      })
      setSubmitted(true)
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
            <span className="text-white text-lg">⚡</span>
          </div>
          <div>
            <h1 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 tracking-tight">
              AI Cost IQ
            </h1>
            <p className="text-xs text-neutral-500">Your free audit report</p>
          </div>
        </div>

        {/* Hero savings block */}
        <div className="rounded-2xl bg-violet-600 text-white p-6 mb-6">
          {audit.already_optimal ? (
            <>
              <p className="text-violet-200 text-sm mb-1">Audit result</p>
              <p className="text-3xl font-medium mb-1">You are spending well ✓</p>
              <p className="text-violet-200 text-sm">
                Your AI stack is optimised for a {audit.team_size} team doing {audit.use_case}.
              </p>
            </>
          ) : (
            <>
              <p className="text-violet-200 text-sm mb-1">Potential savings identified</p>
              <p className="text-4xl font-medium mb-1">
                ${Math.round(audit.total_monthly_saving).toLocaleString()}
                <span className="text-xl font-normal text-violet-200"> / mo</span>
              </p>
              <p className="text-violet-200 text-sm">
                ${Math.round(audit.total_annual_saving).toLocaleString()} per year ·{' '}
                {audit.team_size} team · {audit.use_case}
              </p>
            </>
          )}
        </div>

        {/* AI summary */}
        {audit.ai_summary && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 mb-6">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">
              AI analysis
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {audit.ai_summary}
            </p>
          </div>
        )}

        {/* Credex CTA — only for high savings */}
        {audit.high_savings && (
          <div className="bg-violet-50 dark:bg-violet-950 border border-violet-200 dark:border-violet-800 rounded-xl p-5 mb-6">
            <p className="text-sm font-medium text-violet-900 dark:text-violet-100 mb-1">
              💡 You could save even more with Credex
            </p>
            <p className="text-sm text-violet-700 dark:text-violet-300 mb-3">
              Credex sells discounted AI infrastructure credits — Claude, ChatGPT Enterprise,
              Cursor, and others — sourced from companies that overforecast. The discount is real
              and substantial. At your spend level, it is worth a conversation.
            </p>
            <a
              href="https://credex.rocks"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Book a free Credex consultation →
            </a>
          </div>
        )}

        {/* Per-tool breakdown */}
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-3">
          Tool-by-tool breakdown
        </p>
        <div className="flex flex-col gap-3 mb-8">
          {audit.results.map((r, i) => (
            <div
              key={i}
              className={`border rounded-xl p-4 ${SEVERITY_COLOR[r.severity]}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {r.toolName}
                  </span>
                  <span className="text-xs text-neutral-500 ml-2">{r.plan}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_BADGE[r.severity]}`}
                  >
                    {ACTION_LABEL[r.recommendedAction]}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm mb-2">
                <div>
                  <span className="text-neutral-500 text-xs">Current</span>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">
                    ${r.currentMonthlySpend}/mo
                  </p>
                </div>
                {r.monthlySaving > 0 && (
                  <>
                    <span className="text-neutral-300">→</span>
                    <div>
                      <span className="text-neutral-500 text-xs">Projected</span>
                      <p className="font-medium text-emerald-600 dark:text-emerald-400">
                        ${Math.round(r.projectedMonthlySpend)}/mo
                      </p>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-xs">Saving</span>
                      <p className="font-medium text-emerald-600 dark:text-emerald-400">
                        ${Math.round(r.monthlySaving)}/mo
                      </p>
                    </div>
                  </>
                )}
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {r.reason}
              </p>

              {r.recommendedTool && (
                <p className="text-xs font-medium text-violet-700 dark:text-violet-300 mt-1">
                  Recommended: {r.recommendedTool}
                </p>
              )}
              {r.recommendedPlan && (
                <p className="text-xs font-medium text-violet-700 dark:text-violet-300 mt-1">
                  Switch to: {r.recommendedPlan}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Share URL */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 mb-6">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">
            Share this audit
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Email capture */}
        {!submitted ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
              {audit.already_optimal
                ? 'Get notified when new optimisations apply to your stack'
                : 'Get the full report in your inbox'}
            </p>
            <p className="text-xs text-neutral-500 mb-4">
              {audit.already_optimal
                ? 'AI tool pricing changes constantly. We will notify you when a better option appears for your stack.'
                : 'We will send a PDF summary and flag new savings opportunities as pricing changes.'}
            </p>
            <div className="flex flex-col gap-2 mb-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Company name (optional)"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <input
                  type="text"
                  placeholder="Your role (optional)"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              {/* Honeypot — hidden from real users, bots fill this */}
              <input
                type="text"
                name="website"
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <button
              onClick={handleEmailSubmit}
              disabled={!email || submitting}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {submitting ? 'Sending...' : 'Send me the report'}
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 text-center">
            <p className="text-emerald-700 dark:text-emerald-300 font-medium mb-1">
              ✓ Report sent!
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Check your inbox. We will be in touch if we spot new savings for your stack.
            </p>
          </div>
        )}

      </div>
    </main>
  )
}