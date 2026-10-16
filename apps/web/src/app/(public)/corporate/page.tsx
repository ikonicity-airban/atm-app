'use client';

import React, { useState } from 'react';
import {
  formatNaira,
  calculateCharterQuote,
  type CharterQuoteResult,
  type CharterRequest,
} from '@atm/shared';
import { PageShell } from '../../../components/layout/Templates.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import {
  Building2,
  Briefcase,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Truck,
  Users,
  CreditCard,
  Phone,
  Mail,
} from 'lucide-react';

export default function CorporatePage() {
  const [orgName, setOrgName] = useState<string>('');
  const [taxId, setTaxId] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [serviceType, setServiceType] = useState<'corporate_transit' | 'custom_cargo' | 'private_charter'>('corporate_transit');
  const [originCity, setOriginCity] = useState<string>('Enugu');
  const [originAddress, setOriginAddress] = useState<string>('');
  const [destinationCity, setDestinationCity] = useState<string>('Lagos');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [departureDate, setDepartureDate] = useState<string>('2026-10-28');
  const [durationDays, setDurationDays] = useState<number>(1);
  const [passengerCount, setPassengerCount] = useState<number>(5);
  const [poReference, setPoReference] = useState<string>('');
  const [specialRequirements, setSpecialRequirements] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<CharterRequest | null>(null);

  const quote: CharterQuoteResult = calculateCharterQuote({
    serviceType,
    tripType: 'one_way',
    originCity,
    destinationCity,
    durationDays,
    passengerCount,
    isDoorToDoor: true,
    hasArmedEscort: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !taxId.trim()) {
      setError('Please provide your organization name and Tax ID / CAC RC Number');
      return;
    }
    if (!contactName.trim() || !contactPhone.trim() || !contactEmail.trim()) {
      setError('Please provide booking coordinator contact details');
      return;
    }
    if (!originAddress.trim() || !destinationAddress.trim()) {
      setError('Please provide exact corporate facility addresses');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/charter/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType,
          tripType: 'one_way',
          originCity,
          originAddress,
          destinationCity,
          destinationAddress,
          departureDate: new Date(departureDate).toISOString(),
          returnDate: null,
          durationDays,
          passengerCount,
          contactName,
          contactPhone,
          contactEmail,
          organizationName: orgName,
          organizationTaxId: taxId,
          specialRequirements: specialRequirements || null,
          billingMethod: 'corporate_invoice',
          invoiceReference: poReference || null,
          estimatedFareKobo: quote.breakdown.totalEstimatedKobo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit corporate request');
      }

      setCreatedRequest(data.request);
    } catch (err: any) {
      setError(err?.message || 'Error submitting request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Corporate Logistics' }]}
      title="Corporate Fleet &amp; B2B Logistics"
      description="Scheduled employee transport, executive delegation convoys, and dedicated express cargo agreements across Nigeria."
    >
      {createdRequest && (
        <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">
                Corporate Order Placed
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Ref: {createdRequest.reference}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 p-4 rounded-lg space-y-1">
              <span className="text-xs text-slate-500 font-medium">B2B Account</span>
              <div className="font-bold text-slate-900">{createdRequest.organizationName}</div>
              <div className="text-xs text-slate-600">TIN/RC: {createdRequest.organizationTaxId}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg space-y-1">
              <span className="text-xs text-slate-500 font-medium">Corridor Estimate</span>
              <div className="font-black text-[#ca2484] text-lg">
                {formatNaira(createdRequest.estimatedFareKobo)}
              </div>
              <div className="text-xs text-slate-500">
                Payment: Corporate Invoice (PO: {createdRequest.invoiceReference || 'Pending'})
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-900 space-y-2">
            <div className="font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-700" />
              Corporate Billing Notice
            </div>
            <p className="leading-relaxed">
              Your corporate request has been assigned to our Key Accounts Desk. An official VAT invoice and corporate service level agreement (SLA) will be dispatched to{' '}
              <strong>{createdRequest.contactEmail}</strong>.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCreatedRequest(null)}
            >
              Submit Another Request
            </Button>
            <a
              href={`/manage?ref=${createdRequest.reference}&phone=${encodeURIComponent(createdRequest.contactPhone)}`}
              className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-[#ca2484] hover:bg-[#aa1769] rounded min-h-[44px] flex-1 text-center"
            >
              View Order Progress
            </a>
          </div>
        </div>
      )}

      {!createdRequest && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#ca2484]" />
              Corporate Service Agreement Application
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Type Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Service Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'corporate_transit', label: 'Executive Transit', icon: Users, desc: 'VIP and board delegation transit' },
                    { id: 'custom_cargo', label: 'Dedicated Cargo', icon: Truck, desc: 'Express whole-vehicle cargo runs' },
                    { id: 'private_charter', label: 'Fleet Contract', icon: Briefcase, desc: 'Recurring employee intercity shuttle' },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setServiceType(s.id as any)}
                        className={`p-3.5 rounded-lg border text-left transition-colors min-h-[44px] ${
                          serviceType === s.id
                            ? 'border-[#ca2484] bg-pink-50/40 text-slate-900 font-bold'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-[#ca2484] mb-1.5" />
                        <div className="text-xs font-bold">{s.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{s.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Company Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Company Legal Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Dangote Cement PLC"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    TIN or CAC RC Registration Number
                  </label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="e.g. RC-1129481 or TIN-28491048-0001"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[44px]"
                  />
                </div>
              </div>

              {/* Coordinator Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Logistics Coordinator Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Engr. Folake Adeleke"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Official Mobile (E.164)
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="08029876543"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="folake.adeleke@dangote-cement.com"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[44px]"
                  />
                </div>
              </div>

              {/* Route & Timing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Origin Corridor &amp; Pickup Address
                  </label>
                  <div className="space-y-2">
                    <select
                      value={originCity}
                      onChange={(e) => setOriginCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white min-h-[44px]"
                    >
                      {['Enugu', 'Abuja', 'Lagos', 'Owerri', 'Port Harcourt', 'Onitsha'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={originAddress}
                      onChange={(e) => setOriginAddress(e.target.value)}
                      placeholder="e.g. Regional Depot, Emene Industrial Area, Enugu"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Destination City &amp; Drop-off Address
                  </label>
                  <div className="space-y-2">
                    <select
                      value={destinationCity}
                      onChange={(e) => setDestinationCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white min-h-[44px]"
                    >
                      {['Lagos', 'Abuja', 'Enugu', 'Owerri', 'Port Harcourt'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={destinationAddress}
                      onChange={(e) => setDestinationAddress(e.target.value)}
                      placeholder="e.g. Dangote Towers, Alfred Rewane Road, Ikoyi, Lagos"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Ref */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Purchase Order (PO) Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={poReference}
                    onChange={(e) => setPoReference(e.target.value)}
                    placeholder="e.g. PO-DANG-2026-089"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Cargo or Route Specifications
                </label>
                <textarea
                  rows={3}
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  placeholder="e.g. 3 VIP directors, technical audit materials, non-stop interstate transit."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={submitting} className="px-8 min-h-[44px]">
                  {submitting ? 'Submitting Agreement...' : 'Submit Corporate Service Request'}
                </Button>
              </div>
            </form>
          </div>

          {/* B2B Terms Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400">
                Corporate Contract Benefits
              </span>
              <ul className="text-xs text-slate-300 space-y-3">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Net 30 Invoicing:</strong> Direct payment terms for verified Nigerian corporate organizations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Dedicated Dispatch Coordinator:</strong> Single point of contact for schedule adjustments and manifests.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Vetted Chauffeurs:</strong> Defensive driving certified staff trained in corporate VIP protocols.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-2 text-xs text-slate-600">
              <div className="font-bold text-slate-900 text-sm">Corporate Inquiries</div>
              <p>For custom multi-vehicle fleet procurement or intercity staff logistics tenders:</p>
              <div className="pt-2 text-[#ca2484] font-bold">corporate@ascenttransport.ng</div>
              <div className="text-slate-500">Hotline: 09070000625 (Ext. 4)</div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
