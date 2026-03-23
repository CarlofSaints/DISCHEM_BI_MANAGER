import type { Client, RunLog, AnyLog, AppUser } from './types';

const MAX_LOGS = 150;

// ── Supabase client ────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  // Dynamic import so Next.js doesn't complain at build time when env vars aren't present
  const { createClient } = require('@supabase/supabase-js');
  return createClient(url, key);
}

// ── Read / write helpers ───────────────────────────────────────────────────────

async function kvGet<T>(key: string, fallback: T): Promise<T> {
  if (!process.env.SUPABASE_URL) return localGet<T>(key, fallback);
  const sb = getSupabase();
  const { data, error } = await sb
    .from('dchem_kv')
    .select('value')
    .eq('key', key)
    .single();
  if (error || !data) return fallback;
  return data.value as T;
}

async function kvSet(key: string, value: unknown): Promise<void> {
  if (!process.env.SUPABASE_URL) { localSet(key, value); return; }
  const sb = getSupabase();
  await sb
    .from('dchem_kv')
    .upsert({ key, value, updated_at: new Date().toISOString() });
}

// ── Local JSON fallback (dev only) ────────────────────────────────────────────

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

function localGet<T>(key: string, fallback: T): T {
  const db = readLocalDb();
  return (db[key] ?? fallback) as T;
}

function localSet(key: string, value: unknown) {
  const db = readLocalDb();
  db[key] = value;
  writeLocalDb(db);
}

// ── Clients ────────────────────────────────────────────────────────────────────

export async function getClients(): Promise<Client[]> {
  return kvGet<Client[]>('dchem:clients', []);
}

export async function saveClients(clients: Client[]): Promise<void> {
  await kvSet('dchem:clients', clients);
}

export async function getClient(id: string): Promise<Client | null> {
  const clients = await getClients();
  return clients.find((c) => c.id === id) ?? null;
}

// ── Logs ───────────────────────────────────────────────────────────────────────

export async function getLogs(limit = 100): Promise<AnyLog[]> {
  const all = await kvGet<AnyLog[]>('dchem:logs', []);
  return all.slice(0, limit);
}

export async function addLog(log: RunLog): Promise<void> {
  const all = await kvGet<AnyLog[]>('dchem:logs', []);
  const entry: RunLog = { ...log, logType: 'run' };
  all.unshift(entry);
  if (all.length > MAX_LOGS) all.splice(MAX_LOGS);
  await kvSet('dchem:logs', all);
}

export async function addEventLog(event: import('./types').UserEventLog): Promise<void> {
  const all = await kvGet<AnyLog[]>('dchem:logs', []);
  all.unshift(event);
  if (all.length > MAX_LOGS) all.splice(MAX_LOGS);
  await kvSet('dchem:logs', all);
}

// ── Triggers ───────────────────────────────────────────────────────────────────

export async function getPendingTriggers(): Promise<string[]> {
  return kvGet<string[]>('dchem:triggers', []);
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

// ── Users ──────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<AppUser[]> {
  const users = await kvGet<AppUser[]>('dchem:users', []);

  if (users.length === 0) {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash('Admin2026', 10);
    const admin: AppUser = {
      id: 'admin-0001',
      name: 'Carl dos Santos',
      email: 'carl@outerjoin.co.za',
      passwordHash: hash,
      role: 'admin',
      forcePasswordChange: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      firstLoginAt: null,
    };
    await saveUsers([admin]);
    return [admin];
  }
  return users;
}

export async function saveUsers(users: AppUser[]): Promise<void> {
  await kvSet('dchem:users', users);
}

export async function getUser(id: string): Promise<AppUser | null> {
  const users = await getUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const users = await getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}
