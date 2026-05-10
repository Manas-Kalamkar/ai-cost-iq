// src/app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Honeypot check
  if (body.website) {
    return NextResponse.json({ ok: true })
  }

  const { auditId, email, companyName, role, teamSize } = body

  if (!auditId || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Save lead to Supabase
  const { error } = await supabase.from('leads').insert({
    audit_id: auditId,
    email,
    company_name: companyName || null,
    role: role || null,
    team_size: teamSize || null,
  })

  if (error) {
    console.error('Lead insert error:', error)
    return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
  }

  // Send transactional email via Resend
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'AI Cost IQ <audit@aicostiq.com>',
        to: email,
        subject: 'Your AI spend audit report',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
            <h1 style="font-size:20px;font-weight:600;color:#1a1a1a;margin-bottom:8px">
              Your AI Cost IQ audit is ready
            </h1>
            <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:24px">
              Thanks for using AI Cost IQ. Your full audit report is saved at the link below.
              Share it with your team or bookmark it for your next planning cycle.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/audit/${auditId}"
               style="display:inline-block;padding:10px 20px;background:#534AB7;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500">
              View your audit report →
            </a>
            <hr style="border:none;border-top:1px solid #eee;margin:32px 0" />
            <p style="color:#888;font-size:12px;line-height:1.6">
              AI Cost IQ is a free tool by Credex — we sell discounted AI infrastructure credits
              sourced from companies that overforecast. If your audit showed significant savings
              opportunity, our team will reach out shortly to discuss how Credex credits could
              help reduce your bill further.
            </p>
          </div>
        `,
      }),
    })
  } catch (emailErr) {
    // Email failure should not block the response — lead is already saved
    console.error('Resend email error:', emailErr)
  }

  return NextResponse.json({ ok: true })
}