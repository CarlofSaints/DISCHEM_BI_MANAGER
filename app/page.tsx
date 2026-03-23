import { getLogs, getClients } from '@/lib/kv';
import LogTable from '@/components/LogTable';
import type { LogStatus, AnyLog } from '@/lib/types';

function statsFromLogs(logs: AnyLog[]) {
  // Only count bot runs in stats, not user events
  const runLogs = logs.filter((l): l is import('@/lib/types').RunLog => l.logType !== 'event');
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = runLogs.filter((l) => l.timestamp.startsWith(today));
  const successToday = todayLogs.filter((l) => l.status === 'success' || l.status === 'size_warning');
  const successRate =
    todayLogs.length === 0 ? null : Math.round((successToday.length / todayLogs.length) * 100);

  const lastRunLog = runLogs[0];
  const lastRun = lastRunLog?.timestamp
    ? (() => {
        const diff = Date.now() - new Date(lastRunLog.timestamp).getTime();
        const mins = Math.floor(diff / 60_000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ago`;
      })()
    : 'Never';

  return { todayCount: todayLogs.length, successRate, lastRun, lastRunClientName: lastRunLog?.clientName ?? '' };
}

const statusColour: Record<LogStatus, string> = {
  success: 'text-green-600',
  error: 'text-red-600',
  validation_fail: 'text-amber-600',
  retrying: 'text-blue-600',
  size_warning: 'text-purple-600',
  site_down: 'text-red-700',
};

export default async function DashboardPage() {
  const [logs, clients] = await Promise.all([getLogs(100), getClients()]);
  const { todayCount, successRate, lastRun, lastRunClientName } = statsFromLogs(logs);

  const stats = [
    { label: 'Active Clients', value: clients.length, sub: 'configured' },
    { label: 'Runs Today', value: todayCount, sub: 'this calendar day' },
    { label: 'Success Rate', value: successRate === null ? '—' : `${successRate}%`, sub: 'today' },
    { label: 'Last Run', value: lastRun, sub: lastRunClientName },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <LogTable initialLogs={logs} />
      </div>

      {/* Last status per client */}
      {clients.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Client Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clients.map((c) => {
              const lastLog = logs.find(
                (l): l is import('@/lib/types').RunLog => l.logType !== 'event' && (l as import('@/lib/types').RunLog).clientId === c.id
              );
              return (
                <div key={c.id} className="border border-gray-100 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{c.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {c.schedules.length} schedule{c.schedules.length !== 1 ? 's' : ''} · {c.reportType}
                    </p>
                  </div>
                  {lastLog ? (
                    <span className={`text-xs font-semibold ${statusColour[lastLog.status]}`}>
                      {lastLog.status === 'success' ? '✓ OK' : lastLog.status.replace('_', ' ')}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">No runs yet</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
