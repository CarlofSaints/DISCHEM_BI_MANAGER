// Bot polls this endpoint to fetch its full client configuration.
import { NextResponse } from 'next/server';
import { getClients } from '@/lib/kv';

export async function GET() {
  const clients = await getClients();
  return NextResponse.json(clients);
}
