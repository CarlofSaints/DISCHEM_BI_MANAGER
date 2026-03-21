import { NextResponse } from 'next/server';
import { getPendingTriggers, addTrigger } from '@/lib/kv';

// Bot polls GET to see if any manual runs are queued.
export async function GET() {
  const triggers = await getPendingTriggers();
  return NextResponse.json(triggers);
}

// Web UI calls POST { clientId } to queue a manual run.
export async function POST(req: Request) {
  const { clientId } = await req.json();
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });
  await addTrigger(clientId);
  return NextResponse.json({ ok: true, clientId });
}
