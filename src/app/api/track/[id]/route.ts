import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// A transparent 1x1 pixel GIF
const transparentPixel = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  if (id) {
    try {
      // Find the email
      const email = await prisma.email.findUnique({
        where: { id },
      });

      // Update to opened if it wasn't already
      if (email && email.status !== 'OPENED') {
        await prisma.email.update({
          where: { id },
          data: {
            status: 'OPENED',
            openedAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error('Failed to track email open:', error);
    }
  }

  // Return the tracking pixel with appropriate headers to prevent caching
  return new NextResponse(transparentPixel, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
