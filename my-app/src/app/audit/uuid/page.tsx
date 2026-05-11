// src/app/audit/[uuid]/page.tsx
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import ResultsClient from './ResultsClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Props = { params: { uuid: string } }

// ---------------------------------------------------------------------------
// Server-side OG tag generation — required for social link previews
// Social crawlers don't run JavaScript, so this MUST be server-rendered
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabase
    .from('audits')
    .select('total_monthly_saving, total_annual_saving, use_case, team_size')
    .eq('id', params.uuid)
    .single()

  if (!data) {
    return { title: 'Audit not found — AI Cost IQ' }
  }

  const saving = Math.round(data.total_monthly_saving)
  const annual = Math.round(data.total_annual_saving)
  const title =
    saving > 0
      ? `This team could save $${saving}/mo on AI tools`
      : 'AI spend audit — this team is spending optimally'
  const description =
    saving > 0
      ? `Free AI spend audit found $${annual}/year in potential savings on ${data.use_case} tools. Get your free audit.`
      : `Free AI spend audit confirmed this ${data.team_size} team is running an optimised AI stack. Check yours.`

  return {
    title: `${title} — AI Cost IQ`,
    description,
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/audit/${params.uuid}`,
      siteName: 'AI Cost IQ',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

// ---------------------------------------------------------------------------
// Page — fetches audit server-side, passes to client component
// Email and company name are stripped from the public version
// ---------------------------------------------------------------------------
export default async function AuditResultPage({ params }: Props) {
  const { data, error } = await supabase
    .from('audits')
    .select(
      'id, results, total_current_spend, total_monthly_saving, total_annual_saving, high_savings, already_optimal, ai_summary, use_case, team_size, created_at'
    )
    .eq('id', params.uuid)
    .single()

  if (error || !data) notFound()

  return <ResultsClient audit={data} uuid={params.uuid} />
}