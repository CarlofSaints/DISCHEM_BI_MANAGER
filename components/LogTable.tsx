'use client';
import { useState, useEffect, useCallback } from 'react';
import type { AnyLog } from '@/lib/types';
import StatusBadge from './StatusBadge';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function fmtKb(kb?: number) {
  if (!kb) return '—';
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
}

const EVENT_ACTION_LABELS: Record<string, string> = {
  create_client: 'Client Added',
  update_client: 'Client Updated',
  delete_client: 'Client Deleted',
  create_user: 'User Added',
  update_user: 'User Updated',
  delete_user: 'User Deleted',
};

export default function LogTable({ initialLogs }: { initialLogs: AnyLog[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/logs?limit=100');
      setLogs(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Recent Activity</h2>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-xs text-[#F97316] hover:underline disabled:opacity-40"
        >
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">No activity yet. Start the bot to see runs here.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left pb-2 pr-4 font-medium">Time</th>
                <th className="text-left pb-2 pr-4 font-medium">Client / Target</th>
                <th className="text-left pb-2 pr-4 font-medium">Type</th>
                <th className="text-left pb-2 pr-4 font-medium">Trigger / Actor</th>
                <th className="text-left pb-2 pr-4 font-medium">Status</th>
                <th className="text-left pb-2 pr-4 font-medium">File Size</th>
                <th className="text-left pb-2 pr-4 font-medium">Data Date</th>
                <th className="text-left pb-2 font-medium">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => {
                const isEvent = log.logType === 'event';

                if (isEvent) {
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 pr-4 whitespace-nowrap text-slate-500 text-xs">{fmtDate(log.timestamp)}</td>
                      <td className="py-2.5 pr-4 font-medium text-slate-800">{log.target}</td>
                      <td className="py-2.5 pr-4">
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-blue-50 text-blue-700">
                          {EVENT_ACTION_LABELS[log.action] ?? log.action}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-600 truncate max-w-[120px] block">
                          {log.actor}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-500">user event</span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-400 text-xs">—</td>
                      <td className="py-2.5 pr-4 text-slate-400 text-xs">—</td>
                      <td className="py-2.5 text-slate-500 text-xs max-w-xs truncate" title={log.message}>{log.message}</td>
                    </tr>
                  );
                }

                // Run log
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 pr-4 whitespace-nowrap text-slate-500 text-xs">{fmtDate(log.timestamp)}</td>
                    <td className="py-2.5 pr-4 font-medium text-slate-800">{log.clientName}</td>
                    <td className="py-2.5 pr-4">
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-orange-50 text-orange-600">bot run</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        log.trigger === 'manual' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {log.trigger}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4"><StatusBadge status={log.status} /></td>
                    <td className="py-2.5 pr-4 text-slate-500 text-xs">{fmtKb(log.fileSizeKb)}</td>
                    <td className="py-2.5 pr-4 text-slate-500 text-xs">{log.latestDataDate ?? '—'}</td>
                    <td className="py-2.5 text-slate-500 text-xs max-w-xs truncate" title={log.message}>{log.message}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
