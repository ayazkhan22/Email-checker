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

/** Build pg PoolConfig with explicit fields so SSL settings are never ignored. */
export function getPgPoolConfig(): PoolConfig {
  const parsed = parseDatabaseUrl(getDatabaseUrl())

  const config: PoolConfig = {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 5432,
    database: parsed.pathname.replace(/^\//, '') || 'postgres',
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    max: 1,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 30000,
  }

  // Required for Supabase on Vercel — avoids "self-signed certificate in certificate chain"
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
