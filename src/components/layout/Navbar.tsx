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
    { name: 'Quotation Desk', href: '/' },
    { name: 'Sales Invoices', href: '/invoices' },
    { name: 'Service Catalog', href: '/catalog' },
    { name: 'Studio & Signatures', href: '/settings' },
  ];

  return (
    <header className="no-print sticky top-0 z-40 bg-[#FAF8F4]/95 backdrop-blur-md border-b border-[#E5DFD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Monogram & Studio Name */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-[#1C1917] border border-[#3A332C] flex items-center justify-center text-[#F3EDE2] font-editorial font-semibold text-sm tracking-widest shadow-2xs group-hover:bg-[#8B4A2B] transition-colors">
                THC
              </div>
              <div className="flex flex-col">
                <span className="font-editorial font-semibold text-[#1C1917] text-base sm:text-lg leading-none tracking-tight">
                  The Happy Club Studios
                </span>
                <span className="text-[10px] text-[#78716C] font-medium tracking-[0.16em] uppercase mt-1">
                  Quotation &amp; Billing Desk
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            {currentUser && (
              <nav className="hidden md:flex items-center gap-1 border-l border-[#E5DFD3] pl-6">
                {navLinks.map((link) => {
                  const isActive =
                    link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`relative px-3.5 py-2 rounded-md text-xs font-medium tracking-wide transition-colors ${
                        isActive
                          ? 'text-[#1C1917] font-semibold bg-[#EFECE4]'
                          : 'text-[#68625D] hover:text-[#1C1917] hover:bg-[#F3F0E8]'
                      }`}
                    >
                      {link.name}
                      {isActive && (
                        <span className="absolute bottom-0 left-3.5 right-3.5 h-[2px] bg-[#8B4A2B] rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Actions: Authenticated Staff Profile & Sign Out */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-[#E5DFD3] bg-[#FFFDF9] hover:bg-[#F3F0E8] text-xs text-left transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-[#292524] text-[#F5F2EB] flex items-center justify-center font-editorial font-semibold text-xs">
                    {currentUser.fullName?.charAt(0) || 'S'}
                  </div>
                  <div className="hidden sm:block">
                    <div className="font-semibold text-[#1C1917] leading-none text-xs">
                      {currentUser.fullName}
                    </div>
                    <div className="text-[10px] text-[#78716C] mt-0.5 leading-none">
                      {currentUser.role === 'admin' ? 'Studio Admin' : currentUser.jobTitle}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#78716C] ml-0.5" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-[#FFFDF9] rounded-xl shadow-lg border border-[#E5DFD3] py-1.5 z-50">
                    <div className="px-4 py-2.5 border-b border-[#EFECE4]">
                      <p className="text-xs font-semibold text-[#1C1917] leading-tight">
                        {currentUser.fullName}
                      </p>
                      <p className="text-[11px] text-[#78716C] mt-0.5 truncate">
                        {currentUser.email}
                      </p>
                      <span className="inline-block mt-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5 rounded bg-[#F3EFE6] text-[#57534E] border border-[#E5DFD3]">
                        {currentUser.role === 'admin' ? 'Administrator' : 'Staff Account'}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full px-4 py-2 text-left text-xs text-[#292524] hover:bg-[#F5F2EB] flex items-center gap-2 transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-[#8B4A2B]" />
                        Signature &amp; Studio Settings
                      </Link>
                    </div>

                    <div className="border-t border-[#EFECE4] pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-xs text-[#9E3B33] hover:bg-[#FBECEB]/60 flex items-center gap-2 font-medium transition-colors cursor-pointer"
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1C1917] text-[#F5F2EB] text-xs font-medium hover:bg-[#292524] transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Staff Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation strip */}
      {currentUser && (
        <div className="md:hidden flex overflow-x-auto border-t border-[#E5DFD3] px-3 py-2 gap-1.5 bg-[#F5F2EB]">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#1C1917] text-[#F5F2EB] font-semibold'
                    : 'text-[#57534E] hover:bg-[#E5DFD3]/60'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
