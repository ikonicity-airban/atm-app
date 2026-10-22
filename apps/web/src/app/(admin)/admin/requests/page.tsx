'use client';

import React, { useState, useEffect } from 'react';
import {
  formatNaira,
  type CharterRequest,
  type CharterStatus,
} from '@atm/shared';
import { Button } from '../../../../components/ui/Button.tsx';
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Car,
  User,
  Building2,
  AlertCircle,
  XCircle,
  ArrowRight,
  FileText,
  Calendar,
  MapPin,
  X,
  Phone,
  Mail,
} from 'lucide-react';

const STATUS_TABS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All Requests' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'approved', label: 'Approved' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'completed', label: 'Completed' },
  { id: 'declined', label: 'Declined' },
];

const SEED_VEHICLES = [
  { id: 'veh-sienna-01', plate: 'ENU-421-AA', model: 'Toyota Sienna XSE 2022' },
  { id: 'veh-sienna-02', plate: 'ABJ-893-KM', model: 'Toyota Sienna XLE 2021' },
  { id: 'veh-sienna-03', plate: 'LAG-102-XY', model: 'Toyota Sienna Limited 2023' },
];

const SEED_DRIVERS = [
  { id: 'drv-chukwuma-01', name: 'Chukwuma Eze', phone: '+2348039991122' },
  { id: 'drv-ibrahim-02', name: 'Ibrahim Mohammed', phone: '+2348028883344' },
  { id: 'drv-sunday-03', name: 'Sunday Adeleke', phone: '+2348077775566' },
];

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<CharterRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeRequest, setActiveRequest] = useState<CharterRequest | null>(null);

  // Modification Form State inside modal
  const [finalFareInput, setFinalFareInput] = useState<string>('');
  const [assignedVehicle, setAssignedVehicle] = useState<string>('');
  const [assignedDriver, setAssignedDriver] = useState<string>('');
  const [dispatchNotes, setDispatchNotes] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/requests?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [selectedStatus, searchQuery]);

  const openDrawer = (req: CharterRequest) => {
    setActiveRequest(req);
    setFinalFareInput(
      req.finalFareKobo ? (req.finalFareKobo / 100).toString() : (req.estimatedFareKobo / 100).toString()
    );
    setAssignedVehicle(req.assignedVehicleId || '');
    setAssignedDriver(req.assignedDriverId || '');
    setDispatchNotes(req.dispatchNotes || '');
  };

  const handleUpdate = async (newStatus?: CharterStatus) => {
    if (!activeRequest) return;
    setUpdating(true);

    try {
      const fareNaira = parseFloat(finalFareInput);
      const finalFareKobo = !isNaN(fareNaira) && fareNaira > 0 ? Math.round(fareNaira * 100) : undefined;

      const res = await fetch(`/api/admin/requests/${activeRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus || activeRequest.status,
          finalFareKobo,
          assignedVehicleId: assignedVehicle || null,
          assignedDriverId: assignedDriver || null,
          dispatchNotes: dispatchNotes || null,
          staffId: 'staff-ops-01',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update request');
      }

      setActiveRequest(data.request);
      setToastMessage(`Request ${data.request.reference} updated successfully.`);
      setTimeout(() => setToastMessage(null), 3000);
      fetchRequests();
    } catch (err: any) {
      alert(err?.message || 'Error updating request');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: CharterStatus) => {
    switch (status) {
      case 'submitted':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-50 text-amber-700 border border-amber-200">Submitted</span>;
      case 'approved':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-200">Approved</span>;
      case 'assigned':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Assigned</span>;
      case 'completed':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-300">Completed</span>;
      case 'declined':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-rose-50 text-rose-700 border border-rose-200">Declined</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Charter &amp; Corporate Logistics Console
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage bespoke Toyota Sienna private charters, corporate fleet contracts, and VIP delegation bookings.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${selectedStatus === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ref, client, or corridor..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[36px]"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ref Code</th>
                <th className="py-3 px-4">Service &amp; Client</th>
                <th className="py-3 px-4">Corridor Itinerary</th>
                <th className="py-3 px-4">Departure Date</th>
                <th className="py-3 px-4">Fare (Integer Kobo)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    Loading charter requests...
                  </td>
                </tr>
              )}

              {!loading && requests.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    No charter or corporate requests found matching your filter criteria.
                  </td>
                </tr>
              )}

              {!loading &&
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {r.reference}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {r.organizationName || r.contactName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {r.serviceType.replace('_', ' ')} • {r.contactPhone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {r.originCity} → {r.destinationCity}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {r.durationDays} Day(s) • {r.tripType.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(r.departureDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatNaira(r.finalFareKobo || r.estimatedFareKobo)}
                      {r.billingMethod === 'corporate_invoice' && (
                        <span className="block text-[10px] text-blue-600 font-normal">
                          Invoice (Net 30)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(r.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDrawer(r)}
                        className="text-xs h-8"
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Management Drawer / Modal */}
      {activeRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-50 text-[#ca2484] flex items-center justify-center font-bold">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">
                      Charter {activeRequest.reference}
                    </h2>
                    {getStatusBadge(activeRequest.status)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Created {new Date(activeRequest.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveRequest(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Client & Itinerary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Client &amp; Contact Details
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {activeRequest.contactName}
                </div>
                {activeRequest.organizationName && (
                  <div className="text-slate-700">
                    <strong>Organization:</strong> {activeRequest.organizationName} (TIN: {activeRequest.organizationTaxId || 'N/A'})
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {activeRequest.contactPhone}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {activeRequest.contactEmail}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Corridor &amp; Route Specs
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {activeRequest.originCity} → {activeRequest.destinationCity}
                </div>
                <div className="text-slate-600">
                  <strong>Pickup:</strong> {activeRequest.originAddress}
                </div>
                <div className="text-slate-600">
                  <strong>Destination:</strong> {activeRequest.destinationAddress}
                </div>
                <div className="text-slate-500">
                  {activeRequest.durationDays} Day(s) • {activeRequest.passengerCount} Passengers
                </div>
              </div>
            </div>

            {/* Special Requirements */}
            {activeRequest.specialRequirements && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900">
                <strong>Client Specifications:</strong> {activeRequest.specialRequirements}
              </div>
            )}

            {/* Operations Assignment Form */}
            <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
              <span className="text-xs font-bold text-slate-900 block pb-2 border-b border-slate-100">
                Dispatch Allocation &amp; Price Adjustment
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Final Fare (₦ Naira)
                  </label>
                  <input
                    type="number"
                    value={finalFareInput}
                    onChange={(e) => setFinalFareInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[38px]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Auto-estimate: {formatNaira(activeRequest.estimatedFareKobo)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign Sienna Fleet
                  </label>
                  <select
                    value={assignedVehicle}
                    onChange={(e) => setAssignedVehicle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white min-h-[38px]"
                  >
                    <option value="">-- Select Available Vehicle --</option>
                    {SEED_VEHICLES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} ({v.model})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign Chauffeur
                  </label>
                  <select
                    value={assignedDriver}
                    onChange={(e) => setAssignedDriver(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white min-h-[38px]"
                  >
                    <option value="">-- Select Available Driver --</option>
                    {SEED_DRIVERS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operations Dispatch Notes
                </label>
                <textarea
                  rows={2}
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  placeholder="Record security details, escort notes, or invoice clearance..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updating}
                  onClick={() => handleUpdate('approved')}
                  className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                >
                  Approve Quote
                </Button>

                <Button
                  size="sm"
                  disabled={updating || !assignedVehicle || !assignedDriver}
                  onClick={() => handleUpdate('assigned')}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Assign Fleet &amp; Driver
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={updating}
                  onClick={() => handleUpdate('completed')}
                  className="text-xs text-slate-700"
                >
                  Mark Completed
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={updating}
                  onClick={() => handleUpdate('declined')}
                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Decline
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  disabled={updating}
                  onClick={() => handleUpdate()}
                  className="text-xs ml-auto"
                >
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Audit Event Timeline */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-900 block">
                Audit Timeline ({activeRequest.events?.length || 0} events)
              </span>
              <div className="space-y-2 border-l-2 border-slate-200 pl-3">
                {activeRequest.events?.map((evt) => (
                  <div key={evt.id} className="text-xs space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 uppercase text-[10px]">
                        {evt.status}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(evt.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600">{evt.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
