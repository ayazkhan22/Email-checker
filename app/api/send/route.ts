import { NextResponse } from 'next/server'
import { getAppUrl } from '@/lib/app-url'
import { getSmtpConfig } from '@/lib/config'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/require-auth'
import { getSmtpTransporter } from '@/lib/smtp'

export const maxDuration = 30

function getSmtpErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'Unknown SMTP error'
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
    const trackingPixel = `<img src="${trackingUrl}" alt="" width="1" height="1" style="display:none;border:0;" />`

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

    const smtpError = getSmtpErrorMessage(error)
    console.error('Error sending email:', smtpError, error)

    return NextResponse.json(
      {
        error: 'Failed to send email. Check SMTP_PASSWORD is the App Password for ayazkhan@aizaz.studio.',
        details: smtpError,
      },
      { status: 500 }
    )
  }
}
