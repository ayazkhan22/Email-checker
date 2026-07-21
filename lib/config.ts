/** Dashboard login — ayazkhanloru@gmail.com is for signing into the website only. */
export function getAuthConfig() {
  return {
    email: process.env.AUTH_EMAIL ?? 'ayazkhanloru@gmail.com',
    password: process.env.AUTH_PASSWORD ?? '',
    secret: process.env.AUTH_SECRET ?? '',
  }
}

/** SMTP — ayazkhan@aizaz.studio is the account that actually sends emails. */
export function getSmtpConfig() {
  const smtpEmail = process.env.SMTP_EMAIL ?? 'ayazkhan@aizaz.studio'

  return {
    email: smtpEmail,
    password: process.env.SMTP_PASSWORD ?? '',
    fromEmail: process.env.SMTP_FROM_EMAIL ?? smtpEmail,
    fromName: process.env.SMTP_FROM_NAME ?? 'Ayaz Khan',
  }
}
