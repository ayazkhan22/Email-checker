import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Clear existing data first
    await prisma.email.deleteMany()

    const now = new Date()
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    await prisma.email.createMany({
      data: [
        {
          senderName: 'Ayaz',
          recipientName: 'Aqib',
          recipientEmail: 'aqib@example.com',
          subject: 'Hey Aqib! Check this out',
          body: 'Hi Aqib,\n\nI just wanted to share this cool email tracker I built. Let me know what you think!\n\nBest,\nAyaz',
          status: 'OPENED',
          sentAt: twoHoursAgo,
          openedAt: tenMinutesAgo,
        },
        {
          senderName: 'Ayaz',
          recipientName: 'Aqib',
          recipientEmail: 'aqib@example.com',
          subject: 'Project Update for This Week',
          body: 'Hi Aqib,\n\nHere is the weekly update on the project progress.\n\nRegards,\nAyaz',
          status: 'SENT',
          sentAt: yesterday,
          openedAt: null,
        },
        {
          senderName: 'Ayaz',
          recipientName: 'Aqib',
          recipientEmail: 'aqib@example.com',
          subject: 'Meeting Tomorrow at 10am',
          body: 'Hi Aqib,\n\nDo not forget we have a meeting tomorrow at 10am.\n\nThanks,\nAyaz',
          status: 'OPENED',
          sentAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          openedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
      ],
    })

    return NextResponse.json({ success: true, message: 'Seed data inserted: 3 emails from Ayaz to Aqib' })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 })
  }
}
