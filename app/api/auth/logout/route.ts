import { NextResponse } from 'next/server';
import { logout, clearSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  await logout(req);
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
