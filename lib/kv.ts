import type { Client, RunLog } from './types';

const MAX_LOGS = 500;

// ── Storage backend ────────────────────────────────────────────────────────────
// Vercel KV when KV_REST_API_URL is set (production + preview).
// Falls back to a local JSON file at data/db.json for local dev.

async function kvGet<T>(key: string): Promise<T | null> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv');
    return kv.get<T>(key);
  }
  return localGet<T>(key);
}

async function kvSet(key: string, value: unknown): Promise<void> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv');
    await kv.set(key, value);
    return;
  }
  localSet(key, value);
}

// ── Local JSON fallback ────────────────────────────────────────────────────────
function localDbPath() {
  const path = require('path') as typeof import('path');
  return path.join(process.cwd(), 'data', 'db.json');
}

function readLocalDb(): Record<string, unknown> {
  const fs = require('fs') as typeof import('fs');
  const p = localDbPath();
  try {
    if (!fs.existsSync(p)) return {};
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return {};
  }
}

function writeLocalDb(db: Record<string, unknown>) {
  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');
  const p = localDbPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(db, null, 2));
}

function localGet<T>(key: string): T | null {
  const db = readLocalDb();
  return (db[key] ?? null) as T | null;
}

function localSet(key: string, value: unknown) {
  const db = readLocalDb();
  db[key] = value;
  writeLocalDb(db);
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function getClients(): Promise<Client[]> {
  return (await kvGet<Client[]>('dchem:clients')) ?? [];
}

export async function saveClients(clients: Client[]): Promise<void> {
  await kvSet('dchem:clients', clients);
}

export async function getClient(id: string): Promise<Client | null> {
  const clients = await getClients();
  return clients.find((c) => c.id === id) ?? null;
}

export async function getLogs(limit = 100): Promise<RunLog[]> {
  const all = (await kvGet<RunLog[]>('dchem:logs')) ?? [];
  return all.slice(0, limit);
}

export async function addLog(log: RunLog): Promise<void> {
  const all = (await kvGet<RunLog[]>('dchem:logs')) ?? [];
  all.unshift(log);
  if (all.length > MAX_LOGS) all.splice(MAX_LOGS);
  await kvSet('dchem:logs', all);
}

export async function getPendingTriggers(): Promise<string[]> {
  return (await kvGet<string[]>('dchem:triggers')) ?? [];
}

export async function addTrigger(clientId: string): Promise<void> {
  const triggers = await getPendingTriggers();
  if (!triggers.includes(clientId)) {
    triggers.push(clientId);
    await kvSet('dchem:triggers', triggers);
  }
}

export async function removeTrigger(clientId: string): Promise<void> {
  const triggers = await getPendingTriggers();
  await kvSet('dchem:triggers', triggers.filter((id) => id !== clientId));
}
