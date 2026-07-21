/** Ignore opens in the first few seconds (delivery scanners). */
const MIN_OPEN_DELAY_SECONDS = 15

/** Known legitimate mail-client image proxies — always allow after min delay. */
const MAIL_CLIENT_UA_PATTERNS = [
  /googleimageproxy/i,
  /outlook/i,
  /microsoft/i,
  /applewebkit/i,
  /thunderbird/i,
  /yahoo/i,
  /protonmail/i,
]

/** Block only obvious non-human prefetch bots. */
const BOT_UA_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /crawler/i,
  /spider/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /twitterbot/i,
  /telegrambot/i,
  /headlesschrome/i,
  /python-requests/i,
  /curl\//i,
  /wget/i,
  /go-http-client/i,
  /proofpoint/i,
  /mimecast/i,
  /barracuda/i,
  /spamassassin/i,
]

function isObviousBot(userAgent: string | null): boolean {
  if (!userAgent) return false
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent))
}

function isMailClient(userAgent: string | null): boolean {
  if (!userAgent) return false
  return MAIL_CLIENT_UA_PATTERNS.some((pattern) => pattern.test(userAgent))
}

export function shouldMarkEmailOpened(
  pixelLoads: number,
  userAgent: string | null,
  sentAt: Date
): boolean {
  const secondsSinceSend = (Date.now() - sentAt.getTime()) / 1000

  if (secondsSinceSend < MIN_OPEN_DELAY_SECONDS) {
    return false
  }

  if (isObviousBot(userAgent)) {
    return false
  }

  // Second pixel load = recipient likely opened (first was often a prefetch)
  if (pixelLoads >= 2) {
    return true
  }

  // Single load after delay from a mail client, or any load after 60s
  if (pixelLoads === 1) {
    if (isMailClient(userAgent) || secondsSinceSend >= 60) {
      return true
    }
  }

  return false
}
