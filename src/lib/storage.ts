'use client';

import {
  ServiceCategory,
  ServicePackage,
  Addon,
  Proposal,
  Invoice,
  UserProfile,
  LocationZone,
  CanvaThemeConfig,
} from '@/types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PACKAGES,
  INITIAL_ADDONS,
  INITIAL_USERS,
  INITIAL_THEME_CONFIG,
  INITIAL_ZONES,
  INITIAL_PROPOSALS,
} from './seed-data';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  CATEGORIES: 'tchs_categories',
  PACKAGES: 'tchs_packages',
  ADDONS: 'tchs_addons',
  ZONES: 'tchs_zones',
  EVENT_TYPES: 'tchs_event_types',
  PROPOSALS: 'tchs_proposals',
  INVOICES: 'tchs_invoices',
  USERS: 'tchs_users',
  CURRENT_USER_ID: 'tchs_current_user_id',
  THEME_CONFIG: 'tchs_theme_config',
};

export const INITIAL_EVENT_TYPES = [
  'Wedding',
  'Birthday',
  'Debut',
  'Corporate Event',
  'Anniversary',
  'Christening',
  'Festival / Public Event',
  'Private Gathering',
];

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Error reading localStorage key "${key}":`, e);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving localStorage key "${key}":`, e);
  }
}

// ==========================================
// 1. SERVICE CATEGORIES (Supabase + Local)
// ==========================================
export function getCategories(): ServiceCategory[] {
  return getItem<ServiceCategory[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
}

export async function syncCategoriesFromCloud(): Promise<ServiceCategory[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      const formatted: ServiceCategory[] = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        description: d.description || '',
        sortOrder: d.sort_order || 1,
        isActive: d.is_active !== false,
      }));
      setItem(STORAGE_KEYS.CATEGORIES, formatted);
      return formatted;
    }
  }
  return getCategories();
}

export async function saveCategory(category: ServiceCategory): Promise<void> {
  const current = getCategories();
  const index = current.findIndex((c) => c.id === category.id);
  if (index >= 0) current[index] = category;
  else current.push(category);
  setItem(STORAGE_KEYS.CATEGORIES, current);

  if (isSupabaseConfigured && supabase) {
    await supabase.from('service_categories').upsert({
      id: category.id,
      name: category.name,
      description: category.description,
      sort_order: category.sortOrder,
      is_active: category.isActive,
    });
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const current = getCategories().filter((c) => c.id !== id);
  setItem(STORAGE_KEYS.CATEGORIES, current);

  if (isSupabaseConfigured && supabase) {
    await supabase.from('service_categories').delete().eq('id', id);
  }
}

// ==========================================
// 2. SERVICE PACKAGES (Supabase + Local)
// ==========================================
export function getPackages(): ServicePackage[] {
  return getItem<ServicePackage[]>(STORAGE_KEYS.PACKAGES, INITIAL_PACKAGES);
}

export async function syncPackagesFromCloud(): Promise<ServicePackage[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('service_packages').select('*');
    if (!error && data && data.length > 0) {
      const formatted: ServicePackage[] = data.map((d: any) => ({
        id: d.id,
        categoryId: d.category_id,
        name: d.name,
        scriptTitle: d.script_title || '',
        subtitle: d.subtitle || '',
        shortCode: d.short_code || '',
        basePrice: parseFloat(d.base_price) || 0,
        baseHours: parseFloat(d.base_hours) || 2,
        basePax: parseInt(d.base_pax, 10) || 100,
        badgeText: d.badge_text || '',
        description: d.description || '',
        specs: d.specs || [],
        inclusions: d.inclusions || [],
        freebies: d.freebies || [],
        isActive: d.is_active !== false,
      }));
      setItem(STORAGE_KEYS.PACKAGES, formatted);
      return formatted;
    }
  }
  return getPackages();
}

export async function savePackage(pkg: ServicePackage): Promise<void> {
  const current = getPackages();
  const index = current.findIndex((p) => p.id === pkg.id);
  if (index >= 0) current[index] = pkg;
  else current.push(pkg);
  setItem(STORAGE_KEYS.PACKAGES, current);

  if (isSupabaseConfigured && supabase) {
    await supabase.from('service_packages').upsert({
      id: pkg.id,
      category_id: pkg.categoryId,
      name: pkg.name,
      script_title: pkg.scriptTitle,
      subtitle: pkg.subtitle,
      short_code: pkg.shortCode,
      base_price: pkg.basePrice,
      base_hours: pkg.baseHours,
      base_pax: pkg.basePax,
      badge_text: pkg.badgeText,
      description: pkg.description,
      specs: pkg.specs,
      inclusions: pkg.inclusions,
      freebies: pkg.freebies,
      is_active: pkg.isActive,
    });
  }
}

export async function deletePackage(id: string): Promise<void> {
  const current = getPackages().filter((p) => p.id !== id);
  setItem(STORAGE_KEYS.PACKAGES, current);

  if (isSupabaseConfigured && supabase) {
    await supabase.from('service_packages').delete().eq('id', id);
  }
}

// ==========================================
// 3. ADD-ONS & OPTIONS (Supabase + Local)
// ==========================================
export function getAddons(): Addon[] {
  return getItem<Addon[]>(STORAGE_KEYS.ADDONS, INITIAL_ADDONS);
}

export async function syncAddonsFromCloud(): Promise<Addon[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('addons').select('*');
    if (!error && data && data.length > 0) {
      const formatted: Addon[] = data.map((d: any) => ({
        id: d.id,
        serviceId: d.service_id,
        name: d.name,
        categoryTag: d.category_tag || '',
        pricingType: d.pricing_type,
        basePrice: parseFloat(d.base_price) || 0,
        intervalUnit: d.interval_unit,
        intervalStep: d.interval_step || 1,
        defaultQuantity: d.default_quantity || 1,
        isPaxDependent: Boolean(d.is_pax_dependent),
        paxMultiplier: d.pax_multiplier ? parseFloat(d.pax_multiplier) : undefined,
        variants: d.variants || [],
        description: d.description || '',
        isActive: d.is_active !== false,
      }));
      setItem(STORAGE_KEYS.ADDONS, formatted);
      return formatted;
    }
  }
  return getAddons();
}

export async function saveAddon(addon: Addon): Promise<void> {
  const current = getAddons();
  const index = current.findIndex((a) => a.id === addon.id);
  if (index >= 0) current[index] = addon;
  else current.push(addon);
  setItem(STORAGE_KEYS.ADDONS, current);

  if (isSupabaseConfigured && supabase) {
    await supabase.from('addons').upsert({
      id: addon.id,
      service_id: addon.serviceId,
      name: addon.name,
      category_tag: addon.categoryTag,
      pricing_type: addon.pricingType,
      base_price: addon.basePrice,
      interval_unit: addon.intervalUnit,
      interval_step: addon.intervalStep,
      default_quantity: addon.defaultQuantity,
      is_pax_dependent: addon.isPaxDependent,
      pax_multiplier: addon.paxMultiplier,
      variants: addon.variants,
      description: addon.description,
      is_active: addon.isActive,
    });
  }
}

export async function deleteAddon(id: string): Promise<void> {
  const current = getAddons().filter((a) => a.id !== id);
  setItem(STORAGE_KEYS.ADDONS, current);

  if (isSupabaseConfigured && supabase) {
    await supabase.from('addons').delete().eq('id', id);
  }
}

// ==========================================
// 4. LOCATION ZONES (Supabase + Local)
// ==========================================
export function getZones(): LocationZone[] {
  return getItem<LocationZone[]>(STORAGE_KEYS.ZONES, INITIAL_ZONES);
}

export async function syncZonesFromCloud(): Promise<LocationZone[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('location_zones').select('*');
    if (!error && data && data.length > 0) {
      const formatted: LocationZone[] = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        defaultFee: parseFloat(d.default_fee) || 0,
        description: d.description || '',
      }));
      setItem(STORAGE_KEYS.ZONES, formatted);
      return formatted;
    }
  }
  return getZones();
}

export async function saveZone(zone: LocationZone): Promise<void> {
  const current = getZones();
  const index = current.findIndex((z) => z.id === zone.id);
  if (index >= 0) current[index] = zone;
  else current.push(zone);
  setItem(STORAGE_KEYS.ZONES, current);

  if (isSupabaseConfigured && supabase) {
    await supabase.from('location_zones').upsert({
      id: zone.id,
      name: zone.name,
      default_fee: zone.defaultFee,
      description: zone.description,
    });
  }
}

export async function deleteZone(id: string): Promise<void> {
  const current = getZones().filter((z) => z.id !== id);
  setItem(STORAGE_KEYS.ZONES, current);

  if (isSupabaseConfigured && supabase) {
    await supabase.from('location_zones').delete().eq('id', id);
  }
}

// ==========================================
// 5. EVENT TYPES (Dropdown Management)
// ==========================================
export function getEventTypes(): string[] {
  return getItem<string[]>(STORAGE_KEYS.EVENT_TYPES, INITIAL_EVENT_TYPES);
}

export function saveEventType(type: string): void {
  const clean = type.trim();
  if (!clean) return;
  const current = getEventTypes();
  if (!current.includes(clean)) {
    current.push(clean);
    setItem(STORAGE_KEYS.EVENT_TYPES, current);
  }
}

export function deleteEventType(type: string): void {
  const current = getEventTypes().filter((t) => t !== type);
  setItem(STORAGE_KEYS.EVENT_TYPES, current);
}

// ==========================================
// 6. PROPOSALS & INVOICES (Supabase + Local)
// ==========================================
export function getProposals(): Proposal[] {
  return getItem<Proposal[]>(STORAGE_KEYS.PROPOSALS, INITIAL_PROPOSALS);
}

export async function saveProposal(proposal: Proposal): Promise<void> {
  const current = getProposals();
  const index = current.findIndex((p) => p.id === proposal.id);
  if (index >= 0) current[index] = proposal;
  else current.unshift(proposal);
  setItem(STORAGE_KEYS.PROPOSALS, current);

  if (isSupabaseConfigured && supabase) {
    await supabase.from('proposals').upsert({
      id: proposal.id,
      proposal_number: proposal.proposalNumber,
      client: proposal.client,
      services: proposal.services,
      discounts: proposal.discounts,
      mobilization: proposal.mobilization,
      pricing: proposal.pricing,
      package_tier_badge: proposal.packageTierBadge,
      status: proposal.status,
      notes: proposal.notes,
    });
  }
}

export async function deleteProposal(id: string): Promise<void> {
  const current = getProposals().filter((p) => p.id !== id);
  setItem(STORAGE_KEYS.PROPOSALS, current);

  if (isSupabaseConfigured && supabase) {
    await supabase.from('proposals').delete().eq('id', id);
  }
}

export function getInvoices(): Invoice[] {
  return getItem<Invoice[]>(STORAGE_KEYS.INVOICES, []);
}

export async function saveInvoice(invoice: Invoice): Promise<void> {
  const current = getInvoices();
  const index = current.findIndex((i) => i.id === invoice.id);
  if (index >= 0) current[index] = invoice;
  else current.unshift(invoice);
  setItem(STORAGE_KEYS.INVOICES, current);

  if (isSupabaseConfigured && supabase) {
    await supabase.from('invoices').upsert({
      id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      proposal_id: invoice.proposalId,
      proposal_number: invoice.proposalNumber,
      client: invoice.client,
      issue_date: invoice.issueDate,
      due_date: invoice.dueDate,
      services: invoice.services,
      discounts: invoice.discounts,
      mobilization: invoice.mobilization,
      pricing: invoice.pricing,
      package_tier_badge: invoice.packageTierBadge,
      payment_status: invoice.paymentStatus,
      paid_amount: invoice.paidAmount,
      balance_due: invoice.balanceDue,
      signer_name: invoice.signerName,
      signer_title: invoice.signerTitle,
      signer_email: invoice.signerEmail,
      signer_phone: invoice.signerPhone,
      signer_signature_url: invoice.signerSignatureUrl,
      notes: invoice.notes,
    });
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  const current = getInvoices().filter((i) => i.id !== id);
  setItem(STORAGE_KEYS.INVOICES, current);

  if (isSupabaseConfigured && supabase) {
    await supabase.from('invoices').delete().eq('id', id);
  }
}

// Users
export function getUsers(): UserProfile[] {
  return getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
}

export function saveUser(user: UserProfile): void {
  const current = getUsers();
  const index = current.findIndex((u) => u.id === user.id);
  if (index >= 0) current[index] = user;
  else current.push(user);
  setItem(STORAGE_KEYS.USERS, current);
}

export function getCurrentUser(): UserProfile {
  const users = getUsers();
  const currentId = getItem<string>(STORAGE_KEYS.CURRENT_USER_ID, users[0]?.id || 'user-maria');
  const found = users.find((u) => u.id === currentId);
  return found || users[0] || INITIAL_USERS[0];
}

export function setCurrentUserId(userId: string): void {
  setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
}

export function getThemeConfig(): CanvaThemeConfig {
  return getItem<CanvaThemeConfig>(STORAGE_KEYS.THEME_CONFIG, INITIAL_THEME_CONFIG);
}

export function saveThemeConfig(config: CanvaThemeConfig): void {
  setItem(STORAGE_KEYS.THEME_CONFIG, config);
}

export function generateAutomatedInvoiceNumber(date?: Date): string {
  const d = date || new Date();
  const yyyy = d.getFullYear().toString();
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  const prefix = `TCHS${yyyy}${mm}${dd}`;

  const allInvoices = getInvoices();
  const allProposals = getProposals();
  const matches = [...allInvoices, ...allProposals].filter(
    (item) => ('invoiceNumber' in item ? item.invoiceNumber : item.proposalNumber).startsWith(prefix)
  );

  if (matches.length === 0) return prefix;
  return `${prefix}-${(matches.length + 1).toString().padStart(2, '0')}`;
}

export function convertProposalToInvoice(proposal: Proposal, currentUser: UserProfile): Invoice {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const invoice: Invoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber: proposal.proposalNumber.startsWith('TCHS')
      ? proposal.proposalNumber
      : generateAutomatedInvoiceNumber(),
    proposalId: proposal.id,
    proposalNumber: proposal.proposalNumber,
    client: { ...proposal.client },
    issuedBy: currentUser,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0],
    services: [...proposal.services],
    discounts: [...proposal.discounts],
    mobilization: { ...proposal.mobilization },
    pricing: { ...proposal.pricing },
    packageTierBadge: proposal.packageTierBadge,
    paymentStatus: 'unpaid',
    paidAmount: 0,
    balanceDue: proposal.pricing.packageTotal,
    signerName: currentUser.fullName,
    signerTitle: currentUser.jobTitle,
    signerEmail: currentUser.email,
    signerPhone: currentUser.phone,
    signerSignatureUrl: currentUser.signatureImageUrl,
    notes: proposal.notes || 'Please settle the downpayment to confirm your booking date reservation.',
    createdAt: new Date().toISOString(),
  };

  saveInvoice(invoice);

  proposal.status = 'invoiced';
  saveProposal(proposal);

  return invoice;
}

export function resetToSeedData(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(INITIAL_PACKAGES));
  localStorage.setItem(STORAGE_KEYS.ADDONS, JSON.stringify(INITIAL_ADDONS));
  localStorage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(INITIAL_ZONES));
  localStorage.setItem(STORAGE_KEYS.EVENT_TYPES, JSON.stringify(INITIAL_EVENT_TYPES));
  localStorage.setItem(STORAGE_KEYS.PROPOSALS, JSON.stringify(INITIAL_PROPOSALS));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.THEME_CONFIG, JSON.stringify(INITIAL_THEME_CONFIG));
  localStorage.removeItem(STORAGE_KEYS.INVOICES);
}
