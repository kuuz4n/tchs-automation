export type PricingType = 'fixed' | 'interval' | 'pax_dependent' | 'variant';

export type IntervalUnit = 'HOUR' | 'PAX' | 'pc' | 'pcs' | 'day' | 'km';

export interface AddonVariant {
  id: string;
  addonId: string;
  name: string; // e.g. "Full roll (with paa)", "Cloth", "Magnetic", "Frame", "Acrylic"
  priceDelta: number; // additional cost for this variant
  isPaxDependent?: boolean; // e.g. Frame PAX Depender
}

export interface Addon {
  id: string;
  serviceId: string;
  name: string; // e.g. "Additional Hours", "Additional Capacity", "Custom Backdrop", "Props"
  categoryTag?: string; // sub-grouping e.g. "Props", "Setup", "Print Upgrade"
  pricingType: PricingType;
  basePrice: number;
  intervalUnit?: IntervalUnit;
  intervalStep?: number; // e.g. 1 for 1 HOUR, 100 for 100 PAX, 50 for 50 pcs
  defaultQuantity?: number; // e.g. 2 for "Seats & Stool Default 2 pcs matic"
  isPaxDependent?: boolean;
  paxMultiplier?: number;
  variants?: AddonVariant[];
  description?: string;
  isActive: boolean;
}

export interface ServicePackage {
  id: string;
  categoryId: string;
  name: string; // e.g. "The Happy Club Premium Photobooth - Extended", "Sinta Wedding Day Coverage", "DIY CRAFTS"
  shortCode?: string; // e.g. "PACKAGE A", "PACKAGE B"
  scriptTitle?: string; // e.g. "Sinta", "Classic", "Euphoria"
  subtitle?: string; // e.g. "Wedding Day Photo & Video Coverage"
  basePrice: number;
  baseHours: number;
  basePax: number;
  description: string;
  inclusions: string[];
  freebies?: string[];
  specs?: { label: string; value: string }[];
  badgeText?: string; // e.g. "15% OFF", "POPULAR"
  isActive: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string; // e.g. "The Happy Club", "The Cliffhanger Studios"
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'sales_rep';
  jobTitle: string; // e.g. "Senior Event Account Executive"
  phone: string;
  signatureImageUrl?: string; // data URL or image path
  emailSignatureHtml?: string;
  companyBranch?: string;
}

export interface LocationZone {
  id: string;
  name: string; // e.g. "Metro Manila", "Bulacan", "Rizal", "Cavite", "Tagaytay / Batangas"
  defaultFee: number;
  description?: string;
}

export interface SelectedServiceItem {
  packageId: string;
  packageName: string;
  basePrice: number;
  badge?: string;
  selectedAddons: {
    addonId: string;
    name: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    pricingDetail?: string;
  }[];
  serviceTotal: number;
}

export interface ProposalDiscount {
  id: string;
  name: string; // e.g. "Bundle (Multiple services)", "Loyalty (Repeat Client)"
  type?: 'percent' | 'fixed';
  value?: number;
  percent: number; // e.g. 5
  amount: number;
  isEnabled?: boolean;
}

export interface Client {
  id: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  eventType: string; // "Wedding", "Birthday", "Debut", "Corporate"
  eventDate: string;
  venue: string;
  locationZone: string;
  paxCount: number;
  eventHours: number;
  createdAt: string;
}

export type ProposalStatus = 'draft' | 'sent' | 'approved' | 'invoiced' | 'declined';

export interface Proposal {
  id: string;
  proposalNumber: string; // e.g. "TCHS20260921" or "TCHS-2026-0001"
  client: {
    name: string;
    address: string;
    eventType: string;
    eventDate: string;
    venue: string;
    locationZone: string;
    email?: string;
    phone?: string;
  };
  createdById: string;
  createdBy: UserProfile;
  services: SelectedServiceItem[];
  discounts: ProposalDiscount[];
  mobilization: {
    zoneName: string;
    locationDetail: string; // e.g. "Sta. Maria Bulacan"
    fee: number;
  };
  pricing: {
    subtotal: number;
    totalDiscountPercent: number;
    totalDiscountAmount: number;
    packageTotal: number; // Subtotal - Discount + Mobilization
    downpaymentType: 'amount' | 'percent';
    downpaymentValue: number; // e.g. 5000
    downpaymentAmount: number;
    remainingBalance: number;
  };
  packageTierBadge?: string; // e.g. "PACKAGE A" or "PACKAGE B"
  notes?: string;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  proposalId: string;
  proposalNumber: string;
  client: Proposal['client'];
  issuedBy: UserProfile;
  issueDate: string;
  dueDate: string;
  services: SelectedServiceItem[];
  discounts: ProposalDiscount[];
  mobilization: Proposal['mobilization'];
  pricing: Proposal['pricing'];
  packageTierBadge?: string;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  paidAmount?: number;
  balanceDue?: number;
  signerName: string;
  signerTitle: string;
  signerEmail: string;
  signerPhone: string;
  signerSignatureUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface CanvaThemeConfig {
  brandName: string;
  subBrandName: string;
  primaryColor: string;
  accentColor: string;
  companyAddress: string;
  companyContact: string;
  companyEmail: string;
  bankAccountInfo: string;
  disclaimerNotes: string[];
}
