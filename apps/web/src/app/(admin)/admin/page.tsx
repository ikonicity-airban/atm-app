'use client';

import React, { useState, useEffect } from 'react';
import {
  SEED_TERMINALS,
  formatNaira,
} from '@atm/shared';
import { reportingService, type OperationsMetrics } from '@/server/repositories/reports.ts';
import {
  UserCheck,
  Calendar,
  BarChart3,
  Package,
  Truck,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
} from 'lucide-react';

const MOCK_RECENT_BOOKINGS = [
  {
    ref: 'ATM-7K9W2P',
    passenger: 'Emeka Nwosu',
    phone: '+2348031234567',
    corridor: 'Enugu (Ogui) → Abuja (Utako)',
    seats: [1, 2],
    fareKobo: 6400000,
    status: 'confirmed',
    timeWat: 'Today, 2:45 pm WAT',
  },
  {
    ref: 'ATM-9B4X2K',
    passenger: 'Chioma Okeke',
    phone: '+2348029876543',
    corridor: 'Lagos (Jibowu) → Enugu (Ogui)',
    seats: [3],
    fareKobo: 3600000,
    status: 'checked_in',
    timeWat: 'Today, 1:15 pm WAT',
  },
  {
    ref: 'ATM-5V8R1M',
    passenger: 'Ibrahim Danladi',
    phone: '+2348091112233',
    corridor: 'Abuja (Utako) → Enugu (Ogui)',
    seats: [4, 5],
    fareKobo: 6400000,
    status: 'confirmed',
    timeWat: 'Today, 11:30 am WAT',
  },
  {
    ref: 'ATM-3L7T9Q',
    passenger: 'Folake Adeleke',
    phone: '+2348054443322',
    corridor: 'Lagos (Jibowu) → Owerri (Egbo)',
    seats: [2],
    fareKobo: 3500000,
    status: 'held',
    timeWat: 'Today, 10:10 am WAT',
  },
];

export default function AdminDashboardPage(props?: any) {
  const onNavigate = (props as { onNavigate?: (path: string) => void } | undefined)?.onNavigate;
  const navigate = (path: string) => {
    if (onNavigate) onNavigate(path);
    else if (typeof window !== 'undefined') window.location.href = path;
  };

  const [selectedTerminalId, setSelectedTerminalId] = useState<string>('all');
  const [metrics, setMetrics] = useState<OperationsMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportingService.getOperationsMetrics(selectedTerminalId).then((data) => {
      setMetrics(data);
      setLoading(false);
    });
  }, [selectedTerminalId]);

  return (
    <div className="py-6 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
      {/* Header & Terminal Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-1">
            Operations Console &bull; Ascent Transport Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
            Terminal Operations Console
          </h1>
          <p className="mt-1 text-sm text-slate-600 text-pretty">
            Live corridor throughput, vehicle highway dispatch, seat load factors, and revenue telemetry.
          </p>
        </div>

        {/* Terminal Filter Selector */}
        <div className="flex items-center gap-2 bg-white border border-slate-200/80 p-1.5 rounded-xl shadow-xs">
          <MapPin className="w-4 h-4 text-brand-600 ml-2 flex-shrink-0" />
          <select
            value={selectedTerminalId}
            onChange={(e) => setSelectedTerminalId(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-slate-800 pr-8 py-1 focus:ring-0 focus:outline-none cursor-pointer"
          >
            <option value="all">All Corridors &amp; Hubs</option>
            {SEED_TERMINALS.map((term) => (
              <option key={term.id} value={term.id}>
                {term.city} ({term.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Trips */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Scheduled Trips</span>
            <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {metrics ? metrics.todayTripsCount : '4'}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>On Highway Schedule ({metrics?.activeVehiclesCount || 4} Siennas active)</span>
          </div>
        </div>

        {/* Fleet Seat Load Factor */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Seat Occupancy</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {metrics ? `${metrics.seatLoadFactorPercentage}%` : '88%'}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            5-passenger Toyota Sienna fleet efficiency
          </div>
        </div>

        {/* Active Courier Consignments */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Courier Freight</span>
            <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {metrics ? metrics.activeParcelsCount : '12'}
          </div>
          <div className="mt-2 text-xs text-sky-700 font-semibold flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" />
            <span>{metrics ? metrics.parcelsInTransitCount : '4'} consignments in corridor transit</span>
          </div>
        </div>

        {/* Monthly Gross Revenue */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Monthly Gross Revenue</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 truncate">
            {metrics ? formatNaira(metrics.monthlyGrossRevenueKobo) : formatNaira(89600000)}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Strict integer kobo audit balance
          </div>
        </div>
      </div>

      {/* Quick Operations Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => navigate('/admin/check-in')}
          className="p-5 border border-slate-200/80 rounded-2xl bg-white hover:border-brand-500 hover:shadow-md text-left transition-all min-h-[44px] cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Passenger Boarding Check-In</h3>
          <p className="text-xs text-slate-500 mt-1 text-pretty">Verify QR boarding passes and passenger phone numbers.</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/trips')}
          className="p-5 border border-slate-200/80 rounded-2xl bg-white hover:border-brand-500 hover:shadow-md text-left transition-all min-h-[44px] cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Trip Dispatch &amp; Fleet</h3>
          <p className="text-xs text-slate-500 mt-1 text-pretty">Assign drivers and Toyota Siennas to scheduled departures.</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/parcels')}
          className="p-5 border border-slate-200/80 rounded-2xl bg-white hover:border-brand-500 hover:shadow-md text-left transition-all min-h-[44px] cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Waybill Consignments</h3>
          <p className="text-xs text-slate-500 mt-1 text-pretty">Track cargo drop-offs and verify recipient collection OTPs.</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/reports')}
          className="p-5 border border-slate-200/80 rounded-2xl bg-white hover:border-brand-500 hover:shadow-md text-left transition-all min-h-[44px] cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Monthly Revenue Statements</h3>
          <p className="text-xs text-slate-500 mt-1 text-pretty">Reconcile fare earnings and export financial statements.</p>
        </button>
      </div>

      {/* Live Recent Passenger Manifest Table */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Booking Manifests</h2>
            <p className="text-xs text-slate-500">Live seat bookings across intercity departures.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/bookings')}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 min-h-[44px]"
          >
            <span>View All Bookings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                <th className="py-3 px-3">Ref</th>
                <th className="py-3 px-3">Passenger</th>
                <th className="py-3 px-3">Corridor</th>
                <th className="py-3 px-3">Seats</th>
                <th className="py-3 px-3">Fare</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Time (WAT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {MOCK_RECENT_BOOKINGS.map((b) => (
                <tr key={b.ref} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-brand-700">{b.ref}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <div>{b.passenger}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{b.phone}</div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{b.corridor}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                      Seat {b.seats.join(', ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">{formatNaira(b.fareKobo)}</td>
                  <td className="py-3 px-3">
                    {b.status === 'confirmed' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Confirmed / Paid
                      </span>
                    )}
                    {b.status === 'checked_in' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        Checked-In
                      </span>
                    )}
                    {b.status === 'held' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        15m Hold Lock
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500">{b.timeWat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
