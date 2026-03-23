'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPw.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const r = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPw }),
      });
      if (!r.ok) { setError((await r.json()).error ?? 'Failed'); return; }
      router.push('/');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Image src="/oj-logo.jpg" alt="OuterJoin" width={120} height={32} className="h-8 w-auto object-contain" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#F97316] px-6 py-4">
            <h1 className="text-white font-bold text-lg">Change Your Password</h1>
            <p className="text-orange-100 text-xs mt-0.5">A new password is required before you can continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">New Password</span>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  autoFocus
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="input pr-12"
                  placeholder="Minimum 8 characters"
                />
                <button type="button" onClick={() => setShowNew((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs select-none">
                  {showNew ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">Confirm New Password</span>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="input pr-12"
                  placeholder="Repeat your password"
                />
                <button type="button" onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs select-none">
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {error && <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold rounded-lg text-sm disabled:opacity-50">
              {loading ? 'Saving…' : 'Set New Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
