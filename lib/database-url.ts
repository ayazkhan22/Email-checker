/**
 * Normalize DATABASE_URL for Supabase serverless (Vercel).
 * Transaction pooler must use port 6543 on *.pooler.supabase.com with ?pgbouncer=true
 */
export function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL
  if (!raw) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const url = raw.replace(/^postgres:\/\//, 'postgresql://')

  try {
    const parsed = new URL(url)

    if (isSupabaseHost(parsed.hostname)) {
      if (parsed.hostname.startsWith('db.') && parsed.port === '6543') {
        throw new Error(
          'DATABASE_URL uses port 6543 on db.*.supabase.co which is invalid. ' +
            'Use the Transaction pooler URI (*.pooler.supabase.com:6543?pgbouncer=true).'
        )
      }

      if (parsed.port === '6543' || parsed.hostname.includes('pooler')) {
        parsed.searchParams.set('pgbouncer', 'true')
      }

      parsed.searchParams.set('connection_limit', '1')

      if (!parsed.searchParams.has('connect_timeout')) {
        parsed.searchParams.set('connect_timeout', '30')
      }

      // SSL is configured on the pg Pool (rejectUnauthorized: false) — not via sslmode in the URL
      parsed.searchParams.delete('sslmode')
      parsed.searchParams.delete('sslaccept')
    }

    return parsed.toString()
  } catch (error) {
    if (error instanceof Error && error.message.includes('DATABASE_URL uses port 6543')) {
      throw error
    }
    return url
  }
}

function isSupabaseHost(hostname: string): boolean {
  return hostname.includes('supabase.co') || hostname.includes('supabase.com')
}

export function isSupabaseUrl(): boolean {
  if (!process.env.DATABASE_URL) return false
  try {
    const parsed = new URL(process.env.DATABASE_URL.replace(/^postgres:\/\//, 'postgresql://'))
    return isSupabaseHost(parsed.hostname)
  } catch {
    return process.env.DATABASE_URL.includes('supabase')
  }
}

export function needsRelaxedSsl(): boolean {
  return isSupabaseUrl()
}
