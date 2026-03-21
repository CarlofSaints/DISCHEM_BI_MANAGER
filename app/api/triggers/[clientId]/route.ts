import { NextResponse } from 'next/server';
import { removeTrigger } from '@/lib/kv';

// Bot calls DELETE after it picks up and starts a manual run.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  await removeTrigger(clientId);
  return NextResponse.json({ ok: true });
}
