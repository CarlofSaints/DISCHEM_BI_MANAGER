'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect } from 'react';

type AuthUser = { name: string; email: string; role: 'admin' | 'user' } | null;

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/clients', label: 'Clients' },
  { href: '/bot-setup', label: 'Bot Setup' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d ? { name: d.name, email: d.email, role: d.role } : null))
      .catch(() => {});
  }, [pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  // Don't render header on login/change-password pages
  if (pathname === '/login' || pathname === '/change-password') return null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: OJ Logo */}
        <div className="flex items-center gap-4">
          <Image src="/oj-logo.jpg" alt="OuterJoin" width={140} height={36} className="h-9 w-auto object-contain" priority />
          <div className="hidden sm:block w-px h-8 bg-gray-200" />
          <span className="hidden sm:block text-sm font-semibold text-slate-600 tracking-wide">
            Dis-Chem BI Manager
          </span>
        </div>

        {/* Centre: Nav */}
        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#F97316] text-white'
                    : 'text-slate-600 hover:bg-orange-50 hover:text-[#F97316]'
                }`}
              >
                {label}
              </Link>
            );
          })}
          {user?.role === 'admin' && (
            <Link
              href="/admin/users"
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                pathname.startsWith('/admin')
                  ? 'bg-[#F97316] text-white'
                  : 'text-slate-600 hover:bg-orange-50 hover:text-[#F97316]'
              }`}
            >
              Users
            </Link>
          )}
        </nav>

        {/* Right: User info + logout */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-slate-600 hover:bg-gray-100 transition-colors"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#F97316]/10 text-[#F97316] text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="hidden sm:block max-w-[140px] truncate">{user.name}</span>
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-100 z-50 py-1">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-slate-700 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block ${
                      user.role === 'admin' ? 'bg-[#F97316]/10 text-[#F97316]' : 'bg-gray-100 text-gray-600'
                    }`}>{user.role}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
