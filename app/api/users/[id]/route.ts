import { NextRequest, NextResponse } from 'next/server';
import { getUsers, saveUsers, addEventLog } from '@/lib/kv';
import { requireApiAuth, hashPassword } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(req, true);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  const users = await getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const prev = users[idx];

  if (body.email && body.email.toLowerCase() !== prev.email.toLowerCase()) {
    if (users.some((u) => u.id !== id && u.email.toLowerCase() === body.email.toLowerCase())) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
  }

  const now = new Date().toISOString();
  users[idx] = {
    ...prev,
    name: body.name ?? prev.name,
    email: body.email ?? prev.email,
    role: body.role ?? prev.role,
    forcePasswordChange: body.forcePasswordChange ?? prev.forcePasswordChange,
    passwordHash: body.password ? await hashPassword(body.password) : prev.passwordHash,
    updatedAt: now,
  };

  await saveUsers(users);

  await addEventLog({
    id: crypto.randomUUID(),
    logType: 'event',
    timestamp: now,
    actor: auth.userName,
    actorEmail: auth.userEmail,
    action: 'update_user',
    target: `${users[idx].name} (${users[idx].email})`,
    message: `User "${users[idx].name}" updated by ${auth.userName}`,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(req, true);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const users = await getUsers();
  const user = users.find((u) => u.id === id);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Cannot delete yourself
  if (id === auth.userId) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  await saveUsers(users.filter((u) => u.id !== id));

  const now = new Date().toISOString();
  await addEventLog({
    id: crypto.randomUUID(),
    logType: 'event',
    timestamp: now,
    actor: auth.userName,
    actorEmail: auth.userEmail,
    action: 'delete_user',
    target: `${user.name} (${user.email})`,
    message: `User "${user.name}" deleted by ${auth.userName}`,
  });

  return NextResponse.json({ ok: true });
}
