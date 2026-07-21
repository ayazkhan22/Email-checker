import { NextResponse } from 'next/server'
import { getAppUrl } from '@/lib/app-url'
import { getSmtpConfig } from '@/lib/config'
import { getDatabaseErrorHint } from '@/lib/database-url'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/require-auth'
import { getSmtpTransporter } from '@/lib/smtp'

export const maxDuration = 30

function classifyError(error: unknown): { type: 'database' | 'smtp' | 'unknown'; message: string } {
  const message = error instanceof Error ? error.message : String(error)
  const lower = message.toLowerCase()

  if (
    lower.includes('prisma') ||
    lower.includes("can't reach database") ||
    lower.includes('database server') ||
    lower.includes('database_url') ||
    lower.includes('authentication failed') ||
    lower.includes('p1001')
  ) {
    return { type: 'database', message }
  }

  if (
    lower.includes('smtp') ||
    lower.includes('eauth') ||
    lower.includes('invalid login') ||
    lower.includes('nodemailer')
  ) {
    return { type: 'smtp', message }
  }

  return { type: 'unknown', message }
}

export async function POST(request: Request) {
  const authError = await requireAuth()
  if (authError) return authError

  const smtp = getSmtpConfig()
  if (!smtp.password) {
    return NextResponse.json(
      { error: 'SMTP_PASSWORD is not configured. Add the Gmail App Password for ayazkhan@aizaz.studio in Vercel.' },
      { status: 500 }
    )
  }

  let emailRecordId: string | null = null

  try {
    const body = await request.json()
    const { recipientName, recipientEmail, subject, emailBody } = body

    if (!recipientName || !recipientEmail || !subject || !emailBody) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const appUrl = getAppUrl()

    const emailRecord = await prisma.email.create({
      data: {
        senderName: smtp.fromName,
        recipientName,
        recipientEmail,
        subject,
        body: emailBody,
        status: 'SENT',
      },
    })
    emailRecordId = emailRecord.id

    const trackingUrl = `${appUrl}/api/track?id=${emailRecord.id}`
    const trackingPixel = `<img src="${trackingUrl}" alt="" width="1" height="1" border="0" style="display:none!important;visibility:hidden;width:1px;height:1px;opacity:0;" />`

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${emailBody.replace(/\n/g, '<br/>')}
      </div>
      ${trackingPixel}
    `

    const transporter = getSmtpTransporter()

    await transporter.sendMail({
      from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
      to: recipientEmail,
      subject,
      html: htmlBody,
    })

    return NextResponse.json({ success: true, email: emailRecord })
  } catch (error) {
    if (emailRecordId) {
      await prisma.email.delete({ where: { id: emailRecordId } }).catch(() => {})
    }

    const { type, message } = classifyError(error)
    console.error(`Error sending email (${type}):`, message, error)

    if (type === 'database') {
      return NextResponse.json(
        {
          error: getDatabaseErrorHint(message),
          details: message,
        },
        { status: 500 }
      )
    }

    if (type === 'smtp') {
      return NextResponse.json(
        {
          error: 'SMTP failed. Check SMTP_PASSWORD is the Gmail App Password for ayazkhan@aizaz.studio.',
          details: message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to send email', details: message },
      { status: 500 }
    )
  }
}
