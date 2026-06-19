'use client'

import { useState } from 'react'
import { Mail, Lock } from 'lucide-react'
import { DEMO_USER } from '@/lib/mockData'

export default function LoginPage() {
  const [email, setEmail] = useState(DEMO_USER.email)
  const [password, setPassword] = useState(DEMO_USER.password)
  const [lang, setLang] = useState('en')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    alert(`Logging in with ${email}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-6 right-6 flex gap-2">
        {[
          { code: 'en', flag: '🇬🇧' },
          { code: 'fr', flag: '🇫🇷' },
          { code: 'ar', flag: '🇸🇦' },
        ].map((item) => (
          <button
            key={item.code}
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

      {/* Login Card */}
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-purple-100 p-8 shadow-sm">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center text-white font-semibold text-lg mb-3">
              R
            </div>
            <h1 className="text-sm font-medium text-gray-900">ResumeAI</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
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
                  className="w-full pl-9 pr-4 py-2 border border-purple-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-purple-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Sign in
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-purple-100"></div>
            <span className="text-xs text-gray-500">or</span>
            <div className="flex-1 h-px bg-purple-100"></div>
          </div>

          {/* Google Button */}
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-purple-200 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-50 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="bold">
                G
              </text>
            </svg>
            Continue with Google
          </button>

          {/* Register Link */}
          <div className="text-center mt-6">
            <span className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <a href="/register" className="text-purple-600 font-medium hover:text-purple-700">
                Register
              </a>
            </span>
          </div>
        </div>

        {/* Demo Credentials Info */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Demo credentials pre-filled • Use any email/password
        </p>
      </div>
    </div>
  )
}
