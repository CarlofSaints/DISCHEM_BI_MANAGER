'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/clients', label: 'Clients' },
  { href: '/bot-setup', label: 'Bot Setup' },
];

export default function Header() {
  const pathname = usePathname();

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
        </nav>

        {/* Right: ARIA logo */}
        <Image src="/aria-logo.png" alt="ARIA" width={80} height={32} className="h-8 w-auto object-contain" />
      </div>
    </header>
  );
}
