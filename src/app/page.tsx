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
  saveProposal,
  getCurrentUser,
  convertProposalToInvoice,
  generateAutomatedInvoiceNumber,
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
      const [cloudPkgs, cloudAdds, cloudZns] = await Promise.all([
        syncPackagesFromCloud(),
        syncAddonsFromCloud(),
        syncZonesFromCloud(),
      ]);
      setPackages(cloudPkgs);
      setAddons(cloudAdds);
      setZones(cloudZns);
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
      id: `prop-${Date.now()}`,
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs flex items-center gap-2 animate-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-[#8b4513] text-white rounded-t-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-bold text-white">
            <Calculator className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide uppercase">
              THE HAPPY CLUB / TCHS PACKAGE CALCULATOR
            </h1>
            <p className="text-xs text-amber-200">
              Live proposal builder • Select packages & add-ons for your client quote
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleStartNewProposal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            New Proposal
          </button>
        </div>
      </div>

      {/* Main Calculator Form */}
      <div className="bg-white border-x border-b border-slate-200 rounded-b-2xl shadow-sm p-6 space-y-8">
        {/* ================= 1. CLIENT / EVENT DETAILS ================= */}
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-700" />
              1. Client / Event Details
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Corner Badge:</span>
              <select
                value={packageTierBadge}
                onChange={(e) => setPackageTierBadge(e.target.value)}
                className="text-xs font-semibold px-2 py-1 bg-amber-50 border border-amber-300 rounded text-amber-900"
              >
                <option value="PACKAGE A">PACKAGE A</option>
                <option value="PACKAGE B">PACKAGE B</option>
                <option value="SPECIAL PACKAGE">SPECIAL PACKAGE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700">Client / Couple Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Clinton Correa or Leah & Mark"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-teal-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Client Address</label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Complete billing address"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-teal-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700">Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-teal-600 bg-white"
                >
                  {eventTypes.map((et) => (
                    <option key={et} value={et}>
                      {et}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Name of Venue</label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="e.g. Villa Soledad Resort / Shangri-La The Fort"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-teal-600"
              />
            </div>

            {/* Location / Zone Dropdown */}
            <div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-700" />
                  Location / Zone (Mobilization)
                </label>
                <span className="text-[11px] text-teal-700 font-semibold">
                  Fee: ₱{mobilizationFee.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                <select
                  value={selectedZoneName}
                  onChange={(e) => {
                    setSelectedZoneName(e.target.value);
                    setCustomMobilizationFee(null);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:outline-teal-600"
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
                  placeholder="Specific location (e.g. Sta. Maria Bulacan)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-teal-600"
                />
              </div>
            </div>

            {/* Automated Invoice Number */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Invoice Number (Automated)
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg text-sm bg-slate-50 focus:outline-teal-600"
              />
            </div>
          </div>
        </div>

        {/* ================= 2. PACKAGE & ADD-ONS ================= */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-700" />
                2. Select Packages & Add-ons for this Proposal
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pick services from the catalog. To update, add or delete catalog services permanently, visit{' '}
                <Link
                  href="/catalog"
                  className="text-teal-700 hover:text-teal-900 font-semibold underline inline-flex items-center gap-0.5"
                >
                  Service Catalog <ExternalLink className="w-3 h-3" />
                </Link>
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddServiceRow}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-700 text-white hover:bg-teal-800 font-semibold text-xs shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Service
            </button>
          </div>

          <div className="mt-4 space-y-6">
            {services.map((srvConfig, sIndex) => {
              const currentPkg = packages.find((p) => p.id === srvConfig.packageId);
              const availableAddons = addons.filter((a) => a.serviceId === srvConfig.packageId);
              const computedSrv = computedServices[sIndex];

              return (
                <div
                  key={sIndex}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 shadow-xs space-y-4"
                >
                  {/* Service Header Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      <span className="font-bold text-xs bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg">
                        Service {sIndex + 1}
                      </span>
                      <select
                        value={srvConfig.packageId}
                        onChange={(e) => handleServicePackageChange(sIndex, e.target.value)}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 bg-white"
                      >
                        {packages.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Base: ₱{p.basePrice.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-teal-800">
                        ₱{computedSrv?.serviceTotal.toLocaleString()}
                      </span>
                      {services.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveServiceRow(sIndex)}
                          title="Remove this service from proposal"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Add-ons Checklist */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Available Add-ons for {currentPkg?.name}:
                    </div>

                    {availableAddons.length === 0 ? (
                      <div className="p-3 rounded-xl border border-slate-200 bg-white/70 text-slate-500 text-xs">
                        No add-ons registered for <strong>{currentPkg?.name}</strong> yet.{' '}
                        <Link
                          href="/catalog"
                          className="text-teal-700 font-semibold underline hover:text-teal-900"
                        >
                          Configure in Service Catalog &rarr;
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
                              className={`p-3 rounded-xl border transition-all ${
                                isSelected
                                  ? 'bg-white border-teal-600 shadow-xs'
                                  : 'bg-white/70 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleAddon(sIndex, addon.id)}
                                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                                  />
                                  <span className="text-xs font-semibold text-slate-800">
                                    {addon.name}
                                  </span>
                                </label>

                                <span className="text-xs font-bold text-teal-700 ml-2">
                                  {addon.pricingType === 'interval' &&
                                    `₱${addon.basePrice.toLocaleString()}/${addon.intervalUnit}`}
                                  {addon.pricingType === 'fixed' &&
                                    `₱${addon.basePrice.toLocaleString()}`}
                                  {addon.pricingType === 'variant' &&
                                    `${addon.variants?.length} Options`}
                                </span>
                              </div>

                              {/* Quantity & Variant Selector */}
                              {isSelected && activeConfig && (
                                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                  <span className="text-[11px] text-slate-500">Units / Qty:</span>
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
                                      className="w-16 px-2 py-0.5 text-xs border border-slate-300 rounded text-center"
                                    />
                                    <span className="text-[11px] font-semibold text-slate-700">
                                      = ₱
                                      {(
                                        (addon.basePrice || 0) * (activeConfig.quantity || 1)
                                      ).toLocaleString()}
                                    </span>
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
        </div>

        {/* ================= 3. DISCOUNTS & MOBILIZATION ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-teal-700" />
                3. Discounts & Incentives
              </h2>
              <button
                type="button"
                onClick={handleOpenAddDiscount}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-semibold border border-teal-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3 text-teal-700" />
                Add Discount
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Select which discounts apply to this client. You can edit names/values or add custom discounts.
            </p>

            <div className="space-y-2">
              {discountOptions.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-xs">
                  No discounts created. Click &quot;Add Discount&quot; above to create one.
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
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 mr-2 select-none">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleDiscount(disc.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold ${
                                isSelected ? 'text-emerald-950' : 'text-slate-800'
                              }`}
                            >
                              {disc.name}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                isSelected
                                  ? 'bg-emerald-200/70 text-emerald-900 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {disc.type === 'percent'
                                ? `${disc.value}%`
                                : `₱${disc.value.toLocaleString()}`}
                            </span>
                          </div>
                          {isSelected && subtotal > 0 && (
                            <span className="text-[10px] text-emerald-700 block mt-0.5">
                              Saves ₱
                              {calculatedDeduction.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          )}
                        </div>
                      </label>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditDiscount(disc)}
                          title="Edit discount name or rate"
                          className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDiscount(disc.id)}
                          title="Remove discount"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-teal-700" />
              4. Payment & Downpayment Terms
            </h2>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Downpayment Format:</span>
                <select
                  value={downpaymentMode}
                  onChange={(e) => setDownpaymentMode(e.target.value as 'amount' | 'percent')}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white font-medium"
                >
                  <option value="amount">Fixed Amount in ₱</option>
                  <option value="percent">Percentage in %</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">
                  {downpaymentMode === 'amount' ? 'Downpayment Amount:' : 'Downpayment Percentage:'}
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={downpaymentValue}
                    onChange={(e) => setDownpaymentValue(parseFloat(e.target.value) || 0)}
                    className="w-28 px-2 py-1 border border-slate-300 rounded bg-white text-right font-semibold"
                  />
                  <span className="font-semibold text-slate-700">
                    {downpaymentMode === 'amount' ? '₱' : '%'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold">
                <span className="text-teal-800">Deposit Required:</span>
                <span className="text-teal-900 text-sm">
                  ₱{computedDownpayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 4. PRICING SUMMARY ================= */}
        <div className="pt-4 border-t-2 border-slate-300">
          <div className="max-w-md ml-auto bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200">
              Pricing Summary
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">
                ₱{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {activeDiscounts.length > 0 && (
              <div className="space-y-1 py-0.5">
                {activeDiscounts.map((d) => (
                  <div key={d.id} className="flex justify-between text-emerald-700 font-medium">
                    <span className="truncate pr-2">
                      Discount ({d.name}
                      {d.type === 'percent' ? ` - ${d.value}%` : ''}):
                    </span>
                    <span>
                      -₱{d.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Mobilization Fee ({selectedZoneName}):</span>
              <span className="font-semibold text-slate-900">
                ₱{mobilizationFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Total Package (Yellow Highlight) */}
            <div className="bg-[#fef08a] px-3 py-2 rounded-lg font-bold text-slate-900 flex justify-between items-baseline text-sm mt-2 border border-amber-300 shadow-xs">
              <span className="uppercase tracking-wide">TOTAL PACKAGE:</span>
              <span className="text-base font-extrabold text-amber-950">
                ₱{packageTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-slate-700 pt-1">
              <span>Downpayment:</span>
              <span className="font-semibold text-teal-800">
                ₱{computedDownpayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-slate-700 font-bold border-t border-slate-200 pt-1">
              <span>Remaining Balance:</span>
              <span className="text-slate-900">
                ₱{remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={handleSaveProposal}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            Save Draft Proposal
          </button>

          <button
            type="button"
            onClick={handleOpenPreview}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm"
          >
            <Eye className="w-4 h-4" />
            Preview Canva PDF & Quotation
          </button>

          <button
            type="button"
            onClick={handleGenerateInvoiceNow}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
          >
            <FileCheck className="w-4 h-4" />
            Generate & Sign Invoice
          </button>
        </div>
      </div>

      {/* Add / Edit Discount Modal */}
      {showAddDiscountModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 flex items-center justify-center backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setShowAddDiscountModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-teal-700" />
              <h3 className="text-base font-bold text-slate-900">
                {editingDiscountId ? 'Edit Discount' : 'Add New Discount'}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Customize promo discounts. Once saved, you can toggle it on or off for this client.
            </p>

            <form onSubmit={handleSaveDiscountForm} className="space-y-4 text-xs pt-1">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Discount Title / Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15% OFF Special Promo, Repeat Client Deal"
                  value={discountFormName}
                  onChange={(e) => setDiscountFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-teal-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Calculation Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountFormType('percent')}
                    className={`py-2 rounded-xl font-semibold text-xs border transition-all cursor-pointer ${
                      discountFormType === 'percent'
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    % Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountFormType('fixed')}
                    className={`py-2 rounded-xl font-semibold text-xs border transition-all cursor-pointer ${
                      discountFormType === 'fixed'
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    ₱ Fixed Amount
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-teal-600"
                  />
                  <span className="absolute right-3 top-2.5 font-bold text-slate-400">
                    {discountFormType === 'percent' ? '%' : '₱'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDiscountModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingDiscountId ? 'Save Changes' : 'Add & Include in Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Canva Document Preview Modal */}
      {showPreviewModal && activePreviewProposal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 sm:p-6 flex items-start justify-center backdrop-blur-xs">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl p-6 shadow-2xl my-8">
            <button
              type="button"
              onClick={() => setShowPreviewModal(false)}
              className="no-print absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
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
