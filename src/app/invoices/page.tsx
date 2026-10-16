'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  Printer,
  X,
  CreditCard,
  User,
  Calendar,
  DollarSign,
} from 'lucide-react';
import {
  getInvoices,
  syncInvoicesFromCloud,
  deleteInvoice,
  saveInvoice,
  getCurrentUser,
} from '@/lib/storage';
import { Invoice, UserProfile } from '@/types';
import CanvaDocumentView from '@/components/invoice/CanvaDocumentView';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');

  useEffect(() => {
    refresh(true);
  }, []);

  const refresh = async (syncCloud = false) => {
    setInvoices(getInvoices());
    setCurrentUser(getCurrentUser());
    if (syncCloud) {
      try {
        const cloudInvs = await syncInvoicesFromCloud();
        setInvoices(cloudInvs);
      } catch (e) {
        console.warn('Invoice cloud sync warning:', e);
      }
    }
  };

  const handleDelete = (id: string, num: string) => {
    if (confirm(`Are you sure you want to delete invoice #${num}?`)) {
      deleteInvoice(id);
      refresh();
      if (selectedInvoice?.id === id) {
        setShowViewModal(false);
      }
    }
  };

  const handleTogglePaymentStatus = (inv: Invoice) => {
    const nextStatus =
      inv.paymentStatus === 'unpaid'
        ? 'partial'
        : inv.paymentStatus === 'partial'
        ? 'paid'
        : 'unpaid';

    const paidAmount =
      nextStatus === 'paid'
        ? inv.pricing.packageTotal
        : nextStatus === 'partial'
        ? inv.pricing.downpaymentAmount
        : 0;

    const balanceDue = inv.pricing.packageTotal - paidAmount;

    const updated: Invoice = {
      ...inv,
      paymentStatus: nextStatus,
      paidAmount,
      balanceDue,
    };

    saveInvoice(updated);
    refresh();
    if (selectedInvoice?.id === inv.id) {
      setSelectedInvoice(updated);
    }
  };

  const handleView = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setShowViewModal(true);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'all' || inv.paymentStatus === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.client.name.toLowerCase().includes(q) ||
      (inv.client.eventType || '').toLowerCase().includes(q) ||
      (inv.signerName || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.pricing?.packageTotal || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalOutstanding = invoices.reduce(
    (sum, inv) => sum + (inv.balanceDue ?? inv.pricing?.remainingBalance ?? 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5DFD3]">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B4A2B]">
            Billing &amp; Receivables
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#1C1917] mt-1 tracking-tight">
            Official Sales Invoices
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Signed billing statements with digital staff signatures, payment status tracking, and
            Canva print layouts.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1C1917] hover:bg-[#8B4A2B] text-[#FAF7F2] text-xs font-medium transition-colors shrink-0"
        >
          <Receipt className="w-3.5 h-3.5" />
          New Client Quotation
        </Link>
      </div>

      {/* Financial Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFDF9] border border-[#E5DFD3] rounded-xl p-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#78716C]">
            Gross Invoiced Volume
          </span>
          <div className="font-num text-xl font-semibold text-[#1C1917] mt-1.5">
            ₱{totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-[#78716C] mt-0.5 block">
            Across {invoices.length} issued {invoices.length === 1 ? 'invoice' : 'invoices'}
          </span>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E5DFD3] rounded-xl p-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2E5A44]">
            Collected Payments
          </span>
          <div className="font-num text-xl font-semibold text-[#2E5A44] mt-1.5">
            ₱{totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-[#78716C] mt-0.5 block">
            Deposits &amp; settled balances
          </span>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E5DFD3] rounded-xl p-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8B4A2B]">
            Receivable Balance
          </span>
          <div className="font-num text-xl font-semibold text-[#8B4A2B] mt-1.5">
            ₱{totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-[#78716C] mt-0.5 block">
            Pending event completion or deposit
          </span>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E5DFD3] rounded-xl p-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#78716C]">
            Settlement Breakdown
          </span>
          <div className="flex items-baseline gap-3 mt-1.5 font-num text-xs">
            <span className="text-[#2E5A44] font-semibold">
              {invoices.filter((i) => i.paymentStatus === 'paid').length} Paid
            </span>
            <span className="text-[#9A6B26] font-semibold">
              {invoices.filter((i) => i.paymentStatus === 'partial').length} Partial
            </span>
            <span className="text-[#9E3B33] font-semibold">
              {invoices.filter((i) => i.paymentStatus === 'unpaid').length} Unpaid
            </span>
          </div>
          <span className="text-[11px] text-[#78716C] mt-1 block">
            Click any status pill below to cycle state
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      {invoices.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFDF9] border border-[#E5DFD3] rounded-xl p-3">
          <div className="flex items-center gap-1 bg-[#F5F2EB] p-1 rounded-lg border border-[#E5DFD3]">
            {(
              [
                { id: 'all', label: 'All Invoices' },
                { id: 'unpaid', label: 'Unpaid' },
                { id: 'partial', label: '50% Deposit' },
                { id: 'paid', label: 'Fully Paid' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#1C1917] text-[#FAF7F2]'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client, invoice #, or staff..."
              className="w-full px-3.5 py-1.5 text-xs bg-white border border-[#D6CFC2] rounded-lg text-[#1C1917] placeholder:text-[#A8A29E]"
            />
          </div>
        </div>
      )}

      {/* Invoice Ledger Table */}
      <div>
        {invoices.length === 0 ? (
          <div className="bg-[#FFFDF9] rounded-xl border border-[#E5DFD3] p-14 text-center">
            <div className="w-11 h-11 bg-[#F5F2EB] border border-[#E5DFD3] rounded-lg flex items-center justify-center mx-auto text-[#8B4A2B] mb-3">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-lg font-semibold text-[#1C1917]">
              No sales invoices issued yet
            </h3>
            <p className="text-xs text-[#78716C] mt-1 max-w-sm mx-auto leading-relaxed">
              Prepare a package configuration in the Quotation Desk and click &ldquo;Generate &amp;
              Sign Official Invoice&rdquo; to record it here.
            </p>
            <div className="mt-5">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1C1917] text-[#FAF7F2] text-xs font-medium hover:bg-[#8B4A2B] transition-colors"
              >
                Open Quotation Desk
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-[#FFFDF9] rounded-xl border border-[#E5DFD3] shadow-[0_2px_10px_-4px_rgba(28,25,23,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F2EB] border-b border-[#E5DFD3] text-[#68625D] uppercase font-semibold text-[10px] tracking-[0.12em]">
                  <tr>
                    <th className="py-3.5 px-4">Invoice Ref</th>
                    <th className="py-3.5 px-4">Client &amp; Occasion</th>
                    <th className="py-3.5 px-4">Issue Date</th>
                    <th className="py-3.5 px-4 text-right">Package Total</th>
                    <th className="py-3.5 px-4 text-right">Balance Due</th>
                    <th className="py-3.5 px-4">Settlement</th>
                    <th className="py-3.5 px-4">Signed By</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE4]">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="py-3.5 px-4 font-num font-semibold text-[#1C1917]">
                        {inv.invoiceNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#1C1917]">{inv.client.name}</div>
                        <div className="text-[11px] text-[#78716C]">
                          {inv.client.eventType} • {inv.client.eventDate}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-num text-[#57534E]">{inv.issueDate}</td>

                      <td className="py-3.5 px-4 font-num font-semibold text-[#1C1917] text-right">
                        ₱
                        {inv.pricing.packageTotal.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      <td className="py-3.5 px-4 font-num font-medium text-[#57534E] text-right">
                        ₱
                        {(inv.balanceDue ?? inv.pricing.remainingBalance).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleTogglePaymentStatus(inv)}
                          title="Click to cycle payment status (Unpaid -> Partial -> Paid)"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                            inv.paymentStatus === 'paid'
                              ? 'bg-[#EAF2EC] text-[#2E5A44] border border-[#C5DEC9]'
                              : inv.paymentStatus === 'partial'
                              ? 'bg-[#FDF6E9] text-[#9A6B26] border border-[#EED9B3]'
                              : 'bg-[#FBECEB] text-[#9E3B33] border border-[#E8C5C3]'
                          }`}
                        >
                          {inv.paymentStatus === 'paid' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {inv.paymentStatus === 'partial' ? '50% Deposit' : inv.paymentStatus}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#1C1917]">{inv.signerName}</div>
                        <div className="text-[11px] text-[#78716C]">{inv.signerTitle}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleView(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#F5F2EB] text-[#1C1917] hover:bg-[#1C1917] hover:text-[#FAF7F2] border border-[#D6CFC2] text-[11px] font-medium transition-colors cursor-pointer"
                            title="View / Print PDF"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Open PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
                            className="p-1.5 rounded-md text-[#78716C] hover:text-[#9E3B33] hover:bg-[#FBECEB] transition-colors cursor-pointer"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {showViewModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 sm:p-6 flex items-start justify-center backdrop-blur-[2px]">
          <div className="relative w-full max-w-4xl bg-[#FFFDF9] border border-[#DED8CC] rounded-xl p-6 shadow-2xl my-8">
            <button
              type="button"
              onClick={() => setShowViewModal(false)}
              className="no-print absolute top-5 right-5 p-2 rounded-lg bg-[#F5F2EB] hover:bg-[#E5DFD3] text-[#1C1917] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <CanvaDocumentView
              document={selectedInvoice}
              isInvoice={true}
              currentUser={currentUser || undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
