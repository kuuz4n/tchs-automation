'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  MapPin,
  Calendar,
} from 'lucide-react';
import {
  getCategories,
  syncCategoriesFromCloud,
  saveCategory,
  deleteCategory,
  getPackages,
  syncPackagesFromCloud,
  savePackage,
  deletePackage,
  getAddons,
  syncAddonsFromCloud,
  saveAddon,
  deleteAddon,
  getZones,
  syncZonesFromCloud,
  saveZone,
  deleteZone,
  getEventTypes,
  saveEventType,
  updateEventType,
  deleteEventType,
} from '@/lib/storage';
import {
  ServiceCategory,
  ServicePackage,
  Addon,
  AddonVariant,
  PricingType,
  IntervalUnit,
  LocationZone,
} from '@/types';

export default function CatalogPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [zones, setZones] = useState<LocationZone[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  // Modals & form state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgScriptTitle, setPkgScriptTitle] = useState('');
  const [pkgSubtitle, setPkgSubtitle] = useState('');
  const [pkgBadgeText, setPkgBadgeText] = useState('');
  const [pkgPrice, setPkgPrice] = useState('15000');
  const [pkgHours, setPkgHours] = useState('2');
  const [pkgPax, setPkgPax] = useState('100');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgInclusions, setPkgInclusions] = useState('');
  const [pkgFreebies, setPkgFreebies] = useState('');

  const [showAddonModal, setShowAddonModal] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [addonName, setAddonName] = useState('');
  const [addonTag, setAddonTag] = useState('');
  const [addonPricingType, setAddonPricingType] = useState<PricingType>('interval');
  const [addonBasePrice, setAddonBasePrice] = useState('2500');
  const [addonIntervalUnit, setAddonIntervalUnit] = useState<IntervalUnit>('HOUR');
  const [addonIntervalStep, setAddonIntervalStep] = useState('1');
  const [addonDefaultQty, setAddonDefaultQty] = useState('1');
  const [addonDesc, setAddonDesc] = useState('');
  const [addonVariants, setAddonVariants] = useState<AddonVariant[]>([]);

  // Variant input helper
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');
  const [newVariantIsPax, setNewVariantIsPax] = useState(false);

  // Location Zone modal state
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState<LocationZone | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneFee, setZoneFee] = useState('0');
  const [zoneDesc, setZoneDesc] = useState('');

  // Event Type modal state
  const [showEventTypeModal, setShowEventTypeModal] = useState(false);
  const [editingEventType, setEditingEventType] = useState<string | null>(null);
  const [eventTypeName, setEventTypeName] = useState('');

  useEffect(() => {
    refreshData(true);
  }, []);

  const refreshData = async (syncCloud = false) => {
    const cats = getCategories();
    const pkgs = getPackages();
    const adds = getAddons();
    const zns = getZones();
    const evts = getEventTypes();

    setCategories(cats);
    setPackages(pkgs);
    setAddons(adds);
    setZones(zns);
    setEventTypes(evts);

    if (cats.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(cats[0].id);
    }

    if (syncCloud) {
      try {
        const [cCats, cPkgs, cAdds, cZns] = await Promise.all([
          syncCategoriesFromCloud(),
          syncPackagesFromCloud(),
          syncAddonsFromCloud(),
          syncZonesFromCloud(),
        ]);
        setCategories(cCats);
        setPackages(cPkgs);
        setAddons(cAdds);
        setZones(cZns);
      } catch (e) {
        console.warn('Catalog cloud sync warning:', e);
      }
    }
  };

  const currentCategory = categories.find((c) => c.id === selectedCategoryId);
  const currentPackages = packages.filter((p) => p.categoryId === selectedCategoryId);

  useEffect(() => {
    if (
      currentPackages.length > 0 &&
      (!selectedPackageId || !currentPackages.find((p) => p.id === selectedPackageId))
    ) {
      setSelectedPackageId(currentPackages[0].id);
    }
  }, [selectedCategoryId, currentPackages, selectedPackageId]);

  const currentPackage = packages.find((p) => p.id === selectedPackageId);
  const currentAddons = addons.filter((a) => a.serviceId === selectedPackageId);

  // Category handlers
  const handleOpenCatModal = (cat?: ServiceCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatDesc(cat.description || '');
    } else {
      setEditingCategory(null);
      setCatName('');
      setCatDesc('');
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const newCat: ServiceCategory = {
      id: editingCategory ? editingCategory.id : `cat-${Date.now()}`,
      name: catName.trim(),
      description: catDesc.trim(),
      sortOrder: editingCategory ? editingCategory.sortOrder : categories.length + 1,
      isActive: true,
    };
    await saveCategory(newCat);
    setShowCategoryModal(false);
    refreshData();
    setSelectedCategoryId(newCat.id);
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (
      confirm(
        `Are you sure you want to delete category "${name}" and all its packages and add-ons?`
      )
    ) {
      await deleteCategory(id);
      refreshData();
      const remaining = categories.filter((c) => c.id !== id);
      if (remaining.length > 0) setSelectedCategoryId(remaining[0].id);
    }
  };

  // Package handlers
  const handleOpenPkgModal = (pkg?: ServicePackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPkgName(pkg.name);
      setPkgScriptTitle(pkg.scriptTitle || '');
      setPkgSubtitle(pkg.subtitle || '');
      setPkgBadgeText(pkg.badgeText || '');
      setPkgPrice(pkg.basePrice.toString());
      setPkgHours(pkg.baseHours.toString());
      setPkgPax(pkg.basePax.toString());
      setPkgDesc(pkg.description);
      setPkgInclusions((pkg.inclusions || []).join('\n'));
      setPkgFreebies((pkg.freebies || []).join('\n'));
    } else {
      setEditingPackage(null);
      setPkgName('');
      setPkgScriptTitle('');
      setPkgSubtitle('');
      setPkgBadgeText('');
      setPkgPrice('15000');
      setPkgHours('2');
      setPkgPax('100');
      setPkgDesc('');
      setPkgInclusions('');
      setPkgFreebies('');
    }
    setShowPackageModal(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim() || !selectedCategoryId) return;

    const newPkg: ServicePackage = {
      id: editingPackage ? editingPackage.id : `pkg-${Date.now()}`,
      categoryId: selectedCategoryId,
      name: pkgName.trim(),
      scriptTitle: pkgScriptTitle.trim() || undefined,
      subtitle: pkgSubtitle.trim() || undefined,
      shortCode: editingPackage?.shortCode,
      badgeText: pkgBadgeText.trim() || undefined,
      basePrice: parseFloat(pkgPrice) || 0,
      baseHours: parseFloat(pkgHours) || 2,
      basePax: parseInt(pkgPax, 10) || 100,
      description: pkgDesc.trim(),
      specs: editingPackage?.specs,
      inclusions: pkgInclusions
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      freebies: pkgFreebies
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      isActive: true,
    };
    await savePackage(newPkg);
    setShowPackageModal(false);
    refreshData();
    setSelectedPackageId(newPkg.id);
  };

  const handleDeletePackage = async (id: string, name: string) => {
    if (confirm(`Delete package "${name}"?`)) {
      await deletePackage(id);
      refreshData();
    }
  };

  // Addon handlers
  const handleOpenAddonModal = (addon?: Addon) => {
    if (addon) {
      setEditingAddon(addon);
      setAddonName(addon.name);
      setAddonTag(addon.categoryTag || '');
      setAddonPricingType(addon.pricingType);
      setAddonBasePrice(addon.basePrice.toString());
      setAddonIntervalUnit(addon.intervalUnit || 'HOUR');
      setAddonIntervalStep((addon.intervalStep || 1).toString());
      setAddonDefaultQty((addon.defaultQuantity || 1).toString());
      setAddonDesc(addon.description || '');
      setAddonVariants(addon.variants ? [...addon.variants] : []);
    } else {
      setEditingAddon(null);
      setAddonName('');
      setAddonTag('');
      setAddonPricingType('interval');
      setAddonBasePrice('2500');
      setAddonIntervalUnit('HOUR');
      setAddonIntervalStep('1');
      setAddonDefaultQty('1');
      setAddonDesc('');
      setAddonVariants([]);
    }
    setShowAddonModal(true);
  };

  const handleAddVariant = () => {
    if (!newVariantName.trim()) return;
    const price = parseFloat(newVariantPrice) || 0;
    const v: AddonVariant = {
      id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      addonId: editingAddon?.id || 'temp',
      name: newVariantName.trim(),
      priceDelta: price,
      isPaxDependent: newVariantIsPax,
    };
    setAddonVariants([...addonVariants, v]);
    setNewVariantName('');
    setNewVariantPrice('');
    setNewVariantIsPax(false);
  };

  const handleRemoveVariant = (id: string) => {
    setAddonVariants(addonVariants.filter((v) => v.id !== id));
  };

  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonName.trim() || !selectedPackageId) return;

    const newAddon: Addon = {
      id: editingAddon ? editingAddon.id : `addon-${Date.now()}`,
      serviceId: selectedPackageId,
      name: addonName.trim(),
      categoryTag: addonTag.trim() || undefined,
      pricingType: addonPricingType,
      basePrice: parseFloat(addonBasePrice) || 0,
      intervalUnit: addonPricingType === 'interval' ? addonIntervalUnit : undefined,
      intervalStep:
        addonPricingType === 'interval' ? parseInt(addonIntervalStep, 10) || 1 : undefined,
      defaultQuantity: parseInt(addonDefaultQty, 10) || 1,
      variants: addonPricingType === 'variant' ? addonVariants : undefined,
      description: addonDesc.trim(),
      isActive: true,
    };

    await saveAddon(newAddon);
    setShowAddonModal(false);
    refreshData();
  };

  const handleDeleteAddon = async (id: string, name: string) => {
    if (confirm(`Delete add-on "${name}"?`)) {
      await deleteAddon(id);
      refreshData();
    }
  };

  // Location Zone handlers
  const handleOpenZoneModal = (zone?: LocationZone) => {
    if (zone) {
      setEditingZone(zone);
      setZoneName(zone.name);
      setZoneFee(zone.defaultFee.toString());
      setZoneDesc(zone.description || '');
    } else {
      setEditingZone(null);
      setZoneName('');
      setZoneFee('0');
      setZoneDesc('');
    }
    setShowZoneModal(true);
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return;
    const z: LocationZone = {
      id: editingZone ? editingZone.id : `zone-${Date.now()}`,
      name: zoneName.trim(),
      defaultFee: parseFloat(zoneFee) || 0,
      description: zoneDesc.trim(),
    };
    await saveZone(z);
    setShowZoneModal(false);
    refreshData();
  };

  const handleDeleteZone = async (id: string, name: string) => {
    if (confirm(`Delete location zone "${name}"?`)) {
      await deleteZone(id);
      refreshData();
    }
  };

  // Event Type handlers
  const handleOpenEventTypeModal = (evType?: string) => {
    if (evType) {
      setEditingEventType(evType);
      setEventTypeName(evType);
    } else {
      setEditingEventType(null);
      setEventTypeName('');
    }
    setShowEventTypeModal(true);
  };

  const handleSaveEventType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTypeName.trim()) return;
    if (editingEventType) {
      updateEventType(editingEventType, eventTypeName.trim());
    } else {
      saveEventType(eventTypeName.trim());
    }
    setShowEventTypeModal(false);
    refreshData();
  };

  const handleDeleteEventType = (evType: string) => {
    if (confirm(`Delete event type "${evType}"?`)) {
      deleteEventType(evType);
      refreshData();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5DFD3]">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B4A2B]">
            Master Pricing Database
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#1C1917] mt-1 tracking-tight">
            Service Catalog &amp; Dropdown Registry
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Manage permanent studio categories, package tiers, add-on variants, mobilization zones,
            and event occasion dropdowns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenCatModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1C1917] hover:bg-[#8B4A2B] text-[#FAF7F2] text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Service Category
          </button>
        </div>
      </div>

      {/* Main 3-Column Master-Detail Layout: Categories -> Packages -> Addons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Service Categories */}
        <div className="lg:col-span-3 bg-[#FFFDF9] rounded-xl border border-[#E5DFD3] p-5 flex flex-col">
          <div className="flex items-baseline justify-between pb-3.5 border-b border-[#EFECE4]">
            <div className="flex items-baseline gap-2">
              <span className="font-num text-xs font-semibold text-[#8B4A2B]">01</span>
              <span className="font-editorial text-base font-semibold text-[#1C1917]">
                Service Lines
              </span>
            </div>
            <span className="font-num text-[11px] text-[#78716C]">{categories.length}</span>
          </div>

          <div className="space-y-1.5 mt-3.5 flex-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                  cat.id === selectedCategoryId
                    ? 'bg-[#1C1917] text-[#FAF7F2] border-[#1C1917]'
                    : 'bg-[#FAF8F4] text-[#292524] border-transparent hover:border-[#D6CFC2]'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="text-xs font-semibold truncate">{cat.name}</div>
                  {cat.description && (
                    <div
                      className={`text-[11px] truncate mt-0.5 ${
                        cat.id === selectedCategoryId ? 'text-[#C8B9A6]' : 'text-[#78716C]'
                      }`}
                    >
                      {cat.description}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCatModal(cat);
                    }}
                    className={`p-1 rounded cursor-pointer ${
                      cat.id === selectedCategoryId
                        ? 'hover:bg-[#2E2925] text-[#C8B9A6]'
                        : 'hover:bg-[#E5DFD3] text-[#57534E]'
                    }`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat.id, cat.name);
                    }}
                    className={`p-1 rounded cursor-pointer ${
                      cat.id === selectedCategoryId
                        ? 'hover:bg-[#2E2925] text-[#E8C5C3]'
                        : 'hover:bg-[#FBECEB] text-[#9E3B33]'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Packages under Category */}
        <div className="lg:col-span-4 bg-[#FFFDF9] rounded-xl border border-[#E5DFD3] p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#EFECE4]">
            <div className="flex items-baseline gap-2">
              <span className="font-num text-xs font-semibold text-[#8B4A2B]">02</span>
              <div>
                <span className="font-editorial text-base font-semibold text-[#1C1917] block leading-tight">
                  {currentCategory?.name || 'Packages'}
                </span>
                <span className="text-[11px] text-[#78716C]">Base tiers &amp; Canva inclusions</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenPkgModal()}
              disabled={!selectedCategoryId}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#F5F2EB] text-[#1C1917] hover:bg-[#E7E1D5] border border-[#D6CFC2] font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#8B4A2B]" />
              Add Package
            </button>
          </div>

          <div className="space-y-2.5 mt-3.5 flex-1">
            {currentPackages.length === 0 ? (
              <div className="text-center py-10 text-[#78716C] text-xs">
                No packages registered under this category yet.
              </div>
            ) : (
              currentPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    pkg.id === selectedPackageId
                      ? 'border-[#8B4A2B] bg-[#FAF6F0]'
                      : 'border-[#E5DFD3] hover:border-[#C8B9A6] bg-[#FAF8F4]/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[#1C1917] text-sm">{pkg.name}</h3>
                        {pkg.badgeText && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F7EFE1] text-[#8B4A2B] border border-[#E2CFAF]">
                            {pkg.badgeText}
                          </span>
                        )}
                      </div>
                      <div className="font-num text-xs font-semibold text-[#8B4A2B] mt-1">
                        ₱{pkg.basePrice.toLocaleString()}{' '}
                        <span className="font-sans font-normal text-[#78716C]">
                          • {pkg.baseHours} hrs • {pkg.basePax} PAX
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPkgModal(pkg);
                        }}
                        className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded hover:bg-[#E5DFD3]/60 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePackage(pkg.id, pkg.name);
                        }}
                        className="p-1.5 text-[#78716C] hover:text-[#9E3B33] rounded hover:bg-[#FBECEB] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {pkg.description && (
                    <p className="text-xs text-[#57534E] mt-2 line-clamp-2">{pkg.description}</p>
                  )}

                  {pkg.inclusions?.length > 0 && (
                    <div className="mt-2.5 text-[11px] text-[#57534E] space-y-1 bg-[#FFFDF9] p-2.5 rounded-lg border border-[#EFECE4]">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#78716C]">
                        Inclusions ({pkg.inclusions.length})
                      </div>
                      {pkg.inclusions.slice(0, 3).map((inc, i) => (
                        <div key={i} className="flex items-center gap-1.5 truncate">
                          <Check className="w-3 h-3 text-[#2E5A44] shrink-0" />
                          <span className="truncate">{inc}</span>
                        </div>
                      ))}
                      {pkg.inclusions.length > 3 && (
                        <div className="text-[10px] text-[#78716C] pl-4">
                          +{pkg.inclusions.length - 3} more inclusions
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Add-ons & Interval Options */}
        <div className="lg:col-span-5 bg-[#FFFDF9] rounded-xl border border-[#E5DFD3] p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#EFECE4]">
            <div className="flex items-baseline gap-2">
              <span className="font-num text-xs font-semibold text-[#8B4A2B]">03</span>
              <div>
                <span className="font-editorial text-base font-semibold text-[#1C1917] block leading-tight">
                  Upgrades &amp; Add-ons
                </span>
                <span className="text-[11px] text-[#78716C]">
                  Linked to {currentPackage?.name || 'selected package'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAddonModal()}
              disabled={!selectedPackageId}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#1C1917] text-[#FAF7F2] hover:bg-[#8B4A2B] font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Upgrade
            </button>
          </div>

          <div className="space-y-2.5 mt-3.5 flex-1 overflow-y-auto max-h-[680px] pr-1">
            {!selectedPackageId ? (
              <div className="text-center py-12 text-[#78716C] text-xs">
                Select a package on the left to manage its add-ons.
              </div>
            ) : currentAddons.length === 0 ? (
              <div className="text-center py-12 text-[#78716C] text-xs">
                No add-ons registered for this package yet. Click &ldquo;Add Upgrade&rdquo; above.
              </div>
            ) : (
              currentAddons.map((addon) => (
                <div
                  key={addon.id}
                  className="p-3.5 rounded-xl border border-[#E5DFD3] hover:border-[#C8B9A6] bg-[#FAF8F4]/60 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#1C1917] text-xs">{addon.name}</span>
                        {addon.categoryTag && (
                          <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-[#EFECE4] text-[#57534E]">
                            {addon.categoryTag}
                          </span>
                        )}
                      </div>
                      <div className="font-num text-xs text-[#8B4A2B] font-semibold mt-1">
                        {addon.pricingType === 'interval' && (
                          <span>
                            ₱{addon.basePrice.toLocaleString()}{' '}
                            <span className="font-sans font-normal text-[#78716C]">
                              / {addon.intervalStep} {addon.intervalUnit}
                            </span>
                          </span>
                        )}
                        {addon.pricingType === 'pax_dependent' && (
                          <span>
                            ₱{addon.basePrice.toLocaleString()}{' '}
                            <span className="font-sans font-normal text-[#78716C]">per PAX</span>
                          </span>
                        )}
                        {addon.pricingType === 'fixed' && (
                          <span>
                            {addon.basePrice === 0 ? (
                              <span className="text-[#2E5A44]">Complimentary / Included</span>
                            ) : (
                              `₱${addon.basePrice.toLocaleString()} Flat`
                            )}
                            {addon.defaultQuantity && (
                              <span className="font-sans font-normal text-[#78716C] ml-1">
                                (Default: {addon.defaultQuantity})
                              </span>
                            )}
                          </span>
                        )}
                        {addon.pricingType === 'variant' && (
                          <span className="text-[#57534E]">
                            {addon.variants?.length || 0} Size / Material Variants
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenAddonModal(addon)}
                        className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded hover:bg-[#E5DFD3]/60 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddon(addon.id, addon.name)}
                        className="p-1.5 text-[#78716C] hover:text-[#9E3B33] rounded hover:bg-[#FBECEB] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {addon.description && (
                    <p className="text-xs text-[#68625D] mt-1">{addon.description}</p>
                  )}

                  {addon.variants && addon.variants.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-[#EFECE4] grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {addon.variants.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between text-xs px-2.5 py-1 bg-[#FFFDF9] rounded border border-[#E5DFD3]"
                        >
                          <span className="text-[#292524] truncate">{v.name}</span>
                          <span className="font-num font-semibold text-[#1C1917] ml-2">
                            {v.isPaxDependent
                              ? `+₱${v.priceDelta}/pax`
                              : `+₱${v.priceDelta.toLocaleString()}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ================= DROPDOWNS & MOBILIZATION ZONES MANAGEMENT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 04: Location Zones & Mobilization Fees */}
        <div className="bg-[#FFFDF9] rounded-xl border border-[#E5DFD3] p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#EFECE4]">
            <div className="flex items-baseline gap-2.5">
              <span className="font-num text-xs font-semibold text-[#8B4A2B]">04</span>
              <div>
                <h2 className="font-editorial text-base font-semibold text-[#1C1917]">
                  Location Zones &amp; Mobilization Rates
                </h2>
                <p className="text-[11px] text-[#78716C]">
                  Controls the Location Zone dropdown and default travel fees on proposals.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenZoneModal()}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#F5F2EB] text-[#1C1917] hover:bg-[#E7E1D5] border border-[#D6CFC2] font-medium cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-[#8B4A2B]" />
              Add Zone
            </button>
          </div>

          <div className="space-y-2 mt-3.5 max-h-72 overflow-y-auto pr-1">
            {zones.map((z) => (
              <div
                key={z.id}
                className="flex items-center justify-between p-3 rounded-lg border border-[#E5DFD3] hover:border-[#C8B9A6] bg-[#FAF8F4]/70 transition-all"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#1C1917] truncate">{z.name}</span>
                    <span className="font-num text-[11px] font-semibold text-[#8B4A2B] bg-[#F7EFE1] px-2 py-0.5 rounded border border-[#E2CFAF]">
                      ₱{z.defaultFee.toLocaleString()}
                    </span>
                  </div>
                  {z.description && (
                    <p className="text-[11px] text-[#78716C] truncate mt-0.5">{z.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenZoneModal(z)}
                    className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded hover:bg-[#E5DFD3]/60 cursor-pointer"
                    title="Edit Zone"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteZone(z.id, z.name)}
                    className="p-1.5 text-[#78716C] hover:text-[#9E3B33] rounded hover:bg-[#FBECEB] cursor-pointer"
                    title="Delete Zone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 05: Event Types Dropdown Options */}
        <div className="bg-[#FFFDF9] rounded-xl border border-[#E5DFD3] p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#EFECE4]">
            <div className="flex items-baseline gap-2.5">
              <span className="font-num text-xs font-semibold text-[#8B4A2B]">05</span>
              <div>
                <h2 className="font-editorial text-base font-semibold text-[#1C1917]">
                  Event Occasion Dropdown Options
                </h2>
                <p className="text-[11px] text-[#78716C]">
                  Manage event occasions selectable on client proposals and invoices.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenEventTypeModal()}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#F5F2EB] text-[#1C1917] hover:bg-[#E7E1D5] border border-[#D6CFC2] font-medium cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-[#8B4A2B]" />
              Add Occasion
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3.5 max-h-72 overflow-y-auto pr-1">
            {eventTypes.map((ev) => (
              <div
                key={ev}
                className="flex items-center justify-between p-2.5 rounded-lg border border-[#E5DFD3] hover:border-[#C8B9A6] bg-[#FAF8F4]/70 transition-all"
              >
                <span className="text-xs font-medium text-[#1C1917] truncate pr-2">{ev}</span>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEventTypeModal(ev)}
                    className="p-1 text-[#78716C] hover:text-[#1C1917] rounded hover:bg-[#E5DFD3]/60 cursor-pointer"
                    title="Edit Occasion"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEventType(ev)}
                    className="p-1 text-[#78716C] hover:text-[#9E3B33] rounded hover:bg-[#FBECEB] cursor-pointer"
                    title="Delete Occasion"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="bg-[#FFFDF9] border border-[#DED8CC] rounded-xl max-w-md w-full p-6 shadow-2xl">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B4A2B]">
              Catalog Category
            </span>
            <h3 className="font-editorial text-xl font-semibold text-[#1C1917] mt-0.5">
              {editingCategory ? 'Edit Service Category' : 'Create Service Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#292524] mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Photobooth, DIY Craft Station, 360 Booth"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-[#D6CFC2] rounded-lg bg-white text-[#1C1917]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#292524] mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of the service line"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-[#D6CFC2] rounded-lg bg-white text-[#1C1917]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 text-xs text-[#57534E] hover:bg-[#EFECE4] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-[#1C1917] hover:bg-[#8B4A2B] text-[#FAF7F2] rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Package Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto backdrop-blur-[2px]">
          <div className="bg-[#FFFDF9] border border-[#DED8CC] rounded-xl max-w-lg w-full p-6 shadow-2xl my-8">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B4A2B]">
              Service Tier Configuration
            </span>
            <h3 className="font-editorial text-xl font-semibold text-[#1C1917] mt-0.5">
              {editingPackage ? 'Edit Service Package' : 'Create Service Package'}
            </h3>
            <form onSubmit={handleSavePackage} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-[#292524] mb-1">Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium Photobooth, Sinta Wedding Coverage"
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-[#D6CFC2] rounded-lg bg-white text-[#1C1917]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#292524] mb-1">
                    Canva Script Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sinta, Classic"
                    value={pkgScriptTitle}
                    onChange={(e) => setPkgScriptTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#D6CFC2] rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#292524] mb-1">Subtitle</label>
                  <input
                    type="text"
                    placeholder="e.g. Wedding Day"
                    value={pkgSubtitle}
                    onChange={(e) => setPkgSubtitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#D6CFC2] rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#292524] mb-1">Promo Badge</label>
                  <input
                    type="text"
                    placeholder="e.g. 15% OFF"
                    value={pkgBadgeText}
                    onChange={(e) => setPkgBadgeText(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#D6CFC2] rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#292524] mb-1">Base Price (₱)</label>
                  <input
                    type="number"
                    required
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-num border border-[#D6CFC2] rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#292524] mb-1">Base Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={pkgHours}
                    onChange={(e) => setPkgHours(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-num border border-[#D6CFC2] rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#292524] mb-1">Base PAX</label>
                  <input
                    type="number"
                    value={pkgPax}
                    onChange={(e) => setPkgPax(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-num border border-[#D6CFC2] rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#292524] mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Summary of the package"
                  value={pkgDesc}
                  onChange={(e) => setPkgDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#D6CFC2] rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#292524] mb-1">
                    Inclusions (One per line)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="2 Hours Unlimited Prints&#10;Custom Print Layout&#10;On-site Attendant"
                    value={pkgInclusions}
                    onChange={(e) => setPkgInclusions(e.target.value)}
                    className="w-full px-3 py-2 font-mono text-xs border border-[#D6CFC2] rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#292524] mb-1">
                    Freebies (One per line)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Magnetic Photo Frame&#10;Online Gallery Access"
                    value={pkgFreebies}
                    onChange={(e) => setPkgFreebies(e.target.value)}
                    className="w-full px-3 py-2 font-mono text-xs border border-[#D6CFC2] rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPackageModal(false)}
                  className="px-4 py-2 text-xs text-[#57534E] hover:bg-[#EFECE4] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-[#1C1917] hover:bg-[#8B4A2B] text-[#FAF7F2] rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Addon Modal */}
      {showAddonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto backdrop-blur-[2px]">
          <div className="bg-[#FFFDF9] border border-[#DED8CC] rounded-xl max-w-lg w-full p-6 shadow-2xl my-8">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B4A2B]">
              Service Upgrade / Add-On
            </span>
            <h3 className="font-editorial text-xl font-semibold text-[#1C1917] mt-0.5">
              {editingAddon ? 'Edit Upgrade Item' : 'New Upgrade Item'}
            </h3>
            <p className="text-xs text-[#78716C] mt-0.5">
              Assigned to package:{' '}
              <strong className="text-[#1C1917]">{currentPackage?.name}</strong>
            </p>

            <form onSubmit={handleSaveAddon} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-medium text-[#292524] mb-1">Add-on Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sintra Welcome Board, Extra Hour"
                    value={addonName}
                    onChange={(e) => setAddonName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#D6CFC2] rounded-lg bg-white"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-medium text-[#292524] mb-1">
                    Category Tag (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Props, Duration, Setup"
                    value={addonTag}
                    onChange={(e) => setAddonTag(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#D6CFC2] rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#292524] mb-1.5">
                  Pricing Calculation Model
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'interval', label: 'Interval Step', desc: 'Per hr / 100 pax' },
                      { id: 'variant', label: 'Variants', desc: 'Sizes / Materials' },
                      { id: 'fixed', label: 'Flat Fee', desc: 'Fixed rate' },
                      { id: 'pax_dependent', label: 'Per PAX', desc: 'Rate × PAX' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setAddonPricingType(m.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        addonPricingType === m.id
                          ? 'border-[#8B4A2B] bg-[#FAF6F0] text-[#1C1917] font-semibold'
                          : 'border-[#E5DFD3] bg-[#FAF8F4] text-[#57534E] hover:border-[#C8B9A6]'
                      }`}
                    >
                      <div className="text-xs">{m.label}</div>
                      <div className="text-[10px] text-[#78716C] mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {addonPricingType === 'interval' && (
                <div className="bg-[#FAF8F4] p-3.5 rounded-lg border border-[#E5DFD3] space-y-3">
                  <div className="text-xs font-semibold text-[#1C1917]">Interval Configuration</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#78716C] uppercase">
                        Price (₱)
                      </label>
                      <input
                        type="number"
                        value={addonBasePrice}
                        onChange={(e) => setAddonBasePrice(e.target.value)}
                        className="mt-1 w-full px-2.5 py-1.5 text-sm font-num bg-white border border-[#D6CFC2] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#78716C] uppercase">
                        Step Size
                      </label>
                      <input
                        type="number"
                        value={addonIntervalStep}
                        onChange={(e) => setAddonIntervalStep(e.target.value)}
                        className="mt-1 w-full px-2.5 py-1.5 text-sm font-num bg-white border border-[#D6CFC2] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#78716C] uppercase">
                        Unit
                      </label>
                      <select
                        value={addonIntervalUnit}
                        onChange={(e) => setAddonIntervalUnit(e.target.value as IntervalUnit)}
                        className="mt-1 w-full px-2.5 py-1.5 text-sm bg-white border border-[#D6CFC2] rounded-lg"
                      >
                        <option value="HOUR">HOUR</option>
                        <option value="PAX">PAX</option>
                        <option value="pc">pc</option>
                        <option value="pcs">pcs</option>
                        <option value="day">day</option>
                        <option value="km">km</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {addonPricingType === 'fixed' && (
                <div className="grid grid-cols-2 gap-3 bg-[#FAF8F4] p-3.5 rounded-lg border border-[#E5DFD3]">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#78716C] uppercase">
                      Flat Price (₱)
                    </label>
                    <input
                      type="number"
                      value={addonBasePrice}
                      onChange={(e) => setAddonBasePrice(e.target.value)}
                      className="mt-1 w-full px-2.5 py-1.5 text-sm font-num bg-white border border-[#D6CFC2] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#78716C] uppercase">
                      Default Qty
                    </label>
                    <input
                      type="number"
                      value={addonDefaultQty}
                      onChange={(e) => setAddonDefaultQty(e.target.value)}
                      className="mt-1 w-full px-2.5 py-1.5 text-sm font-num bg-white border border-[#D6CFC2] rounded-lg"
                    />
                  </div>
                </div>
              )}

              {addonPricingType === 'pax_dependent' && (
                <div className="bg-[#FAF8F4] p-3.5 rounded-lg border border-[#E5DFD3]">
                  <label className="block text-[10px] font-semibold text-[#78716C] uppercase">
                    Price per PAX (₱)
                  </label>
                  <input
                    type="number"
                    value={addonBasePrice}
                    onChange={(e) => setAddonBasePrice(e.target.value)}
                    className="mt-1 w-full px-2.5 py-1.5 text-sm font-num bg-white border border-[#D6CFC2] rounded-lg"
                  />
                </div>
              )}

              {addonPricingType === 'variant' && (
                <div className="bg-[#FAF8F4] p-3.5 rounded-lg border border-[#E5DFD3] space-y-3">
                  <div className="text-xs font-semibold text-[#1C1917]">
                    Selectable Variants &amp; Sizes
                  </div>

                  {addonVariants.length > 0 && (
                    <div className="space-y-1.5">
                      {addonVariants.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-white rounded border border-[#E5DFD3]"
                        >
                          <span className="font-medium text-[#1C1917]">{v.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-num font-semibold text-[#8B4A2B]">
                              {v.isPaxDependent ? `+₱${v.priceDelta}/pax` : `+₱${v.priceDelta}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(v.id)}
                              className="text-[#78716C] hover:text-[#9E3B33] cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#E5DFD3] grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-6">
                      <input
                        type="text"
                        placeholder="Option label (e.g. A3 Board)"
                        value={newVariantName}
                        onChange={(e) => setNewVariantName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#D6CFC2] rounded"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        placeholder="Price (₱)"
                        value={newVariantPrice}
                        onChange={(e) => setNewVariantPrice(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-num bg-white border border-[#D6CFC2] rounded"
                      />
                    </div>
                    <div className="sm:col-span-3 flex items-center justify-end gap-2">
                      <label className="text-[10px] text-[#57534E] flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newVariantIsPax}
                          onChange={(e) => setNewVariantIsPax(e.target.checked)}
                          className="rounded accent-[#8B4A2B]"
                        />
                        /PAX
                      </label>
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="px-2.5 py-1.5 bg-[#1C1917] text-[#FAF7F2] rounded text-xs font-medium hover:bg-[#8B4A2B] cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-[#292524] mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes on what this upgrade includes"
                  value={addonDesc}
                  onChange={(e) => setAddonDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#D6CFC2] rounded-lg bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddonModal(false)}
                  className="px-4 py-2 text-xs text-[#57534E] hover:bg-[#EFECE4] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-[#1C1917] hover:bg-[#8B4A2B] text-[#FAF7F2] rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Save Upgrade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Zone Modal */}
      {showZoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="bg-[#FFFDF9] border border-[#DED8CC] rounded-xl max-w-md w-full p-6 shadow-2xl">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B4A2B]">
              Mobilization Zone
            </span>
            <h3 className="font-editorial text-xl font-semibold text-[#1C1917] mt-0.5">
              {editingZone ? 'Edit Location Zone' : 'Add Location Zone'}
            </h3>
            <form onSubmit={handleSaveZone} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#292524] mb-1">Zone / Region Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tagaytay / Cavite / Batangas"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-[#D6CFC2] rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block font-medium text-[#292524] mb-1">
                  Default Mobilization Fee (₱)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={zoneFee}
                  onChange={(e) => setZoneFee(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-num border border-[#D6CFC2] rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block font-medium text-[#292524] mb-1">
                  Coverage Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. South Luzon out-of-town rate"
                  value={zoneDesc}
                  onChange={(e) => setZoneDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-[#D6CFC2] rounded-lg bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowZoneModal(false)}
                  className="px-4 py-2 text-xs text-[#57534E] hover:bg-[#EFECE4] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-[#1C1917] hover:bg-[#8B4A2B] text-[#FAF7F2] rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Type Modal */}
      {showEventTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="bg-[#FFFDF9] border border-[#DED8CC] rounded-xl max-w-md w-full p-6 shadow-2xl">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B4A2B]">
              Event Occasion
            </span>
            <h3 className="font-editorial text-xl font-semibold text-[#1C1917] mt-0.5">
              {editingEventType ? 'Edit Event Occasion' : 'Add Event Occasion'}
            </h3>
            <form onSubmit={handleSaveEventType} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#292524] mb-1">Occasion Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wedding, Debut, Corporate Gala"
                  value={eventTypeName}
                  onChange={(e) => setEventTypeName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-[#D6CFC2] rounded-lg bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEventTypeModal(false)}
                  className="px-4 py-2 text-xs text-[#57534E] hover:bg-[#EFECE4] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-[#1C1917] hover:bg-[#8B4A2B] text-[#FAF7F2] rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Save Occasion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
