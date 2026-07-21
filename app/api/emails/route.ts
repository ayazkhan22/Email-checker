import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
