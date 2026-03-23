import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getUser, getUsers, saveUsers } from '@/lib/kv';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { newPassword } = await req.json();
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const users = await getUsers();
  const idx = users.findIndex((u) => u.id === session.userId);
  if (idx === -1) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  users[idx].passwordHash = await hashPassword(newPassword);
  users[idx].forcePasswordChange = false;
  users[idx].firstLoginAt = users[idx].firstLoginAt ?? new Date().toISOString();
  users[idx].updatedAt = new Date().toISOString();
  await saveUsers(users);

  return NextResponse.json({ ok: true });
}
