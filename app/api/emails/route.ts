import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDatabaseErrorHint } from '@/lib/database-url'
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
      {
        error: getDatabaseErrorHint(message),
        details: message,
      },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const authError = await requireAuth()
  if (authError) return authError

  try {
    await prisma.email.deleteMany()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting all emails:', error)
    return NextResponse.json({ error: 'Failed to delete emails' }, { status: 500 })
  }
}
