'use client';

import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Users, TrendingUp, DollarSign } from 'lucide-react';
import {
  getPlanStats,
  listUsers,
  updateUserPlan,
  type AdminUser,
  type PlanStats,
} from '@/lib/admin-api';

type Tab = 'pro' | 'free';

export default function AdminPlansPage() {
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [tab, setTab] = useState<Tab>('pro');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([
        getPlanStats(),
        listUsers(1, 50, tab),
      ]);
      setStats(s);
      setUsers(u.items);
      setTotal(u.total);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const switchPlan = async (id: string, plan: 'free' | 'pro') => {
    await updateUserPlan(id, plan);
    load();
  };

  if (loading && !stats) {
    return <p className="text-gray-500 text-sm">Loading billing stats...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-purple-500 mb-1">
          Billing
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">Plans & Payments</h1>
        <p className="text-sm text-gray-500 mt-1">
          See who pays (Pro) and who is on the free plan
        </p>
      </div>

      {/* Summary cards */}
      {stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-purple-100 p-5">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CreditCard size={18} />
              <span className="text-xs font-semibold uppercase">Paying (Pro)</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.proUsers}</p>
            <p className="text-xs text-gray-500 mt-1">Active paid subscribers</p>
          </div>

          <div className="bg-white rounded-xl border border-purple-100 p-5">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Users size={18} />
              <span className="text-xs font-semibold uppercase">Free</span>
            </div>
            <p className="text-3xl font-bold text-gray-700">{stats.freeUsers}</p>
            <p className="text-xs text-gray-500 mt-1">Not paying yet</p>
          </div>

          <div className="bg-white rounded-xl border border-purple-100 p-5">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <TrendingUp size={18} />
              <span className="text-xs font-semibold uppercase">Conversion</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats.conversionRate}%</p>
            <p className="text-xs text-gray-500 mt-1">Free → Pro rate</p>
          </div>

          <div className="bg-white rounded-xl border border-purple-100 p-5">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <DollarSign size={18} />
              <span className="text-xs font-semibold uppercase">Est. MRR</span>
            </div>
            <p className="text-3xl font-bold text-amber-600">
              ${stats.estimatedMrr.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Pro × $9.99/mo (estimate)</p>
          </div>
        </div>
      )}

      {/* Visual bar */}
      {stats && stats.totalUsers > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">User split</p>
          <div className="h-4 rounded-full overflow-hidden flex bg-gray-100">
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${(stats.proUsers / stats.totalUsers) * 100}%` }}
              title={`Pro: ${stats.proUsers}`}
            />
            <div
              className="bg-gray-300 transition-all"
              style={{ width: `${(stats.freeUsers / stats.totalUsers) * 100}%` }}
              title={`Free: ${stats.freeUsers}`}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span className="text-green-600">Pro {stats.proUsers}</span>
            <span>Free {stats.freeUsers}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('pro')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === 'pro'
                ? 'bg-green-600 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            Paying — Pro ({stats?.proUsers ?? 0})
          </button>
          <button
            onClick={() => setTab('free')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === 'free'
                ? 'bg-gray-700 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            Not paying — Free ({stats?.freeUsers ?? 0})
          </button>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-purple-50">
              <tr>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Plan</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No {tab === 'pro' ? 'paying' : 'free'} users yet
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          u.plan === 'pro'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {u.plan === 'pro' ? 'Pro — Paying' : 'Free'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={u.isBlocked ? 'text-red-600' : 'text-green-600'}>
                        {u.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.plan === 'pro' ? (
                        <button
                          onClick={() => switchPlan(u.id, 'free')}
                          className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                        >
                          Downgrade to Free
                        </button>
                      ) : (
                        <button
                          onClick={() => switchPlan(u.id, 'pro')}
                          className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:opacity-90"
                        >
                          Upgrade to Pro
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {total > users.length && (
            <p className="text-xs text-gray-400 px-4 py-2 border-t">
              Showing {users.length} of {total} — use Users page for full list
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Note: Stripe checkout is not fully wired yet. Plan changes here are manual until real payments are connected.
      </p>
    </div>
  );
}
