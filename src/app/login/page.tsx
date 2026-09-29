'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogIn,
  KeyRound,
  Mail,
  AlertCircle,
  Lock,
  Database,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { loginUser, setAuthSession } from '@/lib/auth';
import { setCurrentUserId } from '@/lib/storage';
import { getActiveSupabaseConfig, saveSupabaseConfig } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();

  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Supabase connection state
  const [supabaseConfig, setSupabaseConfig] = useState<{
    url: string;
    key: string;
    isConfigured: boolean;
  }>({ url: '', key: '', isConfigured: false });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');

  useEffect(() => {
    // Ensure all sessions start signed out
    setAuthSession(null);

    const config = getActiveSupabaseConfig();
    setSupabaseConfig(config);
    setSupabaseUrlInput(config.url);
    setSupabaseKeyInput(config.key);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await loginUser(loginEmail, loginPassword);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to authenticate');
      } else if (res.user) {
        setCurrentUserId(res.user.id);
        window.dispatchEvent(new Event('tchs_user_updated'));
        window.dispatchEvent(new Event('tchs_auth_changed'));
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSupabaseCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
        {/* Brand Header */}
        <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-800 p-8 text-white text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-inner">
            <Lock className="w-7 h-7 text-amber-200" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">The Happy Club Studios</h1>
          <p className="text-xs text-teal-100 mt-1">
            Employee Portal • Proposal & Invoice Engine
          </p>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Company Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@thehappyclub.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-teal-600 bg-slate-50/70"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-teal-600 bg-slate-50/70"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Database & Supabase Status */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Database className="w-3.5 h-3.5 text-teal-700" />
                Database Backend:
              </span>

              {supabaseConfig.isConfigured ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Supabase Live
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfigModal(!showConfigModal)}
                  className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-0.5"
                >
                  Configure Supabase Keys
                  {showConfigModal ? (
                    <ChevronUp className="w-3 h-3 ml-0.5" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  )}
                </button>
              )}
            </div>

            {/* Expandable Supabase Connect Form */}
            {showConfigModal && (
              <form
                onSubmit={handleSaveSupabaseCredentials}
                className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs animate-in fade-in"
              >
                <div className="font-bold text-slate-800 text-[11px]">
                  Connect Your Supabase Project:
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">
                    Project URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">
                    Anon Public Key
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold text-xs"
                  >
                    Save & Connect Supabase
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
