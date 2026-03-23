import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { SessionData, AppUser } from './types';

export const COOKIE_NAME = 'dchem_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Password helpers ──────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── Stateless session — payload encoded directly in the cookie ────────────────
// No server-side session storage needed. The cookie IS the session.
// Acceptable for an internal tool; token revocation is not supported.

function encodeSession(data: SessionData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

function decodeSession(token: string): SessionData | null {
  try {
    const data = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8')) as SessionData;
    if (new Date(data.expiresAt).getTime() < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

// ── Create session (call after successful login) ──────────────────────────────

export function createSession(user: AppUser): string {
  const session: SessionData = {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    role: user.role,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
  return encodeSession(session);
}

// ── Read session from incoming request (API routes) ───────────────────────────

export function getSessionFromRequest(req: NextRequest | Request): SessionData | null {
  let token: string | undefined;
  if (req instanceof NextRequest) {
    token = req.cookies.get(COOKIE_NAME)?.value;
  } else {
    const cookieHeader = req.headers.get('cookie') ?? '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
    token = match?.[1];
  }
  if (!token) return null;
  return decodeSession(token);
}

// ── Read session from Server Components (next/headers) ────────────────────────

export async function getServerSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}

// ── Require auth in API routes ────────────────────────────────────────────────

export function requireApiAuth(req: Request, adminOnly = false): SessionData | NextResponse {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (adminOnly && session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return session;
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS / 1000,
    path: '/',
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
