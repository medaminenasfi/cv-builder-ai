'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Shield } from 'lucide-react';
import { PasswordInput } from '@/components/ui/password-input';
import { useAuth } from '@/providers/AuthProvider';
import { ApiError } from '@/lib/api';

export default function AdminLoginPage() {
  const { loginAsAdmin, hasAdminSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await loginAsAdmin({ email, password });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to sign in. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white mb-3">
              <Shield size={24} />
            </div>
            <p className="text-xs text-purple-400 uppercase tracking-widest">Admin Portal</p>
            <h1 className="text-lg font-semibold text-white mt-1">ResumeAI Admin</h1>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Separate session from user login — both can stay open
            </p>
            {hasAdminSession && (
              <Link href="/admin" className="text-xs text-green-400 mt-2 hover:underline">
                Already signed in → Open admin panel
              </Link>
            )}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  placeholder="admin@resumeai.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                Password
              </label>
              <PasswordInput
                  variant="dark"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in to Admin'}
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-slate-800">
            <Link href="/login" className="text-xs text-slate-400 hover:text-purple-400">
              ← User login (separate session)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
