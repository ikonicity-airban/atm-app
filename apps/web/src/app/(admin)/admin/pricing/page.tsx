'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  MapPin,
  Clock,
} from 'lucide-react';
import {
  formatNaira,
  type CorridorPricingRule,
  type CorridorPricingSummary,
} from '@atm/shared';
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { pricingRepository } from '@/server/repositories/pricing.ts';

export default function AdminPricingPage() {
  const [corridors, setCorridors] = useState<CorridorPricingSummary[]>([]);
  const [rules, setRules] = useState<CorridorPricingRule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Rule Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-enugu-abuja');
  const [ruleType, setRuleType] = useState<'flat_override' | 'percentage_multiplier'>('percentage_multiplier');
  const [overrideFareNaira, setOverrideFareNaira] = useState<string>('38000');
  const [multiplierPercent, setMultiplierPercent] = useState<string>('115');
  const [startDate, setStartDate] = useState<string>('2026-10-16');
  const [endDate, setEndDate] = useState<string>('2026-10-31');
  const [ruleReason, setRuleReason] = useState<string>('Weekend Peak Travel Demand Multiplier');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load data
  const loadPricingData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let loadedCorridors: CorridorPricingSummary[] | null = null;
      let loadedRules: CorridorPricingRule[] | null = null;

      try {
        const res = await fetch('/api/admin/pricing');
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          loadedCorridors = json.data.corridors;
          loadedRules = json.data.rules;
        } else if (json?.error?.message) {
          throw new Error(json.error.message);
        }
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof Error && !fetchErr.message.includes('Unexpected token') && !fetchErr.message.includes('Failed to fetch')) {
          throw fetchErr;
        }
      }

      if (!loadedCorridors || !loadedRules) {
        const [c, r] = await Promise.all([
          pricingRepository.getCorridorSummaries(),
          pricingRepository.getAllRules(),
        ]);
        loadedCorridors = c;
        loadedRules = r;
      }

      setCorridors(loadedCorridors);
      setRules(loadedRules);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load pricing data.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPricingData();
  }, []);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: any = {
      routeId: selectedRouteId,
      ruleType,
      startDate,
      endDate,
      reason: ruleReason,
      staffId: 'staff-hq-admin-01',
    };

    if (ruleType === 'flat_override') {
      const nairaVal = parseFloat(overrideFareNaira);
      if (isNaN(nairaVal) || nairaVal <= 0) {
        setErrorMessage('Please enter a valid override fare amount.');
        setIsSubmitting(false);
        return;
      }
      payload.overrideFareKobo = Math.round(nairaVal * 100);
    } else {
      const multVal = parseInt(multiplierPercent, 10);
      if (isNaN(multVal) || multVal < 50 || multVal > 300) {
        setErrorMessage('Percentage multiplier must be between 50% and 300%.');
        setIsSubmitting(false);
        return;
      }
      payload.multiplierPercentage = multVal;
    }

    try {
      let created = false;
      try {
        const res = await fetch('/api/admin/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          created = true;
        } else if (json?.error?.message) {
          throw new Error(json.error.message);
        }
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof Error && !fetchErr.message.includes('Unexpected token') && !fetchErr.message.includes('Failed to fetch')) {
          throw fetchErr;
        }
      }

      if (!created) {
        await pricingRepository.createRule(payload);
      }

      setSuccessMessage('Pricing override rule created and activated successfully.');
      setIsModalOpen(false);
      await loadPricingData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create pricing rule.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRule = async (ruleId: string, currentActive: boolean) => {
    try {
      let toggled = false;
      try {
        const res = await fetch(`/api/admin/pricing/${ruleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: !currentActive }),
        });

        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          toggled = true;
        } else if (json?.error?.message) {
          throw new Error(json.error.message);
        }
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof Error && !fetchErr.message.includes('Unexpected token') && !fetchErr.message.includes('Failed to fetch')) {
          throw fetchErr;
        }
      }

      if (!toggled) {
        await pricingRepository.toggleRule(ruleId, !currentActive);
      }

      setSuccessMessage(`Pricing rule status toggled to ${!currentActive ? 'active' : 'inactive'}.`);
      await loadPricingData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to toggle rule.';
      setErrorMessage(message);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Delete this pricing rule? This will return the corridor to standard baseline fares.')) {
      return;
    }

    try {
      let deleted = false;
      try {
        const res = await fetch(`/api/admin/pricing/${ruleId}`, {
          method: 'DELETE',
        });

        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          deleted = true;
        } else if (json?.error?.message) {
          throw new Error(json.error.message);
        }
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof Error && !fetchErr.message.includes('Unexpected token') && !fetchErr.message.includes('Failed to fetch')) {
          throw fetchErr;
        }
      }

      if (!deleted) {
        await pricingRepository.deleteRule(ruleId);
      }

      setSuccessMessage('Pricing rule deleted.');
      await loadPricingData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete rule.';
      setErrorMessage(message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title rests directly on background */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dynamic Corridor Pricing &amp; Surcharges
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage intercity Toyota Sienna baseline fares, seasonal multipliers, and temporary holiday price overrides.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsModalOpen(true);
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Create Pricing Rule
        </button>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
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

      {/* Corridor Pricing Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-3">Intercity Travel Corridors (Baseline vs Live)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {corridors.map((c) => (
            <div
              key={c.routeId}
              className={`p-5 rounded-2xl border transition-all ${
                c.hasActiveOverride
                  ? 'bg-amber-50/50 border-amber-200/90 shadow-xs'
                  : 'bg-white border-slate-200/80 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Corridor Route</span>
                {c.hasActiveOverride ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <Sparkles className="w-3 h-3" />
                    Active Surcharge
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    Standard Base
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2 font-bold text-slate-900 text-lg">
                <span>{c.originCity}</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span>{c.destinationCity}</span>
              </div>

              <div className="text-xs text-slate-500 mt-0.5">
                {c.originTerminalName} → {c.destinationTerminalName} ({c.distanceKm} km)
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-end justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Effective Seat Fare</div>
                  <div className={`text-xl font-extrabold ${c.hasActiveOverride ? 'text-amber-700' : 'text-slate-900'}`}>
                    {formatNaira(c.currentFareKobo)}
                  </div>
                </div>

                {c.hasActiveOverride && (
                  <div className="text-right">
                    <div className="text-[11px] font-medium text-slate-400 line-through">
                      Standard: {formatNaira(c.standardFareKobo)}
                    </div>
                    {c.activeRule?.ruleType === 'percentage_multiplier' && (
                      <div className="text-xs font-bold text-amber-700">
                        {c.activeRule.multiplierPercentage}% multiplier
                      </div>
                    )}
                  </div>
                )}
              </div>

              {c.activeRule && (
                <div className="mt-2 text-[11px] text-amber-800 bg-amber-100/60 p-2 rounded-lg font-medium">
                  {c.activeRule.reason} ({c.activeRule.startDate} to {c.activeRule.endDate})
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Rules Registry Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs mt-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-slate-900">Pricing Override Rules Schedule</div>
          <span className="text-xs text-slate-400">{rules.length} total rules</span>
        </div>

        {rules.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No active or scheduled pricing overrides.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">Corridor Route</th>
                  <th className="py-3.5 px-6">Adjustment Type</th>
                  <th className="py-3.5 px-6">Effective Fare</th>
                  <th className="py-3.5 px-6">Date Schedule</th>
                  <th className="py-3.5 px-6">Reason</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{r.originCity} → {r.destinationCity}</div>
                      <div className="text-xs text-slate-400 font-mono">{r.routeId}</div>
                    </td>

                    <td className="py-4 px-6">
                      {r.ruleType === 'percentage_multiplier' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 text-xs">
                          <Percent className="w-3.5 h-3.5" />
                          {r.multiplierPercentage}% Multiplier
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-blue-700 text-xs">
                          <DollarSign className="w-3.5 h-3.5" />
                          Flat Fare Override
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-extrabold text-slate-900">{formatNaira(r.effectiveFareKobo)}</div>
                      <div className="text-xs text-slate-400">Base: {formatNaira(r.baseFareKobo)}</div>
                    </td>

                    <td className="py-4 px-6 text-xs text-slate-600">
                      <div className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {r.startDate} to {r.endDate}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-xs text-slate-700 max-w-xs truncate">
                      {r.reason}
                    </td>

                    <td className="py-4 px-6">
                      <button
                        type="button"
                        onClick={() => handleToggleRule(r.id, r.isActive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                          r.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${r.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {r.isActive ? 'Active' : 'Paused'}
                      </button>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteRule(r.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Pricing Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-lg">Create Corridor Pricing Override</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Corridor Route
                </label>
                <Select
                  value={selectedRouteId}
                  onValueChange={(val) => {
                    if (typeof val === 'string') setSelectedRouteId(val);
                  }}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Target Corridor Route" />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="route-enugu-abuja">Enugu (Ogui Road) → Abuja (Utako)</SelectItem>
                    <SelectItem value="route-abuja-enugu">Abuja (Utako) → Enugu (Ogui Road)</SelectItem>
                    <SelectItem value="route-enugu-lagos">Enugu (Ogui Road) → Lagos (Jibowu/Ajah)</SelectItem>
                    <SelectItem value="route-lagos-enugu">Lagos (Jibowu/Ajah) → Enugu (Ogui Road)</SelectItem>
                    <SelectItem value="route-lagos-owerri">Lagos (Jibowu) → Owerri (Egbu Road)</SelectItem>
                    <SelectItem value="route-owerri-lagos">Owerri (Egbu Road) → Lagos (Jibowu)</SelectItem>
                  </SelectPopup>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rule Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRuleType('percentage_multiplier')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      ruleType === 'percentage_multiplier'
                        ? 'bg-brand-50 border-brand-500 text-brand-900 ring-1 ring-brand-500'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">Percentage Multiplier</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">e.g. 115% (+15% surge)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRuleType('flat_override')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      ruleType === 'flat_override'
                        ? 'bg-brand-50 border-brand-500 text-brand-900 ring-1 ring-brand-500'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">Flat Kobo Override</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Specific fixed seat price</div>
                  </button>
                </div>
              </div>

              {ruleType === 'percentage_multiplier' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Multiplier Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={multiplierPercent}
                    onChange={(e) => setMultiplierPercent(e.target.value)}
                    min={50}
                    max={300}
                    required
                    className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 font-mono text-slate-800"
                    placeholder="115"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    100% = baseline fare, 115% = 15% holiday surge, 90% = 10% promotional discount.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Override Seat Fare (₦)
                  </label>
                  <input
                    type="number"
                    value={overrideFareNaira}
                    onChange={(e) => setOverrideFareNaira(e.target.value)}
                    required
                    className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 font-mono text-slate-800"
                    placeholder="38000"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Stored strictly in integer kobo at the repository layer.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <DatePicker
                    value={startDate}
                    onChange={(e) => setStartDate(typeof e === 'string' ? e : e?.target?.value)}
                    required
                    className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 font-mono text-slate-800 min-h-[42px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <DatePicker
                    value={endDate}
                    onChange={(e) => setEndDate(typeof e === 'string' ? e : e?.target?.value)}
                    required
                    className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 font-mono text-slate-800 min-h-[42px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Adjustment Rationale / Reason
                </label>
                <input
                  type="text"
                  value={ruleReason}
                  onChange={(e) => setRuleReason(e.target.value)}
                  required
                  placeholder="e.g. December Festive High-Capacity Return Rush"
                  className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Activate Pricing Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
