'use client';

import React, { useState, useEffect } from 'react';
import type { DbTicket } from '@atm/db';
import type { HeldBooking } from '@/server/repositories/bookings.ts';
import {
  formatNaira,
  type CancellationQuoteResult,
  type CancellationExecutionResult,
} from '@atm/shared';
import {
  X,
  AlertTriangle,
  Wallet,
  CreditCard,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';

export interface CancellationModalProps {
  booking: HeldBooking;
  tickets: DbTicket[];
  phone: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: CancellationExecutionResult) => void;
}

export function CancellationModal({
  booking,
  tickets,
  phone,
  isOpen,
  onClose,
  onSuccess,
}: CancellationModalProps) {
  const activeTickets = tickets.filter((t) => t.status !== 'cancelled');
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [disbursementMethod, setDisbursementMethod] = useState<'atm_credit' | 'paystack_reversal'>('atm_credit');
  const [reason, setReason] = useState<string>('');
  const [quote, setQuote] = useState<CancellationQuoteResult | null>(null);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with all active tickets selected
  useEffect(() => {
    if (isOpen && activeTickets.length > 0) {
      setSelectedTicketIds(activeTickets.map((t) => t.id));
      setError(null);
    }
  }, [isOpen, activeTickets.length]);

  // Fetch cancellation quote whenever selected tickets change
  useEffect(() => {
    if (!isOpen || selectedTicketIds.length === 0) {
      setQuote(null);
      return;
    }

    let isMounted = true;
    async function fetchQuote() {
      setLoadingQuote(true);
      setError(null);
      try {
        let quoteData = null;
        try {
          const res = await fetch('/api/bookings/manage/quote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ref: booking.ref,
              phone,
              ticketIds: selectedTicketIds,
            }),
          });
          const json = await res.json().catch(() => null);
          if (res.ok && json?.success) {
            quoteData = json.data;
          } else if (json?.error?.message) {
            throw new Error(json.error.message);
          }
        } catch (fetchErr: any) {
          if (fetchErr.message && !fetchErr.message.includes('Failed to fetch') && !fetchErr.message.includes('Unexpected token')) {
            throw fetchErr;
          }
        }

        if (!quoteData) {
          const { manageBookingRepository } = await import('@/server/repositories/manage-booking.ts');
          quoteData = await manageBookingRepository.quoteCancellation({
            ref: booking.ref,
            phone,
            ticketIds: selectedTicketIds,
          });
        }

        if (isMounted) {
          setQuote(quoteData);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Unable to calculate cancellation quote');
        }
      } finally {
        if (isMounted) {
          setLoadingQuote(false);
        }
      }
    }

    fetchQuote();
    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedTicketIds, booking.ref, phone]);

  if (!isOpen) return null;

  const handleToggleTicket = (ticketId: string) => {
    setSelectedTicketIds((prev) => {
      if (prev.includes(ticketId)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter((id) => id !== ticketId);
      } else {
        return [...prev, ticketId];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedTicketIds(activeTickets.map((t) => t.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTicketIds.length === 0) {
      setError('Please select at least one ticket to cancel');
      return;
    }
    if (reason.trim().length < 3) {
      setError('Please provide a brief reason for cancellation (minimum 3 characters)');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let executionResult = null;
      try {
        const res = await fetch('/api/bookings/manage/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ref: booking.ref,
            phone,
            ticketIds: selectedTicketIds,
            reason: reason.trim(),
            disbursementMethod,
          }),
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          executionResult = json.data;
        } else if (json?.error?.message) {
          throw new Error(json.error.message);
        }
      } catch (fetchErr: any) {
        if (fetchErr.message && !fetchErr.message.includes('Failed to fetch') && !fetchErr.message.includes('Unexpected token')) {
          throw fetchErr;
        }
      }

      if (!executionResult) {
        const { manageBookingRepository } = await import('@/server/repositories/manage-booking.ts');
        executionResult = await manageBookingRepository.executeCancellation({
          ref: booking.ref,
          phone,
          ticketIds: selectedTicketIds,
          reason: reason.trim(),
          disbursementMethod,
        });
      }

      onSuccess(executionResult);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error processing cancellation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200/80 my-8">
        {/* Specular top highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 id="cancel-dialog-title" className="text-xl font-bold tracking-tight text-slate-900 text-balance">
              Cancel Reservation Seats
            </h3>
            <p className="mt-1 text-xs uppercase font-bold text-slate-500 tracking-wider">
              Booking Ref: {booking.ref}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label="Close cancellation modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Notice</p>
                <p className="mt-0.5 text-pretty">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Seat Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Select Passenger Seats to Cancel
              </label>
              {activeTickets.length > 1 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-accent-700 hover:text-accent-800 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded"
                >
                  Select all active ({activeTickets.length})
                </button>
              )}
            </div>

            <div className="space-y-2">
              {activeTickets.map((ticket) => {
                const isSelected = selectedTicketIds.includes(ticket.id);
                return (
                  <label
                    key={ticket.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-rose-400/80 bg-rose-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleTicket(ticket.id)}
                        className="h-5 w-5 rounded border-slate-300 text-rose-600 focus:ring-accent-500"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Seat {ticket.seatNo}: {ticket.passengerName}
                        </p>
                        <p className="text-xs text-slate-500">
                          Toyota Sienna • Ticket {ticket.id}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatNaira(ticket.fareKobo)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Step 2: Live Fee Breakdown & Policy Tier */}
          {quote && (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs uppercase font-bold text-slate-500 tracking-wider">
                <span>Fee Calculation Breakdown</span>
                <span className="flex items-center gap-1 text-slate-600 font-semibold lowercase">
                  <Clock className="h-3.5 w-3.5" />
                  {Math.round(quote.hoursRemaining)}h before departure
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Gross fare for {quote.seatsToCancel.length} seat(s)</span>
                  <span className="font-semibold text-slate-900">{formatNaira(quote.totalFareCancelledKobo)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cancellation deduction ({quote.feePercentageApplied}%)</span>
                  <span className="font-semibold text-rose-600">-{formatNaira(quote.cancellationFeeKobo)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold">
                  <span className="text-slate-900">Net Refund Amount</span>
                  <span className="text-base text-emerald-700">{formatNaira(quote.refundAmountKobo)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 text-pretty">
                {quote.reason}
              </p>
            </div>
          )}

          {/* Step 3: Refund Method Selection */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
              Select Refund Disbursement Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Wallet Credit Option */}
              <button
                type="button"
                onClick={() => setDisbursementMethod('atm_credit')}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                  disbursementMethod === 'atm_credit'
                    ? 'border-accent-600 bg-accent-50/50 ring-2 ring-accent-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Wallet className="h-4 w-4 text-accent-600" />
                    ATM Store Credit
                  </div>
                  <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Instant
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed text-pretty">
                  Added to your phone credit wallet immediately. Ready for instant ticket rebooking.
                </p>
              </button>

              {/* Paystack Card Reversal */}
              <button
                type="button"
                onClick={() => setDisbursementMethod('paystack_reversal')}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                  disbursementMethod === 'paystack_reversal'
                    ? 'border-accent-600 bg-accent-50/50 ring-2 ring-accent-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <CreditCard className="h-4 w-4 text-slate-700" />
                    Original Payment Reversal
                  </div>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    3 to 5 Days
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed text-pretty">
                  Processed via Paystack back to your debit card or bank account.
                </p>
              </button>
            </div>
          </div>

          {/* Step 4: Cancellation Reason */}
          <div>
            <label htmlFor="cancel-reason" className="block text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
              Reason for Cancellation
            </label>
            <input
              id="cancel-reason"
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Schedule adjustment, emergency, personal reason"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full sm:w-auto min-h-[44px] px-5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              Keep My Booking
            </button>
            <button
              type="submit"
              disabled={submitting || loadingQuote || selectedTicketIds.length === 0}
              className="w-full sm:w-auto min-h-[44px] px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow transition-all disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 flex items-center justify-center gap-2"
            >
              {submitting ? 'Processing Cancellation...' : 'Confirm Ticket Cancellation'}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
