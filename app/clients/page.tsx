'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Client } from '@/lib/types';

function fmtSchedules(c: Client) {
  if (!c.schedules.length) return 'Manual only';
  return c.schedules
    .map((s) => `${s.label || s.frequency} @ ${s.time}`)
    .join(', ');
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const load = useCallback(async () => {
    const r = await fetch('/api/clients');
    setClients(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function runNow(c: Client) {
    setRunningId(c.id);
    try {
      await fetch('/api/triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: c.id }),
      });
      showToast(`✓ "${c.name}" queued — bot will pick up within 30s`);
    } catch {
      showToast('Failed to queue run');
    } finally {
      setRunningId(null);
    }
  }

  async function deleteClient(c: Client) {
    if (!confirm(`Delete client "${c.name}"? This cannot be undone.`)) return;
    setDeletingId(c.id);
    await fetch(`/api/clients/${c.id}`, { method: 'DELETE' });
    await load();
    setDeletingId(null);
    showToast(`"${c.name}" deleted`);
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Clients</h1>
        <Link href="/clients/new"
          className="px-4 py-2 bg-[#F97316] hover:bg-[#EA6A0A] text-white text-sm font-semibold rounded-lg transition-colors">
          + Add Client
        </Link>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg transition-opacity">
          {toast}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center text-slate-400 text-sm">Loading…</div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center">
          <p className="text-slate-400 text-sm mb-4">No clients yet.</p>
          <Link href="/clients/new"
            className="px-4 py-2 bg-[#F97316] text-white text-sm font-semibold rounded-lg">
            Add your first client
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-6 py-3 font-medium">Client</th>
                <th className="text-left px-6 py-3 font-medium">Type</th>
                <th className="text-left px-6 py-3 font-medium">Schedules</th>
                <th className="text-left px-6 py-3 font-medium">Validation</th>
                <th className="text-right px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.username}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-[#F97316] font-medium">
                      {c.reportType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs max-w-xs">{fmtSchedules(c)}</td>
                  <td className="px-6 py-4">
                    {c.validation?.enabled ? (
                      <span className="text-xs text-green-600 font-medium">✓ On</span>
                    ) : (
                      <span className="text-xs text-slate-300">Off</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => runNow(c)}
                        disabled={runningId === c.id}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-40"
                      >
                        {runningId === c.id ? 'Queuing…' : '▶ Run Now'}
                      </button>
                      <Link href={`/clients/${c.id}`}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-slate-600 hover:bg-gray-200 transition-colors">
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteClient(c)}
                        disabled={deletingId === c.id}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bot connection hint */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Bot connection:</strong> The local bot polls this app every 30s for config and manual triggers.
        Set <code className="bg-amber-100 px-1 rounded text-xs">DCHEM_API_URL</code> in the bot&apos;s{' '}
        <code className="bg-amber-100 px-1 rounded text-xs">.env</code> file to point here.
      </div>
    </div>
  );
}
