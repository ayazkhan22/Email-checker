import { Pool, type PoolConfig } from 'pg'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { getDatabaseUrl, needsRelaxedSsl } from '@/lib/database-url'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function createPoolConfig(): PoolConfig {
  const connectionString = getDatabaseUrl()

  const config: PoolConfig = {
    connectionString,
    max: 1,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 30000,
  }

  // Supabase on Vercel hits "self-signed certificate in certificate chain" without this
  if (needsRelaxedSsl()) {
    config.ssl = { rejectUnauthorized: false }
  }

  return config
}

function createPrismaClient(): PrismaClient {
  const pool = globalForPrisma.pool ?? new Pool(createPoolConfig())
  globalForPrisma.pool = pool

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    const value = client[prop as keyof PrismaClient]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
