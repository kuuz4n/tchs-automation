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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-[#F5F2EB]">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-[#FFFDF9] border border-[#DED8CC] rounded-xl shadow-[0_12px_40px_-12px_rgba(28,25,23,0.08)] overflow-hidden">
        {/* Left Editorial Brand Panel */}
        <div className="md:col-span-5 bg-[#1C1917] text-[#F5F2EB] p-8 sm:p-10 flex flex-col justify-between relative">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[#C8B9A6] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#C88A55]" />
              Internal Studio Desk
            </div>
            <h1 className="font-editorial text-3xl sm:text-[32px] font-normal tracking-tight text-[#FAF7F2] mt-6 leading-[1.15]">
              The Happy Club Studios
            </h1>
            <p className="font-editorial italic text-sm text-[#C8B9A6] mt-1">
              by The Cliffhanger Studios
            </p>
            <div className="w-10 h-[1px] bg-[#3D3732] my-6" />
            <p className="text-xs text-[#A8A29E] leading-relaxed">
              Prepare tailored event proposals, configure multi-service packages and mobilization
              zones, and issue signed sales invoices from one unified ledger.
            </p>
          </div>

          <div className="pt-8 mt-8 border-t border-[#2E2925] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#A8A29E] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#C88A55]" />
                Cloud Ledger
              </span>
              {supabaseConfig.isConfigured ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#A7D7B8] bg-[#1E3326] px-2.5 py-0.5 rounded border border-[#2D4D39]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#52B788]" />
                  Supabase Connected
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfigModal(!showConfigModal)}
                  className="text-[11px] text-[#E6B88A] hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
                >
                  Configure Keys
                  {showConfigModal ? (
                    <ChevronUp className="w-3 h-3 ml-0.5" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Sign-In Form Panel */}
        <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-[#FFFDF9]">
          <div className="max-w-sm w-full mx-auto space-y-6">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B4A2B]">
                Staff Authentication
              </span>
              <h2 className="font-editorial text-2xl font-semibold text-[#1C1917] mt-1">
                Sign in to your workspace
              </h2>
              <p className="text-xs text-[#78716C] mt-1">
                Use your authorized studio credentials to access proposals and invoices.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-lg bg-[#FBECEB] border border-[#E8C5C3] text-[#8C2D27] text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#292524] block mb-1.5">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@thehappyclub.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#D6CFC2] rounded-lg bg-white text-[#1C1917] placeholder:text-[#A8A29E] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#292524] block mb-1.5">Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#D6CFC2] rounded-lg bg-white text-[#1C1917] placeholder:text-[#A8A29E] transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#1C1917] hover:bg-[#8B4A2B] text-[#FAF7F2] font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? 'Verifying Credentials...' : 'Enter Studio Workspace'}
                </button>
              </div>
            </form>

            {/* Expandable Supabase Connect Form (if manually toggled) */}
            {showConfigModal && (
              <form
                onSubmit={handleSaveSupabaseCredentials}
                className="mt-4 p-4 bg-[#F5F2EB] border border-[#E5DFD3] rounded-lg space-y-3 text-xs"
              >
                <div className="font-semibold text-[#1C1917] text-xs">
                  Supabase Connection Settings
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold tracking-wider text-[#78716C] block mb-1">
                    Project URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#D6CFC2] rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold tracking-wider text-[#78716C] block mb-1">
                    Anon Public Key
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#D6CFC2] rounded text-xs font-mono"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#1C1917] hover:bg-[#8B4A2B] text-white rounded font-medium text-xs transition-colors"
                  >
                    Save Connection
                  </button>
                </div>
              </form>
            )}

            <p className="text-[11px] text-[#78716C] pt-4 border-t border-[#EFECE4]">
              Need a staff account? Ask a Studio Administrator to provision your credentials under{' '}
              <span className="text-[#292524] font-medium">Studio &amp; Signatures</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
