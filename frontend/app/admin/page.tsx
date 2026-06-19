'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  FileText,
  Palette,
  Shield,
  ArrowRight,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { getStats, listUsers, type AdminStats, type AdminUser } from '@/lib/admin-api';

const STAT_ICONS = {
  users: Users,
  admins: Shield,
  cvs: FileText,
  templates: Palette,
} as const;

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getStats(), listUsers(1, 5)])
      .then(([s, u]) => {
        setStats(s);
        setRecentUsers(u.items);
      })
      .catch((e) => setError(e?.message ?? 'Failed to load admin data'))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { key: 'users', label: 'Total Users', value: stats.totalUsers, href: '/admin/users' },
        { key: 'admins', label: 'Admins', value: stats.totalAdmins, href: '/admin/users' },
        { key: 'cvs', label: 'CVs Created', value: stats.totalCvs, href: '/admin/stats' },
        { key: 'templates', label: 'Active Templates', value: stats.activeTemplates, href: '/admin/templates' },
      ]
    : [];

  const quickLinks = [
    {
      href: '/admin/templates',
      title: 'Manage Templates',
      desc: 'Create, edit, activate or deactivate CV templates',
      icon: Palette,
    },
    {
      href: '/admin/users',
      title: 'Manage Users',
      desc: 'Change plans, roles, block or unblock accounts',
      icon: Users,
    },
    {
      href: '/admin/stats',
      title: 'Platform Stats',
      desc: 'Full metrics overview and last update time',
      icon: BarChart3,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-gray-500 text-sm">Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">
        {error} — make sure you are logged in as admin.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-500 mb-1">
            Admin Panel
          </p>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, <span className="font-medium text-gray-700">{user?.email}</span>
          </p>
        </div>
        <a
          href="http://localhost:3002/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-100 rounded-lg text-sm text-purple-700 hover:border-purple-300"
        >
          <ExternalLink size={16} />
          Swagger API
        </a>
      </div>

      {/* Stats cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = STAT_ICONS[c.key as keyof typeof STAT_ICONS];
          return (
            <Link
              key={c.key}
              href={c.href}
              className="bg-white rounded-xl border border-purple-100 p-5 hover:border-purple-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                  <Icon size={20} />
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-purple-400 transition-colors" />
              </div>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{c.value}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick actions + recent users */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <div className="space-y-3">
            {quickLinks.map(({ href, title, desc, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-4 bg-white rounded-xl border border-purple-100 p-4 hover:border-purple-300 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center text-purple-300 shrink-0">
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <ArrowRight size={16} className="text-gray-300 shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Recent Users</h2>
            <Link href="/admin/users" className="text-xs text-purple-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-purple-100 overflow-hidden">
            {recentUsers.length === 0 ? (
              <p className="p-6 text-sm text-gray-500 text-center">No users yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Email</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Plan</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((u) => (
                    <tr key={u.id} className="border-t border-purple-50">
                      <td className="px-4 py-2.5 truncate max-w-[180px]">{u.email}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.plan === 'pro' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Footer info */}
      {stats && (
        <p className="text-xs text-gray-400 text-center">
          Stats updated {new Date(stats.timestamp).toLocaleString()}
        </p>
      )}
    </div>
  );
}
