'use client';

import { AppShell } from '@/components/layout/AppShell';
import { PasswordInput } from '@/components/ui/password-input';
import { PLAN_FEATURES } from '@/lib/mockData';
import * as authApi from '@/lib/auth-api';
import { createCheckoutSession } from '@/lib/billing-api';
import { listCVs } from '@/lib/cvs-api';
import { ApiError } from '@/lib/api';
import type { UserLocale } from '@/lib/types/auth';
import { useAuth } from '@/providers/AuthProvider';
import { useCallback, useEffect, useState } from 'react';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'plan' | 'language'>('account');
  const [language, setLanguage] = useState<UserLocale>('en');
  const [cvCount, setCvCount] = useState(0);
  const [loadingUsage, setLoadingUsage] = useState(true);

  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [localeMsg, setLocaleMsg] = useState<string | null>(null);
  const [localeErr, setLocaleErr] = useState<string | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);
  const [savingLocale, setSavingLocale] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const currentPlan = user?.plan ?? 'free';
  const planLimits = PLAN_FEATURES[currentPlan as keyof typeof PLAN_FEATURES];

  useEffect(() => {
    if (user?.locale) setLanguage(user.locale);
  }, [user?.locale]);

  const loadUsage = useCallback(async () => {
    setLoadingUsage(true);
    try {
      const cvs = await listCVs();
      setCvCount(cvs.length);
    } catch {
      setCvCount(0);
    } finally {
      setLoadingUsage(false);
    }
  }, []);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const handleChangePassword = async () => {
    setPasswordMsg(null);
    setPasswordErr(null);
    if (newPassword.length < 8) {
      setPasswordErr('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr('New passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg('Password updated successfully');
    } catch (e) {
      setPasswordErr(e instanceof ApiError ? e.message : 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveLocale = async () => {
    setLocaleMsg(null);
    setLocaleErr(null);
    setSavingLocale(true);
    try {
      await authApi.updateProfile(language);
      await refreshUser();
      setLocaleMsg('Language preference saved');
    } catch (e) {
      setLocaleErr(e instanceof ApiError ? e.message : 'Failed to save preferences');
    } finally {
      setSavingLocale(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const result = await createCheckoutSession();
      if (result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Checkout unavailable — ask admin to upgrade your plan');
    } finally {
      setUpgrading(false);
    }
  };

  const cvPercent = planLimits.resumes
    ? Math.min(100, Math.round((cvCount / planLimits.resumes) * 100))
    : 0;

  const tabs = [
    { id: 'account' as const, label: 'Account' },
    { id: 'plan' as const, label: 'Plan' },
    { id: 'language' as const, label: 'Language' },
  ];

  return (
    <AppShell title="Settings">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-6 border-b border-purple-100 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-purple-500" />
              )}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="bg-white border border-purple-100 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Profile Information</h3>
                {profileErr && (
                  <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {profileErr}
                  </p>
                )}
                {profileMsg && (
                  <p className="mb-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                    {profileMsg}
                  </p>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email ?? ''}
                      readOnly
                      className="w-full px-3 py-2 border border-purple-100 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Email cannot be changed here. Use a new account or contact support.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                      Account type
                    </label>
                    <p className="text-sm text-gray-700 capitalize">
                      {user?.role ?? 'user'} · {user?.plan ?? 'free'} plan
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                      Member since
                    </label>
                    <p className="text-sm text-gray-700">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-purple-100 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Change Password</h3>
                {passwordErr && (
                  <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {passwordErr}
                  </p>
                )}
                {passwordMsg && (
                  <p className="mb-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                    {passwordMsg}
                  </p>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                      Current Password
                    </label>
                    <PasswordInput
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                      New Password
                    </label>
                    <PasswordInput
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                      Confirm Password
                    </label>
                    <PasswordInput
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={savingPassword || !currentPassword || !newPassword}
                    className="px-4 py-2 bg-white border border-purple-200 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
                  >
                    {savingPassword ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-transparent border border-purple-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Current Plan</h3>
                    <p className="text-xs text-gray-600">
                      {currentPlan === 'free'
                        ? 'Free — up to 3 resumes'
                        : 'Pro — unlimited resumes & more AI'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">
                      {currentPlan === 'free' ? 'Free' : '$9.99'}
                    </p>
                    {currentPlan === 'pro' && (
                      <p className="text-xs text-gray-600">/mo</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-purple-100 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-6">Usage</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-600">Resumes Created</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {loadingUsage ? '…' : cvCount} /{' '}
                        {currentPlan === 'free' ? planLimits.resumes : '∞'}
                      </p>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-purple-500 transition-all"
                        style={{
                          width: currentPlan === 'free' ? `${cvPercent}%` : '20%',
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    AI usage tracking coming soon. Enhance CV from the editor today.
                  </p>
                </div>
              </div>

              {currentPlan === 'free' && (
                <div className="bg-white border border-purple-100 rounded-xl p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        Unlock Premium Features
                      </h3>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Unlimited resumes</li>
                        <li>• More AI enhancements</li>
                        <li>• All templates</li>
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={handleUpgrade}
                      disabled={upgrading}
                      className="shrink-0 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      {upgrading ? 'Opening…' : 'Upgrade to Pro'}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-3">
                    Stripe checkout is a placeholder until payment keys are configured.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'language' && (
            <div className="bg-white border border-purple-100 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-6">Language</h3>
              {localeErr && (
                <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {localeErr}
                </p>
              )}
              {localeMsg && (
                <p className="mb-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  {localeMsg}
                </p>
              )}
              <div className="space-y-2 mb-6">
                {(
                  [
                    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
                    { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
                    { code: 'ar' as const, name: 'العربية', flag: '🇸🇦' },
                  ] as const
                ).map((lang) => (
                  <label
                    key={lang.code}
                    className="flex items-center gap-3 p-3 border border-purple-100 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="language"
                      value={lang.code}
                      checked={language === lang.code}
                      onChange={() => setLanguage(lang.code)}
                      className="w-4 h-4"
                    />
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-sm text-gray-900">{lang.name}</span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSaveLocale}
                disabled={savingLocale || language === user?.locale}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {savingLocale ? 'Saving…' : 'Save Language'}
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
