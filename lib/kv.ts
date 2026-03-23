import type { Client, RunLog, AnyLog, AppUser, SessionData } from './types';

const MAX_LOGS = 500;

// ── Storage backend ────────────────────────────────────────────────────────────
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

// ── Clients ────────────────────────────────────────────────────────────────────

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

// ── Logs (unified run + user event) ───────────────────────────────────────────

export async function getLogs(limit = 100): Promise<AnyLog[]> {
  const all = (await kvGet<AnyLog[]>('dchem:logs')) ?? [];
  return all.slice(0, limit);
}

export async function addLog(log: RunLog): Promise<void> {
  const entry: RunLog = { ...log, logType: 'run' };
  const all = (await kvGet<AnyLog[]>('dchem:logs')) ?? [];
  all.unshift(entry);
  if (all.length > MAX_LOGS) all.splice(MAX_LOGS);
  await kvSet('dchem:logs', all);
}

export async function addEventLog(event: import('./types').UserEventLog): Promise<void> {
  const all = (await kvGet<AnyLog[]>('dchem:logs')) ?? [];
  all.unshift(event);
  if (all.length > MAX_LOGS) all.splice(MAX_LOGS);
  await kvSet('dchem:logs', all);
}

// ── Triggers ───────────────────────────────────────────────────────────────────

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

// ── Users ──────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<AppUser[]> {
  const users = (await kvGet<AppUser[]>('dchem:users')) ?? [];
  if (users.length === 0) {
    // Seed default admin on first run
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

// ── Sessions ───────────────────────────────────────────────────────────────────

type SessionMap = Record<string, SessionData>;

async function getSessions(): Promise<SessionMap> {
  return (await kvGet<SessionMap>('dchem:sessions')) ?? {};
}

async function saveSessions(sessions: SessionMap): Promise<void> {
  await kvSet('dchem:sessions', sessions);
}

export async function setSession(token: string, data: SessionData): Promise<void> {
  const sessions = await getSessions();
  // Prune expired sessions while we're here
  const now = Date.now();
  for (const [k, v] of Object.entries(sessions)) {
    if (new Date(v.expiresAt).getTime() < now) delete sessions[k];
  }
  sessions[token] = data;
  await saveSessions(sessions);
}

export async function getSession(token: string): Promise<SessionData | null> {
  const sessions = await getSessions();
  const session = sessions[token];
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    // Expired
    delete sessions[token];
    await saveSessions(sessions);
    return null;
  }
  return session;
}

export async function deleteSession(token: string): Promise<void> {
  const sessions = await getSessions();
  delete sessions[token];
  await saveSessions(sessions);
}
