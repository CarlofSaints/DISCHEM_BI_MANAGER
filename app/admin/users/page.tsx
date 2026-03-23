'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  forcePasswordChange: boolean;
  createdAt: string;
  firstLoginAt: string | null;
};

function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input pr-10"
        placeholder={placeholder ?? '••••••••'}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs select-none"
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [toast, setToast] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

  // Form state
  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPassword, setFPassword] = useState('');
  const [fRole, setFRole] = useState<'admin' | 'user'>('user');
  const [fForce, setFForce] = useState(true);
  const [fSendEmail, setFSendEmail] = useState(true);
  const [fSaving, setFSaving] = useState(false);
  const [fError, setFError] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/users');
      if (r.status === 401) { router.push('/login'); return; }
      if (r.status === 403) { router.push('/'); return; }
      setUsers(await r.json());
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setCurrentUserId(d.id ?? '')).catch(() => {});
  }, [load]);

  function openAdd() {
    setFName(''); setFEmail(''); setFPassword(''); setFRole('user'); setFForce(true); setFSendEmail(true); setFError('');
    setModal('add');
  }

  function openEdit(u: UserRow) {
    setEditTarget(u);
    setFName(u.name); setFEmail(u.email); setFPassword(''); setFRole(u.role); setFForce(u.forcePasswordChange); setFSendEmail(false); setFError('');
    setModal('edit');
  }

  async function handleAdd() {
    if (!fName || !fEmail || !fPassword) { setFError('Name, email and password are required'); return; }
    setFSaving(true); setFError('');
    try {
      const r = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fName, email: fEmail, password: fPassword, role: fRole, forcePasswordChange: fForce, sendEmail: fSendEmail }),
      });
      if (!r.ok) { setFError((await r.json()).error ?? 'Save failed'); return; }
      setModal(null);
      load();
      showToast('User created');
    } finally {
      setFSaving(false);
    }
  }

  async function handleEdit() {
    if (!editTarget) return;
    setFSaving(true); setFError('');
    try {
      const body: Record<string, unknown> = { name: fName, email: fEmail, role: fRole, forcePasswordChange: fForce };
      if (fPassword) body.password = fPassword;
      const r = await fetch(`/api/users/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) { setFError((await r.json()).error ?? 'Save failed'); return; }
      setModal(null);
      load();
      showToast('User updated');
    } finally {
      setFSaving(false);
    }
  }

  async function handleDelete(u: UserRow) {
    if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    const r = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
    if (r.ok) { load(); showToast('User deleted'); }
    else showToast((await r.json()).error ?? 'Delete failed');
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage who can access the Dis-Chem BI Manager portal.</p>
        </div>
        <button onClick={openAdd}
          className="px-4 py-2 bg-[#F97316] hover:bg-[#EA6A0A] text-white text-sm font-semibold rounded-lg transition-colors">
          + Add User
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading…</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No users yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">Role</th>
                <th className="text-left p-4 font-medium">First Login</th>
                <th className="text-left p-4 font-medium">PW Change</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-slate-800">{u.name}</td>
                  <td className="p-4 text-slate-600">{u.email}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.role === 'admin' ? 'bg-[#F97316]/10 text-[#F97316]' : 'bg-gray-100 text-gray-600'
                    }`}>{u.role}</span>
                  </td>
                  <td className="p-4 text-slate-500 text-xs">{fmtDate(u.firstLoginAt)}</td>
                  <td className="p-4">
                    {u.forcePasswordChange
                      ? <span className="text-xs text-amber-600 font-medium">Pending</span>
                      : <span className="text-xs text-green-600">Done</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)}
                        className="text-xs px-3 py-1 rounded border border-gray-200 text-slate-600 hover:bg-gray-50">
                        Edit
                      </button>
                      {u.id !== currentUserId && (
                        <button onClick={() => handleDelete(u)}
                          className="text-xs px-3 py-1 rounded border border-red-100 text-red-500 hover:bg-red-50">
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {modal === 'add' && (
        <Modal title="Add User" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">Full Name</span>
              <input className="input" value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Jane Smith" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">Email</span>
              <input className="input" type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} placeholder="jane@company.co.za" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">Password</span>
              <PasswordInput value={fPassword} onChange={setFPassword} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">Role</span>
              <select className="input" value={fRole} onChange={(e) => setFRole(e.target.value as 'admin' | 'user')}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
              <input type="checkbox" className="w-4 h-4 accent-[#F97316]" checked={fForce} onChange={(e) => setFForce(e.target.checked)} />
              Force password change on first login
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
              <input type="checkbox" className="w-4 h-4 accent-[#F97316]" checked={fSendEmail} onChange={(e) => setFSendEmail(e.target.checked)} />
              Send welcome email with credentials
            </label>
            {fError && <p className="text-red-600 text-xs">{fError}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={handleAdd} disabled={fSaving}
                className="flex-1 py-2 bg-[#F97316] hover:bg-[#EA6A0A] text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                {fSaving ? 'Creating…' : 'Create User'}
              </button>
              <button onClick={() => setModal(null)}
                className="px-4 py-2 border border-gray-200 text-slate-600 text-sm rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {modal === 'edit' && editTarget && (
        <Modal title={`Edit: ${editTarget.name}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">Full Name</span>
              <input className="input" value={fName} onChange={(e) => setFName(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">Email</span>
              <input className="input" type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">New Password (leave blank to keep current)</span>
              <PasswordInput value={fPassword} onChange={setFPassword} placeholder="Leave blank to keep" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">Role</span>
              <select className="input" value={fRole} onChange={(e) => setFRole(e.target.value as 'admin' | 'user')}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
              <input type="checkbox" className="w-4 h-4 accent-[#F97316]" checked={fForce} onChange={(e) => setFForce(e.target.checked)} />
              Force password change on next login
            </label>
            {fError && <p className="text-red-600 text-xs">{fError}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={handleEdit} disabled={fSaving}
                className="flex-1 py-2 bg-[#F97316] hover:bg-[#EA6A0A] text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                {fSaving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => setModal(null)}
                className="px-4 py-2 border border-gray-200 text-slate-600 text-sm rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
