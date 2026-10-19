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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Trips &amp; Vehicle Dispatch Console
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fleet vehicle assignment, driver scheduling, and highway departure manifest generation.
          </p>
        </div>

        {/* Station Filter & Refresh Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-3 py-1.5 shadow-sm text-xs">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={selectedTerminal}
              onChange={(e) => setSelectedTerminal(e.target.value)}
              className="font-medium text-foreground bg-transparent focus:outline-none"
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
            className="p-2 bg-card border border-border hover:bg-muted/40 text-foreground rounded-xl shadow-sm transition-colors"
            title="Refresh departure schedules"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 flex items-center justify-between text-sm text-rose-700 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-700 dark:hover:text-rose-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-center justify-between text-sm text-emerald-700 dark:text-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Scheduled Departures</span>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{totalTrips}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Across active travel corridors</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Assigned Fleet Vehicles</span>
            <Car className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {assignedTrips} <span className="text-xs font-normal text-muted-foreground">/ {totalTrips}</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">5-Seat Toyota Sienna fleet</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Boarding in Progress</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{boardingTrips}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Active at departure bays</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Boarding Completion</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{boardingPercentage}%</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {totalCheckedIn} of {totalBooked} passengers boarded
          </div>
        </div>
      </div>

      {/* Trips Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span>Corridor Departure Roster</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono font-semibold">
              {trips.length} Trips
            </span>
          </h2>
        </div>

        {isLoading ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
            Loading scheduled departures...
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
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
                  className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col justify-between hover:border-primary/40 transition-colors"
                >
                  {/* Trip Card Top Bar */}
                  <div className="p-4 sm:p-5 border-b border-border bg-muted/30">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-muted-foreground">
                          <span>{trip.id}</span>
                          <span>•</span>
                          <span className="text-primary font-bold">{formatNaira(trip.fareKobo)}</span>
                        </div>
                        <div className="text-base font-bold text-foreground mt-1 flex items-center gap-2">
                          <span>{trip.originTerminalName}</span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span>{trip.destinationTerminalName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {trip.departureTimeWat} (WAT)
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex-shrink-0 ${
                          trip.status === 'boarding'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                            : trip.status === 'in_transit'
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                            : trip.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-muted text-muted-foreground border border-border'
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
                      <div className="p-3 bg-muted/30 rounded-xl border border-border">
                        <div className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <Car className="w-3 h-3 text-muted-foreground" />
                          Vehicle Assignment
                        </div>
                        {trip.vehicle ? (
                          <div className="mt-1">
                            <div className="font-mono font-bold text-foreground text-sm">
                              {trip.vehicle.registrationNumber}
                            </div>
                            <div className="text-muted-foreground truncate">
                              {trip.vehicle.make} {trip.vehicle.model}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1.5 text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Unassigned
                          </div>
                        )}
                      </div>

                      {/* Driver Box */}
                      <div className="p-3 bg-muted/30 rounded-xl border border-border">
                        <div className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          Driver Assignment
                        </div>
                        {trip.driver ? (
                          <div className="mt-1">
                            <div className="font-bold text-foreground text-sm truncate">
                              {trip.driver.fullName}
                            </div>
                            <div className="text-muted-foreground font-mono text-[11px] truncate">
                              {trip.driver.phone}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1.5 text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Unassigned
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Live Boarding Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">
                          Boarding Status: {trip.checkedInSeats} of {trip.bookedSeats} Checked In
                        </span>
                        <span className="font-mono font-bold text-muted-foreground">{boardingPercent}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden border border-border">
                        <div
                          className={`h-full transition-all duration-300 ${
                            boardingPercent === 100
                              ? 'bg-emerald-600 dark:bg-emerald-500'
                              : boardingPercent > 0
                              ? 'bg-primary'
                              : 'bg-muted-foreground/30'
                          }`}
                          style={{ width: `${boardingPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                        <span>Total Capacity: 5 Seats (Toyota Sienna)</span>
                        {trip.standbyReleasedSeats > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {trip.standbyReleasedSeats} standby released
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-muted/30 border-t border-border flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openAssignModal(trip)}
                        className="px-3 py-1.5 bg-background border border-border hover:bg-muted/50 text-foreground text-xs font-semibold rounded-xl shadow-sm transition-colors min-h-[38px]"
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
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors min-h-[38px]"
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
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors min-h-[38px]"
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
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors min-h-[38px]"
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
                      className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5 min-h-[38px]"
                    >
                      <Printer className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground">Assign Fleet Vehicle &amp; Driver</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {assigningTrip.routeTitle} • {assigningTrip.departureTimeWat} (WAT)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningTrip(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-5 space-y-4">
              {/* Vehicle Selection */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-primary" />
                  Select Toyota Sienna Vehicle:
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full text-xs font-medium border border-input bg-background rounded-xl p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Select Licensed Driver:
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full text-xs font-medium border border-input bg-background rounded-xl p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Dispatch Status:
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as TripStatus)}
                  className="w-full text-xs font-medium border border-input bg-background rounded-xl p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="boarding">Boarding at Bay</option>
                  <option value="in_transit">Dispatched on Highway (In Transit)</option>
                  <option value="completed">Completed / Arrived</option>
                  <option value="delayed">Delayed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAssigningTrip(null)}
                  className="px-4 py-2 bg-muted/40 hover:bg-muted text-foreground text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAssign}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-sm transition-colors"
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
