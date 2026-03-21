import type { LogStatus } from '@/lib/types';

const map: Record<LogStatus, { label: string; cls: string }> = {
  success:         { label: 'Success',         cls: 'bg-green-100 text-green-800' },
  error:           { label: 'Error',           cls: 'bg-red-100 text-red-800' },
  validation_fail: { label: 'Stale Data',      cls: 'bg-amber-100 text-amber-800' },
  retrying:        { label: 'Retrying',        cls: 'bg-blue-100 text-blue-800' },
  size_warning:    { label: 'Size Warning',    cls: 'bg-purple-100 text-purple-800' },
  site_down:       { label: 'Site Down',       cls: 'bg-red-200 text-red-900' },
};

export default function StatusBadge({ status }: { status: LogStatus }) {
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
