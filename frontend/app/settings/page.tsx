'use client'

import { AppShell } from '@/components/layout/AppShell'
import { PLAN_FEATURES } from '@/lib/mockData'
import { useState } from 'react'
import { Mail, Lock, Globe, Zap } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'account' | 'plan' | 'language'>(
    'account'
  )
  const [formData, setFormData] = useState({
    name: 'Karim Mansouri',
    email: 'demo@resumeai.com',
  })
  const [language, setLanguage] = useState('en')
  const [region, setRegion] = useState('US')
  const currentPlan = 'free'

  const tabs = [
    { id: 'account' as const, label: 'Account' },
    { id: 'plan' as const, label: 'Plan' },
    { id: 'language' as const, label: 'Language & Region' },
  ]

  return (
    <AppShell title="Settings">
      <div className="max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-6 border-b border-purple-100 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-purple-500"></div>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="bg-white border border-purple-100 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Profile Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                  </div>
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Password Section */}
              <div className="bg-white border border-purple-100 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Change Password
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      />
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-white border border-purple-200 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-50 transition-colors">
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Plan Tab */}
          {activeTab === 'plan' && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="bg-gradient-to-r from-purple-50 to-transparent border border-purple-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Current Plan
                    </h3>
                    <p className="text-xs text-gray-600">
                      {currentPlan === 'free' ? 'Free' : 'Pro'} • Renews on{' '}
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">
                      {currentPlan === 'free' ? 'Free' : '$9.99'}
                    </p>
                    <p className="text-xs text-gray-600">/mo</p>
                  </div>
                </div>
              </div>

              {/* Usage Meters */}
              <div className="bg-white border border-purple-100 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-6">
                  Usage This Month
                </h3>
                <div className="space-y-6">
                  {/* CV Usage */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-600">Resumes Created</p>
                      <p className="text-sm font-semibold text-gray-900">
                        2 /{' '}
                        {PLAN_FEATURES[currentPlan as keyof typeof PLAN_FEATURES]
                          .resumes}
                      </p>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-purple-500"
                        style={{ width: '66%' }}
                      />
                    </div>
                  </div>

                  {/* AI Calls Usage */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-600">AI Enhancements</p>
                      <p className="text-sm font-semibold text-gray-900">
                        4 /
                        {PLAN_FEATURES[currentPlan as keyof typeof PLAN_FEATURES]
                          .ai_calls}
                      </p>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-purple-500"
                        style={{ width: '40%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upgrade CTA */}
              <div className="bg-white border border-purple-100 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Unlock Premium Features
                    </h3>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Unlimited resumes</li>
                      <li>• Unlimited AI enhancements</li>
                      <li>• Advanced templates</li>
                    </ul>
                  </div>
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Language Tab */}
          {activeTab === 'language' && (
            <div className="bg-white border border-purple-100 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-6">
                Language & Region
              </h3>
              <div className="space-y-6">
                {/* Language Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-3">
                    Language
                  </label>
                  <div className="space-y-2">
                    {[
                      { code: 'en', name: 'English', flag: '🇬🇧' },
                      { code: 'fr', name: 'Français', flag: '🇫🇷' },
                      { code: 'ar', name: 'العربية', flag: '🇸🇦' },
                    ].map((lang) => (
                      <label
                        key={lang.code}
                        className="flex items-center gap-3 p-3 border border-purple-100 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name="language"
                          value={lang.code}
                          checked={language === lang.code}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="text-lg">{lang.flag}</span>
                        <span className="text-sm text-gray-900">{lang.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Region Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                    Region
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="FR">France</option>
                    <option value="DE">Germany</option>
                  </select>
                </div>

                <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
