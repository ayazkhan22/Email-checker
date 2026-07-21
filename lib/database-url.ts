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

    if (parsed.hostname.includes('supabase.co')) {
      // db.xxx.supabase.co:6543 is invalid — 6543 only works on the pooler host
      if (parsed.hostname.startsWith('db.') && parsed.port === '6543') {
        throw new Error(
          'DATABASE_URL uses port 6543 on db.*.supabase.co which is invalid. ' +
            'In Supabase → Settings → Database → Connection string, copy the ' +
            'Transaction pooler URI (*.pooler.supabase.com:6543?pgbouncer=true).'
        )
      }

      if (parsed.port === '6543' || parsed.hostname.includes('pooler')) {
        parsed.searchParams.set('pgbouncer', 'true')
      }

      parsed.searchParams.set('connection_limit', '1')

      if (!parsed.searchParams.has('connect_timeout')) {
        parsed.searchParams.set('connect_timeout', '30')
      }

      if (!parsed.searchParams.has('sslmode')) {
        parsed.searchParams.set('sslmode', 'require')
      }
    }

    return parsed.toString()
  } catch (error) {
    if (error instanceof Error && error.message.includes('DATABASE_URL uses port 6543')) {
      throw error
    }
    return url
  }
}

export function isSupabaseUrl(): boolean {
  return process.env.DATABASE_URL?.includes('supabase.co') ?? false
}
