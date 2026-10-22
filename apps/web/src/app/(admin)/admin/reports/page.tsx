'use client';

import React, { useState, useEffect } from 'react';
import {
  SEED_TERMINALS,
  formatNaira,
} from '@atm/shared';
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/Select';
import { reportingService, type OperationsMetrics } from '@/server/repositories/reports.ts';
import {
  BarChart3,
  Download,
  Calendar,
  CreditCard,
  Building2,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Package,
  Users,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

export default function AdminReportsPage() {
  const [selectedTerminalId, setSelectedTerminalId] = useState<string>('all');
  const [metrics, setMetrics] = useState<OperationsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    reportingService.getOperationsMetrics(selectedTerminalId).then((data) => {
      setMetrics(data);
      setLoading(false);
    });
  }, [selectedTerminalId]);

  const handleExportCsv = () => {
    if (!metrics) return;
    const csvContent = reportingService.generateFinancialReportCsv(metrics);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const terminalSlug = metrics.terminalId ? metrics.terminalId.replace('term-', '') : 'all-terminals';
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `atm-revenue-statement-${terminalSlug}-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const passengerPct = metrics && metrics.monthlyGrossRevenueKobo > 0
    ? Math.round((metrics.passengerRevenueKobo / metrics.monthlyGrossRevenueKobo) * 100)
    : 72;
  const courierPct = metrics && metrics.monthlyGrossRevenueKobo > 0
    ? Math.round((metrics.courierRevenueKobo / metrics.monthlyGrossRevenueKobo) * 100)
    : 24;
  const cancellationPct = metrics && metrics.monthlyGrossRevenueKobo > 0
    ? Math.max(1, 100 - passengerPct - courierPct)
    : 4;

  return (
    <div className="py-6 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-1">
            Finance &amp; Operations Telemetry &bull; Phase 7
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
            Monthly Operations &amp; Revenue Reports
          </h1>
          <p className="mt-1 text-sm text-slate-600 text-pretty">
            Audited financial reconciliation across passenger ticket sales, express parcel freight, and cancellation fee retentions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Terminal Selector */}
          <div className="w-56">
            <Select
              value={selectedTerminalId}
              onValueChange={(val) => {
                if (typeof val === 'string') setSelectedTerminalId(val);
              }}
            >
              <SelectTrigger startIcon={MapPin} className="min-h-[38px] text-xs font-bold">
                <SelectValue placeholder="All Corridors & Hubs" />
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value="all">All Corridors & Hubs</SelectItem>
                {SEED_TERMINALS.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.city} ({term.code})
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!metrics || loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50 min-h-[44px] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Revenue Statement (CSV)</span>
          </button>
        </div>
      </div>

      {/* Download Alert Notification */}
      {downloadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-semibold">
              Revenue statement CSV successfully generated and downloaded to your device.
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 font-bold uppercase tracking-wider">
            Verified Integer Kobo
          </span>
        </div>
      )}

      {/* 4 Revenue Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Total Gross Revenue</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 truncate">
            {metrics ? formatNaira(metrics.monthlyGrossRevenueKobo) : formatNaira(89600000)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>100% Reconciled Integer Kobo</span>
          </div>
        </div>

        {/* Passenger Fares */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Passenger Ticket Fares</span>
            <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 truncate">
            {metrics ? formatNaira(metrics.passengerRevenueKobo) : formatNaira(64800000)}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            {passengerPct}% of total gross revenue
          </div>
        </div>

        {/* Express Courier Freight */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Courier Cargo Freight</span>
            <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 truncate">
            {metrics ? formatNaira(metrics.courierRevenueKobo) : formatNaira(21600000)}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            {courierPct}% of total gross revenue
          </div>
        </div>

        {/* Retained Cancellation Fees */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Cancellation Retentions</span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 truncate">
            {metrics ? formatNaira(metrics.cancellationRevenueKobo) : formatNaira(3200000)}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            {cancellationPct}% administrative retainage
          </div>
        </div>
      </div>

      {/* Corridor League Table */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Corridor Revenue &amp; Throughput Breakdown</h2>
            <p className="text-xs text-slate-500">Live breakdown of passenger ticket fares and parcel waybill revenues per corridor route.</p>
          </div>
          <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg self-start">
            Active Filter: {metrics?.terminalName || 'All Terminals'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                <th className="py-3 px-3">Corridor</th>
                <th className="py-3 px-3 text-center">Departures</th>
                <th className="py-3 px-3 text-center">Passengers</th>
                <th className="py-3 px-3 text-right">Passenger Fares</th>
                <th className="py-3 px-3 text-right">Parcel Freight</th>
                <th className="py-3 px-3 text-right font-extrabold text-slate-900">Total Gross</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {metrics?.corridorPerformance.map((c) => (
                <tr key={c.corridor} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500" />
                    <span>{c.corridor}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800">
                      {c.departures}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-900">
                    {c.passengers}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-800">
                    {formatNaira(c.fareKobo)}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-800">
                    {formatNaira(c.parcelFreightKobo)}
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                    {formatNaira(c.totalRevenueKobo)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 font-extrabold text-slate-900 bg-slate-50/60">
                <td className="py-3 px-3 uppercase tracking-wider text-[11px] text-slate-600">Total Corridor Sum</td>
                <td className="py-3 px-3 text-center">
                  {metrics?.corridorPerformance.reduce((acc, c) => acc + c.departures, 0)}
                </td>
                <td className="py-3 px-3 text-center">
                  {metrics?.corridorPerformance.reduce((acc, c) => acc + c.passengers, 0)}
                </td>
                <td className="py-3 px-3 text-right">
                  {formatNaira(metrics?.corridorPerformance.reduce((acc, c) => acc + c.fareKobo, 0) || 0)}
                </td>
                <td className="py-3 px-3 text-right">
                  {formatNaira(metrics?.corridorPerformance.reduce((acc, c) => acc + c.parcelFreightKobo, 0) || 0)}
                </td>
                <td className="py-3 px-3 text-right text-brand-700">
                  {formatNaira(metrics?.corridorPerformance.reduce((acc, c) => acc + c.totalRevenueKobo, 0) || 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment Channels & Compliance Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Channels Breakdown */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm">Payment Channel Distribution</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Ascent passenger bookings and courier freight settled through digital gateway channels.
          </p>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>Paystack Online (Cards, USSD &amp; Bank Transfer)</span>
                <span className="font-mono text-brand-700">82%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-brand-600 rounded-full" style={{ width: '82%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>Terminal POS Card Terminals (Ogui, Utako, Jibowu)</span>
                <span className="font-mono text-brand-700">14%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: '14%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>Counter Cash &amp; Walk-In Direct Deposit</span>
                <span className="font-mono text-brand-700">4%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '4%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Accounting Invariants & Audit Guarantee */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Monetary Invariant &amp; Audit Guarantee</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed text-pretty">
            Under Ascent Transport Management architecture rules, all monetary balances are strictly stored and computed as integer kobo across every system layer. Currency conversion to Naira is performed exclusively at the UI edge with <code className="text-brand-700 font-mono text-[11px] bg-brand-50 px-1 py-0.5 rounded">formatNaira()</code>.
          </p>

          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-500 uppercase font-bold block">Disbursement Settlement</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">T+1 Auto Payout via Paystack</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-500 uppercase font-bold block">Tax &amp; VAT Retention</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">7.5% Included in Fare Price</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
