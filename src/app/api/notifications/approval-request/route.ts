import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { parentEmail, parentName, childName, activityName, activityIcon } = body

    if (!parentEmail || !childName || !activityName) {
      return NextResponse.json(
        { error: 'Chybí povinné údaje' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://academycraft.vercel.app'

    const { data, error } = await resend.emails.send({
      from: 'AcademyCraft <onboarding@resend.dev>',
      to: parentEmail,
      subject: `${childName} čeká na schválení aktivity`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #1a1a2e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 500px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%); border-radius: 16px; padding: 32px; border: 1px solid #2a2a4e;">

              <!-- Header -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 48px; margin-bottom: 8px;">${activityIcon || '📋'}</div>
                <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px 0;">Nová žádost o schválení</h1>
                <p style="color: #a0a0b0; margin: 0; font-size: 14px;">AcademyCraft</p>
              </div>

              <!-- Content -->
              <div style="background-color: #2a2a4e; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="color: #ffffff; margin: 0 0 12px 0; font-size: 16px;">
                  Ahoj${parentName ? ` ${parentName}` : ''},
                </p>
                <p style="color: #a0a0b0; margin: 0; font-size: 15px; line-height: 1.6;">
                  <strong style="color: #17DD62;">${childName}</strong> dokončil/a aktivitu a čeká na tvé schválení:
                </p>
              </div>

              <!-- Activity Card -->
              <div style="background: linear-gradient(135deg, #17DD62 0%, #3D8C3E 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">${activityIcon || '✅'}</div>
                <h2 style="color: #ffffff; font-size: 20px; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">
                  ${activityName}
                </h2>
              </div>

              <!-- CTA Button -->
              <a href="${appUrl}/parent"
                 style="display: block; background: linear-gradient(135deg, #9333EA 0%, #7C3AED 100%); color: #ffffff; text-decoration: none; padding: 16px 24px; border-radius: 12px; text-align: center; font-weight: 600; font-size: 16px;">
                Schválit v aplikaci
              </a>

              <!-- Footer -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #2a2a4e; text-align: center;">
                <p style="color: #6b6b80; font-size: 12px; margin: 0;">
                  Tento email byl odeslán z aplikace AcademyCraft.<br>
                  Pokud nechceš dostávat tyto notifikace, můžeš je vypnout v nastavení.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json(
      { error: 'Nepodařilo se odeslat notifikaci' },
      { status: 500 }
    )
  }
}
