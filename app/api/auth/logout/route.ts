import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  // Stateless sessions — just clear the cookie, nothing to delete server-side
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
