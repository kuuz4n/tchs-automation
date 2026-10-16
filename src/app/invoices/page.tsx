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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-teal-700" />
            Official Sales Invoices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generated invoices stamped with sales staff email signatures and Canva branding.
          </p>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs"
        >
          <Receipt className="w-4 h-4" />
          Create New Proposal / Invoice
        </Link>
      </div>

      {/* Invoice Cards / Table */}
      <div className="mt-6">
        {invoices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No invoices generated yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Go to the Proposal Calculator, configure your client&apos;s package & add-ons, and click
              &quot;Generate & Sign Invoice&quot;.
            </p>
            <div className="mt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800"
              >
                Go to Calculator
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Client / Event</th>
                    <th className="py-3 px-4">Date Issued</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Balance Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Issued & Signed By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{inv.client.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {inv.client.eventType} • {inv.client.eventDate}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">{inv.issueDate}</td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₱{inv.pricing.packageTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-700">
                        ₱{(inv.balanceDue ?? inv.pricing.remainingBalance).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleTogglePaymentStatus(inv)}
                          title="Click to advance payment status (Unpaid -> Partial -> Paid)"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                            inv.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : inv.paymentStatus === 'partial'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {inv.paymentStatus === 'paid' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {inv.paymentStatus}
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{inv.signerName}</div>
                        <div className="text-[11px] text-slate-400">{inv.signerTitle}</div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleView(inv)}
                            className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium"
                            title="View / Print PDF"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                            title="Delete"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 sm:p-6 flex items-start justify-center backdrop-blur-xs">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl p-6 shadow-2xl my-8">
            <button
              type="button"
              onClick={() => setShowViewModal(false)}
              className="no-print absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
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
