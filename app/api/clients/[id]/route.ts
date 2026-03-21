import { NextResponse } from 'next/server';
import { getClients, saveClients } from '@/lib/kv';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clients = await getClients();
  const client = clients.find((c) => c.id === id);
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const clients = await getClients();
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  clients[idx] = { ...clients[idx], ...body, id, updatedAt: new Date().toISOString() };
  await saveClients(clients);
  return NextResponse.json(clients[idx]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clients = await getClients();
  const filtered = clients.filter((c) => c.id !== id);
  if (filtered.length === clients.length)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await saveClients(filtered);
  return NextResponse.json({ ok: true });
}
