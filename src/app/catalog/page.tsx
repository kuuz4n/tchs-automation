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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-teal-700" />
            Service & Pricing Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure dynamic services, wedding packages, intervals (hours, pax), and custom add-ons.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenCatModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium shadow-xs"
          >
            <Plus className="w-4 h-4 text-teal-700" />
            New Service Category
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout: Categories -> Packages -> Addons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Column 1: Service Categories */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Service Categories
            </span>
          </div>

          <div className="space-y-1.5 mt-3 flex-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  cat.id === selectedCategoryId
                    ? 'bg-teal-700 text-white font-medium shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="text-sm font-semibold truncate">{cat.name}</div>
                  {cat.description && (
                    <div
                      className={`text-[11px] truncate ${
                        cat.id === selectedCategoryId ? 'text-teal-100' : 'text-slate-400'
                      }`}
                    >
                      {cat.description}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCatModal(cat);
                    }}
                    className={`p-1 rounded ${
                      cat.id === selectedCategoryId ? 'hover:bg-teal-600' : 'hover:bg-slate-200'
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
                    className={`p-1 rounded ${
                      cat.id === selectedCategoryId ? 'hover:bg-teal-600' : 'hover:bg-slate-200'
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
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                2. Packages under
              </span>
              <span className="text-sm font-semibold text-slate-800">
                {currentCategory?.name || 'Category'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleOpenPkgModal()}
              disabled={!selectedCategoryId}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Package
            </button>
          </div>

          <div className="space-y-2 mt-3 flex-1">
            {currentPackages.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No packages yet under this category.
              </div>
            ) : (
              currentPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    pkg.id === selectedPackageId
                      ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{pkg.name}</h3>
                      <div className="text-xs font-bold text-teal-700 mt-0.5">
                        ₱{pkg.basePrice.toLocaleString()}{' '}
                        <span className="font-normal text-slate-500">
                          ({pkg.baseHours} hrs • {pkg.basePax} PAX)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPkgModal(pkg);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePackage(pkg.id, pkg.name);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {pkg.description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{pkg.description}</p>
                  )}

                  {pkg.inclusions?.length > 0 && (
                    <div className="mt-2 text-[11px] text-slate-600 space-y-0.5 bg-slate-50 p-2 rounded-lg">
                      <div className="font-semibold text-slate-700">Inclusions:</div>
                      {pkg.inclusions.slice(0, 3).map((inc, i) => (
                        <div key={i} className="flex items-center gap-1.5 truncate">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{inc}</span>
                        </div>
                      ))}
                      {pkg.inclusions.length > 3 && (
                        <div className="text-[10px] text-slate-400">
                          +{pkg.inclusions.length - 3} more items
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
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                3. Add-ons & Intervals for
              </span>
              <span className="text-sm font-semibold text-slate-800">
                {currentPackage?.name || 'Select a package'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAddonModal()}
              disabled={!selectedPackageId}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-teal-700 text-white hover:bg-teal-800 font-medium shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Add-On
            </button>
          </div>

          <div className="space-y-3 mt-3 flex-1 overflow-y-auto max-h-[700px] pr-1">
            {!selectedPackageId ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Select a package to configure its add-ons.
              </div>
            ) : currentAddons.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No add-ons created for this service yet. Click &quot;Add Add-On&quot; to add one.
              </div>
            ) : (
              currentAddons.map((addon) => (
                <div
                  key={addon.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{addon.name}</span>
                        {addon.categoryTag && (
                          <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {addon.categoryTag}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-teal-700 font-bold mt-1">
                        {addon.pricingType === 'interval' && (
                          <span>
                            ₱{addon.basePrice.toLocaleString()}{' '}
                            <span className="font-normal text-slate-500">
                              / {addon.intervalStep} {addon.intervalUnit}
                            </span>
                          </span>
                        )}
                        {addon.pricingType === 'pax_dependent' && (
                          <span>
                            ₱{addon.basePrice.toLocaleString()}{' '}
                            <span className="font-normal text-slate-500">per PAX</span>
                          </span>
                        )}
                        {addon.pricingType === 'fixed' && (
                          <span>
                            {addon.basePrice === 0 ? (
                              <span className="text-emerald-600">Free / Default Included</span>
                            ) : (
                              `₱${addon.basePrice.toLocaleString()} (Fixed)`
                            )}
                            {addon.defaultQuantity && (
                              <span className="font-normal text-slate-500 ml-1">
                                (Default: {addon.defaultQuantity} pcs)
                              </span>
                            )}
                          </span>
                        )}
                        {addon.pricingType === 'variant' && (
                          <span className="text-indigo-600">
                            {addon.variants?.length || 0} Selectable Variants
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenAddonModal(addon)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddon(addon.id, addon.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {addon.description && (
                    <p className="text-xs text-slate-500 mt-1">{addon.description}</p>
                  )}

                  {/* Variants display */}
                  {addon.variants && addon.variants.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                      <div className="text-[11px] font-medium text-slate-400">Available Options:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {addon.variants.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center justify-between text-xs px-2 py-1 bg-slate-50 rounded border border-slate-100"
                          >
                            <span className="text-slate-700 truncate">{v.name}</span>
                            <span className="font-semibold text-slate-900 ml-2">
                              {v.isPaxDependent
                                ? `+₱${v.priceDelta}/pax`
                                : `+₱${v.priceDelta.toLocaleString()}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ================= DROPDOWNS & MOBILIZATION ZONES MANAGEMENT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Location Zones & Mobilization Fees */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-700" />
                4. Location Zones & Mobilization Fees
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage location dropdown options and default out-of-town mobilization rates.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenZoneModal()}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Zone
            </button>
          </div>

          <div className="space-y-2 mt-3 max-h-72 overflow-y-auto pr-1">
            {zones.map((z) => (
              <div
                key={z.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 transition-all"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900 truncate">{z.name}</span>
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      ₱{z.defaultFee.toLocaleString()}
                    </span>
                  </div>
                  {z.description && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{z.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenZoneModal(z)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 cursor-pointer"
                    title="Edit Zone"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteZone(z.id, z.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                    title="Delete Zone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Event Types Dropdown Options */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-700" />
                5. Event Types Dropdown
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize event categories selectable on the Proposal Calculator.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenEventTypeModal()}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Event Type
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 max-h-72 overflow-y-auto pr-1">
            {eventTypes.map((ev) => (
              <div
                key={ev}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 transition-all"
              >
                <span className="text-xs font-semibold text-slate-800 truncate pr-2">{ev}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEventTypeModal(ev)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60 cursor-pointer"
                    title="Edit Event Type"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEventType(ev)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                    title="Delete Event Type"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              {editingCategory ? 'Edit Service Category' : 'Create Service Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Happy Club, Studios Services"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of the service line"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-teal-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-medium"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8">
            <h3 className="text-lg font-bold text-slate-900">
              {editingPackage ? 'Edit Package' : 'Create Package'}
            </h3>
            <form onSubmit={handleSavePackage} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Package Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium Photobooth, Sinta Wedding Day Coverage"
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-teal-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Script Title (Canva)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sinta, Classic"
                    value={pkgScriptTitle}
                    onChange={(e) => setPkgScriptTitle(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wedding Day Coverage"
                    value={pkgSubtitle}
                    onChange={(e) => setPkgSubtitle(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Promo Badge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 15% OFF"
                    value={pkgBadgeText}
                    onChange={(e) => setPkgBadgeText(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Base Price (₱)
                  </label>
                  <input
                    type="number"
                    required
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Base Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={pkgHours}
                    onChange={(e) => setPkgHours(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Base PAX
                  </label>
                  <input
                    type="number"
                    value={pkgPax}
                    onChange={(e) => setPkgPax(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="What makes this package special"
                  value={pkgDesc}
                  onChange={(e) => setPkgDesc(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Inclusions (One per line)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="2 Hours Unlimited Prints&#10;Custom Print Layout&#10;On-site Attendant"
                    value={pkgInclusions}
                    onChange={(e) => setPkgInclusions(e.target.value)}
                    className="mt-1 w-full px-3 py-2 font-mono text-xs border border-slate-300 rounded-lg focus:outline-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Freebies (One per line)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Magnetic Photo Frame&#10;Online Gallery Access"
                    value={pkgFreebies}
                    onChange={(e) => setPkgFreebies(e.target.value)}
                    className="mt-1 w-full px-3 py-2 font-mono text-xs border border-slate-300 rounded-lg focus:outline-teal-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPackageModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-medium"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8">
            <h3 className="text-lg font-bold text-slate-900">
              {editingAddon ? 'Edit Add-On' : 'Add New Add-On'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Adding to package: <strong className="text-slate-800">{currentPackage?.name}</strong>
            </p>

            <form onSubmit={handleSaveAddon} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Add-on Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Additional Hours, Custom Backdrop"
                    value={addonName}
                    onChange={(e) => setAddonName(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-teal-600"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Category Tag (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Duration, Props, Setup"
                    value={addonTag}
                    onChange={(e) => setAddonTag(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Pricing Calculation Model
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                  {(
                    [
                      { id: 'interval', label: 'Interval Step', desc: 'Per hr / 100 pax' },
                      { id: 'variant', label: 'Variants', desc: 'Selectable items' },
                      { id: 'fixed', label: 'Fixed / Default', desc: 'One flat fee / free' },
                      { id: 'pax_dependent', label: 'PAX Dependent', desc: 'Multiplier × PAX' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setAddonPricingType(m.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        addonPricingType === m.id
                          ? 'border-teal-600 bg-teal-50/70 text-teal-900 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs">{m.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional pricing fields */}
              {addonPricingType === 'interval' && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-700">Interval Settings:</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                        Price (₱)
                      </label>
                      <input
                        type="number"
                        value={addonBasePrice}
                        onChange={(e) => setAddonBasePrice(e.target.value)}
                        className="mt-1 w-full px-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                        Every Step
                      </label>
                      <input
                        type="number"
                        value={addonIntervalStep}
                        onChange={(e) => setAddonIntervalStep(e.target.value)}
                        className="mt-1 w-full px-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                        Unit
                      </label>
                      <select
                        value={addonIntervalUnit}
                        onChange={(e) => setAddonIntervalUnit(e.target.value as IntervalUnit)}
                        className="mt-1 w-full px-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
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
                  <p className="text-[11px] text-slate-500">
                    Example: ₱{addonBasePrice} per {addonIntervalStep} {addonIntervalUnit}
                  </p>
                </div>
              )}

              {addonPricingType === 'fixed' && (
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                      Fixed Price (₱)
                    </label>
                    <input
                      type="number"
                      value={addonBasePrice}
                      onChange={(e) => setAddonBasePrice(e.target.value)}
                      className="mt-1 w-full px-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                      Default Qty
                    </label>
                    <input
                      type="number"
                      value={addonDefaultQty}
                      onChange={(e) => setAddonDefaultQty(e.target.value)}
                      className="mt-1 w-full px-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {addonPricingType === 'pax_dependent' && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                    Price per PAX (₱)
                  </label>
                  <input
                    type="number"
                    value={addonBasePrice}
                    onChange={(e) => setAddonBasePrice(e.target.value)}
                    className="mt-1 w-full px-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Multiplies automatically by the proposal&apos;s event PAX count.
                  </p>
                </div>
              )}

              {addonPricingType === 'variant' && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-700">Sub-Variants & Options:</div>

                  {/* List of current variants */}
                  {addonVariants.length > 0 && (
                    <div className="space-y-1.5">
                      {addonVariants.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-white rounded border border-slate-200"
                        >
                          <div>
                            <span className="font-medium text-slate-800">{v.name}</span>
                            {v.isPaxDependent && (
                              <span className="ml-1 text-[10px] text-amber-700 font-semibold bg-amber-50 px-1 py-0.5 rounded">
                                PAX Dependent
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-teal-800">
                              {v.isPaxDependent ? `+₱${v.priceDelta}/pax` : `+₱${v.priceDelta}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(v.id)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add variant input */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          placeholder="Option name (e.g. Magnetic, Cloth)"
                          value={newVariantName}
                          onChange={(e) => setNewVariantName(e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          placeholder="Price (+₱)"
                          value={newVariantPrice}
                          onChange={(e) => setNewVariantPrice(e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div className="sm:col-span-3 flex items-center justify-end gap-2">
                        <label className="text-[10px] text-slate-600 flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newVariantIsPax}
                            onChange={(e) => setNewVariantIsPax(e.target.checked)}
                            className="rounded text-teal-600"
                          />
                          /PAX
                        </label>
                        <button
                          type="button"
                          onClick={handleAddVariant}
                          className="px-2 py-1 bg-slate-800 text-white rounded text-xs font-medium hover:bg-slate-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes or details on what this add-on provides"
                  value={addonDesc}
                  onChange={(e) => setAddonDesc(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-teal-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddonModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-medium"
                >
                  Save Add-On
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Zone Modal */}
      {showZoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              {editingZone ? 'Edit Location Zone' : 'Add Location Zone'}
            </h3>
            <form onSubmit={handleSaveZone} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Zone / Region Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subic / Zambales / Bataan"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Default Mobilization Fee (₱)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={zoneFee}
                  onChange={(e) => setZoneFee(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Description / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Northern Luzon Zone"
                  value={zoneDesc}
                  onChange={(e) => setZoneDesc(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-teal-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowZoneModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-medium"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              {editingEventType ? 'Edit Event Type' : 'Add Event Type'}
            </h3>
            <form onSubmit={handleSaveEventType} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Event Type Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wedding, Debut, Corporate Gala"
                  value={eventTypeName}
                  onChange={(e) => setEventTypeName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-teal-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEventTypeModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-medium"
                >
                  Save Event Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
