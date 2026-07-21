import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isLikelyRealOpen } from '@/lib/track'

const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (id) {
    try {
      const email = await prisma.email.findUnique({ where: { id } })

      if (email && email.status !== 'OPENED') {
        const userAgent = request.headers.get('user-agent')
        if (isLikelyRealOpen(userAgent, email.sentAt)) {
          await prisma.email.update({
            where: { id },
            data: {
              status: 'OPENED',
              openedAt: new Date(),
            },
          })
        }
      }
    } catch (error) {
      console.error('Tracking error:', error)
    }
  }

  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  })
}
