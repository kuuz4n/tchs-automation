'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileText,
  Receipt,
  Layers,
  Settings,
  Sparkles,
  ChevronDown,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/storage';
import { getAuthSession, logoutUser } from '@/lib/auth';
import { UserProfile } from '@/types';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const refreshAuth = () => {
      const session = getAuthSession();
      setCurrentUser(session?.user || null);
    };

    refreshAuth();
    window.addEventListener('storage', refreshAuth);
    window.addEventListener('tchs_user_updated', refreshAuth);
    window.addEventListener('tchs_auth_changed', refreshAuth);

    return () => {
      window.removeEventListener('storage', refreshAuth);
      window.removeEventListener('tchs_user_updated', refreshAuth);
      window.removeEventListener('tchs_auth_changed', refreshAuth);
    };
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUserDropdownOpen(false);
    setCurrentUser(null);
    router.push('/login');
  };

  const navLinks = [
    { name: 'Proposals', href: '/', icon: FileText },
    { name: 'Invoices', href: '/invoices', icon: Receipt },
    { name: 'Service Catalog', href: '/catalog', icon: Layers },
    { name: 'Branding & Profile', href: '/settings', icon: Settings },
  ];

  return (
    <header className="no-print sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-sm font-bold text-lg">
                THC
              </div>
              <div>
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg block leading-tight">
                  The Happy Club
                </span>
                <span className="text-xs text-teal-700 font-medium tracking-wide uppercase">
                  Proposal & Invoice Engine
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {currentUser && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-800 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-700' : 'text-slate-500'}`} />
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Actions: Authenticated Staff Profile & Sign Out */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-left transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:block">
                    <div className="font-semibold text-slate-800 leading-none">
                      {currentUser.fullName}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-none">
                      {currentUser.role === 'admin' ? 'Administrator' : currentUser.jobTitle}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 leading-tight">
                        {currentUser.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                      <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                        {currentUser.role === 'admin' ? 'Administrator' : 'Staff Member'}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        My Profile & Signature
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav (Only when logged in) */}
      {currentUser && (
        <div className="md:hidden flex overflow-x-auto border-t border-slate-200 px-2 py-1.5 gap-1 bg-slate-50/70">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  isActive ? 'bg-teal-700 text-white font-semibold' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
