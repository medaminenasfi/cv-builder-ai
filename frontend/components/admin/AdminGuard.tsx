'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Palette,
  BarChart3,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/templates', label: 'Templates', icon: Palette },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/stats', label: 'Stats', icon: BarChart3 },
];

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading admin...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-56 bg-slate-950 text-white flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <p className="text-xs text-purple-400 uppercase tracking-widest">ResumeAI</p>
          <p className="font-semibold text-sm">Admin Panel</p>
          <p className="text-xs text-slate-400 truncate mt-1">{user.email}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                pathname === href || (href !== '/admin' && pathname.startsWith(href))
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
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
            User app
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
