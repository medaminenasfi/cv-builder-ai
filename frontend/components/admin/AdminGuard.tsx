'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Palette,
  BarChart3,
  CreditCard,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, match: (p: string) => p === '/admin' || p === '/admin/dashboard' },
  { href: '/admin/templates', label: 'Templates', icon: Palette, match: (p: string) => p.startsWith('/admin/templates') },
  { href: '/admin/users', label: 'Users', icon: Users, match: (p: string) => p.startsWith('/admin/users') },
  { href: '/admin/plans', label: 'Plans & Billing', icon: CreditCard, match: (p: string) => p.startsWith('/admin/plans') },
  { href: '/admin/stats', label: 'Stats', icon: BarChart3, match: (p: string) => p.startsWith('/admin/stats') },
];

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { adminUser, isLoading, logoutAdmin, hasAdminSession, refreshAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!hasAdminSession) {
      router.replace('/admin/login');
      return;
    }
    refreshAdmin();
  }, [isLoading, hasAdminSession, router, refreshAdmin]);

  if (isLoading || !hasAdminSession || !adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading admin...
      </div>
    );
  }

  if (adminUser.role !== 'admin') {
    router.replace('/admin/login');
    return null;
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-56 bg-slate-950 text-white flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <p className="text-xs text-purple-400 uppercase tracking-widest">ResumeAI</p>
          <p className="font-semibold text-sm">Admin Panel</p>
          <p className="text-xs text-slate-400 truncate mt-1">{adminUser.email}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon, match }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                match(pathname)
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link
            href="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
          >
            <ExternalLink size={16} />
            User app (new tab)
          </Link>
          <button
            type="button"
            onClick={() => logoutAdmin()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
          >
            <LogOut size={16} />
            Admin logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
