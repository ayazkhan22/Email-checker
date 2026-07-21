import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { shouldMarkEmailOpened } from '@/lib/track'

const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

const PIXEL_HEADERS = {
  'Content-Type': 'image/gif',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
  'Surrogate-Control': 'no-store',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (id) {
    try {
      const email = await prisma.email.findUnique({ where: { id } })

      if (email && email.status !== 'OPENED') {
        const updated = await prisma.email.update({
          where: { id },
          data: { pixelLoads: { increment: 1 } },
        })

        const userAgent = request.headers.get('user-agent')

        if (shouldMarkEmailOpened(updated.pixelLoads, userAgent, email.sentAt)) {
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
    headers: PIXEL_HEADERS,
  })
}
