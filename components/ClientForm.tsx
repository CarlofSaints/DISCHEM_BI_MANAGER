'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Client, Schedule, Frequency, Channel } from '@/lib/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CHANNELS: { value: Channel; label: string; disabled?: boolean }[] = [
  { value: 'dischem', label: 'Dis-Chem' },
  { value: 'clicks', label: 'Clicks (coming soon)', disabled: true },
  { value: 'pnp', label: 'Pick n Pay (coming soon)', disabled: true },
];

function emptySchedule(): Schedule {
  return {
    id: crypto.randomUUID().slice(0, 8),
    label: '',
    frequency: 'daily',
    time: '06:00',
    days: [1, 2, 3, 4, 5],
    dayOfMonth: 1,
  };
}

function defaultForm(client?: Client) {
  return {
    name: client?.name ?? '',
    username: client?.username ?? '',
    password: client?.password ?? '',
    reportType: client?.reportType ?? 'SALES' as const,
    channel: client?.channel ?? 'dischem' as Channel,
    bookmarkName: client?.bookmarkName ?? '',
    downloadDir: client?.downloadDir ?? '',
    schedules: client?.schedules ?? [emptySchedule()],
    validationEnabled: client?.validation?.enabled ?? false,
    retryWaitMinutes: client?.validation?.retryWaitMinutes ?? 30,
    maxRetries: client?.validation?.maxRetries ?? 3,
    expectedFileSizeKb: client?.expectedFileSizeKb ?? 0,
    fileSizeTolerancePct: client?.fileSizeTolerancePct ?? 20,
    notifyEmail: client?.notifyEmail ?? '',
  };
}

export default function ClientForm({ client }: { client?: Client }) {
  const router = useRouter();
  const isEdit = !!client;
  const [form, setForm] = useState(defaultForm(client));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function setField<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function addSchedule() {
    setField('schedules', [...form.schedules, emptySchedule()]);
  }

  function removeSchedule(id: string) {
    setField('schedules', form.schedules.filter((s) => s.id !== id));
  }

  function updateSchedule(id: string, patch: Partial<Schedule>) {
    setField('schedules', form.schedules.map((s) => s.id === id ? { ...s, ...patch } : s));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        validation: {
          enabled: form.validationEnabled,
          retryWaitMinutes: form.retryWaitMinutes,
          maxRetries: form.maxRetries,
        },
      };
      const url = isEdit ? `/api/clients/${client!.id}` : '/api/clients';
      const method = isEdit ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (r.status === 401) { router.push('/login'); return; }
      if (!r.ok) throw new Error(await r.text());
      router.push('/clients');
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  // Preview of file name
  const previewName = form.name
    ? `${form.name.toUpperCase()} ${form.channel.toUpperCase()} ${form.reportType} YYYY-MM-DD.xlsx`
    : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* ── Basic Info ── */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide border-l-4 border-[#F97316] pl-3">
          Basic Info
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Client Name</span>
            <input required value={form.name} onChange={(e) => setField('name', e.target.value)}
              className="input" placeholder="e.g. Vital" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Report Type</span>
            <select value={form.reportType} onChange={(e) => setField('reportType', e.target.value as 'SALES' | 'STOCK')}
              className="input">
              <option value="SALES">SALES</option>
              <option value="STOCK">STOCK</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Channel</span>
            <select value={form.channel} onChange={(e) => setField('channel', e.target.value as Channel)}
              className="input">
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value} disabled={c.disabled}>{c.label}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Bookmark Name</span>
            <input required value={form.bookmarkName} onChange={(e) => setField('bookmarkName', e.target.value)}
              className="input" placeholder="e.g. VITAL BOT" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Dis-Chem Username</span>
            <input required value={form.username} onChange={(e) => setField('username', e.target.value)}
              className="input" placeholder="Dis-Chem login username" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Dis-Chem Password</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                className="input pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs select-none"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Export Save Path (folder on the bot machine)</span>
            <input required value={form.downloadDir} onChange={(e) => setField('downloadDir', e.target.value)}
              className="input" placeholder="C:\Reports\Vital" />
            <span className="text-[11px] text-slate-400">Files will be saved as: {previewName || 'CLIENT CHANNEL SALES YYYY-MM-DD.xlsx'}</span>
          </label>
        </div>
      </section>

      {/* ── Schedules ── */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide border-l-4 border-[#F97316] pl-3">
            Schedules
          </h2>
          <button type="button" onClick={addSchedule}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#F97316] text-[#F97316] hover:bg-orange-50 font-medium">
            + Add Schedule
          </button>
        </div>

        {form.schedules.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">No schedules yet — bot will only respond to manual triggers.</p>
        )}

        {form.schedules.map((s) => (
          <div key={s.id} className="border border-gray-100 rounded-lg p-4 space-y-3 relative">
            <button type="button" onClick={() => removeSchedule(s.id)}
              className="absolute top-3 right-3 text-gray-300 hover:text-red-400 text-lg leading-none">×</button>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-600">Label</span>
                <input value={s.label} onChange={(e) => updateSchedule(s.id, { label: e.target.value })}
                  className="input text-sm" placeholder="e.g. Morning" />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-600">Frequency</span>
                <select value={s.frequency} onChange={(e) => updateSchedule(s.id, { frequency: e.target.value as Frequency })}
                  className="input text-sm">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-600">Time (24h, Johannesburg)</span>
                <input type="time" value={s.time} onChange={(e) => updateSchedule(s.id, { time: e.target.value })}
                  className="input text-sm" />
              </label>

              {s.frequency === 'monthly' && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-600">Day of Month</span>
                  <input type="number" min={1} max={28} value={s.dayOfMonth ?? 1}
                    onChange={(e) => updateSchedule(s.id, { dayOfMonth: Number(e.target.value) })}
                    className="input text-sm" />
                </label>
              )}
            </div>

            {s.frequency === 'weekly' && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-600">Days</span>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((d, i) => {
                    const checked = (s.days ?? []).includes(i);
                    return (
                      <label key={d} className="flex items-center gap-1 cursor-pointer text-sm">
                        <input type="checkbox" checked={checked}
                          onChange={() => {
                            const days = checked
                              ? (s.days ?? []).filter((x) => x !== i)
                              : [...(s.days ?? []), i];
                            updateSchedule(s.id, { days });
                          }}
                          className="accent-[#F97316]" />
                        {d}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* ── Data Validation ── */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide border-l-4 border-[#F97316] pl-3">
          Data Validation
        </h2>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.validationEnabled}
            onChange={(e) => setField('validationEnabled', e.target.checked)}
            className="w-4 h-4 accent-[#F97316]" />
          <span className="text-sm text-slate-700">Enable date validation (check Excel data is from yesterday)</span>
        </label>

        {form.validationEnabled && (
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">Retry wait (minutes)</span>
              <input type="number" min={5} max={240} value={form.retryWaitMinutes}
                onChange={(e) => setField('retryWaitMinutes', Number(e.target.value))}
                className="input" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">Max retries</span>
              <input type="number" min={1} max={10} value={form.maxRetries}
                onChange={(e) => setField('maxRetries', Number(e.target.value))}
                className="input" />
            </label>
          </div>
        )}
      </section>

      {/* ── File Size Alert ── */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide border-l-4 border-[#F97316] pl-3">
          File Size Alert
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Expected file size (KB)</span>
            <input type="number" min={0} value={form.expectedFileSizeKb}
              onChange={(e) => setField('expectedFileSizeKb', Number(e.target.value))}
              className="input" placeholder="e.g. 5000" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Tolerance (%)</span>
            <input type="number" min={0} max={100} value={form.fileSizeTolerancePct}
              onChange={(e) => setField('fileSizeTolerancePct', Number(e.target.value))}
              className="input" placeholder="20" />
          </label>

          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Alert email (CAM notified on anomalies)</span>
            <input type="email" value={form.notifyEmail}
              onChange={(e) => setField('notifyEmail', e.target.value)}
              className="input" placeholder="cam@outerjoin.co.za" />
          </label>
        </div>
      </section>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="px-6 py-2 bg-[#F97316] hover:bg-[#EA6A0A] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Client'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2 border border-gray-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
