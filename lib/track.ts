/** Minimum seconds after send before a pixel load counts as a real open (filters prefetch/scanners). */
const MIN_OPEN_DELAY_SECONDS = 90

const BOT_UA_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /preview/i,
  /fetch/i,
  /slurp/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /twitterbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /applebot/i,
  /headless/i,
  /python-requests/i,
  /curl\//i,
  /wget/i,
  /go-http-client/i,
  /proofpoint/i,
  /mimecast/i,
  /barracuda/i,
  /spamassassin/i,
  /safelinks/i,
  /scanner/i,
]

export function isLikelyRealOpen(userAgent: string | null, sentAt: Date): boolean {
  const secondsSinceSend = (Date.now() - sentAt.getTime()) / 1000
  if (secondsSinceSend < MIN_OPEN_DELAY_SECONDS) {
    return false
  }

  if (!userAgent || userAgent.trim() === '') {
    return false
  }

  if (BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent))) {
    return false
  }

  return true
}
