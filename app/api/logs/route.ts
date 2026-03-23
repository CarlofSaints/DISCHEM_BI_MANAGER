import { NextResponse } from 'next/server';
import { getLogs, addLog } from '@/lib/kv';
import type { RunLog } from '@/lib/types';
// Note: GET is intentionally public (bot polling). POST is bot-only (no UI auth).

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? 100), 500);
  const logs = await getLogs(limit);
  return NextResponse.json(logs);
}

// Bot calls POST after each run attempt.
export async function POST(req: Request) {
  const log = (await req.json()) as RunLog;
  if (!log.id || !log.clientId || !log.status)
    return NextResponse.json({ error: 'Invalid log entry' }, { status: 400 });
  await addLog(log);
  return NextResponse.json({ ok: true });
}
