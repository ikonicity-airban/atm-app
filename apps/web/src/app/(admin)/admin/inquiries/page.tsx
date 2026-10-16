'use client';

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  User,
  Phone,
  Mail,
  FileText,
  Tag,
  Plus,
  X,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Send,
  Ticket,
} from 'lucide-react';
import {
  formatWatDateTime,
  normalisePhone,
  type CustomerInquiry,
  type InquiriesKPIs,
  type InquiryCategory,
  type InquiryPriority,
  type InquiryStatus,
} from '@atm/shared';
import { inquiriesRepository } from '@/server/repositories/inquiries.ts';

const CATEGORY_MAP: Record<InquiryCategory, string> = {
  booking: 'Booking Modification',
  luggage: 'Luggage & Waybills',
  refund: 'Refund & Cancellation',
  driver_conduct: 'Driver Service',
  delay: 'Transit Delay',
  general: 'General Inquiry',
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [kpis, setKpis] = useState<InquiriesKPIs | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Resolution Modal State
  const [resolvingTicket, setResolvingTicket] = useState<CustomerInquiry | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<InquiryStatus>('resolved');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [staffName, setStaffName] = useState<string>('Adaeze Nwankwo');
  const [isSubmittingResolution, setIsSubmittingResolution] = useState<boolean>(false);
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  // New Ticket Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');
  const [newCustomerEmail, setNewCustomerEmail] = useState<string>('');
  const [newCategory, setNewCategory] = useState<InquiryCategory>('booking');
  const [newPriority, setNewPriority] = useState<InquiryPriority>('medium');
  const [newBookingRef, setNewBookingRef] = useState<string>('');
  const [newWaybillCode, setNewWaybillCode] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>('');
  const [newMessage, setNewMessage] = useState<string>('');
  const [isCreatingTicket, setIsCreatingTicket] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadInquiries = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let loadedInquiries: CustomerInquiry[] | null = null;
      let loadedKpis: InquiriesKPIs | null = null;

      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory !== 'all') queryParams.set('category', selectedCategory);
        if (selectedStatus !== 'all') queryParams.set('status', selectedStatus);
        if (searchQuery.trim()) queryParams.set('q', searchQuery.trim());

        const res = await fetch(`/api/admin/inquiries?${queryParams.toString()}`);
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          loadedInquiries = json.data.inquiries;
          loadedKpis = json.data.kpis;
        } else if (json?.error?.message) {
          throw new Error(json.error.message);
        }
      } catch (fetchErr: unknown) {
        if (
          fetchErr instanceof Error &&
          !fetchErr.message.includes('Unexpected token') &&
          !fetchErr.message.includes('Failed to fetch')
        ) {
          throw fetchErr;
        }
      }

      if (!loadedInquiries || !loadedKpis) {
        const [inqs, kp] = await Promise.all([
          inquiriesRepository.getInquiries({
            category: selectedCategory,
            status: selectedStatus,
            query: searchQuery,
          }),
          inquiriesRepository.getKPIs(),
        ]);
        loadedInquiries = inqs;
        loadedKpis = kp;
      }

      setInquiries(loadedInquiries);
      setKpis(loadedKpis);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load inquiries.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, [selectedCategory, selectedStatus, searchQuery]);

  const openResolveModal = (inq: CustomerInquiry) => {
    setResolvingTicket(inq);
    setResolutionStatus(inq.status === 'resolved' ? 'resolved' : 'resolved');
    setResolutionNotes(inq.resolutionNotes || '');
    setStaffName(inq.assignedStaffName || 'Adaeze Nwankwo');
    setResolutionError(null);
  };

  const handleResolutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket) return;
    if (!resolutionNotes.trim()) {
      setResolutionError('Resolution notes are required to document support actions.');
      return;
    }

    setIsSubmittingResolution(true);
    setResolutionError(null);

    try {
      let resolved: any = null;
      try {
        const res = await fetch(`/api/admin/inquiries/${resolvingTicket.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: resolutionStatus,
            resolutionNotes: resolutionNotes.trim(),
            staffId: 'staff-hq-admin-01',
            staffName: staffName.trim() || 'Adaeze Nwankwo',
          }),
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          resolved = json.data;
        } else if (json?.error?.message) {
          throw new Error(json.error.message);
        }
      } catch (fetchErr: unknown) {
        if (
          fetchErr instanceof Error &&
          !fetchErr.message.includes('Unexpected token') &&
          !fetchErr.message.includes('Failed to fetch')
        ) {
          throw fetchErr;
        }
      }

      if (!resolved) {
        resolved = await inquiriesRepository.resolveInquiry({
          inquiryId: resolvingTicket.id,
          status: resolutionStatus,
          resolutionNotes: resolutionNotes.trim(),
          staffId: 'staff-hq-admin-01',
          staffName: staffName.trim() || 'Adaeze Nwankwo',
        });
      }

      setSuccessMessage(
        `Ticket ${resolvingTicket.id} updated to ${resolutionStatus.replace(/_/g, ' ')}.`
      );
      setResolvingTicket(null);
      await loadInquiries();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update ticket.';
      setResolutionError(msg);
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newCustomerName.trim() || !newCustomerPhone.trim() || !newSubject.trim() || !newMessage.trim()) {
      setCreateError('Customer name, phone number, subject, and message are required.');
      return;
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalisePhone(newCustomerPhone.trim());
    } catch {
      setCreateError('Please enter a valid Nigerian mobile phone number (e.g. 08031234567).');
      return;
    }

    setIsCreatingTicket(true);
    try {
      const payload = {
        customerName: newCustomerName.trim(),
        customerPhone: normalizedPhone,
        customerEmail: newCustomerEmail.trim() || undefined,
        bookingRef: newBookingRef.trim() || undefined,
        waybillCode: newWaybillCode.trim() || undefined,
        category: newCategory,
        priority: newPriority,
        subject: newSubject.trim(),
        message: newMessage.trim(),
      };

      let created: any = null;
      try {
        const res = await fetch('/api/admin/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          created = json.data;
        } else if (json?.error?.message) {
          throw new Error(json.error.message);
        }
      } catch (fetchErr: unknown) {
        if (
          fetchErr instanceof Error &&
          !fetchErr.message.includes('Unexpected token') &&
          !fetchErr.message.includes('Failed to fetch')
        ) {
          throw fetchErr;
        }
      }

      if (!created) {
        created = await inquiriesRepository.createInquiry(payload);
      }

      setSuccessMessage(`New ticket ${created.id} created successfully.`);
      setIsCreateModalOpen(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
      setNewSubject('');
      setNewMessage('');
      setNewBookingRef('');
      setNewWaybillCode('');
      await loadInquiries();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create ticket.';
      setCreateError(msg);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const getPriorityBadge = (priority: InquiryPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wide">
            <AlertTriangle className="w-3 h-3" /> Urgent
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30 uppercase tracking-wide">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wide">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-500/20 text-slate-300 border border-slate-500/30 uppercase tracking-wide">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status: InquiryStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Open
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <MessageSquare className="w-3.5 h-3.5" /> In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header resting directly on section canvas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Customer Inquiries &amp; Support Desk
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Log, assign, and resolve customer feedback, booking modifications, luggage queries, and corporate charters.
          </p>
        </div>
        <div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Log Customer Inquiry
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-[#0B1528] border border-[#1E2E4A]">
            <div className="text-xs text-slate-400 font-medium">Total Tickets</div>
            <div className="mt-1 text-2xl font-bold text-white">{kpis.totalInquiries}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1528] border border-[#1E2E4A]">
            <div className="text-xs text-amber-400 font-medium">Awaiting Action</div>
            <div className="mt-1 text-2xl font-bold text-amber-400">{kpis.openCount}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1528] border border-[#1E2E4A]">
            <div className="text-xs text-cyan-400 font-medium">In Investigation</div>
            <div className="mt-1 text-2xl font-bold text-cyan-400">{kpis.inProgressCount}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1528] border border-[#1E2E4A]">
            <div className="text-xs text-emerald-400 font-medium">Resolved</div>
            <div className="mt-1 text-2xl font-bold text-emerald-400">{kpis.resolvedCount}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1528] border border-[#1E2E4A]">
            <div className="text-xs text-rose-400 font-medium">Urgent Priority</div>
            <div className="mt-1 text-2xl font-bold text-rose-400">{kpis.urgentCount}</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between p-4 rounded-xl bg-[#0B1528] border border-[#1E2E4A]">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, ticket ID, booking ref, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#060D1A] border border-[#1E2E4A] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#060D1A] border border-[#1E2E4A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Categories</option>
              <option value="booking">Booking Modification</option>
              <option value="luggage">Luggage &amp; Waybills</option>
              <option value="refund">Ticket Cancellation &amp; Refund</option>
              <option value="driver_conduct">Driver Service</option>
              <option value="delay">Transit Delay</option>
              <option value="general">Corporate &amp; General</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#060D1A] border border-[#1E2E4A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table / List */}
      <div className="rounded-xl border border-[#1E2E4A] bg-[#0B1528] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading support desk tickets...</div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center">
            <HelpCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-white font-medium">No inquiries found matching criteria</p>
            <p className="text-sm text-slate-400 mt-1">Try resetting filter options or query terms.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1E2E4A]">
            {inquiries.map((inq) => (
              <div
                key={inq.id}
                className="p-5 hover:bg-[#111F38]/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-xs text-cyan-400">{inq.id}</span>
                    {getPriorityBadge(inq.priority)}
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {inq.categoryLabel}
                    </span>
                    {getStatusBadge(inq.status)}
                    <span className="text-xs text-slate-500">• {inq.createdAtWat}</span>
                  </div>

                  <h3 className="text-base font-semibold text-white">{inq.subject}</h3>

                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                    {inq.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="inline-flex items-center gap-1.5 text-slate-300">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {inq.customerName}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-300 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {inq.customerPhone}
                    </span>
                    {inq.customerEmail && (
                      <span className="inline-flex items-center gap-1.5 text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {inq.customerEmail}
                      </span>
                    )}
                    {inq.bookingRef && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono border border-blue-500/20">
                        Trip: {inq.bookingRef}
                      </span>
                    )}
                    {inq.waybillCode && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono border border-purple-500/20">
                        Waybill: {inq.waybillCode}
                      </span>
                    )}
                  </div>

                  {inq.resolutionNotes && (
                    <div className="mt-2.5 p-3 rounded-lg bg-[#060D1A] border border-[#1E2E4A] text-xs">
                      <div className="text-emerald-400 font-medium flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Staff Resolution (by {inq.assignedStaffName || 'Support Agent'}):
                      </div>
                      <p className="text-slate-300">{inq.resolutionNotes}</p>
                      {inq.resolvedAtWat && (
                        <div className="text-[11px] text-slate-500 mt-1">Closed at: {inq.resolvedAtWat}</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openResolveModal(inq)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1E2E4A] hover:bg-[#25395C] text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    {inq.status === 'resolved' ? 'Review & Edit' : 'Action / Resolve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Action & Resolution Modal */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#0B1528] border border-[#1E2E4A] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2E4A]">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Ticket className="w-5 h-5 text-cyan-400" />
                <span>Action Ticket: {resolvingTicket.id}</span>
              </div>
              <button
                onClick={() => setResolvingTicket(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolutionSubmit} className="mt-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-[#060D1A] border border-[#1E2E4A] text-xs space-y-1.5">
                <div className="font-semibold text-white">{resolvingTicket.subject}</div>
                <div className="text-slate-400">
                  Customer: <span className="text-slate-300">{resolvingTicket.customerName}</span> ({resolvingTicket.customerPhone})
                </div>
              </div>

              {resolutionError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{resolutionError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Update Support Status
                </label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value as InquiryStatus)}
                  className="w-full px-3 py-2 bg-[#060D1A] border border-[#1E2E4A] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="in_progress">In Progress (Active Investigation)</option>
                  <option value="resolved">Resolved (Customer Handled &amp; Satisfied)</option>
                  <option value="open">Re-open / Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Assigned Staff Name
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060D1A] border border-[#1E2E4A] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Staff Resolution Notes &amp; Action Taken
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail the actions taken: e.g. Contacted driver, confirmed seat swap with passenger, issued refund voucher..."
                  className="w-full px-3 py-2 bg-[#060D1A] border border-[#1E2E4A] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResolution}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-all shadow-md flex items-center gap-2"
                >
                  {isSubmittingResolution ? 'Saving...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Customer Inquiry Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#0B1528] border border-[#1E2E4A] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2E4A]">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Plus className="w-5 h-5 text-cyan-400" />
                <span>Log New Customer Inquiry</span>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="mt-5 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              {createError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nnamdi Azikiwe"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#060D1A] border border-[#1E2E4A] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Phone Number (Nigerian) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 08031234567"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#060D1A] border border-[#1E2E4A] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Customer Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. customer@example.ng"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060D1A] border border-[#1E2E4A] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as InquiryCategory)}
                    className="w-full px-3 py-2 bg-[#060D1A] border border-[#1E2E4A] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="booking">Booking Modification</option>
                    <option value="luggage">Luggage &amp; Waybills</option>
                    <option value="refund">Cancellation &amp; Refund</option>
                    <option value="driver_conduct">Driver Service</option>
                    <option value="delay">Transit Delay</option>
                    <option value="general">Corporate &amp; General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Priority *
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as InquiryPriority)}
                    className="w-full px-3 py-2 bg-[#060D1A] border border-[#1E2E4A] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Booking Reference (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ATM-7K9W2P"
                    value={newBookingRef}
                    onChange={(e) => setNewBookingRef(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-[#060D1A] border border-[#1E2E4A] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Waybill Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ATM-EXP-7K3N9R"
                    value={newWaybillCode}
                    onChange={(e) => setNewWaybillCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-[#060D1A] border border-[#1E2E4A] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seat reassignment request for passenger"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060D1A] border border-[#1E2E4A] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Message / Details *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide detailed description of the customer request or feedback..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060D1A] border border-[#1E2E4A] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTicket}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition-all shadow-md flex items-center gap-2"
                >
                  {isCreatingTicket ? 'Submitting...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
