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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-[#1C1917] text-[#FAF7F2] px-4 py-3 rounded-lg shadow-xl border border-[#3D3732] text-xs flex items-center gap-2.5 animate-in slide-in-from-top-4">
          <span className="w-2 h-2 rounded-full bg-[#68B684]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5DFD3]">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B4A2B]">
            Studio Administration &amp; Identity
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#1C1917] mt-1 tracking-tight">
            Staff Signatures &amp; Studio Branding
          </h1>
          <p className="text-xs text-[#78716C] mt-1 flex items-center gap-2 flex-wrap">
            <span>
              Signed in as <strong className="text-[#1C1917]">{activeSessionUser?.fullName}</strong>
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                isAdmin
                  ? 'bg-[#F7EFE1] text-[#8B4A2B] border border-[#E2CFAF]'
                  : 'bg-[#EFECE4] text-[#57534E]'
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
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#1C1917] hover:bg-[#8B4A2B] text-[#FAF7F2] text-xs font-medium transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Provision Staff Account
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT: USER PROFILES & SIGNATURES (7 Cols) ================= */}
        <div className="lg:col-span-7 bg-[#FFFDF9] rounded-xl border border-[#E5DFD3] p-6 space-y-6">
          <div className="flex items-baseline justify-between pb-4 border-b border-[#EFECE4]">
            <div className="flex items-baseline gap-3">
              <span className="font-num text-xs font-semibold text-[#8B4A2B]">01</span>
              <div>
                <h2 className="font-editorial text-lg font-semibold text-[#1C1917]">
                  Staff Credentials &amp; Digital Signature Stamp
                </h2>
                <p className="text-[11px] text-[#78716C]">
                  {isAdmin
                    ? 'Administrator view: select any staff member below to update their profile or signature stamp.'
                    : 'Configure your personal signatory details and drawn signature for official sales invoices.'}
                </p>
              </div>
            </div>
          </div>

          {/* User selector chips (Visible for Admin to switch between staff profiles) */}
          {isAdmin && (
            <div className="bg-[#FAF8F4] p-3.5 rounded-lg border border-[#E5DFD3]">
              <span className="text-[10px] font-semibold text-[#78716C] uppercase tracking-[0.14em] block mb-2">
                Select Staff Profile to Edit
              </span>
              <div className="flex flex-wrap gap-2">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer border ${
                      u.id === selectedUserId
                        ? 'bg-[#1C1917] text-[#FAF7F2] border-[#1C1917]'
                        : 'bg-white text-[#292524] border-[#D6CFC2] hover:bg-[#EFECE4]'
                    }`}
                  >
                    <span>{u.fullName}</span>
                    <span
                      className={`text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded ${
                        u.id === selectedUserId
                          ? 'bg-[#2E2925] text-[#DFC9A6]'
                          : 'bg-[#F5F2EB] text-[#78716C]'
                      }`}
                    >
                      {u.role === 'admin' ? 'Admin' : 'Staff'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Edit form */}
          <form onSubmit={handleSaveUserProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-medium text-[#292524] block mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#D6CFC2] rounded-lg text-sm bg-white text-[#1C1917]"
                />
              </div>

              <div>
                <label className="font-medium text-[#292524] block mb-1.5">
                  Job Title / Designation
                </label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Event Account Executive"
                  className="w-full px-3.5 py-2 border border-[#D6CFC2] rounded-lg text-sm bg-white text-[#1C1917]"
                />
              </div>

              <div>
                <label className="font-medium text-[#292524] block mb-1.5">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#D6CFC2] rounded-lg text-sm bg-white text-[#1C1917]"
                />
              </div>

              <div>
                <label className="font-medium text-[#292524] block mb-1.5">Contact Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#D6CFC2] rounded-lg text-sm bg-white text-[#1C1917]"
                />
              </div>

              {isAdmin && (
                <div>
                  <label className="font-medium text-[#292524] block mb-1.5">Access Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'sales_rep')}
                    className="w-full px-3 py-2 border border-[#D6CFC2] rounded-lg text-xs bg-white font-medium text-[#1C1917]"
                  >
                    <option value="sales_rep">Sales Representative</option>
                    <option value="admin">Administrator (Full Studio Controls)</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="font-medium text-[#292524] block mb-1.5">
                Signatory Footer Note
              </label>
              <textarea
                rows={3}
                value={emailSignatureHtml}
                onChange={(e) => setEmailSignatureHtml(e.target.value)}
                placeholder="Warm regards,&#10;Juan Dela Cruz&#10;Senior Event Account Executive | The Happy Club"
                className="w-full px-3.5 py-2 font-mono text-xs border border-[#D6CFC2] rounded-lg bg-white text-[#1C1917]"
              />
              <p className="text-[11px] text-[#78716C] mt-1">
                Printed on the signatory block of proposals and invoices issued under your account.
              </p>
            </div>

            {/* Digital Signature Drawing / Upload Canvas */}
            <div className="pt-4 border-t border-[#EFECE4] space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[#1C1917] flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-[#8B4A2B]" />
                  Digital Signature Stamp
                </label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[11px] text-[#9E3B33] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Clear Pad
                </button>
              </div>

              {/* Draw Pad */}
              <div className="border border-dashed border-[#C8B9A6] rounded-xl bg-[#FAF8F4] p-4 flex flex-col items-center">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={100}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="bg-white rounded-lg cursor-crosshair border border-[#E5DFD3]"
                />
                <p className="text-[11px] text-[#78716C] mt-2">
                  Sign above using mouse or stylus, or upload a transparent PNG signature below.
                </p>
              </div>

              {/* Or file upload */}
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#D6CFC2] text-[#1C1917] bg-white hover:bg-[#FAF8F4] cursor-pointer text-xs font-medium transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#8B4A2B]" />
                  Upload Transparent PNG
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {signatureImageUrl && (
                  <span className="text-[11px] text-[#2E5A44] font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Signature Stamp Active
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-[#1C1917] hover:bg-[#8B4A2B] text-[#FAF7F2] font-medium text-xs transition-colors cursor-pointer"
              >
                Save Profile &amp; Signature
              </button>
            </div>
          </form>
        </div>

        {/* ================= RIGHT: CANVA BRANDING & BANKING (5 Cols) ================= */}
        {themeConfig && (
          <div className="lg:col-span-5 bg-[#FFFDF9] rounded-xl border border-[#E5DFD3] p-6 space-y-6">
            <div className="flex items-baseline gap-3 pb-4 border-b border-[#EFECE4]">
              <span className="font-num text-xs font-semibold text-[#8B4A2B]">02</span>
              <div>
                <h2 className="font-editorial text-lg font-semibold text-[#1C1917]">
                  Studio Letterhead &amp; Remittance
                </h2>
                <p className="text-[11px] text-[#78716C]">
                  Company masthead, address, and settlement accounts shown on PDFs.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveTheme} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#292524] block mb-1.5">Primary Brand</label>
                  <input
                    type="text"
                    value={themeConfig.brandName}
                    disabled={!isAdmin}
                    onChange={(e) =>
                      setThemeConfig({ ...themeConfig, brandName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#D6CFC2] rounded-lg text-sm bg-white disabled:bg-[#F5F2EB] text-[#1C1917]"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#292524] block mb-1.5">
                    Script Sub-Brand
                  </label>
                  <input
                    type="text"
                    value={themeConfig.subBrandName}
                    disabled={!isAdmin}
                    onChange={(e) =>
                      setThemeConfig({ ...themeConfig, subBrandName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#D6CFC2] rounded-lg text-sm font-editorial italic bg-white disabled:bg-[#F5F2EB] text-[#1C1917]"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-[#292524] block mb-1.5">Studio Address</label>
                <input
                  type="text"
                  value={themeConfig.companyAddress}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setThemeConfig({ ...themeConfig, companyAddress: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-[#D6CFC2] rounded-lg text-xs bg-white disabled:bg-[#F5F2EB] text-[#1C1917]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#292524] block mb-1.5">
                    Contact Number(s)
                  </label>
                  <input
                    type="text"
                    value={themeConfig.companyContact}
                    disabled={!isAdmin}
                    onChange={(e) =>
                      setThemeConfig({ ...themeConfig, companyContact: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#D6CFC2] rounded-lg text-xs bg-white disabled:bg-[#F5F2EB] text-[#1C1917]"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#292524] block mb-1.5">Official Email</label>
                  <input
                    type="text"
                    value={themeConfig.companyEmail}
                    disabled={!isAdmin}
                    onChange={(e) =>
                      setThemeConfig({ ...themeConfig, companyEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#D6CFC2] rounded-lg text-xs bg-white disabled:bg-[#F5F2EB] text-[#1C1917]"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-[#292524] flex items-center gap-1.5 mb-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#8B4A2B]" />
                  Bank &amp; GCash Remittance Details
                </label>
                <textarea
                  rows={4}
                  value={themeConfig.bankAccountInfo}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setThemeConfig({ ...themeConfig, bankAccountInfo: e.target.value })
                  }
                  className="w-full px-3.5 py-2 font-mono text-xs border border-[#D6CFC2] rounded-lg bg-white disabled:bg-[#F5F2EB] text-[#1C1917]"
                />
              </div>

              {isAdmin && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-[#1C1917] hover:bg-[#8B4A2B] text-[#FAF7F2] font-medium text-xs transition-colors cursor-pointer"
                  >
                    Save Studio Branding
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Admin Only Modal: Create Staff Account */}
      {showAdminNewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="bg-[#FFFDF9] border border-[#DED8CC] rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowAdminNewUserModal(false)}
              className="absolute top-5 right-5 text-[#78716C] hover:text-[#1C1917] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B4A2B]">
              Administrator Action
            </span>
            <h3 className="font-editorial text-xl font-semibold text-[#1C1917] mt-0.5">
              Provision Staff Account
            </h3>
            <p className="text-xs text-[#78716C] mt-1 mb-4">
              Create a new Supabase login and staff profile without signing out of your session.
            </p>

            {adminModalError && (
              <div className="mb-4 p-3 rounded-lg bg-[#FBECEB] border border-[#E8C5C3] text-[#8C2D27] text-xs">
                {adminModalError}
              </div>
            )}

            <form onSubmit={handleAdminCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-[#292524] block mb-1">Employee Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Christine Reyes"
                  className="w-full px-3.5 py-2 border border-[#D6CFC2] rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="font-medium text-[#292524] block mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={newStaffTitle}
                  onChange={(e) => setNewStaffTitle(e.target.value)}
                  placeholder="e.g. Senior Events Specialist"
                  className="w-full px-3.5 py-2 border border-[#D6CFC2] rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="font-medium text-[#292524] block mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="name@thehappyclub.com"
                  className="w-full px-3.5 py-2 border border-[#D6CFC2] rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="font-medium text-[#292524] block mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2 border border-[#D6CFC2] rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="font-medium text-[#292524] block mb-1">Access Role</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as 'sales_rep' | 'admin')}
                  className="w-full px-3 py-2 border border-[#D6CFC2] rounded-lg text-xs bg-white font-medium"
                >
                  <option value="sales_rep">Sales Representative (Standard Staff)</option>
                  <option value="admin">Administrator (Full Studio Controls)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminNewUserModal(false)}
                  className="px-4 py-2 text-xs text-[#57534E] hover:bg-[#EFECE4] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-[#1C1917] hover:bg-[#8B4A2B] text-[#FAF7F2] font-medium rounded-lg transition-colors cursor-pointer"
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
