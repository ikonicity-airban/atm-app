'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Car,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Calendar,
  ShieldAlert,
  FileText,
  DollarSign,
  X,
  Gauge,
  User,
  MapPin,
} from 'lucide-react';
import {
  formatNaira,
  type FleetVehicleRecord,
  type FleetKPIs,
  type VehicleMaintenanceStatus,
  type MaintenanceLog,
} from '@atm/shared';
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/Select';
import { fleetRepository } from '@/server/repositories/fleet.ts';

export default function AdminFleetPage() {
  const [vehicles, setVehicles] = useState<FleetVehicleRecord[]>([]);
  const [kpis, setKpis] = useState<FleetKPIs | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selected vehicle for logging maintenance
  const [loggingVehicle, setLoggingVehicle] = useState<FleetVehicleRecord | null>(null);
  const [serviceType, setServiceType] = useState<string>('routine_oil_filter');
  const [odometerInput, setOdometerInput] = useState<string>('');
  const [costNairaInput, setCostNairaInput] = useState<string>('45000');
  const [workshopName, setWorkshopName] = useState<string>('Ascent Central Garage');
  const [technicianName, setTechnicianName] = useState<string>('Emeka Nwosu');
  const [serviceNotes, setServiceNotes] = useState<string>('Full synthetic oil change and multi-point vehicle inspection.');
  const [isSubmittingLog, setIsSubmittingLog] = useState<boolean>(false);

  // Status update modal
  const [statusVehicle, setStatusVehicle] = useState<FleetVehicleRecord | null>(null);
  const [targetStatus, setTargetStatus] = useState<VehicleMaintenanceStatus>('active');
  const [statusReason, setStatusReason] = useState<string>('');

  // Load data
  const loadFleetData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let loadedVehicles: FleetVehicleRecord[] | null = null;
      let loadedKpis: FleetKPIs | null = null;

      try {
        const res = await fetch('/api/admin/fleet');
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          loadedVehicles = json.data.vehicles;
          loadedKpis = json.data.kpis;
        } else if (json?.error?.message) {
          throw new Error(json.error.message);
        }
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof Error && !fetchErr.message.includes('Unexpected token') && !fetchErr.message.includes('Failed to fetch')) {
          throw fetchErr;
        }
      }

      if (!loadedVehicles || !loadedKpis) {
        const [v, k] = await Promise.all([
          fleetRepository.getAllVehicles(),
          fleetRepository.getKPIs(),
        ]);
        loadedVehicles = v;
        loadedKpis = k;
      }

      setVehicles(loadedVehicles);
      setKpis(loadedKpis);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load fleet maintenance data.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFleetData();
  }, []);

  const openLogModal = (vehicle: FleetVehicleRecord) => {
    setLoggingVehicle(vehicle);
    setOdometerInput(String(vehicle.currentMileageKm + 500));
    setCostNairaInput('45000');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggingVehicle) return;

    const odo = parseInt(odometerInput, 10);
    const costNaira = parseFloat(costNairaInput);

    if (isNaN(odo) || odo <= 0) {
      setErrorMessage('Please enter a valid odometer mileage reading in kilometers.');
      return;
    }

    if (isNaN(costNaira) || costNaira < 0) {
      setErrorMessage('Please enter a valid service cost amount.');
      return;
    }

    setIsSubmittingLog(true);
    setErrorMessage(null);

    const costKobo = Math.round(costNaira * 100);

    try {
      let saved = false;
      try {
        const res = await fetch('/api/admin/fleet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleId: loggingVehicle.id,
            serviceType,
            odometerKm: odo,
            costKobo,
            workshopName,
            technicianName,
            notes: serviceNotes,
            staffId: 'staff-terminal-enugu-01',
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
        await fleetRepository.logMaintenance({
          vehicleId: loggingVehicle.id,
          serviceType: serviceType as any,
          odometerKm: odo,
          costKobo,
          workshopName,
          technicianName,
          notes: serviceNotes,
          staffId: 'staff-terminal-enugu-01',
        });
      }

      setSuccessMessage(`Maintenance log saved for ${loggingVehicle.registrationNumber}. Threshold updated.`);
      setLoggingVehicle(null);
      await loadFleetData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error recording service log.';
      setErrorMessage(message);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusVehicle) return;

    try {
      let updated = false;
      try {
        const res = await fetch(`/api/admin/fleet/${statusVehicle.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: targetStatus,
            reason: statusReason || 'Scheduled operations status update',
            staffId: 'staff-terminal-enugu-01',
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
        await fleetRepository.updateVehicleStatus({
          vehicleId: statusVehicle.id,
          status: targetStatus,
          reason: statusReason || 'Scheduled operations status update',
          staffId: 'staff-terminal-enugu-01',
        });
      }

      setSuccessMessage(`Status updated to ${targetStatus} for ${statusVehicle.registrationNumber}.`);
      setStatusVehicle(null);
      await loadFleetData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update vehicle status.';
      setErrorMessage(message);
    }
  };

  const getStatusBadge = (status: VehicleMaintenanceStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Road Ready
          </span>
        );
      case 'service_due':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Service Due
          </span>
        );
      case 'in_maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Wrench className="w-3.5 h-3.5" />
            In Workshop
          </span>
        );
      case 'grounded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Grounded
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title rests directly on background */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Fleet Maintenance &amp; Road Readiness
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Toyota Sienna 5-passenger executive vehicle health, service intervals, and FRSC roadworthiness monitoring.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Fleet</span>
              <Car className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{kpis.totalVehicles}</div>
            <div className="text-xs text-slate-500 mt-1">Toyota Siennas</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Road</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-2">{kpis.activeVehicles}</div>
            <div className="text-xs text-slate-500 mt-1">Available for dispatch</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Due</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-amber-600 mt-2">{kpis.serviceDueVehicles}</div>
            <div className="text-xs text-slate-500 mt-1">5,000km threshold reached</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Workshop</span>
              <Wrench className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-extrabold text-blue-600 mt-2">{kpis.inMaintenanceVehicles}</div>
            <div className="text-xs text-slate-500 mt-1">Undergoing servicing</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Spend</span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-2">
              {formatNaira(kpis.totalMaintenanceSpendKobo)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Historical repairs</div>
          </div>
        </div>
      )}

      {/* Vehicle Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-slate-900">Sienna Fleet Status &amp; Roadworthiness</div>
          <span className="text-xs text-slate-400">{vehicles.length} vehicles registered</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading fleet maintenance registry...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">Registration &amp; Model</th>
                  <th className="py-3.5 px-6">Terminal &amp; Driver</th>
                  <th className="py-3.5 px-6">Mileage &amp; Next Service</th>
                  <th className="py-3.5 px-6">Compliance &amp; Expiries</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-mono font-bold text-slate-900 text-base">{v.registrationNumber}</div>
                      <div className="text-xs text-slate-500">{v.make} {v.model} ({v.year})</div>
                      <div className="text-[11px] text-brand-700 font-medium mt-0.5">5 Seats · Air Conditioned</div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {v.currentTerminalName}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {v.assignedDriverName || <span className="italic text-slate-400">Unassigned</span>}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                        <Gauge className="w-3.5 h-3.5 text-slate-400" />
                        {v.currentMileageKm.toLocaleString()} km
                      </div>
                      <div className="text-xs mt-1">
                        {v.isServiceOverdue ? (
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Overdue by {Math.abs(v.kmUntilNextService).toLocaleString()} km
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            Next: {v.nextServiceMileageKm.toLocaleString()} km ({v.kmUntilNextService.toLocaleString()} km left)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6 space-y-1">
                      <div className="text-xs flex items-center gap-1.5">
                        <span className="text-slate-400">FRSC Road:</span>
                        <span className={`font-mono ${v.isRoadworthinessExpiringSoon ? 'text-amber-700 font-bold' : 'text-slate-700'}`}>
                          {v.roadworthinessExpiryDate}
                        </span>
                        {v.isRoadworthinessExpiringSoon && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">Soon</span>
                        )}
                      </div>
                      <div className="text-xs flex items-center gap-1.5">
                        <span className="text-slate-400">Insurance:</span>
                        <span className={`font-mono ${v.isInsuranceExpiringSoon ? 'text-amber-700 font-bold' : 'text-slate-700'}`}>
                          {v.insuranceExpiryDate}
                        </span>
                        {v.isInsuranceExpiringSoon && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">Soon</span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      {getStatusBadge(v.status)}
                    </td>

                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openLogModal(v)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Log Service
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusVehicle(v);
                          setTargetStatus(v.status);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Maintenance Modal */}
      {loggingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Record Maintenance Service</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {loggingVehicle.registrationNumber} · {loggingVehicle.make} {loggingVehicle.model}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLoggingVehicle(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Service Category
                </label>
                <Select
                  value={serviceType}
                  onValueChange={(val) => {
                    if (typeof val === 'string') setServiceType(val);
                  }}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Service Category" />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="routine_oil_filter">Routine Engine Oil &amp; Filter Service</SelectItem>
                    <SelectItem value="brake_pads">Front &amp; Rear Brake Pads Replacement</SelectItem>
                    <SelectItem value="tire_replacement">Tire Balancing &amp; Highway Replacement</SelectItem>
                    <SelectItem value="ac_servicing">Air Conditioning Refrigerant Service</SelectItem>
                    <SelectItem value="suspension_overhaul">Suspension Bushings &amp; Shocks Overhaul</SelectItem>
                    <SelectItem value="emergency_repair">Emergency Mechanical Highway Repair</SelectItem>
                  </SelectPopup>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Odometer (km)
                  </label>
                  <input
                    type="number"
                    value={odometerInput}
                    onChange={(e) => setOdometerInput(e.target.value)}
                    required
                    className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cost (₦)
                  </label>
                  <input
                    type="number"
                    value={costNairaInput}
                    onChange={(e) => setCostNairaInput(e.target.value)}
                    required
                    className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Workshop Center
                  </label>
                  <input
                    type="text"
                    value={workshopName}
                    onChange={(e) => setWorkshopName(e.target.value)}
                    required
                    className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Technician / Mechanic
                  </label>
                  <input
                    type="text"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    required
                    className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Service Notes &amp; Observations
                </label>
                <textarea
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  rows={3}
                  required
                  className="w-full text-sm rounded-xl border border-slate-200 p-3 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLoggingVehicle(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLog}
                  className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-xs"
                >
                  {isSubmittingLog ? 'Saving...' : 'Save Service Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {statusVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-lg">Update Vehicle Status</h3>
              <button
                type="button"
                onClick={() => setStatusVehicle(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Vehicle
                </label>
                <div className="font-mono font-bold text-slate-900">
                  {statusVehicle.registrationNumber} ({statusVehicle.make} {statusVehicle.model})
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Status
                </label>
                <Select
                  value={targetStatus}
                  onValueChange={(val) => {
                    if (val) setTargetStatus(val as VehicleMaintenanceStatus);
                  }}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Target Status" />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="active">Active (Road Ready for Dispatch)</SelectItem>
                    <SelectItem value="service_due">Service Due (Inspection Threshold Reached)</SelectItem>
                    <SelectItem value="in_maintenance">In Maintenance (Undergoing Repair in Bay)</SelectItem>
                    <SelectItem value="grounded">Grounded (Withdrawn from Fleet)</SelectItem>
                  </SelectPopup>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Update Reason
                </label>
                <input
                  type="text"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Cleared post-repair test run"
                  required
                  className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatusVehicle(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
