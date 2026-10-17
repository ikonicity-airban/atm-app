'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Printer,
  RefreshCw,
  Phone,
  Truck,
  UserCheck,
  UserX,
  AlertCircle,
  Building2,
  Calendar,
} from 'lucide-react';
import type { CachedRoadsideManifest } from '@atm/shared';

const LOCAL_STORAGE_MANIFEST_KEY = 'atm_driver_cached_manifest';

export default function RoadsideManifestPage() {
  const [manifest, setManifest] = useState<CachedRoadsideManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string>('');

  const loadManifest = async () => {
    setLoading(true);

    // First check local persistent storage for instant offline availability
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(LOCAL_STORAGE_MANIFEST_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setManifest(parsed);
          setIsOffline(true);
          setSyncMessage('Showing saved manifest from local offline storage');
        } catch {
          // invalid json in local storage
        }
      }
    }

    // Try fetching fresh manifest from network if reachable
    try {
      const res = await fetch('/api/driver/trip/active');
      if (res.ok) {
        const data = await res.json();
        if (data.cachedManifest) {
          setManifest(data.cachedManifest);
          setIsOffline(false);
          setSyncMessage('Synchronized live with dispatch server');
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              LOCAL_STORAGE_MANIFEST_KEY,
              JSON.stringify(data.cachedManifest)
            );
          }
        }
      }
    } catch {
      // Network unreachable, remaining on offline cache
      setIsOffline(true);
      setSyncMessage('Offline highway mode: using cached manifest');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManifest();
  }, []);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const getSeatLabel = (seatNo: number) => {
    switch (seatNo) {
      case 1:
        return 'Seat 1 (Front Passenger)';
      case 2:
        return 'Seat 2 (Middle Row Left)';
      case 3:
        return 'Seat 3 (Middle Row Right)';
      case 4:
        return 'Seat 4 (Rear Row Left)';
      case 5:
        return 'Seat 5 (Rear Row Right)';
      default:
        return `Seat ${seatNo}`;
    }
  };

  if (loading && !manifest) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#ca2484] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-300 font-semibold text-sm">
          Loading roadside digital manifest...
        </p>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="py-10 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-950/80 border border-amber-800 flex items-center justify-center mx-auto text-amber-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-white">
            No Manifest Available
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            You do not have an active trip cached in offline storage. Connect to internet and sign in to sync your vehicle manifest.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/driver"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 min-h-[48px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Driver Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const cachedDate = new Date(manifest.cachedAtUtc);
  const formattedDateWat = cachedDate.toLocaleString('en-GB', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-5 pb-12 print:text-black print:bg-white print:p-0">
      {/* Top Header Actions (Hidden in print) */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href="/driver"
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 min-h-[48px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={loadManifest}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 min-h-[48px] cursor-pointer"
            title="Refresh manifest from server"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#ca2484] hover:bg-[#a81c6d] text-white rounded-xl text-xs font-bold shadow-md min-h-[48px] cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Manifest</span>
          </button>
        </div>
      </div>

      {/* Network & Verification Status Banner (Hidden in print) */}
      <div
        className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 print:hidden ${
          isOffline
            ? 'bg-amber-950/60 border-amber-800 text-amber-200'
            : 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{syncMessage}</span>
        </div>
        <span className="text-[10px] opacity-75 font-mono">
          WAT {formattedDateWat}
        </span>
      </div>

      {/* Official FRSC Document Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 print:border-black print:bg-white print:p-2 print:rounded-none">
        <div className="border-b border-slate-800 pb-3 flex items-start justify-between gap-2 print:border-black">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#ca2484] bg-[#ca2484]/15 px-2 py-0.5 rounded print:text-black print:border print:border-black">
                FRSC CPRTSS Compliant
              </span>
            </div>
            <h1 className="text-lg font-black text-white mt-1 print:text-black">
              Digital Highway Roadside Manifest
            </h1>
            <p className="text-xs text-slate-400 print:text-slate-700">
              Ascent Transport Management Nigeria Limited
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block print:text-slate-700">
              Manifest No
            </span>
            <span className="text-sm font-black font-mono text-white print:text-black">
              {manifest.manifestNumber}
            </span>
          </div>
        </div>

        {/* Vehicle and Driver Credentials Section */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 print:border-slate-400 print:bg-white">
            <span className="text-[10px] font-bold uppercase text-slate-400 block print:text-slate-600">
              Vehicle Registration
            </span>
            <span className="text-lg font-black text-white font-mono block mt-0.5 print:text-black">
              {manifest.vehiclePlate}
            </span>
            <span className="text-[11px] text-slate-400 block print:text-slate-700">
              {manifest.vehicleModel}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 print:border-slate-400 print:bg-white">
            <span className="text-[10px] font-bold uppercase text-slate-400 block print:text-slate-600">
              Commercial Driver
            </span>
            <span className="text-sm font-black text-white block mt-0.5 print:text-black">
              {manifest.driverName}
            </span>
            <span className="text-[11px] text-slate-400 font-mono block print:text-slate-700">
              Badge: {manifest.driverBadgeId}
            </span>
            <a
              href={`tel:${manifest.driverPhone}`}
              className="text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1 mt-0.5 print:text-black"
            >
              <Phone className="w-2.5 h-2.5" />
              <span>{manifest.driverPhone}</span>
            </a>
          </div>
        </div>

        {/* Corridor Hubs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-3 text-xs print:border-slate-400 print:bg-white">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block print:text-slate-600">
              Origin Terminal
            </span>
            <span className="font-bold text-white block print:text-black">
              {manifest.originTerminal.name} ({manifest.originTerminal.city})
            </span>
            <span className="text-[11px] text-slate-400 block line-clamp-1 print:text-slate-700">
              {manifest.originTerminal.address}
            </span>
            <a
              href={`tel:${manifest.originTerminal.phone}`}
              className="text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1 mt-0.5 print:text-black"
            >
              <Phone className="w-2.5 h-2.5" />
              <span>{manifest.originTerminal.phone}</span>
            </a>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block print:text-slate-600">
              Destination Terminal
            </span>
            <span className="font-bold text-white block print:text-black">
              {manifest.destinationTerminal.name} ({manifest.destinationTerminal.city})
            </span>
            <span className="text-[11px] text-slate-400 block line-clamp-1 print:text-slate-700">
              {manifest.destinationTerminal.address}
            </span>
            <a
              href={`tel:${manifest.destinationTerminal.phone}`}
              className="text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1 mt-0.5 print:text-black"
            >
              <Phone className="w-2.5 h-2.5" />
              <span>{manifest.destinationTerminal.phone}</span>
            </a>
          </div>
        </div>

        {/* Passenger Boarding Roster (5 Seats Strictly) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-white print:text-black">
              Passenger & Next of Kin Roster
            </h2>
            <span className="text-xs font-bold text-slate-300 print:text-black">
              {manifest.summary.boardedCount} of 5 Boarded
            </span>
          </div>

          <div className="space-y-2.5">
            {manifest.passengers.map((passenger) => (
              <div
                key={passenger.seatNo}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2 print:border-slate-400 print:bg-white print:p-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-200 font-mono font-bold flex items-center justify-center text-xs print:border print:border-black print:bg-white print:text-black">
                      {passenger.seatNo}
                    </span>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block print:text-slate-600">
                        {getSeatLabel(passenger.seatNo)}
                      </span>
                      <span className="font-extrabold text-sm text-white block print:text-black">
                        {passenger.name}
                      </span>
                    </div>
                  </div>

                  <div>
                    {passenger.isBoarded ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 print:border-black print:text-black print:bg-white">
                        <UserCheck className="w-3 h-3" />
                        <span>Boarded</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-800 text-slate-400 border border-slate-700 print:border-black print:text-black print:bg-white">
                        <UserX className="w-3 h-3" />
                        <span>Unboarded</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] print:border-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold print:text-slate-600">
                      Passenger Contact
                    </span>
                    <a
                      href={`tel:${passenger.phone}`}
                      className="text-white hover:underline font-mono inline-flex items-center gap-1 mt-0.5 print:text-black"
                    >
                      <Phone className="w-3 h-3 text-slate-400 print:text-black" />
                      <span>{passenger.phone}</span>
                    </a>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold print:text-slate-600">
                      Emergency Next of Kin
                    </span>
                    <div className="mt-0.5">
                      <span className="font-bold text-white print:text-black">
                        {passenger.emergencyContactName || 'Not recorded'}
                      </span>
                      {passenger.emergencyContactPhone && (
                        <a
                          href={`tel:${passenger.emergencyContactPhone}`}
                          className="text-emerald-400 hover:underline font-mono block mt-0.5 print:text-black"
                        >
                          {passenger.emergencyContactPhone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manifest Statutory Footer */}
        <div className="pt-4 border-t border-slate-800 text-center space-y-2 text-[11px] text-slate-400 print:border-black print:text-slate-700">
          <p className="font-semibold text-slate-300 print:text-black">
            Federal Road Safety Corps Commercial Passenger Road Transport Safety Scheme
          </p>
          <p className="text-[10px]">
            Statutory vehicle cabin manifest generated by Ascent Transport Management Nigeria under FRSC safety regulations. Verified digital record.
          </p>
          <div className="pt-1 text-[10px] font-mono text-slate-400 print:text-slate-600">
            Offline Cache Timestamp: {manifest.cachedAtUtc} (WAT {formattedDateWat})
          </div>
        </div>
      </div>
    </div>
  );
}
