import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/require-auth'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth()
  if (authError) return authError

  try {
    const { id } = await params

    await prisma.email.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting email:', error)
    return NextResponse.json({ error: 'Failed to delete email' }, { status: 500 })
  }
}
