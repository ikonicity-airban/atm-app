'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Car,
  User,
  Clock,
  Printer,
  FileText,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Filter,
  RefreshCw,
  Users,
  ChevronRight,
  Shield,
  X,
} from 'lucide-react';
import {
  SEED_TERMINALS,
  BRAND,
  formatNaira,
  type DispatchTrip,
  type TripStatus,
} from '@atm/shared';
import { dispatchRepository, type SeedVehicle, type SeedDriver } from '@/server/repositories/dispatch.ts';

export default function AdminTripsPage() {
  const [selectedTerminal, setSelectedTerminal] = useState<string>('all');
  const [trips, setTrips] = useState<DispatchTrip[]>([]);
  const [vehicles, setVehicles] = useState<SeedVehicle[]>([]);
  const [drivers, setDrivers] = useState<SeedDriver[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Assignment Modal State
  const [assigningTrip, setAssigningTrip] = useState<DispatchTrip | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<TripStatus>('boarding');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState<boolean>(false);

  // Load Trips
  const loadTrips = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let loadedTrips: DispatchTrip[] | null = null;
      let loadedVehicles: SeedVehicle[] | null = null;
      let loadedDrivers: SeedDriver[] | null = null;

      try {
        const query = selectedTerminal && selectedTerminal !== 'all' ? `?terminalId=${selectedTerminal}` : '';
        const res = await fetch(`/api/admin/trips${query}`);
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          loadedTrips = json.data.trips;
          loadedVehicles = json.data.vehicles;
          loadedDrivers = json.data.drivers;
        } else if (json?.error?.message) {
          throw new Error(json.error.message);
        }
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof Error && !fetchErr.message.includes('Unexpected token') && !fetchErr.message.includes('Failed to fetch')) {
          throw fetchErr;
        }
      }

      if (!loadedTrips) {
        const terminalFilter = selectedTerminal && selectedTerminal !== 'all' ? selectedTerminal : undefined;
        const [t, v, d] = await Promise.all([
          dispatchRepository.getTripsForDispatch({ terminalId: terminalFilter }),
          dispatchRepository.getVehicles(terminalFilter),
          dispatchRepository.getDrivers(terminalFilter),
        ]);
        loadedTrips = t;
        loadedVehicles = v;
        loadedDrivers = d;
      }

      setTrips(loadedTrips);
      setVehicles(loadedVehicles || []);
      setDrivers(loadedDrivers || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dispatch data.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, [selectedTerminal]);

  // Open Assignment Modal
  const openAssignModal = (trip: DispatchTrip) => {
    setAssigningTrip(trip);
    setSelectedVehicleId(trip.vehicle?.id || vehicles[0]?.id || '');
    setSelectedDriverId(trip.driver?.id || drivers[0]?.id || '');
    setSelectedStatus(trip.status);
  };

  // Submit Assignment
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTrip) return;

    setIsSubmittingAssign(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let saved = false;
      try {
        const res = await fetch(`/api/admin/trips/${assigningTrip.id}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripId: assigningTrip.id,
            vehicleId: selectedVehicleId,
            driverId: selectedDriverId,
            status: selectedStatus,
          }),
        });

        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          saved = true;
        } else if (json?.error?.message) {
          throw new Error(json.error.message);
        }
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof Error && !fetchErr.message.includes('Unexpected token') && !fetchErr.message.includes('Failed to fetch')) {
          throw fetchErr;
        }
      }

      if (!saved) {
        await dispatchRepository.assignVehicleAndDriver({
          tripId: assigningTrip.id,
          vehicleId: selectedVehicleId,
          driverId: selectedDriverId,
          status: selectedStatus,
        });
      }

      setSuccessMessage(`Successfully updated vehicle and driver assignment for trip ${assigningTrip.routeTitle}.`);
      setAssigningTrip(null);
      await loadTrips();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Assignment update error.';
      setErrorMessage(message);
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Quick Status Transition Button
  const handleQuickStatus = async (tripId: string, vehicleId: string, driverId: string, nextStatus: TripStatus) => {
    try {
      let updated = false;
      try {
        const res = await fetch(`/api/admin/trips/${tripId}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripId,
            vehicleId,
            driverId,
            status: nextStatus,
          }),
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          updated = true;
        } else if (json?.error?.message) {
          throw new Error(json.error.message);
        }
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof Error && !fetchErr.message.includes('Unexpected token') && !fetchErr.message.includes('Failed to fetch')) {
          throw fetchErr;
        }
      }

      if (!updated) {
        await dispatchRepository.assignVehicleAndDriver({
          tripId,
          vehicleId,
          driverId,
          status: nextStatus,
        });
      }

      setSuccessMessage(`Trip status transitioned to ${nextStatus}.`);
      await loadTrips();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update status.';
      setErrorMessage(message);
    }
  };

  // Metrics
  const totalTrips = trips.length;
  const assignedTrips = trips.filter((t) => t.vehicle && t.driver).length;
  const boardingTrips = trips.filter((t) => t.status === 'boarding').length;
  const totalBooked = trips.reduce((sum, t) => sum + t.bookedSeats, 0);
  const totalCheckedIn = trips.reduce((sum, t) => sum + t.checkedInSeats, 0);
  const boardingPercentage = totalBooked > 0 ? Math.round((totalCheckedIn / totalBooked) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title rests directly on background */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Trips &amp; Vehicle Dispatch Console
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Fleet vehicle assignment, driver scheduling, and highway departure manifest generation.
          </p>
        </div>

        {/* Station Filter & Refresh Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-3 py-1.5 shadow-sm text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTerminal}
              onChange={(e) => setSelectedTerminal(e.target.value)}
              className="font-medium text-slate-800 bg-transparent focus:outline-none"
            >
              <option value="all">All Terminal Hubs</option>
              {SEED_TERMINALS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={loadTrips}
            className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm transition-colors"
            title="Refresh departure schedules"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 flex items-center justify-between text-sm text-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex items-center justify-between text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Scheduled Departures</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalTrips}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across active travel corridors</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Assigned Fleet Vehicles</span>
            <Car className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {assignedTrips} <span className="text-xs font-normal text-slate-400">/ {totalTrips}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">5-Seat Toyota Sienna fleet</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Boarding in Progress</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{boardingTrips}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active at departure bays</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Boarding Completion</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{boardingPercentage}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {totalCheckedIn} of {totalBooked} passengers boarded
          </div>
        </div>
      </div>

      {/* Trips Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Corridor Departure Roster</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono font-semibold">
              {trips.length} Trips
            </span>
          </h2>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
            Loading scheduled departures...
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
            No scheduled departures found for the selected terminal filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {trips.map((trip) => {
              const boardingPercent =
                trip.bookedSeats > 0 ? Math.round((trip.checkedInSeats / trip.bookedSeats) * 100) : 0;
              const hasAssignment = Boolean(trip.vehicle && trip.driver);

              return (
                <div
                  key={trip.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  {/* Trip Card Top Bar */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-500">
                          <span>{trip.id}</span>
                          <span>•</span>
                          <span className="text-orange-600 font-bold">{formatNaira(trip.fareKobo)}</span>
                        </div>
                        <div className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                          <span>{trip.originTerminalName}</span>
                          <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span>{trip.destinationTerminalName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-orange-500" />
                            {trip.departureTimeWat} (WAT)
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex-shrink-0 ${
                          trip.status === 'boarding'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : trip.status === 'in_transit'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : trip.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {trip.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Vehicle, Driver & Boarding Progress Body */}
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Vehicle & Driver Details */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {/* Vehicle Box */}
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <Car className="w-3 h-3 text-slate-500" />
                          Vehicle Assignment
                        </div>
                        {trip.vehicle ? (
                          <div className="mt-1">
                            <div className="font-mono font-bold text-slate-900 text-sm">
                              {trip.vehicle.registrationNumber}
                            </div>
                            <div className="text-slate-600 truncate">
                              {trip.vehicle.make} {trip.vehicle.model}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1.5 text-amber-700 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Unassigned
                          </div>
                        )}
                      </div>

                      {/* Driver Box */}
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          Driver Assignment
                        </div>
                        {trip.driver ? (
                          <div className="mt-1">
                            <div className="font-bold text-slate-900 text-sm truncate">
                              {trip.driver.fullName}
                            </div>
                            <div className="text-slate-500 font-mono text-[11px] truncate">
                              {trip.driver.phone}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1.5 text-amber-700 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Unassigned
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Live Boarding Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">
                          Boarding Status: {trip.checkedInSeats} of {trip.bookedSeats} Checked In
                        </span>
                        <span className="font-mono font-bold text-slate-600">{boardingPercent}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full transition-all duration-300 ${
                            boardingPercent === 100
                              ? 'bg-emerald-600'
                              : boardingPercent > 0
                              ? 'bg-orange-500'
                              : 'bg-slate-300'
                          }`}
                          style={{ width: `${boardingPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                        <span>Total Capacity: 5 Seats (Toyota Sienna)</span>
                        {trip.standbyReleasedSeats > 0 && (
                          <span className="text-amber-600 font-medium">
                            {trip.standbyReleasedSeats} standby released
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openAssignModal(trip)}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg shadow-sm transition-colors min-h-[38px]"
                      >
                        Assign Fleet &amp; Driver
                      </button>

                      {/* Quick Status Buttons */}
                      {trip.status === 'scheduled' && hasAssignment && (
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickStatus(trip.id, trip.vehicle!.id, trip.driver!.id, 'boarding')
                          }
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors min-h-[38px]"
                        >
                          Start Boarding
                        </button>
                      )}

                      {trip.status === 'boarding' && hasAssignment && (
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickStatus(trip.id, trip.vehicle!.id, trip.driver!.id, 'in_transit')
                          }
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors min-h-[38px]"
                        >
                          Dispatch Highway
                        </button>
                      )}

                      {trip.status === 'in_transit' && hasAssignment && (
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickStatus(trip.id, trip.vehicle!.id, trip.driver!.id, 'completed')
                          }
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors min-h-[38px]"
                        >
                          Arrived
                        </button>
                      )}
                    </div>

                    {/* Highway Manifest Action */}
                    <a
                      href={`/admin/trips/${trip.id}/manifest`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 min-h-[38px]"
                    >
                      <Printer className="w-3.5 h-3.5 text-orange-400" />
                      <span>Print Manifest (A4)</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign Vehicle & Driver Modal */}
      {assigningTrip && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Assign Fleet Vehicle &amp; Driver</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {assigningTrip.routeTitle} • {assigningTrip.departureTimeWat} (WAT)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningTrip(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-5 space-y-4">
              {/* Vehicle Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-orange-600" />
                  Select Toyota Sienna Vehicle:
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">-- Choose active Toyota Sienna --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} - {v.make} {v.model} ({v.year}) [A/C: {v.hasAirConditioning ? 'Yes' : 'No'}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Driver Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-600" />
                  Select Licensed Driver:
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">-- Choose vetted driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.phone}) - License: {d.licenseNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                  Dispatch Status:
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as TripStatus)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="boarding">Boarding at Bay</option>
                  <option value="in_transit">Dispatched on Highway (In Transit)</option>
                  <option value="completed">Completed / Arrived</option>
                  <option value="delayed">Delayed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAssigningTrip(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAssign}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                >
                  {isSubmittingAssign ? 'Saving...' : 'Save & Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
