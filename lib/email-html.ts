export function getEmailSignatureHtml(): string {
  if (process.env.EMAIL_SIGNATURE_HTML_BASE64) {
    try {
      return Buffer.from(process.env.EMAIL_SIGNATURE_HTML_BASE64, 'base64').toString('utf8')
    } catch {
      return ''
    }
  }

  return process.env.EMAIL_SIGNATURE_HTML ?? ''
}

export function hasEmailSignature(): boolean {
  return getEmailSignatureHtml().trim().length > 0
}

export function buildEmailHtml(body: string, trackingPixel: string): string {
  const messageHtml = body
    .split('\n')
    .map((line) => line.trim() === '' ? '<br/>' : line.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    .join('<br/>')

  const signature = getEmailSignatureHtml()
  const signatureBlock = signature
    ? `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">${signature}</div>`
    : ''

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
      <div style="font-size: 14px; line-height: 1.6;">${messageHtml}</div>
      ${signatureBlock}
    </div>
    ${trackingPixel}
  `
}
