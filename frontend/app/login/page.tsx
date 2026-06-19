'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { PasswordInput } from '@/components/ui/password-input'
import { useAuth } from '@/providers/AuthProvider'
import { ApiError } from '@/lib/api'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [lang, setLang] = useState('en')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login({ email, password })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Unable to sign in. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="absolute top-6 right-6 flex gap-2">
        {[
          { code: 'en', flag: '🇬🇧' },
          { code: 'fr', flag: '🇫🇷' },
          { code: 'ar', flag: '🇸🇦' },
        ].map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => setLang(item.code)}
            className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
              lang === item.code
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.flag}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-purple-100 p-8 shadow-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center text-white font-semibold text-lg mb-3">
              R
            </div>
            <h1 className="text-sm font-medium text-gray-900">ResumeAI</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2 border border-purple-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                Password
              </label>
              <PasswordInput
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
              className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="text-center mt-6 space-y-2">
            <span className="text-sm text-gray-600 block">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-purple-600 font-medium hover:text-purple-700">
                Register
              </Link>
            </span>
            <Link href="/admin/login" className="text-xs text-gray-400 hover:text-purple-600 block">
              Admin login (separate session) →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
