import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { getSmtpConfig } from '@/lib/config'

export function getSmtpTransporter(): Transporter {
  const { email, password } = getSmtpConfig()

  if (!email || !password) {
    throw new Error('SMTP_EMAIL and SMTP_PASSWORD must be set in environment variables')
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: email,
      pass: password,
    },
  })
}
