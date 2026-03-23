import type { Client, RunLog, AnyLog, AppUser } from './types';

// Env vars are capped to avoid hitting Vercel's 64KB limit.
// Sessions are stateless (encoded in the cookie itself) — no server-side storage needed.
const MAX_LOGS = 150;

// ── Vercel env var updater ─────────────────────────────────────────────────────
// Requires VERCEL_TOKEN in env. VERCEL_PROJECT_ID + VERCEL_TEAM_ID are
// automatically injected by Vercel at runtime.

async function updateVercelEnv(key: string, value: string): Promise<void> {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    console.warn(`[kv] VERCEL_TOKEN or VERCEL_PROJECT_ID missing — cannot persist ${key}`);
    return;
  }

  const teamId = process.env.VERCEL_TEAM_ID ?? '';
  const qs = teamId ? `?teamId=${teamId}` : '';
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Find existing env var ID
  const listRes = await fetch(
    `https://api.vercel.com/v10/projects/${projectId}/env${qs}`,
    { headers }
  );
  const listData = await listRes.json() as { envs?: { id: string; key: string }[] };
  const existing = listData.envs?.find((e) => e.key === key);

  if (existing) {
    // Update
    await fetch(
      `https://api.vercel.com/v10/projects/${projectId}/env/${existing.id}${qs}`,
      { method: 'PATCH', headers, body: JSON.stringify({ value }) }
    );
  } else {
    // Create
    await fetch(
      `https://api.vercel.com/v10/projects/${projectId}/env${qs}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          key,
          value,
          type: 'plain',
          target: ['production', 'preview', 'development'],
        }),
      }
    );
  }
}

// ── Storage helpers ────────────────────────────────────────────────────────────

// On Vercel, process.env is set at cold-start and doesn't update when we write
// via the API. So reads must also go through the Vercel API to get the live value.
async function envRead<T>(envKey: string, fallback: T): Promise<T> {
  if (!process.env.VERCEL) {
    const raw = process.env[envKey];
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  }

  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    const raw = process.env[envKey];
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  }

  const teamId = process.env.VERCEL_TEAM_ID ?? '';
  const qs = teamId ? `?teamId=${teamId}` : '';
  try {
    const res = await fetch(
      `https://api.vercel.com/v10/projects/${projectId}/env${qs}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json() as { envs?: { key: string; value?: string }[] };
    const found = data.envs?.find((e) => e.key === envKey);
    if (!found?.value) return fallback;
    return JSON.parse(found.value) as T;
  } catch {
    const raw = process.env[envKey];
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  }
}

async function envWrite(envKey: string, value: unknown): Promise<void> {
  if (process.env.VERCEL) {
    await updateVercelEnv(envKey, JSON.stringify(value));
  } else {
    localSet(envKey, value);
  }
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
  if (process.env.VERCEL) return await envRead<Client[]>('DCHEM_CLIENTS_JSON', []);
  return localGet<Client[]>('dchem:clients', []);
}

export async function saveClients(clients: Client[]): Promise<void> {
  await envWrite('DCHEM_CLIENTS_JSON', clients);
}

export async function getClient(id: string): Promise<Client | null> {
  const clients = await getClients();
  return clients.find((c) => c.id === id) ?? null;
}

// ── Logs ───────────────────────────────────────────────────────────────────────

export async function getLogs(limit = 100): Promise<AnyLog[]> {
  const all = process.env.VERCEL
    ? await envRead<AnyLog[]>('DCHEM_LOGS_JSON', [])
    : localGet<AnyLog[]>('dchem:logs', []);
  return all.slice(0, limit);
}

export async function addLog(log: RunLog): Promise<void> {
  const all = process.env.VERCEL
    ? await envRead<AnyLog[]>('DCHEM_LOGS_JSON', [])
    : localGet<AnyLog[]>('dchem:logs', []);
  const entry: RunLog = { ...log, logType: 'run' };
  all.unshift(entry);
  if (all.length > MAX_LOGS) all.splice(MAX_LOGS);
  await envWrite('DCHEM_LOGS_JSON', all);
}

export async function addEventLog(event: import('./types').UserEventLog): Promise<void> {
  const all = process.env.VERCEL
    ? await envRead<AnyLog[]>('DCHEM_LOGS_JSON', [])
    : localGet<AnyLog[]>('dchem:logs', []);
  all.unshift(event);
  if (all.length > MAX_LOGS) all.splice(MAX_LOGS);
  await envWrite('DCHEM_LOGS_JSON', all);
}

// ── Triggers ───────────────────────────────────────────────────────────────────

export async function getPendingTriggers(): Promise<string[]> {
  if (process.env.VERCEL) return await envRead<string[]>('DCHEM_TRIGGERS_JSON', []);
  return localGet<string[]>('dchem:triggers', []);
}

export async function addTrigger(clientId: string): Promise<void> {
  const triggers = await getPendingTriggers();
  if (!triggers.includes(clientId)) {
    triggers.push(clientId);
    await envWrite('DCHEM_TRIGGERS_JSON', triggers);
  }
}

export async function removeTrigger(clientId: string): Promise<void> {
  const triggers = await getPendingTriggers();
  await envWrite('DCHEM_TRIGGERS_JSON', triggers.filter((id) => id !== clientId));
}

// ── Users ──────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<AppUser[]> {
  const users = process.env.VERCEL
    ? await envRead<AppUser[]>('DCHEM_USERS_JSON', [])
    : localGet<AppUser[]>('dchem:users', []);

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
  await envWrite('DCHEM_USERS_JSON', users);
}

export async function getUser(id: string): Promise<AppUser | null> {
  const users = await getUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const users = await getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}
