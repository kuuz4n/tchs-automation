'use client';

import React, { useState } from 'react';
import {
  Printer,
  Download,
  Share2,
  CheckCircle2,
  FileCheck,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Tag,
  CreditCard,
} from 'lucide-react';
import { Proposal, Invoice, CanvaThemeConfig, UserProfile } from '@/types';
import { getThemeConfig } from '@/lib/storage';

interface CanvaDocumentViewProps {
  document: Proposal | Invoice;
  isInvoice?: boolean;
  currentUser?: UserProfile;
  onConvertToInvoice?: () => void;
}

export default function CanvaDocumentView({
  document,
  isInvoice = false,
  currentUser,
  onConvertToInvoice,
}: CanvaDocumentViewProps) {
  const theme = getThemeConfig();
  const [viewMode, setViewMode] = useState<'canva' | 'formal'>('canva');

  const invoice = isInvoice ? (document as Invoice) : null;
  const proposal = !isInvoice ? (document as Proposal) : null;

  const client = document.client;
  const pricing = document.pricing;
  const services = document.services;
  const discounts = document.discounts;
  const mobilization = document.mobilization;

  const handlePrint = () => {
    window.print();
  };

  const signer = invoice
    ? {
        name: invoice.signerName,
        title: invoice.signerTitle,
        email: invoice.signerEmail,
        phone: invoice.signerPhone,
        signatureUrl: invoice.signerSignatureUrl,
      }
    : currentUser
    ? {
        name: currentUser.fullName,
        title: currentUser.jobTitle,
        email: currentUser.email,
        phone: currentUser.phone,
        signatureUrl: currentUser.signatureImageUrl,
      }
    : null;

  return (
    <div className="flex flex-col items-center">
      {/* Top Action Toolbar (Hidden when printing) */}
      <div className="no-print w-full max-w-3xl bg-[#FAF8F4] border border-[#E5DFD3] rounded-xl p-3.5 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-semibold text-[#78716C] uppercase tracking-[0.14em] pl-1">
            Layout Mode
          </span>
          <div className="inline-flex bg-[#EFECE4] p-1 rounded-lg border border-[#E5DFD3]">
            <button
              type="button"
              onClick={() => setViewMode('canva')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'canva'
                  ? 'bg-[#1C1917] text-[#FAF7F2]'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              Canva Quotation
            </button>
            <button
              type="button"
              onClick={() => setViewMode('formal')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'formal'
                  ? 'bg-[#1C1917] text-[#FAF7F2]'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              Formal Sales Invoice
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isInvoice && onConvertToInvoice && (
            <button
              type="button"
              onClick={onConvertToInvoice}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2E5A44] hover:bg-[#234735] text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              Issue Signed Invoice
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1C1917] hover:bg-[#8B4A2B] text-[#FAF7F2] text-xs font-medium transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Canva-Styled Sheet Container */}
      <div className="print-sheet w-full max-w-3xl bg-[#fbf8f3] text-[#2c2b29] border border-[#e8e2d5] rounded-2xl shadow-xl overflow-hidden relative p-8 sm:p-12 transition-all">
        {/* Subtle Paper Texture Background Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply"
          style={{
            backgroundImage: `radial-gradient(#d6cdb7 0.75px, transparent 0.75px)`,
            backgroundSize: '12px 12px',
          }}
        />

        {/* Golden Package Corner Badge (from Canva screenshots) */}
        {document.packageTierBadge && (
          <div className="absolute bottom-0 right-0 z-10 w-28 h-28 overflow-hidden pointer-events-none">
            <div className="absolute bottom-0 right-0 w-36 h-36 bg-[#dfa436] rotate-45 transform translate-x-18 translate-y-18 shadow-md flex items-start justify-center pt-3">
              <span className="text-[#2b220d] font-bold text-[11px] tracking-wider uppercase transform -rotate-45 block mt-4 mr-4">
                {document.packageTierBadge}
              </span>
            </div>
          </div>
        )}

        {/* ================= CANVA AESTHETIC VIEW ================= */}
        {viewMode === 'canva' ? (
          <div className="relative z-10 space-y-6">
            {/* Header Brand Calligraphy */}
            <div className="text-center pt-2 pb-4">
              <div
                className="text-xs sm:text-sm font-bold tracking-[0.25em] text-[#1e1c18] uppercase"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {theme.brandName}
              </div>
              <div
                className="text-4xl sm:text-5xl text-[#1a1917] mt-[-6px]"
                style={{ fontFamily: "'Great Vibes', cursive" }}
              >
                {theme.subBrandName}
              </div>

              {/* Event / Couple Name */}
              <div className="mt-4">
                <h1
                  className="text-xl sm:text-2xl font-normal italic text-[#182338] tracking-wide"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {client.name}
                </h1>
                <p
                  className="text-xs sm:text-sm text-[#48453f] mt-0.5 tracking-wider uppercase font-medium"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {client.eventType === 'Wedding' ? 'Wedding Day Coverage' : `${client.eventType} Event Coverage`}
                </p>
                <p className="text-[11px] text-[#787369] mt-0.5">
                  {client.eventDate} • {client.venue}
                </p>
              </div>
            </div>

            {/* Services Listing */}
            <div className="space-y-6 pt-2">
              {services.map((srv, idx) => (
                <div key={idx} className="relative bg-white/40 rounded-xl p-5 border border-[#e5decb]/60">
                  {/* Discount Starburst Badge (if badge text is present or discount applied) */}
                  {srv.badge && (
                    <div className="absolute -top-3 -left-3 z-10">
                      <div className="w-12 h-12 rounded-full bg-[#c93b3b] text-white flex flex-col items-center justify-center text-center shadow-md animate-in fade-in">
                        <span className="text-[9px] font-extrabold uppercase leading-none px-1">
                          {srv.badge}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Service Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[#e2dacf]">
                    <div>
                      <span
                        className="text-2xl sm:text-3xl text-[#1e1c18]"
                        style={{ fontFamily: "'Great Vibes', cursive" }}
                      >
                        {srv.packageName.split(' - ')[0]}
                      </span>
                      <span className="text-xs text-[#524e46] ml-2 font-medium">
                        | {srv.packageName} |
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-lg sm:text-xl font-bold text-[#1f2937]"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {srv.serviceTotal.toLocaleString()} Php
                      </span>
                    </div>
                  </div>

                  {/* Addons / Specs breakdown */}
                  {srv.selectedAddons && srv.selectedAddons.length > 0 ? (
                    <div className="mt-3 space-y-1.5">
                      <div className="text-xs font-bold text-[#3d3a34] uppercase tracking-wider">
                        Included Features & Add-ons:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {srv.selectedAddons.map((addon, aIdx) => (
                          <div
                            key={aIdx}
                            className="flex items-center justify-between p-2 rounded-lg bg-white/70 border border-[#eee7d8]"
                          >
                            <span className="text-[#3c3933] font-medium truncate">
                              • {addon.name} {addon.quantity > 1 ? `(${addon.quantity}x)` : ''}
                            </span>
                            <span className="font-semibold text-[#1f2937] text-[11px] ml-2">
                              ₱{addon.totalPrice.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Default Specs & Freebies for Wedding / Photobooth */
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#44403c]">
                      <div>
                        <div className="font-bold text-[#292524] mb-1">Coverage Specs:</div>
                        <p className="italic text-[11px] text-[#57534e]">
                          • Complete high-definition photo and video coverage
                        </p>
                        <p className="italic text-[11px] text-[#57534e]">
                          • 3-5 minute Cinematic Highlights Film
                        </p>
                        <p className="italic text-[11px] text-[#57534e]">
                          • 180-250 post-processed high-res photos
                        </p>
                      </div>
                      <div>
                        <div className="font-bold text-[#292524] mb-1">Freebies:</div>
                        <p className="italic text-[11px] text-[#57534e]">
                          • Premium Photo Album (8.5&quot; x 11&quot; / 20 pages / True Flat)
                        </p>
                        <p className="italic text-[11px] text-[#57534e]">
                          • Glass-to-Glass Framed Keepsake Photo (11&quot; x 14&quot;)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pricing Summary Card (Exact layout from Canva PDF) */}
            <div className="pt-4 max-w-md ml-auto">
              <div className="space-y-1.5 text-xs text-[#44403c]">
                <div className="flex justify-between items-center italic">
                  <span className="text-sm">Package Fee</span>
                  <span
                    className="text-sm font-semibold"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Php {pricing.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {discounts && discounts.length > 0 && (
                  <div className="space-y-1">
                    {discounts.map((d, dIdx) => (
                      <div key={dIdx} className="flex justify-between items-center text-emerald-800 italic">
                        <span className="truncate pr-2">
                          Discount ({d.name}{d.percent > 0 ? ` - ${d.percent}%` : ''})
                        </span>
                        <span className="whitespace-nowrap font-medium">
                          - Php {d.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    {discounts.length > 1 && (
                      <div className="flex justify-between items-center text-emerald-900 font-semibold italic border-t border-[#e2dacf] pt-0.5">
                        <span>Total Discounts ({pricing.totalDiscountPercent}%)</span>
                        <span>- Php {pricing.totalDiscountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-baseline italic">
                  <div>
                    <span className="text-sm">Mobilization Fee ({client.eventType} Day)</span>
                    {mobilization.locationDetail && (
                      <div className="text-[10px] text-[#78716c] not-italic">
                        *{mobilization.locationDetail}
                      </div>
                    )}
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Php {mobilization.fee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="border-t border-[#292524] pt-2 mt-2">
                  <div className="flex justify-between items-baseline">
                    <span
                      className="text-sm font-serif italic text-[#1c1917]"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Php
                    </span>
                    <span
                      className="text-2xl sm:text-3xl font-bold text-[#1c1917] tracking-tight"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {pricing.packageTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Downpayment & Remaining Balance */}
                <div className="bg-[#f0eade] p-3 rounded-xl mt-3 space-y-1 text-xs">
                  <div className="flex justify-between text-[#292524]">
                    <span>Required Downpayment:</span>
                    <span className="font-bold text-teal-800">
                      Php {pricing.downpaymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#57534e]">
                    <span>Remaining Balance:</span>
                    <span className="font-bold text-slate-800">
                      Php {pricing.remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sunflower Graphic Accent (from Canva design screenshot) */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-12 h-12 flex items-center justify-center opacity-85 hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 100 100" className="w-10 h-10 drop-shadow-sm">
                  {/* Petals */}
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                    <ellipse
                      key={deg}
                      cx="50"
                      cy="26"
                      rx="7"
                      ry="20"
                      fill="#eab308"
                      stroke="#ca8a04"
                      strokeWidth="1"
                      transform={`rotate(${deg} 50 50)`}
                    />
                  ))}
                  {/* Center seed disc */}
                  <circle cx="50" cy="50" r="16" fill="#713f12" />
                  <circle cx="50" cy="50" r="12" fill="#451a03" />
                </svg>
              </div>
            </div>

            {/* Signer Block (Active Logged-in User's Signature) */}
            {signer && (
              <div className="pt-2 border-t border-[#e2dacf] flex flex-col sm:flex-row justify-between items-end gap-4 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Document Number:
                  </p>
                  <p className="font-mono font-bold text-slate-800 text-xs">
                    {document.proposalNumber || (invoice ? invoice.invoiceNumber : 'TCHS')}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Payment via {theme.bankAccountInfo}
                  </p>
                </div>

                <div className="text-right">
                  {signer.signatureUrl ? (
                    <div className="inline-block mb-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={signer.signatureUrl}
                        alt="Signature"
                        className="h-12 w-auto object-contain mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="h-10 flex items-center justify-center text-teal-800 italic font-serif text-sm">
                      {signer.name}
                    </div>
                  )}
                  <div className="border-t border-slate-400 pt-1 w-44 inline-block">
                    <p className="font-bold text-slate-900 text-xs">{signer.name}</p>
                    <p className="text-[10px] text-slate-600">{signer.title}</p>
                    <p className="text-[9px] text-slate-400">{signer.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Disclaimers / Footnotes */}
            <div className="text-[10px] text-[#78716c] space-y-0.5 pt-2">
              {theme.disclaimerNotes.map((note, i) => (
                <p key={i}>{note}</p>
              ))}
            </div>
          </div>
        ) : (
          /* ================= FORMAL SALES INVOICE VIEW ================= */
          <div className="relative z-10 space-y-6">
            {/* Invoice Top Details */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  OFFICIAL SALES INVOICE
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Invoice #: {invoice ? invoice.invoiceNumber : document.proposalNumber}
                </p>
                <p className="text-xs text-slate-500">
                  Date Issued: {invoice?.issueDate || new Date().toISOString().split('T')[0]}
                </p>
              </div>
              <div className="text-right">
                <h3 className="font-bold text-slate-900 text-sm">{theme.brandName}</h3>
                <p className="text-xs text-slate-600">{theme.companyAddress}</p>
                <p className="text-xs text-slate-600">{theme.companyContact}</p>
                <p className="text-xs text-teal-700">{theme.companyEmail}</p>
              </div>
            </div>

            {/* Billed To */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/80 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
                  Billed To:
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{client.name}</p>
                <p className="text-slate-600">{client.address}</p>
                {client.phone && <p className="text-slate-600">Phone: {client.phone}</p>}
                {client.email && <p className="text-slate-600">Email: {client.email}</p>}
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
                  Event Details:
                </span>
                <p className="text-slate-800">
                  <strong>Type:</strong> {client.eventType}
                </p>
                <p className="text-slate-800">
                  <strong>Date:</strong> {client.eventDate}
                </p>
                <p className="text-slate-800">
                  <strong>Venue:</strong> {client.venue}
                </p>
                <p className="text-slate-800">
                  <strong>Zone:</strong> {mobilization.zoneName}
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-left text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {services.map((srv, sIdx) => (
                    <React.Fragment key={sIdx}>
                      <tr className="font-semibold text-slate-900 bg-slate-50/50">
                        <td className="py-2.5">{srv.packageName}</td>
                        <td className="py-2.5 text-center">1</td>
                        <td className="py-2.5 text-right">₱{srv.basePrice.toLocaleString()}</td>
                        <td className="py-2.5 text-right">₱{srv.basePrice.toLocaleString()}</td>
                      </tr>
                      {srv.selectedAddons?.map((ad, aIdx) => (
                        <tr key={aIdx} className="text-slate-600 text-[11px]">
                          <td className="py-1.5 pl-4">
                            ↳ {ad.name} {ad.pricingDetail ? `(${ad.pricingDetail})` : ''}
                          </td>
                          <td className="py-1.5 text-center">{ad.quantity}</td>
                          <td className="py-1.5 text-right">₱{ad.unitPrice.toLocaleString()}</td>
                          <td className="py-1.5 text-right">₱{ad.totalPrice.toLocaleString()}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}

                  {mobilization.fee > 0 && (
                    <tr className="text-slate-700">
                      <td className="py-2">
                        Mobilization Fee ({mobilization.locationDetail || mobilization.zoneName})
                      </td>
                      <td className="py-2 text-center">1</td>
                      <td className="py-2 text-right">₱{mobilization.fee.toLocaleString()}</td>
                      <td className="py-2 text-right">₱{mobilization.fee.toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Payment & Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-300">
              <div className="text-xs text-slate-600 space-y-2">
                <div>
                  <span className="font-bold text-slate-800 uppercase block text-[10px]">
                    Banking & Payment Details:
                  </span>
                  <p className="whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] font-mono mt-1">
                    {theme.bankAccountInfo}
                  </p>
                </div>
                <p className="text-[11px] text-slate-500">
                  * Please send payment confirmation/receipt to {theme.companyEmail}.
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-right">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-semibold text-slate-900">
                    ₱{pricing.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {discounts && discounts.length > 0 && (
                  <>
                    {discounts.map((d, dIdx) => (
                      <div key={dIdx} className="flex justify-between text-emerald-700">
                        <span className="truncate pr-2">
                          Discount ({d.name}{d.percent > 0 ? ` - ${d.percent}%` : ''}):
                        </span>
                        <span className="font-semibold whitespace-nowrap">
                          -₱{d.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </>
                )}

                <div className="flex justify-between">
                  <span className="text-slate-600">Mobilization Fee:</span>
                  <span className="font-semibold text-slate-900">
                    ₱{mobilization.fee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="border-t-2 border-slate-900 pt-2 flex justify-between text-sm sm:text-base font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-teal-800">
                    ₱{pricing.packageTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-teal-50 p-2.5 rounded-lg text-xs space-y-1 mt-2 text-slate-800 border border-teal-200 text-left">
                  <div className="flex justify-between">
                    <span>Deposit Required (Downpayment):</span>
                    <span className="font-bold text-teal-800">
                      ₱{pricing.downpaymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Balance Due:</span>
                    <span className="font-bold text-slate-800">
                      ₱{pricing.remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Issuer Signature Stamp */}
            {signer && (
              <div className="pt-6 border-t border-slate-300 flex justify-end">
                <div className="text-right w-64">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-semibold">
                    Authorized Sign-off:
                  </p>
                  {signer.signatureUrl ? (
                    <div className="inline-block mb-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={signer.signatureUrl}
                        alt="Signature"
                        className="h-14 w-auto object-contain ml-auto"
                      />
                    </div>
                  ) : (
                    <div className="h-10 flex items-center justify-end text-teal-800 italic font-serif text-base">
                      {signer.name}
                    </div>
                  )}
                  <div className="border-t border-slate-700 pt-1">
                    <p className="font-bold text-slate-900 text-xs">{signer.name}</p>
                    <p className="text-[11px] text-slate-600">{signer.title}</p>
                    <p className="text-[10px] text-slate-500">{signer.phone}</p>
                    <p className="text-[10px] text-teal-700">{signer.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
