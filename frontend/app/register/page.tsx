'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, User } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { ApiError } from '@/lib/api'
import type { UserLocale } from '@/lib/types/auth'

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export default function RegisterPage() {
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [lang, setLang] = useState<UserLocale>('en')
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords must match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await register({
        email: formData.email,
        password: formData.password,
        locale: lang,
      })
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message)
      } else {
        setApiError('Unable to create account. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="absolute top-6 right-6 flex gap-2">
        {(
          [
            { code: 'en' as UserLocale, flag: '🇬🇧' },
            { code: 'fr' as UserLocale, flag: '🇫🇷' },
            { code: 'ar' as UserLocale, flag: '🇸🇦' },
          ] as const
        ).map((item) => (
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

          <form onSubmit={handleRegister} className="space-y-4">
            {apiError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {apiError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-purple-400 text-sm transition-colors ${
                    errors.name ? 'border-red-300 focus:ring-red-200' : 'border-purple-100 focus:ring-purple-300'
                  }`}
                  placeholder="John Doe"
                />
              </div>
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-purple-400 text-sm transition-colors ${
                    errors.email ? 'border-red-300 focus:ring-red-200' : 'border-purple-100 focus:ring-purple-300'
                  }`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-purple-400 text-sm transition-colors ${
                    errors.password ? 'border-red-300 focus:ring-red-200' : 'border-purple-100 focus:ring-purple-300'
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-purple-400 text-sm transition-colors ${
                    errors.confirmPassword ? 'border-red-300 focus:ring-red-200' : 'border-purple-100 focus:ring-purple-300'
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="text-center mt-6">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-purple-600 font-medium hover:text-purple-700">
                Sign in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
