import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getAppUrl } from '@/lib/app-url'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/require-auth'

export const maxDuration = 30

export async function POST(request: Request) {
  const authError = await requireAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const { recipientName, recipientEmail, subject, emailBody } = body

    if (!recipientName || !recipientEmail || !subject || !emailBody) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const senderName = process.env.SMTP_FROM_NAME || 'Ayaz Khan'
    const { SMTP_EMAIL, SMTP_PASSWORD } = process.env

    if (!SMTP_EMAIL || !SMTP_PASSWORD) {
      return NextResponse.json({ error: 'Server SMTP configuration is missing' }, { status: 500 })
    }

    const appUrl = getAppUrl()

    // 1. Save email record first to get the tracking ID
    const emailRecord = await prisma.email.create({
      data: {
        senderName,
        recipientName,
        recipientEmail,
        subject,
        body: emailBody,
        status: 'SENT',
      },
    })

    // 2. Build tracking pixel URL
    const trackingUrl = `${appUrl}/api/track?id=${emailRecord.id}`
    const trackingPixel = `<img src="${trackingUrl}" alt="" width="1" height="1" style="display:none;border:0;" />`

    // 3. Build full HTML email
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${emailBody.replace(/\n/g, '<br/>')}
      </div>
      ${trackingPixel}
    `

    // 4. Send via Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: `"${senderName}" <${SMTP_EMAIL}>`,
      to: recipientEmail,
      subject,
      html: htmlBody,
    })

    return NextResponse.json({ success: true, email: emailRecord })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
