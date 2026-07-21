import { NextResponse } from 'next/server'
import {
  createSessionToken,
  getAuthCredentials,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const credentials = getAuthCredentials()
    if (!credentials) {
      return NextResponse.json({ error: 'Auth is not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (email !== credentials.email || password !== credentials.password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = await createSessionToken(email)
    if (!token) {
      return NextResponse.json({ error: 'Auth is not configured' }, { status: 500 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
