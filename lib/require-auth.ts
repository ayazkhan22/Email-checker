import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { isAuthenticatedRequest, SESSION_COOKIE } from '@/lib/auth'

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getSessionToken()
  return isAuthenticatedRequest(token)
}

export async function requireAuth(): Promise<NextResponse | null> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
