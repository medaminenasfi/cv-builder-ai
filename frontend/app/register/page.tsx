'use client'

import { useState } from 'react'
import { Mail, Lock, User } from 'lucide-react'

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [lang, setLang] = useState('en')

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

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      alert(`Registering ${formData.name} with ${formData.email}`)
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

      {/* Register Card */}
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
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name Field */}
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

            {/* Email Field */}
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

            {/* Password Field */}
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

            {/* Confirm Password Field */}
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
              {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Register Button */}
            <button
              type="submit"
              className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Create Account
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
            Sign up with Google
          </button>

          {/* Login Link */}
          <div className="text-center mt-6">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-purple-600 font-medium hover:text-purple-700">
                Sign in
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
