import { NextResponse } from 'next/server'
import { hasEmailSignature } from '@/lib/email-html'
import { requireAuth } from '@/lib/require-auth'

export async function GET() {
  const authError = await requireAuth()
  if (authError) return authError

  return NextResponse.json({ configured: hasEmailSignature() })
}
