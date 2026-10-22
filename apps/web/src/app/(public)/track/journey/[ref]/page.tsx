'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  type JourneyTrackingPayload,
  type HighwayWaypoint,
  type RoadsideIncidentReport,
} from '@atm/shared';
import { PageShell } from '@/components/layout/Templates.tsx';
import {
  MapPin,
  Truck,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Compass,
  PhoneCall,
  User,
  ArrowRight,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function JourneyLiveTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const rawRef = params?.ref as string;
  const bookingRef = rawRef ? decodeURIComponent(rawRef).toUpperCase() : '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [journey, setJourney] = useState<JourneyTrackingPayload | null>(null);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const fetchJourneyData = async () => {
    if (!bookingRef) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/telematics/journey/${encodeURIComponent(bookingRef)}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || 'Journey data not found for this reference.');
        setJourney(null);
      } else {
        setJourney(json.data);
        setLastRefreshedAt(new Date());
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch real-time journey telemetry.');
      setJourney(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourneyData();
  }, [bookingRef]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_transit':
        return {
          label: 'In Transit',
          className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold',
        };
      case 'delayed':
        return {
          label: 'Highway Advisory Delay',
          className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold',
        };
      case 'boarding':
        return {
          label: 'Passenger Boarding',
          className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold',
        };
      case 'completed':
        return {
          label: 'Arrived at Destination',
          className: 'bg-muted text-foreground border-border font-bold',
        };
      default:
        return {
          label: 'Scheduled Departure',
          className: 'bg-muted/50 text-foreground border-border font-bold',
        };
    }
  };

  const getIncidentLabel = (category: string) => {
    switch (category) {
      case 'mechanical_breakdown':
        return 'Mechanical Inspection';
      case 'checkpoint_delay':
        return 'FRSC / Highway Checkpoint';
      case 'traffic_gridlock':
        return 'Expressway Traffic Congestion';
      case 'weather_hazard':
        return 'Adverse Weather Caution';
      default:
        return 'Highway Advisory';
    }
  };

  return (
    <PageShell
      title={`Journey Tracking: ${bookingRef}`}
      description="Live Nigerian highway waypoint progression, GPS telematics coordinates, and dynamic arrival estimations for Ascent Transport Management passenger journeys."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Track', href: '/track' },
        { label: bookingRef },
      ]}
      density="spacious"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
            Corridor Journey Telematics
          </span>
          <h2 className="text-xl sm:text-2xl font-mono font-extrabold text-foreground mt-0.5">
            {bookingRef}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchJourneyData}
            disabled={loading}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-card hover:bg-muted border border-border text-foreground text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telematics</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEmergencyOpen(!isEmergencyOpen)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/20 transition-colors flex items-center gap-2"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Emergency Assistance</span>
          </button>
        </div>
      </div>

      {/* Emergency Drawer Panel */}
      {isEmergencyOpen && journey && (
        <div className="mb-8 p-6 rounded-2xl border-2 border-rose-300 dark:border-rose-900/60 bg-rose-50/90 dark:bg-rose-950/20 shadow-md animate-in slide-in-from-top duration-200">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-rose-950 dark:text-rose-200">
                  Emergency Roadside & Operations Assistance
                </h3>
                <p className="text-xs text-rose-800 dark:text-rose-300">
                  Direct priority telephone lines for passengers, dispatch desks, and standby relief vehicles.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEmergencyOpen(false)}
              className="text-xs text-rose-700 dark:text-rose-300 hover:text-rose-950 font-bold px-2 py-1"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href={`tel:${journey.emergencyAssistance.centralSafetyLine}`}
              className="min-h-[44px] p-3 rounded-xl bg-card border border-rose-200 dark:border-rose-900/40 hover:border-rose-400 transition-colors flex items-center justify-between"
            >
              <div>
                <span className="block text-[10px] font-bold text-muted-foreground uppercase">
                  Central Safety Operations
                </span>
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                  {journey.emergencyAssistance.centralSafetyLine}
                </span>
              </div>
              <PhoneCall className="w-4 h-4 text-rose-600" />
            </a>

            <a
              href={`tel:${journey.emergencyAssistance.originTerminalPhone}`}
              className="min-h-[44px] p-3 rounded-xl bg-card border border-rose-200 dark:border-rose-900/40 hover:border-rose-400 transition-colors flex items-center justify-between"
            >
              <div>
                <span className="block text-[10px] font-bold text-muted-foreground uppercase">
                  {journey.originTerminal.city} Terminal Desk
                </span>
                <span className="text-xs font-mono font-bold text-foreground">
                  {journey.emergencyAssistance.originTerminalPhone}
                </span>
              </div>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </a>

            <a
              href={`tel:${journey.emergencyAssistance.destinationTerminalPhone}`}
              className="min-h-[44px] p-3 rounded-xl bg-card border border-rose-200 dark:border-rose-900/40 hover:border-rose-400 transition-colors flex items-center justify-between"
            >
              <div>
                <span className="block text-[10px] font-bold text-muted-foreground uppercase">
                  {journey.destinationTerminal.city} Terminal Desk
                </span>
                <span className="text-xs font-mono font-bold text-foreground">
                  {journey.emergencyAssistance.destinationTerminalPhone}
                </span>
              </div>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>

          {journey.emergencyAssistance.reliefVehicleStatus && journey.emergencyAssistance.reliefVehicleStatus !== 'none' && (
            <div className="mt-4 p-3 rounded-xl bg-card/80 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between text-xs">
              <span className="text-foreground">
                Relief Vehicle Status:{' '}
                <strong className="capitalize text-foreground">
                  {journey.emergencyAssistance.reliefVehicleStatus.replace(/_/g, ' ')}
                </strong>
                {journey.emergencyAssistance.reliefVehiclePlate && (
                  <span className="ml-1 font-mono font-bold text-brand-800 dark:text-brand-300">
                    ({journey.emergencyAssistance.reliefVehiclePlate})
                  </span>
                )}
              </span>
              <span className="text-muted-foreground font-medium">
                {journey.emergencyAssistance.assignedPatrolUnit}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-start gap-3 mb-8">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !journey && (
        <div className="p-12 text-center rounded-2xl border border-border bg-card">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground">Connecting to Highway Telematics...</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Retrieving vehicle coordinates, corridor progression, and dynamic ETA.
          </p>
        </div>
      )}

      {/* Main Journey Telematics Dashboard */}
      {journey && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Top Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status & Corridor Card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Operational Status
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] border ${
                    getStatusBadge(journey.tripStatus).className
                  }`}
                >
                  {getStatusBadge(journey.tripStatus).label}
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground">
                {journey.originTerminal.city} → {journey.destinationTerminal.city}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Passenger: <strong className="text-foreground">{journey.passengerName}</strong> (Seat {journey.seatNumber})
              </p>
            </div>

            {/* Dynamic ETA Card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Estimated Arrival (WAT)
                </span>
                <Clock className="w-4 h-4 text-brand-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground font-mono">
                {journey.estimatedArrivalWat}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {journey.delayMinutes > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    +{journey.delayMinutes} mins highway adjustment
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">On Schedule</span>
                )}
              </p>
            </div>

            {/* Assigned Sienna Vehicle & Driver */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Vehicle & Driver
                </span>
                <Truck className="w-4 h-4 text-brand-600" />
              </div>
              <h3 className="text-base font-bold text-foreground font-mono">
                {journey.vehicle.plateNumber}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Driver: <strong className="text-foreground">{journey.driver.name}</strong> ({journey.driver.badgeId})
              </p>
            </div>
          </div>

          {/* Active Incident Advisory Banner */}
          {journey.activeIncidents && journey.activeIncidents.length > 0 && (
            <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                  Active Driver Roadside Incident Advisory
                </h4>
              </div>
              {journey.activeIncidents.map((incident) => (
                <div key={incident.id} className="text-xs text-amber-900 dark:text-amber-300 pl-7">
                  <div className="font-bold flex items-center gap-2">
                    <span>{getIncidentLabel(incident.category)}</span>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-normal">
                      Reported at {incident.reportedAtUtc}
                    </span>
                  </div>
                  <p className="mt-0.5">{incident.description}</p>
                  {incident.locationNote && (
                    <p className="text-amber-800 dark:text-amber-400 text-[11px] mt-0.5">
                      Waypoint location: <strong>{incident.locationNote}</strong>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Progress Bar & Vehicle GPS Coordinates Card */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                  Corridor Progression
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {journey.telematics.highwayName}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-brand-700 dark:text-brand-400 font-mono">
                  {journey.progressPercentage}%
                </span>
                <span className="text-xs text-muted-foreground ml-1">completed</span>
              </div>
            </div>

            {/* Solid Progress Bar (Zero animate-pulse per design guidelines) */}
            <div className="w-full h-3 rounded-full bg-muted overflow-hidden mb-6 border border-border">
              <div
                className="h-full bg-brand-600 transition-all duration-500"
                style={{ width: `${journey.progressPercentage}%` }}
              />
            </div>

            {/* GPS Telemetry Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-muted/40 border border-border text-xs">
              <div>
                <span className="block text-muted-foreground font-medium">GPS Latitude</span>
                <span className="font-mono font-bold text-foreground">
                  {journey.telematics.latitude}° N
                </span>
              </div>
              <div>
                <span className="block text-muted-foreground font-medium">GPS Longitude</span>
                <span className="font-mono font-bold text-foreground">
                  {journey.telematics.longitude}° E
                </span>
              </div>
              <div>
                <span className="block text-muted-foreground font-medium">Transit Speed</span>
                <span className="font-mono font-bold text-foreground">
                  {journey.telematics.speedKmh} km/h
                </span>
              </div>
              <div>
                <span className="block text-muted-foreground font-medium">Bearing</span>
                <span className="font-mono font-bold text-foreground">
                  {journey.telematics.bearingDegrees}° Heading
                </span>
              </div>
            </div>
          </div>

          {/* Highway Corridor Waypoint Stepper */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <h3 className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-6">
              Corridor Transit Waypoints & Checkpoints
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {journey.waypoints.map((wp: HighwayWaypoint) => {
                const isPassed = wp.status === 'passed';
                const isCurrent = wp.status === 'current';

                return (
                  <div key={wp.id} className="relative">
                    <div
                      className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full ring-4 ring-card shadow-sm ${
                        isCurrent
                          ? 'bg-amber-500'
                          : isPassed
                          ? 'bg-emerald-600'
                          : 'bg-muted-foreground/40'
                      }`}
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold ${
                              isCurrent
                                ? 'text-amber-600 dark:text-amber-400'
                                : isPassed
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {wp.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {wp.distanceFromOriginKm} km
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                              Current Approach
                            </span>
                          )}
                          {isPassed && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                              Passed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{wp.landmark}</p>
                      </div>

                      {wp.passedAtWat && (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {wp.passedAtWat}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
