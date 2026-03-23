import { NextRequest, NextResponse } from 'next/server';
import { getClients, saveClients, addEventLog } from '@/lib/kv';
import { requireApiAuth } from '@/lib/auth';
import type { Client } from '@/lib/types';

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  const clients = await getClients();
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const clients = await getClients();

  const now = new Date().toISOString();
  const newClient: Client = {
    id: body.id || crypto.randomUUID().slice(0, 8),
    name: body.name,
    username: body.username,
    password: body.password,
    reportType: body.reportType ?? 'SALES',
    channel: body.channel ?? 'dischem',
    bookmarkName: body.bookmarkName ?? '',
    downloadDir: body.downloadDir ?? '',
    schedules: body.schedules ?? [],
    validation: body.validation ?? { enabled: false, retryWaitMinutes: 30, maxRetries: 3 },
    expectedFileSizeKb: body.expectedFileSizeKb ?? 0,
    fileSizeTolerancePct: body.fileSizeTolerancePct ?? 20,
    notifyEmail: body.notifyEmail ?? '',
    createdAt: now,
    updatedAt: now,
  };

  clients.push(newClient);
  await saveClients(clients);

  await addEventLog({
    id: crypto.randomUUID(),
    logType: 'event',
    timestamp: now,
    actor: auth.userName,
    actorEmail: auth.userEmail,
    action: 'create_client',
    target: newClient.name,
    message: `Client "${newClient.name}" added by ${auth.userName}`,
  });

  return NextResponse.json(newClient, { status: 201 });
}
