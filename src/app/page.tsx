'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calculator,
  Plus,
  Trash2,
  FileCheck,
  Eye,
  Check,
  Layers,
  MapPin,
  Calendar,
  Building,
  User,
  DollarSign,
  CreditCard,
  X,
  FilePlus2,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import {
  getPackages,
  syncPackagesFromCloud,
  getAddons,
  syncAddonsFromCloud,
  getZones,
  syncZonesFromCloud,
  getEventTypes,
  getProposals,
  syncProposalsFromCloud,
  saveProposal,
  getCurrentUser,
  convertProposalToInvoice,
  generateAutomatedInvoiceNumber,
  generateUUID,
} from '@/lib/storage';
import { getAuthSession } from '@/lib/auth';
import {
  ServicePackage,
  Addon,
  LocationZone,
  Proposal,
  SelectedServiceItem,
  ProposalDiscount,
  UserProfile,
} from '@/types';
import CanvaDocumentView from '@/components/invoice/CanvaDocumentView';

export interface ProposalDiscountOption {
  id: string;
  name: string;
  type: 'percent' | 'fixed';
  value: number;
  isEnabled: boolean;
}

const DEFAULT_DISCOUNT_OPTIONS: ProposalDiscountOption[] = [
  {
    id: 'disc-early-bird',
    name: 'Early Bird Promo',
    type: 'percent',
    value: 10,
    isEnabled: false,
  },
  {
    id: 'disc-bundle',
    name: 'Bundle Discount (Multiple Services)',
    type: 'percent',
    value: 5,
    isEnabled: false,
  },
  {
    id: 'disc-loyalty',
    name: 'Loyalty (Repeat Client)',
    type: 'percent',
    value: 5,
    isEnabled: false,
  },
  {
    id: 'disc-seasonal',
    name: 'Seasonal Promo',
    type: 'percent',
    value: 15,
    isEnabled: false,
  },
];

export default function CalculatorPage() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [zones, setZones] = useState<LocationZone[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [savedProposals, setSavedProposals] = useState<Proposal[]>([]);

  // Client / Event Details
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [eventType, setEventType] = useState('Wedding');
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [venueName, setVenueName] = useState('');
  const [selectedZoneName, setSelectedZoneName] = useState('Metro Manila');
  const [zoneDetail, setZoneDetail] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [packageTierBadge, setPackageTierBadge] = useState('PACKAGE A');

  // Multi-service configuration for this proposal
  const [services, setServices] = useState<
    {
      packageId: string;
      selectedAddonConfigs: {
        addonId: string;
        quantity: number;
        variantId?: string;
      }[];
    }[]
  >([]);

  // Dynamic Discounts
  const [discountOptions, setDiscountOptions] =
    useState<ProposalDiscountOption[]>(DEFAULT_DISCOUNT_OPTIONS);
  const [showAddDiscountModal, setShowAddDiscountModal] = useState(false);
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [discountFormName, setDiscountFormName] = useState('');
  const [discountFormType, setDiscountFormType] = useState<'percent' | 'fixed'>('percent');
  const [discountFormValue, setDiscountFormValue] = useState<number>(10);

  // Mobilization
  const [customMobilizationFee, setCustomMobilizationFee] = useState<number | null>(null);

  // Downpayment
  const [downpaymentMode, setDownpaymentMode] = useState<'amount' | 'percent'>('amount');
  const [downpaymentValue, setDownpaymentValue] = useState(5000);

  // Preview Modal & Toast
  const [activePreviewProposal, setActivePreviewProposal] = useState<Proposal | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    refreshAllData();
  }, []);

  const refreshAllData = async () => {
    const pkgs = getPackages();
    const adds = getAddons();
    const zns = getZones();
    const evts = getEventTypes();
    const props = getProposals();

    const session = getAuthSession();
    const activeUser = session?.user || getCurrentUser();

    setPackages(pkgs);
    setAddons(adds);
    setZones(zns);
    setEventTypes(evts);
    setCurrentUser(activeUser);
    setSavedProposals(props);
    setInvoiceNumber(generateAutomatedInvoiceNumber());

    if (pkgs.length > 0 && services.length === 0) {
      setServices([{ packageId: pkgs[0].id, selectedAddonConfigs: [] }]);
    }

    // Sync with Supabase cloud
    try {
      const [cloudPkgs, cloudAdds, cloudZns, cloudProps] = await Promise.all([
        syncPackagesFromCloud(),
        syncAddonsFromCloud(),
        syncZonesFromCloud(),
        syncProposalsFromCloud(),
      ]);
      setPackages(cloudPkgs);
      setAddons(cloudAdds);
      setZones(cloudZns);
      setSavedProposals(cloudProps);
    } catch (e) {
      console.warn('Cloud sync error:', e);
    }

    // Load persisted discount presets if available
    try {
      const savedDiscs = localStorage.getItem('tchs_discount_options');
      if (savedDiscs) {
        const parsed = JSON.parse(savedDiscs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDiscountOptions(parsed.map((d: any) => ({ ...d, isEnabled: false })));
        }
      }
    } catch (e) {
      console.warn('Error reading saved discounts:', e);
    }
  };

  // Active Zone & Mobilization
  const activeZone = zones.find((z) => z.name === selectedZoneName) || zones[0];
  const mobilizationFee =
    customMobilizationFee !== null ? customMobilizationFee : activeZone?.defaultFee || 0;

  // Calculation engine for this proposal
  const computedServices: SelectedServiceItem[] = services.map((s) => {
    const pkg = packages.find((p) => p.id === s.packageId);
    const pkgBasePrice = pkg?.basePrice || 0;
    const pkgName = pkg?.name || 'Selected Service';

    const selectedAddons = s.selectedAddonConfigs.map((cfg) => {
      const addon = addons.find((a) => a.id === cfg.addonId);
      const name = addon?.name || 'Add-on';
      const qty = cfg.quantity || 1;
      let unitPrice = addon?.basePrice || 0;
      let totalPrice = unitPrice * qty;
      let pricingDetail = `${qty} × ₱${unitPrice.toLocaleString()}`;

      if (addon?.pricingType === 'interval') {
        pricingDetail = `${qty} ${addon.intervalUnit || 'step'} × ₱${unitPrice.toLocaleString()}`;
      } else if (addon?.pricingType === 'variant') {
        const v =
          addon.variants?.find((varItem) => varItem.id === cfg.variantId) || addon.variants?.[0];
        if (v) {
          unitPrice = v.priceDelta;
          totalPrice = unitPrice * qty;
          pricingDetail = `${v.name} (+₱${unitPrice.toLocaleString()})`;
        }
      }

      return {
        addonId: cfg.addonId,
        name,
        quantity: qty,
        unitPrice,
        totalPrice,
        pricingDetail,
      };
    });

    const addonsTotal = selectedAddons.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const serviceTotal = pkgBasePrice + addonsTotal;

    return {
      packageId: s.packageId,
      packageName: pkgName,
      basePrice: pkgBasePrice,
      badge: pkg?.badgeText,
      selectedAddons,
      serviceTotal,
    };
  });

  const subtotal = computedServices.reduce((sum, s) => sum + s.serviceTotal, 0);

  // Dynamic Active Discounts for this proposal
  const activeDiscounts: ProposalDiscount[] = discountOptions
    .filter((d) => d.isEnabled && d.value > 0)
    .map((d) => {
      let amount = 0;
      let percent = 0;
      if (d.type === 'percent') {
        percent = d.value;
        amount = (subtotal * d.value) / 100;
      } else {
        amount = Math.min(d.value, subtotal);
        percent = subtotal > 0 ? (amount / subtotal) * 100 : 0;
      }
      return {
        id: d.id,
        name: d.name,
        type: d.type,
        value: d.value,
        percent: Math.round(percent * 10) / 10,
        amount: Math.round(amount * 100) / 100,
        isEnabled: true,
      };
    });

  const totalDiscountAmount = activeDiscounts.reduce((sum, d) => sum + d.amount, 0);
  const totalDiscountPercent =
    subtotal > 0 ? Math.round((totalDiscountAmount / subtotal) * 100 * 10) / 10 : 0;

  const packageTotal = Math.max(0, subtotal - totalDiscountAmount + mobilizationFee);

  const computedDownpayment =
    downpaymentMode === 'percent'
      ? (packageTotal * downpaymentValue) / 100
      : Math.min(downpaymentValue, packageTotal);
  const remainingBalance = Math.max(0, packageTotal - computedDownpayment);

  // Manage proposal service rows
  const handleAddServiceRow = () => {
    const unselected =
      packages.find((p) => !services.some((s) => s.packageId === p.id)) || packages[0];
    if (unselected) {
      setServices([...services, { packageId: unselected.id, selectedAddonConfigs: [] }]);
    }
  };

  // ONLY removes the row from the current proposal (never touches database catalog)
  const handleRemoveServiceRow = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleServicePackageChange = (serviceIndex: number, newPkgId: string) => {
    const updated = [...services];
    updated[serviceIndex] = {
      packageId: newPkgId,
      selectedAddonConfigs: [],
    };
    setServices(updated);
  };

  const handleToggleAddon = (serviceIndex: number, addonId: string) => {
    const updated = [...services];
    const targetService = updated[serviceIndex];
    const exists = targetService.selectedAddonConfigs.find((c) => c.addonId === addonId);

    if (exists) {
      targetService.selectedAddonConfigs = targetService.selectedAddonConfigs.filter(
        (c) => c.addonId !== addonId
      );
    } else {
      const addon = addons.find((a) => a.id === addonId);
      targetService.selectedAddonConfigs.push({
        addonId,
        quantity: addon?.defaultQuantity || 1,
        variantId: addon?.variants?.[0]?.id,
      });
    }
    setServices(updated);
  };

  const handleUpdateAddonQty = (serviceIndex: number, addonId: string, qty: number) => {
    const updated = [...services];
    const config = updated[serviceIndex].selectedAddonConfigs.find((c) => c.addonId === addonId);
    if (config) {
      config.quantity = Math.max(1, qty);
      setServices(updated);
    }
  };

  const handleUpdateAddonVariant = (
    serviceIndex: number,
    addonId: string,
    variantId: string
  ) => {
    const updated = [...services];
    const config = updated[serviceIndex].selectedAddonConfigs.find((c) => c.addonId === addonId);
    if (config) {
      config.variantId = variantId;
      setServices(updated);
    }
  };

  // Discount Management
  const handleToggleDiscount = (id: string) => {
    setDiscountOptions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isEnabled: !d.isEnabled } : d))
    );
  };

  const handleOpenAddDiscount = () => {
    setEditingDiscountId(null);
    setDiscountFormName('');
    setDiscountFormType('percent');
    setDiscountFormValue(10);
    setShowAddDiscountModal(true);
  };

  const handleOpenEditDiscount = (disc: ProposalDiscountOption) => {
    setEditingDiscountId(disc.id);
    setDiscountFormName(disc.name);
    setDiscountFormType(disc.type);
    setDiscountFormValue(disc.value);
    setShowAddDiscountModal(true);
  };

  const handleSaveDiscountForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountFormName.trim()) return;

    let updated: ProposalDiscountOption[];
    if (editingDiscountId) {
      updated = discountOptions.map((d) =>
        d.id === editingDiscountId
          ? {
              ...d,
              name: discountFormName.trim(),
              type: discountFormType,
              value: discountFormValue,
            }
          : d
      );
    } else {
      const newDisc: ProposalDiscountOption = {
        id: `disc-${Date.now()}`,
        name: discountFormName.trim(),
        type: discountFormType,
        value: discountFormValue,
        isEnabled: true, // auto-select newly added discount for this proposal
      };
      updated = [...discountOptions, newDisc];
    }

    setDiscountOptions(updated);
    try {
      localStorage.setItem('tchs_discount_options', JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not persist discount options:', err);
    }
    setShowAddDiscountModal(false);
  };

  const handleDeleteDiscount = (id: string) => {
    const updated = discountOptions.filter((d) => d.id !== id);
    setDiscountOptions(updated);
    try {
      localStorage.setItem('tchs_discount_options', JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not persist discount options:', err);
    }
  };

  // Start fresh proposal
  const handleStartNewProposal = () => {
    setClientName('');
    setClientAddress('');
    setEventType('Wedding');
    setEventDate(new Date().toISOString().split('T')[0]);
    setVenueName('');
    setSelectedZoneName('Metro Manila');
    setZoneDetail('');
    setInvoiceNumber(generateAutomatedInvoiceNumber());
    setPackageTierBadge('PACKAGE A');
    setDiscountOptions((prev) => prev.map((d) => ({ ...d, isEnabled: false })));
    setDownpaymentMode('amount');
    setDownpaymentValue(5000);
    if (packages.length > 0) {
      setServices([{ packageId: packages[0].id, selectedAddonConfigs: [] }]);
    }
    setNotification('Started clean proposal form.');
    setTimeout(() => setNotification(null), 2500);
  };

  // Build proposal object
  const buildProposalObject = (): Proposal => {
    const session = getAuthSession();
    const user = session?.user || currentUser || getCurrentUser();
    return {
      id: generateUUID(),
      proposalNumber: invoiceNumber || generateAutomatedInvoiceNumber(),
      client: {
        name: clientName || 'Client Name',
        address: clientAddress,
        eventType,
        eventDate,
        venue: venueName,
        locationZone: selectedZoneName,
      },
      createdById: user.id,
      createdBy: user,
      services: computedServices,
      discounts: activeDiscounts,
      mobilization: {
        zoneName: selectedZoneName,
        locationDetail: zoneDetail || `${venueName}, ${selectedZoneName}`,
        fee: mobilizationFee,
      },
      pricing: {
        subtotal,
        totalDiscountPercent,
        totalDiscountAmount,
        packageTotal,
        downpaymentType: downpaymentMode,
        downpaymentValue,
        downpaymentAmount: computedDownpayment,
        remainingBalance,
      },
      packageTierBadge,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleOpenPreview = () => {
    const prop = buildProposalObject();
    setActivePreviewProposal(prop);
    setShowPreviewModal(true);
  };

  const handleSaveProposal = async () => {
    const prop = buildProposalObject();
    await saveProposal(prop);
    setSavedProposals(getProposals());
    setNotification(`Proposal #${prop.proposalNumber} saved!`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleGenerateInvoiceNow = () => {
    const prop = buildProposalObject();
    const session = getAuthSession();
    const user = session?.user || currentUser || getCurrentUser();
    const invoice = convertProposalToInvoice(prop, user);
    setNotification(
      `Official Sales Invoice #${invoice.invoiceNumber} generated & signed by ${user.fullName}!`
    );
    setTimeout(() => setNotification(null), 4000);
    setActivePreviewProposal(prop);
    setShowPreviewModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-[#1C1917] text-[#FAF7F2] px-4 py-3 rounded-lg shadow-xl border border-[#3D3732] text-xs flex items-center gap-2.5 animate-in slide-in-from-top-4">
          <span className="w-2 h-2 rounded-full bg-[#68B684]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Editorial Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E5DFD3]">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B4A2B]">
            <span>Studio Quotation Desk</span>
            <span className="text-[#C7B299]">•</span>
            <span className="font-num text-[#57534E]">{invoiceNumber}</span>
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#1C1917] mt-1 tracking-tight">
            Client Proposal &amp; Package Configurator
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Assemble event packages, customize station upgrades, and generate Canva quotations or
            signed sales invoices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#D6CFC2] rounded-lg px-3 py-1.5">
            <span className="text-[11px] font-medium text-[#78716C]">Canva Ribbon:</span>
            <select
              value={packageTierBadge}
              onChange={(e) => setPackageTierBadge(e.target.value)}
              className="text-xs font-semibold text-[#8B4A2B] bg-transparent border-none focus:ring-0 cursor-pointer pr-1"
            >
              <option value="PACKAGE A">PACKAGE A</option>
              <option value="PACKAGE B">PACKAGE B</option>
              <option value="SPECIAL PACKAGE">SPECIAL PACKAGE</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleStartNewProposal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FFFDF9] hover:bg-[#EFECE4] text-[#292524] border border-[#D6CFC2] text-xs font-medium transition-colors cursor-pointer"
          >
            <FilePlus2 className="w-3.5 h-3.5 text-[#8B4A2B]" />
            Reset Form
          </button>
        </div>
      </div>

      {/* Main 2-Column Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-start">
        {/* ================= LEFT COLUMN: CONFIGURATION STEPS (7 Cols) ================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* STEP 01: CLIENT & EVENT DOSSIER */}
          <section className="bg-[#FFFDF9] border border-[#E5DFD3] rounded-xl p-6 shadow-[0_2px_10px_-4px_rgba(28,25,23,0.04)]">
            <div className="flex items-baseline justify-between pb-4 border-b border-[#EFECE4]">
              <div className="flex items-baseline gap-3">
                <span className="font-num text-xs font-semibold text-[#8B4A2B] tracking-wider">
                  01
                </span>
                <div>
                  <h2 className="font-editorial text-lg font-semibold text-[#1C1917]">
                    Client &amp; Event Dossier
                  </h2>
                  <p className="text-[11px] text-[#78716C]">
                    Primary celebrant or couple details, event date, and venue mobilization zone.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 text-xs">
              <div>
                <label className="font-medium text-[#292524] block mb-1.5">
                  Client / Couple Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Clinton Correa or Leah & Mark"
                  className="w-full px-3.5 py-2 border border-[#D6CFC2] rounded-lg text-sm bg-white text-[#1C1917] placeholder:text-[#A8A29E]"
                />
              </div>

              <div>
                <label className="font-medium text-[#292524] block mb-1.5">
                  Client Billing Address
                </label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="City or full billing address"
                  className="w-full px-3.5 py-2 border border-[#D6CFC2] rounded-lg text-sm bg-white text-[#1C1917] placeholder:text-[#A8A29E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#292524] block mb-1.5">Event Occasion</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D6CFC2] rounded-lg text-sm bg-white text-[#1C1917]"
                  >
                    {eventTypes.map((et) => (
                      <option key={et} value={et}>
                        {et}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-medium text-[#292524] block mb-1.5">Event Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D6CFC2] rounded-lg text-sm bg-white text-[#1C1917] font-num"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-[#292524] block mb-1.5">
                  Reception / Event Venue
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Shangri-La The Fort / Villa Soledad"
                  className="w-full px-3.5 py-2 border border-[#D6CFC2] rounded-lg text-sm bg-white text-[#1C1917] placeholder:text-[#A8A29E]"
                />
              </div>

              {/* Location / Zone Dropdown */}
              <div className="sm:col-span-2 pt-2 border-t border-[#F2EFE9]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-medium text-[#292524] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#8B4A2B]" />
                    Location Zone &amp; Out-of-Town Mobilization
                  </label>
                  <span className="font-num text-xs font-semibold text-[#8B4A2B] bg-[#F7EFE1] px-2.5 py-0.5 rounded border border-[#E5D3B3]">
                    Mobilization: ₱{mobilizationFee.toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={selectedZoneName}
                    onChange={(e) => {
                      setSelectedZoneName(e.target.value);
                      setCustomMobilizationFee(null);
                    }}
                    className="sm:col-span-1 w-full px-3 py-2 border border-[#D6CFC2] rounded-lg text-xs bg-[#FAF8F4] text-[#1C1917] font-medium"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.name}>
                        {z.name} (₱{z.defaultFee.toLocaleString()})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={zoneDetail}
                    onChange={(e) => setZoneDetail(e.target.value)}
                    placeholder="Specific town / city note (e.g. Tagaytay Ridge)"
                    className="sm:col-span-1 w-full px-3 py-2 border border-[#D6CFC2] rounded-lg text-xs bg-white text-[#1C1917] placeholder:text-[#A8A29E]"
                  />
                  <div className="relative">
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      title="Reference Number"
                      className="w-full pl-14 pr-3 py-2 font-num border border-[#D6CFC2] rounded-lg text-xs bg-[#FAF8F4] text-[#1C1917]"
                    />
                    <span className="absolute left-3 top-2 text-[10px] font-semibold uppercase tracking-wider text-[#78716C]">
                      REF #
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* STEP 02: SERVICE PACKAGES & ADD-ONS */}
          <section className="bg-[#FFFDF9] border border-[#E5DFD3] rounded-xl p-6 shadow-[0_2px_10px_-4px_rgba(28,25,23,0.04)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFECE4]">
              <div className="flex items-baseline gap-3">
                <span className="font-num text-xs font-semibold text-[#8B4A2B] tracking-wider">
                  02
                </span>
                <div>
                  <h2 className="font-editorial text-lg font-semibold text-[#1C1917]">
                    Selected Packages &amp; Station Upgrades
                  </h2>
                  <p className="text-[11px] text-[#78716C]">
                    Configure packages for this quote. Permanent catalog items are managed in{' '}
                    <Link
                      href="/catalog"
                      className="text-[#8B4A2B] hover:underline font-medium inline-flex items-center gap-0.5"
                    >
                      Service Catalog <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddServiceRow}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1C1917] text-[#FAF7F2] hover:bg-[#8B4A2B] font-medium text-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Another Service
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {services.map((srvConfig, sIndex) => {
                const currentPkg = packages.find((p) => p.id === srvConfig.packageId);
                const availableAddons = addons.filter((a) => a.serviceId === srvConfig.packageId);
                const computedSrv = computedServices[sIndex];

                return (
                  <div
                    key={sIndex}
                    className="rounded-xl border border-[#DFD8CA] bg-[#FAF8F4] overflow-hidden"
                  >
                    {/* Service Line Header */}
                    <div className="px-4 py-3.5 bg-[#F2EFE8] border-b border-[#DFD8CA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5 flex-1">
                        <span className="font-num text-[11px] font-semibold bg-[#1C1917] text-[#FAF7F2] px-2 py-0.5 rounded">
                          #{sIndex + 1}
                        </span>
                        <select
                          value={srvConfig.packageId}
                          onChange={(e) => handleServicePackageChange(sIndex, e.target.value)}
                          className="px-3 py-1.5 border border-[#D0C8B8] rounded-lg text-sm font-semibold text-[#1C1917] bg-[#FFFDF9] cursor-pointer"
                        >
                          {packages.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — ₱{p.basePrice.toLocaleString()}
                            </option>
                          ))}
                        </select>
                        {currentPkg && (
                          <span className="text-[11px] text-[#78716C]">
                            {currentPkg.baseHours} hrs • {currentPkg.basePax} PAX
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-[10px] uppercase tracking-wider text-[#78716C] block">
                            Line Total
                          </span>
                          <span className="font-num text-sm font-semibold text-[#1C1917]">
                            ₱{computedSrv?.serviceTotal.toLocaleString()}
                          </span>
                        </div>
                        {services.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveServiceRow(sIndex)}
                            title="Remove service line from quote"
                            className="p-1.5 text-[#78716C] hover:text-[#9E3B33] rounded-md hover:bg-[#E5DFD3] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Add-ons Grid */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#78716C]">
                          Optional Upgrades &amp; Add-ons ({availableAddons.length})
                        </span>
                      </div>

                      {availableAddons.length === 0 ? (
                        <div className="p-3.5 rounded-lg border border-[#E5DFD3] bg-[#FFFDF9] text-[#78716C] text-xs">
                          No add-ons linked to <strong>{currentPkg?.name}</strong>.{' '}
                          <Link
                            href="/catalog"
                            className="text-[#8B4A2B] font-medium underline hover:text-[#1C1917]"
                          >
                            Add in Service Catalog &rarr;
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {availableAddons.map((addon) => {
                            const isSelected = srvConfig.selectedAddonConfigs.some(
                              (c) => c.addonId === addon.id
                            );
                            const activeConfig = srvConfig.selectedAddonConfigs.find(
                              (c) => c.addonId === addon.id
                            );

                            return (
                              <div
                                key={addon.id}
                                className={`p-3 rounded-lg border transition-all ${
                                  isSelected
                                    ? 'bg-[#FFFDF9] border-[#8B4A2B] shadow-2xs'
                                    : 'bg-[#FFFDF9]/60 border-[#E5DFD3] hover:border-[#C8B9A6]'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 select-none">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleAddon(sIndex, addon.id)}
                                      className="rounded border-[#C8B9A6] text-[#8B4A2B] focus:ring-[#8B4A2B] w-4 h-4 cursor-pointer accent-[#8B4A2B]"
                                    />
                                    <span className="text-xs font-medium text-[#1C1917]">
                                      {addon.name}
                                    </span>
                                  </label>

                                  <span className="font-num text-[11px] font-semibold text-[#57534E] shrink-0">
                                    {addon.pricingType === 'interval' &&
                                      `₱${addon.basePrice.toLocaleString()}/${addon.intervalUnit}`}
                                    {addon.pricingType === 'fixed' &&
                                      `₱${addon.basePrice.toLocaleString()}`}
                                    {addon.pricingType === 'variant' &&
                                      `${addon.variants?.length} sizes`}
                                  </span>
                                </div>

                                {/* Quantity & Variant Controls when checked */}
                                {isSelected && activeConfig && (
                                  <div className="mt-2.5 pt-2.5 border-t border-[#EFECE4] space-y-2">
                                    {addon.pricingType === 'variant' &&
                                      addon.variants &&
                                      addon.variants.length > 0 && (
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-[11px] text-[#78716C]">
                                            Variant:
                                          </span>
                                          <select
                                            value={
                                              activeConfig.variantId || addon.variants[0]?.id || ''
                                            }
                                            onChange={(e) =>
                                              handleUpdateAddonVariant(
                                                sIndex,
                                                addon.id,
                                                e.target.value
                                              )
                                            }
                                            className="flex-1 px-2 py-1 text-xs border border-[#D6CFC2] rounded bg-[#FAF8F4] font-medium text-[#1C1917]"
                                          >
                                            {addon.variants.map((v) => (
                                              <option key={v.id} value={v.id}>
                                                {v.name} (+₱{v.priceDelta.toLocaleString()})
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      )}

                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[11px] text-[#78716C]">Quantity:</span>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          min={1}
                                          value={activeConfig.quantity}
                                          onChange={(e) =>
                                            handleUpdateAddonQty(
                                              sIndex,
                                              addon.id,
                                              parseInt(e.target.value, 10) || 1
                                            )
                                          }
                                          className="w-16 px-2 py-0.5 text-xs font-num border border-[#D6CFC2] rounded text-center bg-white"
                                        />
                                        <span className="font-num text-[11px] font-semibold text-[#8B4A2B]">
                                          = ₱
                                          {(() => {
                                            const activeVar =
                                              addon.pricingType === 'variant'
                                                ? addon.variants?.find(
                                                    (v) => v.id === activeConfig.variantId
                                                  ) || addon.variants?.[0]
                                                : null;
                                            const unitRate = activeVar
                                              ? activeVar.priceDelta
                                              : addon.basePrice || 0;
                                            return (
                                              unitRate * (activeConfig.quantity || 1)
                                            ).toLocaleString();
                                          })()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* STEP 03: PROMOTIONAL ADJUSTMENTS & DISCOUNTS */}
          <section className="bg-[#FFFDF9] border border-[#E5DFD3] rounded-xl p-6 shadow-[0_2px_10px_-4px_rgba(28,25,23,0.04)]">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFECE4]">
              <div className="flex items-baseline gap-3">
                <span className="font-num text-xs font-semibold text-[#8B4A2B] tracking-wider">
                  03
                </span>
                <div>
                  <h2 className="font-editorial text-lg font-semibold text-[#1C1917]">
                    Discounts &amp; Client Incentives
                  </h2>
                  <p className="text-[11px] text-[#78716C]">
                    Check only the discounts that apply to this client, or add a custom promo deal.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAddDiscount}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F2EB] hover:bg-[#E7E1D5] text-[#1C1917] text-xs font-medium border border-[#D6CFC2] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#8B4A2B]" />
                Add Discount
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
              {discountOptions.length === 0 ? (
                <div className="sm:col-span-2 p-4 rounded-lg border border-dashed border-[#D6CFC2] text-center text-[#78716C] text-xs">
                  No discount presets. Click &quot;Add Discount&quot; to create one.
                </div>
              ) : (
                discountOptions.map((disc) => {
                  const isSelected = disc.isEnabled;
                  const calculatedDeduction =
                    disc.type === 'percent'
                      ? (subtotal * disc.value) / 100
                      : Math.min(disc.value, subtotal);

                  return (
                    <div
                      key={disc.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-[#2E5A44] bg-[#EAF2EC]/70'
                          : 'border-[#E5DFD3] bg-[#FAF8F4] hover:border-[#C8B9A6]'
                      }`}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 mr-2 select-none">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleDiscount(disc.id)}
                          className="rounded border-[#C8B9A6] w-4 h-4 cursor-pointer accent-[#2E5A44]"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-[#1C1917]">{disc.name}</span>
                            <span
                              className={`font-num text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                isSelected
                                  ? 'bg-[#2E5A44] text-white'
                                  : 'bg-[#E5DFD3] text-[#57534E]'
                              }`}
                            >
                              {disc.type === 'percent'
                                ? `${disc.value}%`
                                : `₱${disc.value.toLocaleString()}`}
                            </span>
                          </div>
                          {isSelected && subtotal > 0 && (
                            <span className="font-num text-[10px] text-[#2E5A44] font-medium block mt-0.5">
                              Deducts ₱
                              {calculatedDeduction.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          )}
                        </div>
                      </label>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditDiscount(disc)}
                          title="Edit discount"
                          className="p-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-[#E5DFD3]/60 rounded transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDiscount(disc.id)}
                          title="Delete discount"
                          className="p-1.5 text-[#78716C] hover:text-[#9E3B33] hover:bg-[#FBECEB] rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* ================= RIGHT COLUMN: STICKY LIVE QUOTATION FOLIO (5 Cols) ================= */}
        <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-22 space-y-4">
          <div className="bg-[#FFFDF9] border border-[#DED8CC] rounded-xl shadow-[0_12px_32px_-12px_rgba(28,25,23,0.08)] overflow-hidden">
            {/* Folio Top Header */}
            <div className="bg-[#1C1917] text-[#FAF7F2] px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#C8B9A6]">
                  Live Quotation Folio
                </span>
                <span className="font-num text-[11px] text-[#E6B88A] font-medium">
                  {invoiceNumber}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <h3 className="font-editorial text-lg font-normal text-white truncate">
                  {clientName || 'Untitled Client Quote'}
                </h3>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#2E2925] text-[#DFC9A6] border border-[#3D3732] shrink-0">
                  {packageTierBadge}
                </span>
              </div>
              <p className="text-[11px] text-[#A8A29E] mt-0.5 truncate">
                {eventType} • {eventDate} {venueName ? `• ${venueName}` : ''}
              </p>
            </div>

            {/* Line Items Breakdown */}
            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-2.5 pb-3 border-b border-[#EFECE4]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#78716C]">
                  Selected Services
                </div>
                {computedServices.map((srv, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-medium text-[#1C1917]">
                      <span>{srv.packageName}</span>
                      <span className="font-num">₱{srv.basePrice.toLocaleString()}</span>
                    </div>
                    {srv.selectedAddons.map((add, aIdx) => (
                      <div
                        key={aIdx}
                        className="flex justify-between text-[11px] text-[#68625D] pl-3 border-l border-[#E5DFD3]"
                      >
                        <span className="truncate pr-2">+ {add.name}</span>
                        <span className="font-num shrink-0">
                          ₱{add.totalPrice.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Subtotals & Adjustments */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#57534E]">
                  <span>Gross Subtotal</span>
                  <span className="font-num font-medium text-[#1C1917]">
                    ₱{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {activeDiscounts.map((d) => (
                  <div key={d.id} className="flex justify-between text-[#2E5A44] font-medium">
                    <span className="truncate pr-2">
                      Less: {d.name} {d.type === 'percent' ? `(${d.value}%)` : ''}
                    </span>
                    <span className="font-num shrink-0">
                      -₱{d.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}

                <div className="flex justify-between text-[#57534E]">
                  <span>Mobilization ({selectedZoneName})</span>
                  <span className="font-num font-medium text-[#1C1917]">
                    ₱{mobilizationFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Net Package Total Highlight */}
              <div className="bg-[#F7EFE1] border border-[#E2CFAF] rounded-lg px-4 py-3 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8B4A2B] block">
                    Net Package Total
                  </span>
                  <span className="text-[10px] text-[#78716C]">Inclusive of selected upgrades</span>
                </div>
                <span className="font-num text-lg font-semibold text-[#1C1917]">
                  ₱{packageTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Downpayment Configurator inside Folio */}
              <div className="p-3.5 rounded-lg bg-[#FAF8F4] border border-[#E5DFD3] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#57534E]">Reservation Terms</span>
                  <select
                    value={downpaymentMode}
                    onChange={(e) => setDownpaymentMode(e.target.value as 'amount' | 'percent')}
                    className="px-2 py-1 text-[11px] border border-[#D6CFC2] rounded bg-white font-medium text-[#1C1917]"
                  >
                    <option value="amount">Fixed Deposit (₱)</option>
                    <option value="percent">Percentage (%)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#78716C]">
                    {downpaymentMode === 'amount' ? 'Deposit Amount' : 'Deposit Rate'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={downpaymentValue}
                      onChange={(e) => setDownpaymentValue(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 font-num text-xs border border-[#D6CFC2] rounded bg-white text-right font-semibold text-[#1C1917]"
                    />
                    <span className="font-num text-xs font-semibold text-[#57534E]">
                      {downpaymentMode === 'amount' ? '₱' : '%'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E5DFD3] space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#57534E]">Downpayment Due:</span>
                    <span className="font-num font-semibold text-[#8B4A2B]">
                      ₱{computedDownpayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-[#1C1917]">
                    <span>Balance Upon Event:</span>
                    <span className="font-num">
                      ₱{remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleGenerateInvoiceNow}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#1C1917] hover:bg-[#8B4A2B] text-[#FAF7F2] text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <FileCheck className="w-4 h-4" />
                  Generate &amp; Sign Official Invoice
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleOpenPreview}
                    className="py-2 px-3 rounded-lg bg-[#F3EFE6] hover:bg-[#E6E0D4] text-[#1C1917] border border-[#D6CFC2] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#8B4A2B]" />
                    Canva Quote PDF
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveProposal}
                    className="py-2 px-3 rounded-lg bg-white hover:bg-[#FAF8F4] text-[#292524] border border-[#D6CFC2] text-xs font-medium transition-colors cursor-pointer"
                  >
                    Save Draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Add / Edit Discount Modal */}
      {showAddDiscountModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 flex items-center justify-center backdrop-blur-[2px]">
          <div className="relative w-full max-w-md bg-[#FFFDF9] border border-[#DED8CC] rounded-xl p-6 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setShowAddDiscountModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-[#78716C] hover:bg-[#EFECE4] hover:text-[#1C1917] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B4A2B]">
                Promotional Adjustment
              </span>
              <h3 className="font-editorial text-xl font-semibold text-[#1C1917] mt-0.5">
                {editingDiscountId ? 'Edit Discount Preset' : 'New Client Discount'}
              </h3>
              <p className="text-xs text-[#78716C] mt-1">
                Configure a percentage or fixed peso deduction for client proposals.
              </p>
            </div>

            <form onSubmit={handleSaveDiscountForm} className="space-y-4 text-xs pt-1">
              <div>
                <label className="font-medium text-[#292524] block mb-1.5">Discount Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bridal Fair 10% Promo, Repeat Client Deal"
                  value={discountFormName}
                  onChange={(e) => setDiscountFormName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#D6CFC2] rounded-lg text-sm bg-white text-[#1C1917]"
                />
              </div>

              <div>
                <label className="font-medium text-[#292524] block mb-1.5">Calculation Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountFormType('percent')}
                    className={`py-2 rounded-lg font-medium text-xs border transition-all cursor-pointer ${
                      discountFormType === 'percent'
                        ? 'bg-[#1C1917] text-[#FAF7F2] border-[#1C1917]'
                        : 'bg-[#FAF8F4] text-[#57534E] border-[#D6CFC2] hover:bg-[#EFECE4]'
                    }`}
                  >
                    % Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountFormType('fixed')}
                    className={`py-2 rounded-lg font-medium text-xs border transition-all cursor-pointer ${
                      discountFormType === 'fixed'
                        ? 'bg-[#1C1917] text-[#FAF7F2] border-[#1C1917]'
                        : 'bg-[#FAF8F4] text-[#57534E] border-[#D6CFC2] hover:bg-[#EFECE4]'
                    }`}
                  >
                    ₱ Fixed Amount
                  </button>
                </div>
              </div>

              <div>
                <label className="font-medium text-[#292524] block mb-1.5">
                  {discountFormType === 'percent'
                    ? 'Discount Percentage (%)'
                    : 'Discount Amount (₱)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={1}
                    max={discountFormType === 'percent' ? 100 : 1000000}
                    value={discountFormValue}
                    onChange={(e) => setDiscountFormValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 border border-[#D6CFC2] rounded-lg text-sm font-num font-semibold bg-white text-[#1C1917]"
                  />
                  <span className="absolute right-3.5 top-2.5 font-num font-semibold text-[#78716C]">
                    {discountFormType === 'percent' ? '%' : '₱'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDiscountModal(false)}
                  className="px-4 py-2 text-xs text-[#57534E] hover:bg-[#EFECE4] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-[#1C1917] hover:bg-[#8B4A2B] text-[#FAF7F2] font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {editingDiscountId ? 'Save Changes' : 'Add & Apply to Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Canva Document Preview Modal */}
      {showPreviewModal && activePreviewProposal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 sm:p-6 flex items-start justify-center backdrop-blur-[2px]">
          <div className="relative w-full max-w-4xl bg-[#FFFDF9] border border-[#DED8CC] rounded-xl p-6 shadow-2xl my-8">
            <button
              type="button"
              onClick={() => setShowPreviewModal(false)}
              className="no-print absolute top-5 right-5 p-2 rounded-lg bg-[#F5F2EB] hover:bg-[#E5DFD3] text-[#1C1917] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <CanvaDocumentView
              document={activePreviewProposal}
              currentUser={currentUser || undefined}
              onConvertToInvoice={handleGenerateInvoiceNow}
            />
          </div>
        </div>
      )}
    </div>
  );
}
