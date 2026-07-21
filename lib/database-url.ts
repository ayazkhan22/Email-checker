import type { PoolConfig } from 'pg'

function parseDatabaseUrl(raw: string): URL {
  return new URL(raw.replace(/^postgres:\/\//, 'postgresql://'))
}

function isSupabaseHost(hostname: string): boolean {
  return hostname.includes('supabase.co') || hostname.includes('supabase.com')
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

export function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL
  if (!raw) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const parsed = parseDatabaseUrl(raw)

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

    parsed.searchParams.delete('sslmode')
    parsed.searchParams.delete('sslaccept')
  }

  return parsed.toString()
}

function resolveCredentials(parsed: URL): { user: string; password: string } {
  const user = process.env.DATABASE_USER ?? decodeURIComponent(parsed.username)
  const password = process.env.DATABASE_PASSWORD ?? decodeURIComponent(parsed.password)

  if (!user) {
    throw new Error('Database username is missing. Set DATABASE_USER or include it in DATABASE_URL.')
  }

  if (!password) {
    throw new Error(
      'Database password is missing. Set DATABASE_PASSWORD in Vercel (recommended) or include it in DATABASE_URL.'
    )
  }

  if (parsed.hostname.includes('pooler') && user === 'postgres') {
    throw new Error(
      'Supabase pooler requires username postgres.ctsukdtinxlpzubhnzwm, not postgres. ' +
        'Copy the full connection string from Supabase → Settings → Database → Transaction pooler.'
    )
  }

  return { user, password }
}

/** Build pg PoolConfig with explicit fields so SSL settings are never ignored. */
export function getPgPoolConfig(): PoolConfig {
  const parsed = parseDatabaseUrl(getDatabaseUrl())
  const { user, password } = resolveCredentials(parsed)

  const config: PoolConfig = {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 5432,
    database: parsed.pathname.replace(/^\//, '') || 'postgres',
    user,
    password,
    max: 1,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 30000,
  }

  if (!isLocalHost(parsed.hostname)) {
    config.ssl = { rejectUnauthorized: false }
  }

  return config
}

export function isSupabaseUrl(): boolean {
  if (!process.env.DATABASE_URL) return false
  try {
    return isSupabaseHost(parseDatabaseUrl(process.env.DATABASE_URL).hostname)
  } catch {
    return process.env.DATABASE_URL.includes('supabase')
  }
}

export function getDatabaseErrorHint(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('authentication failed') || lower.includes('password authentication failed')) {
    return (
      'Database login failed. In Vercel, set DATABASE_PASSWORD to your Supabase database password ' +
      '(Supabase → Settings → Database → Database password). ' +
      'If your password has special characters (@, #, %, etc.), use DATABASE_PASSWORD instead of putting it in DATABASE_URL. ' +
      'Username must be postgres.ctsukdtinxlpzubhnzwm for the pooler.'
    )
  }

  if (lower.includes("can't reach database") || lower.includes('p1001')) {
    return 'Cannot reach Supabase. Check DATABASE_URL uses the Transaction pooler on port 6543 and the project is not paused.'
  }

  if (lower.includes('does not exist') || lower.includes('relation')) {
    return 'Email table missing. Run the SQL in prisma/setup.sql inside Supabase → SQL Editor.'
  }

  return 'Check DATABASE_URL and DATABASE_PASSWORD in Vercel environment variables.'
}
