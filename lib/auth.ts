import { getAuthConfig } from '@/lib/config'

export const SESSION_COOKIE = 'auth_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function getAuthSecret(): string | null {
  const secret = getAuthConfig().secret
  return secret || null
}

export function getAuthCredentials(): { email: string; password: string } | null {
  const { email, password } = getAuthConfig()
  if (!email || !password) return null
  return { email, password }
}

async function signPayload(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return Buffer.from(signature).toString('hex')
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

export async function createSessionToken(email: string): Promise<string | null> {
  const secret = getAuthSecret()
  if (!secret) return null

  const expires = Date.now() + SESSION_MAX_AGE * 1000
  const payload = JSON.stringify({ email, exp: expires })
  const signature = await signPayload(secret, payload)
  return `${Buffer.from(payload).toString('base64url')}.${signature}`
}

export async function verifySessionToken(token: string): Promise<boolean> {
  const secret = getAuthSecret()
  if (!secret) return false

  const dotIndex = token.lastIndexOf('.')
  if (dotIndex === -1) return false

  const encodedPayload = token.slice(0, dotIndex)
  const signature = token.slice(dotIndex + 1)

  let payload: string
  try {
    payload = Buffer.from(encodedPayload, 'base64url').toString('utf8')
  } catch {
    return false
  }

  const expected = await signPayload(secret, payload)
  if (!timingSafeEqualHex(signature, expected)) {
    return false
  }

  try {
    const data = JSON.parse(payload) as { email?: string; exp?: number }
    if (!data.email || typeof data.exp !== 'number') return false
    return Date.now() <= data.exp
  } catch {
    return false
  }
}

export async function isAuthenticatedRequest(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false
  return verifySessionToken(cookieValue)
}
