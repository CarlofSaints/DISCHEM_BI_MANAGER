-- Run this in your Supabase project: SQL Editor → New query → paste → Run

create table if not exists dchem_kv (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Disable RLS (service role key bypasses it anyway, but explicit is cleaner)
alter table dchem_kv disable row level security;
