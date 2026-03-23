import { NextRequest, NextResponse } from 'next/server';
import { getUsers, saveUsers } from '@/lib/kv';
import { requireApiAuth, hashPassword } from '@/lib/auth';
import { addEventLog } from '@/lib/kv';
import { sendWelcomeEmail } from '@/lib/email';
import type { AppUser } from '@/lib/types';

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req, true);
  if (auth instanceof NextResponse) return auth;

  const users = await getUsers();
  return NextResponse.json(users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    forcePasswordChange: u.forcePasswordChange,
    createdAt: u.createdAt,
    firstLoginAt: u.firstLoginAt,
  })));
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, true);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { name, email, password, role, forcePasswordChange, sendEmail } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'name, email, and password are required' }, { status: 400 });
  }

  const users = await getUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const newUser: AppUser = {
    id: crypto.randomUUID().slice(0, 8),
    name,
    email,
    passwordHash: await hashPassword(password),
    role: role ?? 'user',
    forcePasswordChange: forcePasswordChange ?? true,
    createdAt: now,
    updatedAt: now,
    firstLoginAt: null,
  };

  users.push(newUser);
  await saveUsers(users);

  // Log the event
  await addEventLog({
    id: crypto.randomUUID(),
    logType: 'event',
    timestamp: now,
    actor: auth.userName,
    actorEmail: auth.userEmail,
    action: 'create_user',
    target: `${name} (${email})`,
    message: `User "${name}" (${role ?? 'user'}) created by ${auth.userName}`,
  });

  // Send welcome email if requested
  if (sendEmail && process.env.RESEND_API_KEY) {
    sendWelcomeEmail({
      toName: name,
      toEmail: email,
      password,
      forcePasswordChange: forcePasswordChange ?? true,
    }).catch(() => {});
  }

  return NextResponse.json({
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    forcePasswordChange: newUser.forcePasswordChange,
    createdAt: newUser.createdAt,
    firstLoginAt: null,
  }, { status: 201 });
}
