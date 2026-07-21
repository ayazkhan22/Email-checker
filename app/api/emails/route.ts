import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/require-auth'

export async function GET() {
  const authError = await requireAuth()
  if (authError) return authError

  try {
    const emails = await prisma.email.findMany({
      orderBy: { sentAt: 'desc' },
    })
    return NextResponse.json({ emails })
  } catch (error) {
    console.error('Error fetching emails:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch emails'
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? message : 'Failed to fetch emails' },
      { status: 500 }
    )
  }
}
