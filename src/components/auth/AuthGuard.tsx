'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { Lock } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyAuth = () => {
      // Allow unrestricted access to /login
      if (pathname === '/login') {
        setChecking(false);
        return;
      }

      const session = getAuthSession();
      if (!session?.user) {
        setIsAuthenticated(false);
        setChecking(false);
        router.replace('/login');
      } else {
        setIsAuthenticated(true);
        setChecking(false);
      }
    };

    verifyAuth();

    window.addEventListener('tchs_auth_changed', verifyAuth);
    return () => {
      window.removeEventListener('tchs_auth_changed', verifyAuth);
    };
  }, [pathname, router]);

  // If on /login, render immediately
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Loading state while checking authentication
  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F2EB]">
        <div className="w-10 h-10 rounded-lg bg-[#1C1917] text-[#F5F2EB] flex items-center justify-center font-editorial font-semibold text-sm tracking-widest mb-3">
          THC
        </div>
        <p className="text-xs text-[#78716C] font-medium">Opening studio workspace...</p>
      </div>
    );
  }

  // If not authenticated, do not flash protected page content while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
