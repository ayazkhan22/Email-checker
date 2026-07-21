import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 1×1 transparent GIF in base64
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
        await prisma.email.update({
          where: { id },
          data: {
            status: 'OPENED',
            openedAt: new Date(),
          },
        })
      }
    } catch (error) {
      console.error('Tracking error:', error)
    }
  }

  // Always return the transparent pixel — never break the email visually
  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
