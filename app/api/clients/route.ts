import { NextResponse } from 'next/server';
import { getClients, saveClients } from '@/lib/kv';
import type { Client } from '@/lib/types';

export async function GET() {
  const clients = await getClients();
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const body = await req.json();
  const clients = await getClients();

  const now = new Date().toISOString();
  const newClient: Client = {
    id: body.id || crypto.randomUUID().slice(0, 8),
    name: body.name,
    username: body.username,
    password: body.password,
    reportType: body.reportType ?? 'SALES',
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
  return NextResponse.json(newClient, { status: 201 });
}
