import { NextRequest, NextResponse } from 'next/server';
import { getClients, saveClients, addEventLog } from '@/lib/kv';
import { requireApiAuth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const clients = await getClients();
  const client = clients.find((c) => c.id === id);
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  const clients = await getClients();
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  clients[idx] = { ...clients[idx], ...body, id, updatedAt: new Date().toISOString() };
  await saveClients(clients);

  const now = new Date().toISOString();
  await addEventLog({
    id: crypto.randomUUID(),
    logType: 'event',
    timestamp: now,
    actor: auth.userName,
    actorEmail: auth.userEmail,
    action: 'update_client',
    target: clients[idx].name,
    message: `Client "${clients[idx].name}" updated by ${auth.userName}`,
  });

  return NextResponse.json(clients[idx]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const clients = await getClients();
  const client = clients.find((c) => c.id === id);
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await saveClients(clients.filter((c) => c.id !== id));

  const now = new Date().toISOString();
  await addEventLog({
    id: crypto.randomUUID(),
    logType: 'event',
    timestamp: now,
    actor: auth.userName,
    actorEmail: auth.userEmail,
    action: 'delete_client',
    target: client.name,
    message: `Client "${client.name}" deleted by ${auth.userName}`,
  });

  return NextResponse.json({ ok: true });
}
