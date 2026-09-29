'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  User,
  Check,
  Upload,
  PenTool,
  RotateCcw,
  Sparkles,
  Building,
  CreditCard,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Lock,
  X,
} from 'lucide-react';
import {
  getUsers,
  saveUser,
  getCurrentUser,
  setCurrentUserId,
  getThemeConfig,
  saveThemeConfig,
} from '@/lib/storage';
import { getAuthSession, adminCreateStaffUser } from '@/lib/auth';
import { UserProfile, CanvaThemeConfig } from '@/types';

export default function SettingsPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeSessionUser, setActiveSessionUser] = useState<UserProfile | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [themeConfig, setThemeConfig] = useState<CanvaThemeConfig | null>(null);

  // Form states for active user
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'sales_rep'>('sales_rep');
  const [emailSignatureHtml, setEmailSignatureHtml] = useState('');
  const [signatureImageUrl, setSignatureImageUrl] = useState('');

  // Admin New Staff Modal State
  const [showAdminNewUserModal, setShowAdminNewUserModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffTitle, setNewStaffTitle] = useState('Senior Event Account Executive');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'sales_rep' | 'admin'>('sales_rep');
  const [adminModalError, setAdminModalError] = useState<string | null>(null);

  // Canvas drawing ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const allUsers = getUsers();
    const session = getAuthSession();
    const active = session?.user || getCurrentUser();
    const theme = getThemeConfig();

    setUsers(allUsers);
    setActiveSessionUser(active);
    setThemeConfig(theme);

    if (active) {
      loadUserData(active);
    }
  }, []);

  const isAdmin = activeSessionUser?.role === 'admin';

  const loadUserData = (u: UserProfile) => {
    setSelectedUserId(u.id);
    setFullName(u.fullName);
    setJobTitle(u.jobTitle);
    setEmail(u.email);
    setPhone(u.phone);
    setRole(u.role);
    setEmailSignatureHtml(u.emailSignatureHtml || '');
    setSignatureImageUrl(u.signatureImageUrl || '');
  };

  const handleSelectUser = (id: string) => {
    // Only Admin can switch/edit other profiles
    if (!isAdmin && id !== activeSessionUser?.id) return;

    const found = users.find((u) => u.id === id);
    if (found) {
      loadUserData(found);
      setCurrentUserId(id);
      window.dispatchEvent(new Event('tchs_user_updated'));
    }
  };

  const handleAdminCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminModalError(null);

    const res = await adminCreateStaffUser(
      newStaffEmail,
      newStaffPassword,
      newStaffName,
      newStaffTitle,
      newStaffRole
    );

    if (!res.success) {
      setAdminModalError(res.error || 'Failed to create staff account');
      return;
    }

    const updated = getUsers();
    setUsers(updated);
    setShowAdminNewUserModal(false);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPassword('');

    setNotification(`Successfully created new staff account for ${res.user?.fullName}!`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveUserProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: UserProfile = {
      id: selectedUserId,
      fullName: fullName.trim(),
      jobTitle: jobTitle.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: isAdmin ? role : activeSessionUser?.role || 'sales_rep',
      emailSignatureHtml: emailSignatureHtml.trim(),
      signatureImageUrl: signatureImageUrl,
    };

    saveUser(updatedUser);
    setCurrentUserId(updatedUser.id);
    setUsers(getUsers());
    window.dispatchEvent(new Event('tchs_user_updated'));

    setNotification('User profile & email signature updated successfully!');
    setTimeout(() => setNotification(null), 3000);
  };

  // Canvas Drawing Methods
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f766e';
    ctx.lineCap = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureImageUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureImageUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Theme Config Save (Admin only)
  const handleSaveTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeConfig) return;
    saveThemeConfig(themeConfig);
    setNotification('Canva branding & company settings saved!');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs flex items-center gap-2 animate-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-teal-700" />
            User Profile, Signatures & Invoicing Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as: <strong className="text-slate-800">{activeSessionUser?.fullName}</strong>{' '}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isAdmin ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {activeSessionUser?.role === 'admin' ? 'Administrator' : 'Sales Representative'}
            </span>
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowAdminNewUserModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Provision New Staff Account
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ================= LEFT: USER PROFILES & SIGNATURES ================= */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-teal-700" />
                Staff Credentials & Digital Signature
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAdmin
                  ? 'As an Administrator, you can manage and edit any staff profile.'
                  : 'Update your personal profile, email signature, and drawn signature stamp.'}
              </p>
            </div>
          </div>

          {/* User selector chips (Visible for Admin to switch between staff profiles) */}
          {isAdmin && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Manage Staff Member:
              </span>
              <div className="flex flex-wrap gap-2">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      u.id === selectedUserId
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{u.fullName}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded ${
                        u.id === selectedUserId
                          ? 'bg-teal-800 text-teal-100'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {u.role === 'admin' ? 'Admin' : 'Sales'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Edit form */}
          <form onSubmit={handleSaveUserProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-teal-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Job Title / Designation</label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Event Account Executive"
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-teal-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Company Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-teal-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-teal-600"
                />
              </div>

              {isAdmin && (
                <div>
                  <label className="font-semibold text-slate-700">System Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'sales_rep')}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                  >
                    <option value="sales_rep">Sales Representative</option>
                    <option value="admin">Administrator (Can create staff)</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="font-semibold text-slate-700">Email Signature Block</label>
              <textarea
                rows={3}
                value={emailSignatureHtml}
                onChange={(e) => setEmailSignatureHtml(e.target.value)}
                placeholder="Warm regards,&#10;Juan Dela Cruz&#10;Senior Event Account Executive | The Happy Club"
                className="mt-1 w-full px-3 py-2 font-mono text-xs border border-slate-300 rounded-lg focus:outline-teal-600"
              />
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically rendered on sales invoices & quotes issued by this user.
              </p>
            </div>

            {/* Digital Signature Drawing / Upload Canvas */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-teal-700" />
                  Digital Signature Stamp
                </label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Clear Signature
                </button>
              </div>

              {/* Draw Pad */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-2 flex flex-col items-center">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={100}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="bg-white rounded-lg shadow-xs cursor-crosshair border border-slate-200"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  ✍️ Draw your signature above using mouse, touch, or stylus.
                </p>
              </div>

              {/* Or file upload */}
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer text-xs font-medium">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  Upload Signature PNG / Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {signatureImageUrl && (
                  <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Signature Saved
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs"
              >
                Save Profile & Signature
              </button>
            </div>
          </form>
        </div>

        {/* ================= RIGHT: CANVA BRANDING & BANKING ================= */}
        {themeConfig && (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-teal-700" />
                Canva Branding & Invoicing Details
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize titles, bank accounts, and disclaimers
              </p>
            </div>

            <form onSubmit={handleSaveTheme} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Brand Name</label>
                  <input
                    type="text"
                    value={themeConfig.brandName}
                    disabled={!isAdmin}
                    onChange={(e) =>
                      setThemeConfig({ ...themeConfig, brandName: e.target.value })
                    }
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Sub-Brand (Cursive)</label>
                  <input
                    type="text"
                    value={themeConfig.subBrandName}
                    disabled={!isAdmin}
                    onChange={(e) =>
                      setThemeConfig({ ...themeConfig, subBrandName: e.target.value })
                    }
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-serif italic disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Company Address</label>
                <input
                  type="text"
                  value={themeConfig.companyAddress}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setThemeConfig({ ...themeConfig, companyAddress: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Contact Number(s)</label>
                  <input
                    type="text"
                    value={themeConfig.companyContact}
                    disabled={!isAdmin}
                    onChange={(e) =>
                      setThemeConfig({ ...themeConfig, companyContact: e.target.value })
                    }
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Official Email</label>
                  <input
                    type="text"
                    value={themeConfig.companyEmail}
                    disabled={!isAdmin}
                    onChange={(e) =>
                      setThemeConfig({ ...themeConfig, companyEmail: e.target.value })
                    }
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-teal-700" />
                  Bank Account / GCash Payment Details
                </label>
                <textarea
                  rows={3}
                  value={themeConfig.bankAccountInfo}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setThemeConfig({ ...themeConfig, bankAccountInfo: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 font-mono text-xs border border-slate-300 rounded-lg disabled:bg-slate-100"
                />
              </div>

              {isAdmin && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs"
                  >
                    Save Branding Settings
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Admin Only Modal: Create Staff Account */}
      {showAdminNewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowAdminNewUserModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
              <h3 className="text-base font-bold text-slate-900">Provision New Staff Account</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Admin privilege: Create a company login for an employee.
            </p>

            {adminModalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {adminModalError}
              </div>
            )}

            <form onSubmit={handleAdminCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Employee Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Christine Reyes"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={newStaffTitle}
                  onChange={(e) => setNewStaffTitle(e.target.value)}
                  placeholder="e.g. Senior Events Specialist"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Company Email</label>
                <input
                  type="email"
                  required
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="name@thehappyclub.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  placeholder="Minimum 4 characters"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Access Role</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as 'sales_rep' | 'admin')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium"
                >
                  <option value="sales_rep">Sales Representative (Standard Staff)</option>
                  <option value="admin">Administrator (Full Admin Controls)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminNewUserModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
