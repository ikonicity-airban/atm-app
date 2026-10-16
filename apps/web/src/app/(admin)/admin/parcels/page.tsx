'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  MapPin,
  ArrowRight,
  User,
  Phone,
  KeyRound,
  X,
  FileCheck,
  Warehouse,
  ChevronRight,
} from 'lucide-react';
import {
  formatNaira,
  SEED_TERMINALS,
  type ParcelStatus,
} from '@atm/shared';
import type { DbParcel } from '@atm/db';
import { parcelRepository } from '@/server/repositories/parcels.ts';

export default function AdminParcelsPage() {
  const [parcels, setParcels] = useState<DbParcel[]>([]);
  const [stageCounts, setStageCounts] = useState<{
    booked: number;
    received_at_origin: number;
    in_transit: number;
    arrived_at_destination: number;
    ready_for_pickup: number;
    delivered: number;
    total: number;
  }>({
    booked: 0,
    received_at_origin: 0,
    in_transit: 0,
    arrived_at_destination: 0,
    ready_for_pickup: 0,
    delivered: 0,
    total: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTerminal, setSelectedTerminal] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pickup Verification Modal State
  const [pickupModalParcel, setPickupModalParcel] = useState<DbParcel | null>(null);
  const [pickupCodeInput, setPickupCodeInput] = useState<string>('');
  const [isVerifyingPickup, setIsVerifyingPickup] = useState<boolean>(false);
  const [pickupError, setPickupError] = useState<string | null>(null);

  // Status Advancement Modal State
  const [advanceModalParcel, setAdvanceModalParcel] = useState<DbParcel | null>(null);
  const [advanceTargetStatus, setAdvanceTargetStatus] = useState<ParcelStatus>('received_at_origin');
  const [advanceLocationTerminalId, setAdvanceLocationTerminalId] = useState<string>('');
  const [advanceDescription, setAdvanceDescription] = useState<string>('');
  const [isAdvancingStatus, setIsAdvancingStatus] = useState<boolean>(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  const loadParcels = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let loadedParcels: DbParcel[] | null = null;
      let counts = {
        booked: 0,
        received_at_origin: 0,
        in_transit: 0,
        arrived_at_destination: 0,
        ready_for_pickup: 0,
        delivered: 0,
        total: 0,
      };

      try {
        const queryParams = new URLSearchParams();
        if (selectedTerminal !== 'all') queryParams.set('terminalId', selectedTerminal);
        if (selectedStatus !== 'all') queryParams.set('status', selectedStatus);
        if (searchQuery.trim()) queryParams.set('q', searchQuery.trim());

        const res = await fetch(`/api/admin/parcels?${queryParams.toString()}`);
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          loadedParcels = json.data.parcels;
          counts = json.data.stageCounts;
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

      if (!loadedParcels) {
        const all = await parcelRepository.getAllParcels();
        counts = {
          booked: all.filter((p) => p.status === 'booked').length,
          received_at_origin: all.filter((p) => p.status === 'received_at_origin').length,
          in_transit: all.filter((p) => p.status === 'in_transit').length,
          arrived_at_destination: all.filter((p) => p.status === 'arrived_at_destination').length,
          ready_for_pickup: all.filter((p) => p.status === 'ready_for_pickup').length,
          delivered: all.filter((p) => p.status === 'delivered').length,
          total: all.length,
        };

        let filtered = [...all];
        if (selectedTerminal !== 'all') {
          filtered = filtered.filter(
            (p) => p.originTerminalId === selectedTerminal || p.destinationTerminalId === selectedTerminal
          );
        }
        if (selectedStatus !== 'all') {
          filtered = filtered.filter((p) => p.status === selectedStatus);
        }
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toUpperCase();
          filtered = filtered.filter(
            (p) =>
              p.trackingCode.toUpperCase().includes(q) ||
              p.senderPhone.includes(q) ||
              p.receiverPhone.includes(q) ||
              p.senderName.toUpperCase().includes(q) ||
              p.receiverName.toUpperCase().includes(q)
          );
        }
        loadedParcels = filtered;
      }

      setParcels(loadedParcels);
      setStageCounts(counts);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load parcels.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadParcels();
  }, [selectedTerminal, selectedStatus, searchQuery]);

  const getTerminalName = (id: string) => {
    const term = SEED_TERMINALS.find((t) => t.id === id);
    return term ? term.name : id;
  };

  const getNextDefaultStatus = (current: ParcelStatus): ParcelStatus => {
    switch (current) {
      case 'booked':
        return 'received_at_origin';
      case 'received_at_origin':
        return 'in_transit';
      case 'in_transit':
        return 'arrived_at_destination';
      case 'arrived_at_destination':
        return 'ready_for_pickup';
      case 'ready_for_pickup':
        return 'delivered';
      default:
        return 'delivered';
    }
  };

  const openAdvanceModal = (parcel: DbParcel) => {
    setAdvanceModalParcel(parcel);
    const next = getNextDefaultStatus(parcel.status);
    setAdvanceTargetStatus(next);
    setAdvanceLocationTerminalId(
      next === 'ready_for_pickup' || next === 'arrived_at_destination'
        ? parcel.destinationTerminalId
        : parcel.originTerminalId
    );
    setAdvanceDescription(`Consignment status progressed to ${next.replace(/_/g, ' ')}`);
    setAdvanceError(null);
  };

  const handleAdvanceStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceModalParcel) return;
    setIsAdvancingStatus(true);
    setAdvanceError(null);

    try {
      let updated: any = null;
      try {
        const res = await fetch('/api/admin/parcels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'advance_status',
            trackingCode: advanceModalParcel.trackingCode,
            nextStatus: advanceTargetStatus,
            locationTerminalId: advanceLocationTerminalId,
            description: advanceDescription,
            staffId: 'staff-terminal-counter',
          }),
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          updated = json.data;
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

      if (!updated) {
        const repoRes = await parcelRepository.updateParcelStatus(
          advanceModalParcel.trackingCode,
          advanceTargetStatus,
          advanceLocationTerminalId,
          advanceDescription,
          'staff-terminal-counter'
        );
        if (!repoRes) {
          throw new Error('Could not find or update the consignment in repository.');
        }
        updated = repoRes;
      }

      setSuccessMessage(
        `Consignment ${advanceModalParcel.trackingCode} advanced to ${advanceTargetStatus.replace(/_/g, ' ')}.`
      );
      setAdvanceModalParcel(null);
      await loadParcels();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to advance status.';
      setAdvanceError(msg);
    } finally {
      setIsAdvancingStatus(false);
    }
  };

  const openPickupModal = (parcel: DbParcel) => {
    setPickupModalParcel(parcel);
    setPickupCodeInput('');
    setPickupError(null);
  };

  const handlePickupVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupModalParcel) return;
    if (!pickupCodeInput.trim() || pickupCodeInput.trim().length !== 4) {
      setPickupError('Please provide the valid 4-digit secret pickup OTP.');
      return;
    }

    setIsVerifyingPickup(true);
    setPickupError(null);

    try {
      let result: any = null;
      try {
        const res = await fetch('/api/admin/parcels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verify_pickup',
            trackingCode: pickupModalParcel.trackingCode,
            pickupCode: pickupCodeInput.trim(),
            staffId: 'staff-terminal-counter',
          }),
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          result = json.data;
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

      if (!result) {
        result = await parcelRepository.verifyPickupAndDeliver(
          pickupModalParcel.trackingCode,
          pickupCodeInput.trim(),
          'staff-terminal-counter'
        );
      }

      setSuccessMessage(
        `Waybill ${pickupModalParcel.trackingCode} verified successfully and released to recipient.`
      );
      setPickupModalParcel(null);
      await loadParcels();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid pickup code.';
      setPickupError(msg);
    } finally {
      setIsVerifyingPickup(false);
    }
  };

  const getStatusBadge = (status: ParcelStatus) => {
    switch (status) {
      case 'booked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5" /> Booked
          </span>
        );
      case 'received_at_origin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Warehouse className="w-3.5 h-3.5" /> Received at Origin
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Truck className="w-3.5 h-3.5" /> In Transit
          </span>
        );
      case 'arrived_at_destination':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <MapPin className="w-3.5 h-3.5" /> Arrived at Destination
          </span>
        );
      case 'ready_for_pickup':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <KeyRound className="w-3.5 h-3.5" /> Ready for Collection
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {status}
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
            Parcels &amp; Freight Hub
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Live consignment intake, corridor transshipment, checkpoint advancement, and secure 4-digit collection verification.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white"
          >
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
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stage Counter Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatus === 'all'
              ? 'bg-[#1E2E4A]/80 border-cyan-500/50 ring-1 ring-cyan-500/50'
              : 'bg-[#0B1528] border-[#1E2E4A] hover:border-slate-600'
          }`}
        >
          <div className="text-xs text-slate-400 font-medium">All Shipments</div>
          <div className="mt-1 text-xl font-bold text-white">{stageCounts.total}</div>
        </button>

        <button
          onClick={() => setSelectedStatus('booked')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatus === 'booked'
              ? 'bg-[#1E2E4A]/80 border-blue-500/50 ring-1 ring-blue-500/50'
              : 'bg-[#0B1528] border-[#1E2E4A] hover:border-slate-600'
          }`}
        >
          <div className="text-xs text-blue-400 font-medium">1. Booked</div>
          <div className="mt-1 text-xl font-bold text-white">{stageCounts.booked}</div>
        </button>

        <button
          onClick={() => setSelectedStatus('received_at_origin')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatus === 'received_at_origin'
              ? 'bg-[#1E2E4A]/80 border-amber-500/50 ring-1 ring-amber-500/50'
              : 'bg-[#0B1528] border-[#1E2E4A] hover:border-slate-600'
          }`}
        >
          <div className="text-xs text-amber-400 font-medium">2. Received</div>
          <div className="mt-1 text-xl font-bold text-white">{stageCounts.received_at_origin}</div>
        </button>

        <button
          onClick={() => setSelectedStatus('in_transit')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatus === 'in_transit'
              ? 'bg-[#1E2E4A]/80 border-cyan-500/50 ring-1 ring-cyan-500/50'
              : 'bg-[#0B1528] border-[#1E2E4A] hover:border-slate-600'
          }`}
        >
          <div className="text-xs text-cyan-400 font-medium">3. In Transit</div>
          <div className="mt-1 text-xl font-bold text-white">{stageCounts.in_transit}</div>
        </button>

        <button
          onClick={() => setSelectedStatus('arrived_at_destination')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatus === 'arrived_at_destination'
              ? 'bg-[#1E2E4A]/80 border-purple-500/50 ring-1 ring-purple-500/50'
              : 'bg-[#0B1528] border-[#1E2E4A] hover:border-slate-600'
          }`}
        >
          <div className="text-xs text-purple-400 font-medium">4. Arrived</div>
          <div className="mt-1 text-xl font-bold text-white">{stageCounts.arrived_at_destination}</div>
        </button>

        <button
          onClick={() => setSelectedStatus('ready_for_pickup')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatus === 'ready_for_pickup'
              ? 'bg-[#1E2E4A]/80 border-orange-500/50 ring-1 ring-orange-500/50'
              : 'bg-[#0B1528] border-[#1E2E4A] hover:border-slate-600'
          }`}
        >
          <div className="text-xs text-orange-400 font-medium">5. Ready Pickup</div>
          <div className="mt-1 text-xl font-bold text-white">{stageCounts.ready_for_pickup}</div>
        </button>

        <button
          onClick={() => setSelectedStatus('delivered')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatus === 'delivered'
              ? 'bg-[#1E2E4A]/80 border-emerald-500/50 ring-1 ring-emerald-500/50'
              : 'bg-[#0B1528] border-[#1E2E4A] hover:border-slate-600'
          }`}
        >
          <div className="text-xs text-emerald-400 font-medium">6. Delivered</div>
          <div className="mt-1 text-xl font-bold text-white">{stageCounts.delivered}</div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between p-4 rounded-xl bg-[#0B1528] border border-[#1E2E4A]">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by waybill code, passenger name, or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#060D1A] border border-[#1E2E4A] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedTerminal}
              onChange={(e) => setSelectedTerminal(e.target.value)}
              className="bg-[#060D1A] border border-[#1E2E4A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Terminals</option>
              {SEED_TERMINALS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.city})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#060D1A] border border-[#1E2E4A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Stages</option>
              <option value="booked">Booked</option>
              <option value="received_at_origin">Received at Origin</option>
              <option value="in_transit">In Transit</option>
              <option value="arrived_at_destination">Arrived at Destination</option>
              <option value="ready_for_pickup">Ready for Collection</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Consignment Table / Roster */}
      <div className="rounded-xl border border-[#1E2E4A] bg-[#0B1528] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading freight registry...</div>
        ) : parcels.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-white font-medium">No consignments match current filters</p>
            <p className="text-sm text-slate-400 mt-1">Try resetting the terminal or status selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#060D1A] border-b border-[#1E2E4A] text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Waybill &amp; Item</th>
                  <th className="px-6 py-4">Route Corridor</th>
                  <th className="px-6 py-4">Sender / Recipient</th>
                  <th className="px-6 py-4">Tariff</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2E4A]">
                {parcels.map((parcel) => (
                  <tr key={parcel.id} className="hover:bg-[#111F38]/50 transition-colors">
                    {/* Waybill Code and Category */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-400">{parcel.trackingCode}</span>
                        {parcel.fragile && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Fragile
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white font-medium mt-1">{parcel.description}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Category: <span className="capitalize text-slate-300">{parcel.category}</span> • {parcel.weightKg} kg
                      </div>
                    </td>

                    {/* Route */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-white">
                        <span className="font-medium text-slate-300">{getTerminalName(parcel.originTerminalId)}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-medium text-cyan-300">{getTerminalName(parcel.destinationTerminalId)}</span>
                      </div>
                    </td>

                    {/* Sender and Recipient */}
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <div className="text-slate-300">
                          <span className="text-slate-500">From:</span> {parcel.senderName} ({parcel.senderPhone})
                        </div>
                        <div className="text-slate-300 mt-1">
                          <span className="text-slate-500">To:</span> {parcel.receiverName} ({parcel.receiverPhone})
                        </div>
                      </div>
                    </td>

                    {/* Tariff / Fee */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{formatNaira(parcel.totalFeeKobo)}</div>
                      <div className="text-[11px] text-slate-400">
                        {parcel.paid ? (
                          <span className="text-emerald-400 font-medium">Paid</span>
                        ) : (
                          <span className="text-amber-400 font-medium">Collect on Delivery</span>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(parcel.status)}
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {parcel.status !== 'delivered' && (
                          <button
                            onClick={() => openAdvanceModal(parcel)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1E2E4A] hover:bg-[#25395C] text-slate-200 transition-colors inline-flex items-center gap-1.5 border border-slate-700"
                            title="Update consignment milestone status"
                          >
                            <Truck className="w-3.5 h-3.5 text-cyan-400" />
                            Advance
                          </button>
                        )}

                        {parcel.status === 'ready_for_pickup' && (
                          <button
                            onClick={() => openPickupModal(parcel)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors inline-flex items-center gap-1.5 shadow-sm"
                            title="Verify 4-digit secret OTP and deliver to recipient"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            Verify Code
                          </button>
                        )}

                        {parcel.status === 'delivered' && (
                          <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Complete
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verify 4-digit Collection OTP Modal */}
      {pickupModalParcel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0B1528] border border-[#1E2E4A] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2E4A]">
              <div className="flex items-center gap-2 text-white font-semibold">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Verify Recipient Collection OTP</span>
              </div>
              <button
                onClick={() => setPickupModalParcel(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePickupVerificationSubmit} className="mt-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-[#060D1A] border border-[#1E2E4A] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Waybill:</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {pickupModalParcel.trackingCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient:</span>
                  <span className="text-white font-medium">{pickupModalParcel.receiverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="text-slate-300">{pickupModalParcel.receiverPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Destination Bay:</span>
                  <span className="text-slate-300">
                    {getTerminalName(pickupModalParcel.destinationTerminalId)}
                  </span>
                </div>
              </div>

              {pickupError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pickupError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Enter 4-Digit Pickup PIN (SMS Sent to Recipient)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    maxLength={4}
                    value={pickupCodeInput}
                    onChange={(e) => setPickupCodeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 4829"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#060D1A] border border-[#1E2E4A] rounded-xl text-lg font-mono tracking-widest text-white text-center placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Recipient must present this one-time security PIN before terminal dispatch staff can release the package.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPickupModalParcel(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingPickup || pickupCodeInput.length !== 4}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-all shadow-md flex items-center gap-2"
                >
                  {isVerifyingPickup ? 'Verifying...' : 'Confirm & Release Parcel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advance Status Modal */}
      {advanceModalParcel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#0B1528] border border-[#1E2E4A] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2E4A]">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Truck className="w-5 h-5 text-cyan-400" />
                <span>Advance Shipment Milestone</span>
              </div>
              <button
                onClick={() => setAdvanceModalParcel(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdvanceStatusSubmit} className="mt-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-[#060D1A] border border-[#1E2E4A] text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Waybill:</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {advanceModalParcel.trackingCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span className="text-amber-400 font-medium capitalize">
                    {advanceModalParcel.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Corridor:</span>
                  <span className="text-white">
                    {getTerminalName(advanceModalParcel.originTerminalId)} → {getTerminalName(advanceModalParcel.destinationTerminalId)}
                  </span>
                </div>
              </div>

              {advanceError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{advanceError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Next Milestone Status
                </label>
                <select
                  value={advanceTargetStatus}
                  onChange={(e) => setAdvanceTargetStatus(e.target.value as ParcelStatus)}
                  className="w-full px-3 py-2 bg-[#060D1A] border border-[#1E2E4A] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="received_at_origin">Received at Origin Terminal</option>
                  <option value="in_transit">In Transit (Highway Corridor)</option>
                  <option value="arrived_at_destination">Arrived at Destination Terminal</option>
                  <option value="ready_for_pickup">Ready for Customer Collection</option>
                  <option value="delivered">Delivered &amp; Handed Over</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Checkpoint Terminal Location
                </label>
                <select
                  value={advanceLocationTerminalId}
                  onChange={(e) => setAdvanceLocationTerminalId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060D1A] border border-[#1E2E4A] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  {SEED_TERMINALS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Dispatch / Handling Notes
                </label>
                <textarea
                  rows={2}
                  value={advanceDescription}
                  onChange={(e) => setAdvanceDescription(e.target.value)}
                  placeholder="e.g. Scanned into destination holding room. SMS dispatched."
                  className="w-full px-3 py-2 bg-[#060D1A] border border-[#1E2E4A] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAdvanceModalParcel(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdvancingStatus}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition-all shadow-md flex items-center gap-2"
                >
                  {isAdvancingStatus ? 'Updating...' : 'Save & Record Checkpoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
