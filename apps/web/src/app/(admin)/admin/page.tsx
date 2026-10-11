'use client';

import React from 'react';
import { formatNaira } from '@atm/shared';
import { UserCheck, Calendar, BarChart3 } from 'lucide-react';

export default function AdminDashboardPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const navigate = (path: string) => {
    if (onNavigate) onNavigate(path);
    else if (typeof window !== 'undefined') window.location.href = path;
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
      <div>
        <span className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-1">
          Operations &amp; Admin
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          ATM Operations Console
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Terminal overview, active fleet status, manifest status, and revenue telemetry.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Today&apos;s Trips</span>
          <span className="text-2xl font-bold text-slate-900 block mt-1">4</span>
          <span className="text-[10px] text-emerald-600 font-medium">On Schedule</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Tickets Held/Paid</span>
          <span className="text-2xl font-bold text-slate-900 block mt-1">18</span>
          <span className="text-[10px] text-slate-500 font-medium">90% load factor</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Courier Parcels</span>
          <span className="text-2xl font-bold text-slate-900 block mt-1">12</span>
          <span className="text-[10px] text-blue-600 font-medium">4 in transit</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Monthly Revenue</span>
          <span className="text-2xl font-bold text-slate-900 block mt-1">{formatNaira(89600000)}</span>
          <span className="text-[10px] text-emerald-600 font-medium">October 2026</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <button
          type="button"
          onClick={() => navigate('/admin/check-in')}
          className="p-5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-left transition-colors min-h-[44px] cursor-pointer"
        >
          <UserCheck className="w-6 h-6 text-[#ca2484] mb-2" />
          <h3 className="font-bold text-slate-900 text-sm">Mobile Passenger Check-In</h3>
          <p className="text-xs text-slate-500 mt-1">Quick phone or QR code passenger boarding clearance.</p>
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/trips')}
          className="p-5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-left transition-colors min-h-[44px] cursor-pointer"
        >
          <Calendar className="w-6 h-6 text-[#ca2484] mb-2" />
          <h3 className="font-bold text-slate-900 text-sm">Trip Dispatch &amp; Fleet</h3>
          <p className="text-xs text-slate-500 mt-1">Assign drivers and Toyota Siennas to daily routes.</p>
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/reports')}
          className="p-5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-left transition-colors min-h-[44px] cursor-pointer"
        >
          <BarChart3 className="w-6 h-6 text-[#ca2484] mb-2" />
          <h3 className="font-bold text-slate-900 text-sm">Monthly Revenue Reporting</h3>
          <p className="text-xs text-slate-500 mt-1">Passenger fares and parcel freight earnings breakdown.</p>
        </button>
      </div>
    </div>
  );
}
