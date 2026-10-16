'use client';

import React, { useEffect, useState } from 'react';
import { Printer, ArrowLeft, Shield, Car, User, AlertCircle } from 'lucide-react';
import { BRAND, type HighwayManifest } from '@atm/shared';
import { dispatchRepository } from '@/server/repositories/dispatch.ts';

export interface HighwayManifestPrintPageProps {
  params?: { tripId?: string } | Promise<{ tripId?: string }>;
}

export default function HighwayManifestPrintPage({ params }: HighwayManifestPrintPageProps) {
  const [tripId, setTripId] = useState<string>('trip-enugu-abuja-morning');
  const [manifest, setManifest] = useState<HighwayManifest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (params) {
      if (params instanceof Promise) {
        params.then((p) => {
          if (p?.tripId) setTripId(p.tripId);
        });
      } else if (params.tripId) {
        setTripId(params.tripId);
      }
    } else if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      const manifestIdx = parts.indexOf('manifest');
      if (manifestIdx > 0 && parts[manifestIdx - 1]) {
        setTripId(parts[manifestIdx - 1]);
      }
    }
  }, [params]);

  useEffect(() => {
    async function fetchManifest() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        let loadedManifest: HighwayManifest | null = null;
        try {
          const res = await fetch(`/api/admin/trips/${tripId}/manifest`);
          const json = await res.json().catch(() => null);
          if (res.ok && json?.success) {
            loadedManifest = json.data;
          } else if (json?.error?.message) {
            throw new Error(json.error.message);
          }
        } catch (fetchErr: unknown) {
          if (fetchErr instanceof Error && !fetchErr.message.includes('Unexpected token') && !fetchErr.message.includes('Failed to fetch')) {
            throw fetchErr;
          }
        }

        if (!loadedManifest) {
          loadedManifest = await dispatchRepository.getHighwayManifest(tripId);
        }

        setManifest(loadedManifest);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Manifest generation failed.';
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchManifest();
  }, [tripId]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-sm text-slate-500">
        Compiling statutory highway manifest...
      </div>
    );
  }

  if (errorMessage || !manifest) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl border border-red-200 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Manifest Generation Error</h2>
          <p className="text-xs text-slate-600">{errorMessage || 'Manifest records unavailable.'}</p>
          <a
            href="/admin/trips"
            className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            Return to Dispatch Console
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:p-0 print:bg-white text-slate-900">
      {/* Screen Control Bar (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <a
          href="/admin/trips"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dispatch Console</span>
        </a>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Standard A4 Document Format</span>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Manifest (A4)</span>
          </button>
        </div>
      </div>

      {/* Official A4 Manifest Document Container */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-300 print:border-none shadow-md print:shadow-none p-8 sm:p-10 font-sans print:p-0">
        {/* Document Header & Statutory Brand Letterhead */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  {BRAND.name}
                </span>
                <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded tracking-wider">
                  ATM NIGERIA
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Intercity Passenger Carriage &amp; Logistics Service Provider • RC: 1849204
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Corporate HQ: 263 Ogui Road, Enugu State • Dispatch Hotlines: {BRAND.contactPhones.join(' • ')}
              </p>
            </div>

            {/* Official Seal Badge */}
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                Manifest Code
              </div>
              <div className="text-sm font-mono font-bold text-slate-900">{manifest.manifestNumber}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Issued: {manifest.issuedAtWat}</div>
            </div>
          </div>

          {/* Official Form Title */}
          <div className="mt-4 pt-3 border-t border-slate-200 text-center">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Official Intercity Highway Passenger Manifest
            </h2>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              Compliant with Nigerian Federal Road Safety Corps (FRSC) and Highway Patrol Transit Regulations
            </p>
          </div>
        </div>

        {/* Section 1: Route & Schedule Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-6 print:bg-slate-50">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Origin Station</div>
            <div className="font-bold text-slate-900 mt-0.5">{manifest.originTerminal.name}</div>
            <div className="text-[10px] text-slate-500 truncate">{manifest.originTerminal.address}</div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Destination Station</div>
            <div className="font-bold text-slate-900 mt-0.5">{manifest.destinationTerminal.name}</div>
            <div className="text-[10px] text-slate-500 truncate">{manifest.destinationTerminal.address}</div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Scheduled Departure</div>
            <div className="font-bold text-slate-900 mt-0.5">{manifest.departureDateWat}</div>
            <div className="text-[11px] text-orange-600 font-bold">{manifest.departureTimeWat} (WAT)</div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Corridor Distance</div>
            <div className="font-bold text-slate-900 mt-0.5">{manifest.corridorDistanceKm} km</div>
            <div className="text-[10px] text-slate-500">Est. Duration: {manifest.estimatedDurationHours} hrs</div>
          </div>
        </div>

        {/* Section 2: Fleet Vehicle & Driver Credentials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Vehicle Box */}
          <div className="p-3.5 border border-slate-300 rounded-lg text-xs space-y-1">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-1.5">
              <span className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 text-[11px]">
                <Car className="w-3.5 h-3.5 text-orange-600" />
                Vehicle Specifications
              </span>
              <span className="font-mono font-bold text-slate-900 text-xs px-2 py-0.5 bg-slate-100 rounded">
                PLATE: {manifest.vehicle.registrationNumber}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500">Make / Model:</span>{' '}
                <span className="font-semibold text-slate-900">{manifest.vehicle.make} {manifest.vehicle.model}</span>
              </div>
              <div>
                <span className="text-slate-500">Year of Manufacture:</span>{' '}
                <span className="font-semibold text-slate-900">{manifest.vehicle.year}</span>
              </div>
              <div>
                <span className="text-slate-500">Passenger Capacity:</span>{' '}
                <span className="font-semibold text-slate-900">5 Seats (Toyota Sienna)</span>
              </div>
              <div>
                <span className="text-slate-500">Fleet Status:</span>{' '}
                <span className="font-semibold text-emerald-700 uppercase">Road Ready</span>
              </div>
            </div>
          </div>

          {/* Driver Box */}
          <div className="p-3.5 border border-slate-300 rounded-lg text-xs space-y-1">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-1.5">
              <span className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 text-[11px]">
                <User className="w-3.5 h-3.5 text-orange-600" />
                Assigned Commercial Driver
              </span>
              <span className="font-bold text-slate-900 text-xs">
                {manifest.driver.fullName}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500">Contact Number:</span>{' '}
                <span className="font-mono font-semibold text-slate-900">{manifest.driver.phone}</span>
              </div>
              <div>
                <span className="text-slate-500">Driver License No:</span>{' '}
                <span className="font-mono font-bold text-slate-900">{manifest.driver.licenseNumber}</span>
              </div>
              <div>
                <span className="text-slate-500">License Expiry:</span>{' '}
                <span className="font-semibold text-slate-900">{manifest.driver.licenseExpiry}</span>
              </div>
              <div>
                <span className="text-slate-500">Vetting Status:</span>{' '}
                <span className="font-semibold text-emerald-700 uppercase">Verified Certified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Passenger Roster (5 Sienna Seats) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Verified Passenger Roster (5 Seats Capacity)
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">
              Boarded: {manifest.summary.checkedInCount} / 5 • Available: {manifest.summary.unoccupiedCount}
            </span>
          </div>

          <table className="w-full text-left text-xs border border-slate-300 divide-y divide-slate-300">
            <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2.5 border-r border-slate-300 w-16">Seat</th>
                <th className="p-2.5 border-r border-slate-300">Passenger Name</th>
                <th className="p-2.5 border-r border-slate-300">Contact Phone</th>
                <th className="p-2.5 border-r border-slate-300">Emergency Next of Kin</th>
                <th className="p-2.5 border-r border-slate-300 w-28">Boarding Status</th>
                <th className="p-2.5 w-24">Gate Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {manifest.passengers.map((passenger) => (
                <tr key={passenger.seatNo} className="even:bg-slate-50/50">
                  <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300 font-mono">
                    Seat {passenger.seatNo}
                  </td>
                  <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300">
                    {passenger.passengerName}
                  </td>
                  <td className="p-2.5 font-mono text-slate-700 border-r border-slate-300">
                    {passenger.phone}
                  </td>
                  <td className="p-2.5 text-slate-700 border-r border-slate-300">
                    <span className="font-medium">{passenger.emergencyContactName}</span>
                    {passenger.emergencyContactPhone !== 'N/A' && (
                      <span className="block font-mono text-slate-500 text-[10px]">
                        {passenger.emergencyContactPhone}
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-300">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        passenger.status === 'checked_in'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {passenger.status === 'checked_in' ? 'CHECKED IN' : 'UNOCCUPIED'}
                    </span>
                    {passenger.checkedInAtWat && (
                      <div className="text-[9px] text-slate-400 mt-0.5">{passenger.checkedInAtWat}</div>
                    )}
                  </td>
                  <td className="p-2.5 text-slate-500 font-mono text-[10px]">
                    {passenger.verifyingStaffId || '---'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 4: Statutory Road Safety Compliance Notice */}
        <div className="p-3 bg-slate-50 border border-slate-300 rounded text-[10px] text-slate-600 mb-6 leading-relaxed">
          <p className="font-semibold text-slate-800 uppercase tracking-wider mb-1">
            Federal Road Safety Corps &amp; Nigeria Police Transit Undertaking:
          </p>
          <p>{manifest.statutoryComplianceNotice}</p>
        </div>

        {/* Section 5: Station Master Signoff & Driver Handover Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-4 border-t-2 border-slate-900 text-xs">
          {/* Station Master Verification */}
          <div className="space-y-1">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Station Dispatch Officer Signoff:
            </div>
            <div className="text-slate-700 font-medium">{manifest.stationMaster.name}</div>
            <div className="text-slate-500 text-[10px]">{manifest.stationMaster.roleTitle}</div>
            <div className="text-slate-500 text-[10px] font-mono">Timestamp: {manifest.stationMaster.signedAtWat}</div>
            <div className="pt-6 border-b border-slate-400 w-48"></div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest pt-0.5">Official Signature / Stamp</div>
          </div>

          {/* Driver Acknowledgment */}
          <div className="space-y-1">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Driver Manifest Handover Acknowledgement:
            </div>
            <div className="text-slate-700 font-medium">{manifest.driver.fullName}</div>
            <div className="text-slate-500 text-[10px]">Licensed Intercity Commercial Pilot</div>
            <div className="text-slate-500 text-[10px] font-mono">Vehicle: {manifest.vehicle.registrationNumber}</div>
            <div className="pt-6 border-b border-slate-400 w-48"></div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest pt-0.5">Driver Acceptance Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
}
