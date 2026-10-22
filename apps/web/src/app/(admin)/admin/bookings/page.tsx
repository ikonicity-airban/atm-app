'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  SEED_TERMINALS,
  formatNaira,
  formatWatDateTime,
} from '@atm/shared';
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/Select';
import { bookingRepository, type HeldBooking } from '@/server/repositories/bookings.ts';
import {
  Search,
  Filter,
  Users,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  UserCheck,
  Eye,
  X,
  CreditCard,
} from 'lucide-react';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<HeldBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTerminal, setSelectedTerminal] = useState<string>('all');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<HeldBooking | null>(null);

  useEffect(() => {
    setLoading(true);
    bookingRepository.getAllBookings().then((data) => {
      setBookings(data);
      setLoading(false);
    });
  }, []);

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2500);
  };

  const handleCheckIn = async (ref: string) => {
    // Optimistically update status
    setBookings((prev) =>
      prev.map((b) => (b.ref === ref ? { ...b, status: 'confirmed' as const } : b))
    );
    if (selectedBooking && selectedBooking.ref === ref) {
      setSelectedBooking((prev) => (prev ? { ...prev, status: 'confirmed' as const } : null));
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Status filter
      if (selectedStatus !== 'all' && b.status !== selectedStatus) {
        return false;
      }

      // Terminal filter
      if (selectedTerminal !== 'all') {
        const origId = b.trip?.originTerminal?.id;
        const destId = b.trip?.destinationTerminal?.id;
        if (origId !== selectedTerminal && destId !== selectedTerminal) {
          return false;
        }
      }

      // Search query (ref, name, phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const refMatch = b.ref.toLowerCase().includes(q);
        const nameMatch = b.contact.fullName.toLowerCase().includes(q);
        const phoneMatch = b.contact.phone.replace(/[\s-]/g, '').includes(q.replace(/[\s-]/g, ''));
        const passengerMatch = b.passengers.some((p) => p.fullName.toLowerCase().includes(q));
        return refMatch || nameMatch || phoneMatch || passengerMatch;
      }

      return true;
    });
  }, [bookings, selectedStatus, selectedTerminal, searchQuery]);

  const totalSeatsBooked = bookings.reduce(
    (acc, b) => (b.status === 'confirmed' ? acc + b.seats.length : acc),
    0
  );
  const totalGrossKobo = bookings.reduce(
    (acc, b) => (b.status === 'confirmed' ? acc + b.totalFareKobo : acc),
    0
  );
  const activeHoldsCount = bookings.filter((b) => b.status === 'held').length;

  return (
    <div className="py-6 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-1">
            Operations Console &bull; Phase 7
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
            Passenger Booking Manifests
          </h1>
          <p className="mt-1 text-sm text-slate-600 text-pretty">
            Search, verify, and inspect passenger seat reservations across Nigerian intercity departures.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white border border-slate-200/80 px-4 py-2 rounded-xl shadow-xs">
            <span className="text-[11px] text-slate-500 uppercase font-bold block">Confirmed Seats</span>
            <span className="text-base font-extrabold text-slate-900">{totalSeatsBooked} Passengers</span>
          </div>
          <div className="bg-white border border-slate-200/80 px-4 py-2 rounded-xl shadow-xs">
            <span className="text-[11px] text-slate-500 uppercase font-bold block">Paid Seat Volume</span>
            <span className="text-base font-extrabold text-brand-700">{formatNaira(totalGrossKobo)}</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Surface */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference (ATM-...), phone (+234...), or passenger name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all min-h-[44px]"
            />
          </div>

          {/* Terminal Filter */}
          <div className="md:col-span-3">
            <Select
              value={selectedTerminal}
              onValueChange={(val) => {
                if (typeof val === 'string') setSelectedTerminal(val);
              }}
            >
              <SelectTrigger startIcon={MapPin} className="min-h-[44px]">
                <SelectValue placeholder="All Terminal Hubs" />
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value="all">All Terminal Hubs</SelectItem>
                {SEED_TERMINALS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.city} ({t.code})
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <Select
              value={selectedStatus}
              onValueChange={(val) => {
                if (typeof val === 'string') setSelectedStatus(val);
              }}
            >
              <SelectTrigger startIcon={Filter} className="min-h-[44px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed / Paid</SelectItem>
                <SelectItem value="held">15m Hold Lock</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectPopup>
            </Select>
          </div>
        </div>

        {/* Status Pill Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          {[
            { id: 'all', label: 'All Bookings', count: bookings.length },
            { id: 'confirmed', label: 'Confirmed', count: bookings.filter((b) => b.status === 'confirmed').length },
            { id: 'held', label: 'Hold Lock', count: activeHoldsCount },
            { id: 'cancelled', label: 'Cancelled', count: bookings.filter((b) => b.status === 'cancelled').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1 rounded-lg font-bold transition-all min-h-[32px] cursor-pointer ${
                selectedStatus === tab.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Active Passenger Manifest Records</h2>
            <p className="text-xs text-slate-500">Showing {filteredBookings.length} matching reservations.</p>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">No reservations found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn&apos;t find any bookings matching your current filter criteria.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
                setSelectedTerminal('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors min-h-[44px]"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">Ref</th>
                  <th className="py-3 px-4">Primary Passenger</th>
                  <th className="py-3 px-4">Corridor Route</th>
                  <th className="py-3 px-4">Seats</th>
                  <th className="py-3 px-4">Total Fare</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredBookings.map((b) => (
                  <tr key={b.ref} className="hover:bg-slate-50/70 transition-colors">
                    {/* Booking Ref */}
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-brand-700">{b.ref}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyRef(b.ref)}
                          className="p-1 rounded hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          title="Copy reference"
                        >
                          {copiedRef === b.ref ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Passenger */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{b.contact.fullName}</div>
                      <div className="text-[11px] text-slate-400">{b.contact.phone}</div>
                    </td>

                    {/* Corridor */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {b.trip?.originTerminal?.name || 'Origin'} &rarr; {b.trip?.destinationTerminal?.name || 'Destination'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatWatDateTime(b.trip?.departureTimeUtc || new Date().toISOString()).fullStr}
                      </div>
                    </td>

                    {/* Seats */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {b.seats.map((seat) => (
                          <span
                            key={seat}
                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[11px]"
                          >
                            Seat {seat}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Fare */}
                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      {formatNaira(b.totalFareKobo)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {b.status === 'confirmed' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Confirmed / Paid
                        </span>
                      )}
                      {b.status === 'held' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          15m Hold Lock
                        </span>
                      )}
                      {b.status === 'cancelled' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-800 border border-red-200">
                          Cancelled / Refunded
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(b)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center gap-1 min-h-[36px] transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-brand-700 text-sm">{selectedBooking.ref}</span>
                <span className="text-xs text-slate-400">&bull; Manifest Details</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Corridor */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-[11px] uppercase font-bold text-slate-400 block">Corridor &amp; Schedule</span>
                <h4 className="text-sm font-extrabold text-slate-900">
                  {selectedBooking.trip?.originTerminal?.name} &rarr; {selectedBooking.trip?.destinationTerminal?.name}
                </h4>
                <div className="text-slate-600 font-medium flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Departs: {formatWatDateTime(selectedBooking.trip?.departureTimeUtc || new Date().toISOString()).fullStr}</span>
                </div>
              </div>

              {/* Passengers Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Manifest Passengers</h4>
                <div className="space-y-2">
                  {selectedBooking.passengers.map((p) => (
                    <div
                      key={p.seatNo}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-xs">
                          {p.seatNo}
                        </span>
                        <span className="font-bold text-slate-900">{p.fullName}</span>
                      </div>
                      <span className="text-slate-500 text-[11px]">Toyota Sienna Seat {p.seatNo}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact & Next of Kin */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block">Contact Phone</span>
                  <span className="font-semibold text-slate-900 block mt-0.5">{selectedBooking.contact.phone}</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block">Emergency Next of Kin</span>
                  <span className="font-semibold text-slate-900 block mt-0.5">
                    {selectedBooking.contact.nextOfKinPhone || 'Not recorded'}
                  </span>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="p-4 rounded-xl bg-brand-50/50 border border-brand-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-600 uppercase font-bold block">Total Paid Fare</span>
                  <span className="text-sm font-mono text-slate-500">
                    {selectedBooking.seats.length} seat(s) &times; {formatNaira(selectedBooking.fareKoboPerSeat)}
                  </span>
                </div>
                <div className="text-base font-extrabold text-brand-700">
                  {formatNaira(selectedBooking.totalFareKobo)}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs min-h-[44px] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
