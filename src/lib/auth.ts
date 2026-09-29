'use client';

import { UserProfile } from '@/types';
import { getUsers, saveUser } from './storage';
import { supabase, isSupabaseConfigured } from './supabase';

const AUTH_STORAGE_KEY = 'tchs_auth_session';

export interface AuthSession {
  user: UserProfile;
  token: string;
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse auth session:', e);
    return null;
  }
}

export function setAuthSession(session: AuthSession | null): void {
  if (typeof window === 'undefined') return;
  if (!session) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } else {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }
  window.dispatchEvent(new Event('tchs_auth_changed'));
}

export function isCurrentSessionAdmin(): boolean {
  const session = getAuthSession();
  return session?.user?.role === 'admin';
}

// Real Supabase Login
export async function loginUser(
  email: string,
  pass: string
): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Supabase Auth if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          return {
            success: false,
            error:
              "Email confirmation is enabled in your Supabase project. To allow staff instant login: In Supabase Dashboard, go to Authentication -> Providers -> Email, turn OFF 'Confirm email', then run in SQL Editor: update auth.users set email_confirmed_at = now();",
          };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Fetch profile from public.profiles
        const { data: profile, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const userObj: UserProfile = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          fullName: profile?.full_name || data.user.user_metadata?.full_name || 'Staff Member',
          role: profile?.role || data.user.user_metadata?.role || 'sales_rep',
          jobTitle: profile?.job_title || data.user.user_metadata?.job_title || 'Event Specialist',
          phone: profile?.phone || '',
          signatureImageUrl: profile?.signature_image_url || '',
          emailSignatureHtml: profile?.email_signature_html || '',
        };

        const session: AuthSession = {
          user: userObj,
          token: data.session?.access_token || 'sb-token',
        };

        setAuthSession(session);
        return { success: true, user: userObj };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Supabase authentication failed' };
    }
  }

  // 2. Local Fallback Auth (if Supabase env keys not yet set)
  const allUsers = getUsers();
  const existing = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!existing) {
    return {
      success: false,
      error: 'Invalid email or password. Contact your Administrator to provision access.',
    };
  }

  if (pass.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  const session: AuthSession = {
    user: existing,
    token: `token-${Date.now()}`,
  };

  setAuthSession(session);
  return { success: true, user: existing };
}

// Admin-Only Staff Creation in Supabase
export async function adminCreateStaffUser(
  email: string,
  pass: string,
  fullName: string,
  jobTitle: string,
  role: 'admin' | 'sales_rep' = 'sales_rep'
): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
  const currentSession = getAuthSession();
  if (currentSession?.user?.role !== 'admin') {
    return {
      success: false,
      error: 'Access denied: Only an Administrator can create new staff accounts.',
    };
  }

  const cleanEmail = email.trim().toLowerCase();

  // If Supabase is active
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            full_name: fullName,
            job_title: jobTitle,
            role,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const userObj: UserProfile = {
          id: data.user.id,
          email: cleanEmail,
          fullName,
          jobTitle,
          role,
          phone: '',
          emailSignatureHtml: `Best regards,\n${fullName}\n${jobTitle} | The Happy Club Studios`,
        };

        // Also insert into public.profiles
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: cleanEmail,
          full_name: fullName,
          job_title: jobTitle,
          role,
          email_signature_html: userObj.emailSignatureHtml,
        });

        saveUser(userObj);
        return { success: true, user: userObj };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Supabase staff creation failed' };
    }
  }

  // Fallback local store
  const allUsers = getUsers();
  const existing = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return { success: false, error: 'An employee account with this email already exists.' };
  }

  const newUser: UserProfile = {
    id: `user-${Date.now()}`,
    email: cleanEmail,
    fullName: fullName.trim(),
    jobTitle: jobTitle.trim() || 'Event Specialist',
    role,
    phone: '',
    emailSignatureHtml: `Best regards,\n${fullName.trim()}\n${jobTitle.trim()} | The Happy Club Studios\n${cleanEmail}`,
  };

  saveUser(newUser);
  return { success: true, user: newUser };
}

export async function logoutUser(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut:', e);
    }
  }
  setAuthSession(null);
}
