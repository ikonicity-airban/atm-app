'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Users,
  Clock,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Phone,
  RefreshCw,
  LogOut,
  Navigation,
} from 'lucide-react';
import type { CachedRoadsideManifest, RoadsideIncidentReport, RoadsideIncidentType } from '@atm/shared';

const LOCAL_STORAGE_MANIFEST_KEY = 'atm_driver_cached_manifest';

export default function DriverDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tripData, setTripData] = useState<any>(null);
  const [manifest, setManifest] = useState<CachedRoadsideManifest | null>(null);
  const [incidents, setIncidents] = useState<RoadsideIncidentReport[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Milestone transition states
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [incidentCategory, setIncidentCategory] = useState<RoadsideIncidentType>('checkpoint_delay');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [reportingIncident, setReportingIncident] = useState(false);

  const fetchTripData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/driver/trip/active');
      if (!res.ok) throw new Error('Network error or unassigned trip');
      const data = await res.json();

      if (data.trip && data.cachedManifest) {
        setTripData(data.trip);
        setManifest(data.cachedManifest);
        setIncidents(data.incidents || []);
        setIsOffline(false);
        setLastSyncTime(new Date().toLocaleTimeString());

        // Cache manifest in local persistent storage for highway signal dead zones
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_MANIFEST_KEY, JSON.stringify(data.cachedManifest));
        }
      }
    } catch (err) {
      // Fallback: Read locally cached manifest if offline
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(LOCAL_STORAGE_MANIFEST_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setManifest(parsed);
          setIsOffline(true);
          setLastSyncTime('Loaded from Offline Storage');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripData();
  }, []);

  const handleToggleBoarding = async (seatNo: number, currentStatus: boolean) => {
    if (!manifest) return;
    const newStatus = !currentStatus;

    // Optimistic update
    const updatedPassengers = manifest.passengers.map((p) =>
      p.seatNo === seatNo ? { ...p, isBoarded: newStatus } : p
    );
    const updatedManifest: CachedRoadsideManifest = {
      ...manifest,
      passengers: updatedPassengers,
      summary: {
        ...manifest.summary,
        boardedCount: updatedPassengers.filter((p) => p.isBoarded).length,
        unoccupiedCount: 5 - updatedPassengers.filter((p) => p.isBoarded).length,
      },
    };
    setManifest(updatedManifest);

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_MANIFEST_KEY, JSON.stringify(updatedManifest));
    }

    try {
      await fetch('/api/driver/trip/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: manifest.tripId,
          seatNo,
          isBoarded: newStatus,
        }),
      });
    } catch {
      // Retained in local manifest
    }
  };

  const handleStatusUpdate = async (nextStatus: 'in_transit' | 'completed') => {
    if (!manifest) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch('/api/driver/trip/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: manifest.tripId,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || 'Status update failed');
      else await fetchTripData();
    } catch (err) {
      alert('Offline: status will synchronize once cellular network is restored.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manifest) return;
    setReportingIncident(true);

    try {
      const res = await fetch('/api/driver/trip/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: manifest.tripId,
          category: incidentCategory,
          description: incidentDesc,
          locationNote: incidentLocation,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIncidents((prev) => [data.incident, ...prev]);
        setIncidentModalOpen(false);
        setIncidentDesc('');
        setIncidentLocation('');
      } else {
        alert(data.error || 'Failed to submit incident');
      }
    } catch {
      alert('Unable to send incident advisory. Call safety desk directly.');
    } finally {
      setReportingIncident(false);
    }
  };

  if (loading && !manifest) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
        <RefreshCw className="w-8 h-8 text-[#ca2484] animate-spin" />
        <span className="text-xs font-bold text-slate-400">Loading Assigned Trip...</span>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
        <Truck className="w-12 h-12 text-slate-600" />
        <h2 className="text-lg font-bold text-white">No Assigned Trip Found</h2>
        <p className="text-xs text-slate-400 max-w-xs">
          Your station master has not assigned a Toyota Sienna departure for your driver badge today.
        </p>
        <button
          onClick={fetchTripData}
          className="px-4 py-2.5 bg-[#ca2484] text-white text-xs font-bold rounded-xl min-h-[48px]"
        >
          Check Again
        </button>
      </div>
    );
  }

  const currentStatus = tripData?.status || 'boarding';

  return (
    <div className="space-y-5 pb-8">
      {/* Network Connectivity & Cache Indicator */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isOffline ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          />
          <span className="text-[11px] font-bold text-slate-300">
            {isOffline ? 'Offline Highway Cache' : 'Live Highway Sync'}
          </span>
        </div>
        <button
          onClick={fetchTripData}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Sync ({lastSyncTime})</span>
        </button>
      </div>

      {/* Driver & Trip Hero Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#ca2484] block">
              Vehicle Registration
            </span>
            <span className="text-2xl font-black text-white font-mono block">
              {manifest.vehiclePlate}
            </span>
            <span className="text-xs text-slate-400">{manifest.vehicleModel}</span>
          </div>

          <div className="text-right">
            <span
              className={`inline-block px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                currentStatus === 'in_transit'
                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                  : currentStatus === 'completed'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {currentStatus.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1 font-mono">
              Badge: {manifest.driverBadgeId}
            </span>
          </div>
        </div>

        {/* Corridor Hubs */}
        <div className="pt-3 border-t border-slate-850 flex items-center justify-between text-xs">
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Origin</span>
              <span className="text-white font-bold">{manifest.originTerminal.city}</span>
            </div>
          </div>
          <span className="text-slate-600 font-bold">&rarr;</span>
          <div className="flex items-start gap-1.5 text-right">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Destination</span>
              <span className="text-white font-bold">{manifest.destinationTerminal.city}</span>
            </div>
            <MapPin className="w-3.5 h-3.5 text-[#ca2484] mt-0.5" />
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/driver/manifest"
          className="p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl flex items-center justify-center gap-2 text-xs font-extrabold text-white shadow-xs min-h-[48px]"
        >
          <FileText className="w-4 h-4 text-[#ca2484]" />
          <span>Roadside Manifest</span>
        </Link>

        <button
          onClick={() => setIncidentModalOpen(true)}
          className="p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl flex items-center justify-center gap-2 text-xs font-extrabold text-amber-300 shadow-xs min-h-[48px] cursor-pointer"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Report Incident</span>
        </button>
      </div>

      {/* Passenger Boarding Roster (5-Passenger Sienna Configuration) */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#ca2484]" />
            <h2 className="text-sm font-extrabold text-white">
              Passenger Roster ({manifest.summary.boardedCount}/5 Boarded)
            </h2>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {manifest.summary.unoccupiedCount} Unoccupied
          </span>
        </div>

        <div className="space-y-2.5">
          {manifest.passengers.map((p) => (
            <div
              key={p.seatNo}
              className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                p.isBoarded
                  ? 'bg-slate-900/90 border-emerald-900/60'
                  : 'bg-slate-900/40 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    p.isBoarded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {p.seatNo}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-tight">
                    {p.name}
                  </span>
                  <a
                    href={`tel:${p.phone}`}
                    className="text-[11px] font-semibold text-slate-400 hover:text-[#ca2484] flex items-center gap-1 mt-0.5"
                  >
                    <Phone className="w-2.5 h-2.5" />
                    <span>{p.phone}</span>
                  </a>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleBoarding(p.seatNo, p.isBoarded)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[44px] flex items-center gap-1.5 cursor-pointer ${
                  p.isBoarded
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
                }`}
              >
                {p.isBoarded ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Boarded</span>
                  </>
                ) : (
                  <span>Mark Boarded</span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trip Milestone Progress Actions */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Highway Journey Milestones
        </h3>

        {currentStatus === 'boarding' && (
          <button
            type="button"
            disabled={updatingStatus}
            onClick={() => handleStatusUpdate('in_transit')}
            className="w-full py-3.5 px-4 bg-[#ca2484] hover:bg-[#aa1769] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>Mark Departure &bull; Start Transit</span>
          </button>
        )}

        {currentStatus === 'in_transit' && (
          <button
            type="button"
            disabled={updatingStatus}
            onClick={() => handleStatusUpdate('completed')}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark Terminal Arrival &bull; Trip Complete</span>
          </button>
        )}

        {currentStatus === 'completed' && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-850 rounded-xl text-center text-xs text-emerald-300 font-bold">
            Journey successfully completed and archived.
          </div>
        )}
      </div>

      {/* Active Incidents Banner */}
      {incidents.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-4 space-y-2">
          <span className="text-[10px] uppercase font-bold text-amber-400 block">
            Reported Roadside Advisories
          </span>
          {incidents.map((inc) => (
            <div key={inc.id} className="text-xs text-amber-200">
              <span className="font-bold uppercase tracking-wide">
                [{inc.category.replace('_', ' ')}]:
              </span>{' '}
              {inc.description}{' '}
              {inc.locationNote && <span className="italic">(@ {inc.locationNote})</span>}
            </div>
          ))}
        </div>
      )}

      {/* Incident Modal */}
      {incidentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Roadside Incident Report</span>
              </h3>
              <button
                type="button"
                onClick={() => setIncidentModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitIncident} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Incident Category
                </label>
                <select
                  value={incidentCategory}
                  onChange={(e) => setIncidentCategory(e.target.value as RoadsideIncidentType)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white min-h-[48px]"
                >
                  <option value="checkpoint_delay">FRSC / Police Checkpoint Delay</option>
                  <option value="traffic_gridlock">Highway Traffic Gridlock</option>
                  <option value="mechanical_breakdown">Mechanical / Tyre Breakdown</option>
                  <option value="weather_hazard">Heavy Rain / Flooding</option>
                  <option value="medical_emergency">Passenger Medical Need</option>
                  <option value="other">Other Roadside Delay</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Location Landmark / Waypoint
                </label>
                <input
                  type="text"
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                  placeholder="e.g. Near Ore bypass, Ondo State"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Advisory Details
                </label>
                <textarea
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  placeholder="Briefly describe delay or breakdown status..."
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIncidentModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl min-h-[48px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportingIncident}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl min-h-[48px] disabled:opacity-50"
                >
                  {reportingIncident ? 'Dispatching...' : 'Submit Advisory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
