import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { setSession, getSession, deleteSession } from './kv';
import type { SessionData, AppUser } from './types';

export const COOKIE_NAME = 'dchem_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: AppUser): Promise<string> {
  const token = crypto.randomUUID();
  const session: SessionData = {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    role: user.role,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
  await setSession(token, session);
  return token;
}

// ── For API Routes — reads cookie from Request ─────────────────────────────────
export async function getSessionFromRequest(req: NextRequest | Request): Promise<SessionData | null> {
  let token: string | undefined;
  if (req instanceof NextRequest) {
    token = req.cookies.get(COOKIE_NAME)?.value;
  } else {
    // Standard Request (route handlers)
    const cookieHeader = req.headers.get('cookie') ?? '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
    token = match?.[1];
  }
  if (!token) return null;
  return getSession(token);
}

// ── For Server Components — reads from next/headers ──────────────────────────
export async function getServerSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return getSession(token);
}

// ── Require auth in API route — returns 401 if not authenticated ──────────────
export async function requireApiAuth(req: Request, adminOnly = false): Promise<SessionData | NextResponse> {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (adminOnly && session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return session;
}

// ── Set session cookie on a NextResponse ──────────────────────────────────────
export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS / 1000,
    path: '/',
  });
}

// ── Clear session cookie ──────────────────────────────────────────────────────
export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

// ── Logout helper ─────────────────────────────────────────────────────────────
export async function logout(req: Request): Promise<void> {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  const token = match?.[1];
  if (token) await deleteSession(token);
}
