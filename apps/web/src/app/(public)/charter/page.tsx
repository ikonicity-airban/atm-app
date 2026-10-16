'use client';

import React, { useState, useId } from 'react';
import {
  formatNaira,
  calculateCharterQuote,
  type CharterQuoteInput,
  type CharterQuoteResult,
  type CharterRequest,
} from '@atm/shared';
import { PageShell } from '../../../components/layout/Templates.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import {
  Car,
  Shield,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  CreditCard,
  FileText,
  Phone,
  Mail,
  HelpCircle,
  Briefcase,
  Compass,
} from 'lucide-react';

const MAJOR_CITIES = ['Enugu', 'Abuja', 'Lagos', 'Owerri', 'Port Harcourt', 'Onitsha', 'Awka', 'Asaba'];

export default function CharterPage() {
  const [step, setStep] = useState<number>(1);
  const [originCity, setOriginCity] = useState<string>('Enugu');
  const [originAddress, setOriginAddress] = useState<string>('');
  const [destinationCity, setDestinationCity] = useState<string>('Abuja');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [tripType, setTripType] = useState<'one_way' | 'round_trip' | 'multi_day'>('one_way');
  const [departureDate, setDepartureDate] = useState<string>('2026-10-25');
  const [returnDate, setReturnDate] = useState<string>('2026-10-28');
  const [durationDays, setDurationDays] = useState<number>(1);
  const [passengerCount, setPassengerCount] = useState<number>(4);
  const [isDoorToDoor, setIsDoorToDoor] = useState<boolean>(true);
  const [hasArmedEscort, setHasArmedEscort] = useState<boolean>(false);
  const [specialRequirements, setSpecialRequirements] = useState<string>('');

  const [contactName, setContactName] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [billingMethod, setBillingMethod] = useState<'paystack_gateway' | 'corporate_invoice'>('paystack_gateway');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<CharterRequest | null>(null);

  // Calculate live estimate
  const quoteParams: CharterQuoteInput = {
    serviceType: 'private_charter',
    tripType,
    originCity,
    destinationCity,
    durationDays: tripType === 'multi_day' ? durationDays : tripType === 'round_trip' ? 2 : 1,
    passengerCount,
    isDoorToDoor,
    hasArmedEscort,
  };

  const quote: CharterQuoteResult = calculateCharterQuote(quoteParams);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originAddress.trim() || !destinationAddress.trim()) {
      setError('Please provide specific pickup and destination addresses');
      return;
    }
    if (!contactName.trim() || !contactPhone.trim() || !contactEmail.trim()) {
      setError('Please enter contact name, phone number, and email');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/charter/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: 'private_charter',
          tripType,
          originCity,
          originAddress,
          destinationCity,
          destinationAddress,
          departureDate: new Date(departureDate).toISOString(),
          returnDate: tripType !== 'one_way' ? new Date(returnDate).toISOString() : null,
          durationDays: quoteParams.durationDays,
          passengerCount,
          contactName,
          contactPhone,
          contactEmail,
          organizationName: null,
          organizationTaxId: null,
          specialRequirements: specialRequirements || null,
          billingMethod,
          invoiceReference: null,
          estimatedFareKobo: quote.breakdown.totalEstimatedKobo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit charter reservation');
      }

      setCreatedRequest(data.request);
      setStep(4);
    } catch (err: any) {
      setError(err?.message || 'Error submitting request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Private Charter' }]}
      title="Private Toyota Sienna Fleet Charter"
      description="Exclusive intercity travel across Nigeria. Dedicated 5-passenger individual captain seating with door-to-door convenience."
    >
      {/* Confirmation State */}
      {createdRequest && (
        <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">
                Request Confirmed
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Charter Booking {createdRequest.reference}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 p-4 rounded-lg space-y-1">
              <span className="text-xs text-slate-500 font-medium">Corridor Itinerary</span>
              <div className="font-bold text-slate-900">
                {createdRequest.originCity} → {createdRequest.destinationCity}
              </div>
              <div className="text-xs text-slate-600 truncate">{createdRequest.originAddress}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg space-y-1">
              <span className="text-xs text-slate-500 font-medium">Estimated Total</span>
              <div className="font-black text-[#ca2484] text-lg">
                {formatNaira(createdRequest.estimatedFareKobo)}
              </div>
              <div className="text-xs text-slate-500">
                {createdRequest.durationDays} Day(s) • {createdRequest.tripType.replace('_', ' ')}
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 space-y-2">
            <div className="font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" />
              What Happens Next?
            </div>
            <p className="leading-relaxed">
              Our operations dispatch desk has received your private hire reservation. A travel coordinator will review vehicle road readiness, confirm driver allocation, and contact you at{' '}
              <strong className="text-amber-950">{createdRequest.contactPhone}</strong> within 30 minutes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setCreatedRequest(null);
                setStep(1);
              }}
            >
              Book Another Charter
            </Button>
            <a
              href={`/manage?ref=${createdRequest.reference}&phone=${encodeURIComponent(createdRequest.contactPhone)}`}
              className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-[#ca2484] hover:bg-[#aa1769] rounded min-h-[44px] flex-1 text-center"
            >
              Track Request Status
            </a>
          </div>
        </div>
      )}

      {/* Booking Wizard */}
      {!createdRequest && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form (8 Cols) */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
            {/* Step Indicators */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= 1 ? 'bg-[#ca2484] text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  1
                </span>
                <span className="text-xs font-bold text-slate-900">Route &amp; Dates</span>
              </div>
              <div className="w-8 h-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= 2 ? 'bg-[#ca2484] text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  2
                </span>
                <span className="text-xs font-bold text-slate-900">Custom Options</span>
              </div>
              <div className="w-8 h-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= 3 ? 'bg-[#ca2484] text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  3
                </span>
                <span className="text-xs font-bold text-slate-900">Confirm &amp; Book</span>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* STEP 1: ROUTE & DATES */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Trip Type
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'one_way', label: 'One Way', desc: 'Direct drop-off' },
                        { id: 'round_trip', label: 'Round Trip', desc: 'Return journey' },
                        { id: 'multi_day', label: 'Multi-Day Hire', desc: 'Dedicated full day' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTripType(t.id as any)}
                          className={`p-3 rounded-lg border text-left transition-colors min-h-[44px] ${
                            tripType === t.id
                              ? 'border-[#ca2484] bg-pink-50/40 text-slate-900 font-bold'
                              : 'border-slate-200 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          <div className="text-xs font-bold">{t.label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Origin City
                      </label>
                      <select
                        value={originCity}
                        onChange={(e) => setOriginCity(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[44px]"
                      >
                        {MAJOR_CITIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Destination City
                      </label>
                      <select
                        value={destinationCity}
                        onChange={(e) => setDestinationCity(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[44px]"
                      >
                        {MAJOR_CITIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Exact Pickup Address (Door-to-Door)
                      </label>
                      <input
                        type="text"
                        value={originAddress}
                        onChange={(e) => setOriginAddress(e.target.value)}
                        placeholder="e.g. 14 Independence Layout, Enugu"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Exact Drop-off Address
                      </label>
                      <input
                        type="text"
                        value={destinationAddress}
                        onChange={(e) => setDestinationAddress(e.target.value)}
                        placeholder="e.g. Maitama District, Abuja"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Departure Date
                      </label>
                      <input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[44px]"
                      />
                    </div>

                    {tripType !== 'one_way' && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Return Date
                        </label>
                        <input
                          type="date"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[44px]"
                        />
                      </div>
                    )}

                    {tripType === 'multi_day' && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Duration (Days)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={durationDays}
                          onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 1)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[44px]"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button
                      type="button"
                      onClick={() => {
                        if (!originAddress.trim() || !destinationAddress.trim()) {
                          setError('Please fill in both pickup and drop-off addresses');
                          return;
                        }
                        setError(null);
                        setStep(2);
                      }}
                      className="px-6"
                    >
                      Continue to Custom Options <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: CUSTOM OPTIONS */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Number of Passengers (Max 5 for Sienna)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setPassengerCount(num)}
                          className={`w-12 h-11 rounded-lg border font-bold text-xs transition-colors min-h-[44px] ${
                            passengerCount === num
                              ? 'border-[#ca2484] bg-[#ca2484] text-white'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="escortToggle"
                        checked={hasArmedEscort}
                        onChange={(e) => setHasArmedEscort(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#ca2484] focus:ring-[#ca2484]"
                      />
                      <label htmlFor="escortToggle" className="cursor-pointer">
                        <span className="text-xs font-bold text-slate-900 block">
                          Add Armed Escort Security Detail
                        </span>
                        <span className="text-xs text-slate-500 block mt-0.5">
                          Certified armed security escort vehicle for interstate highway protection (₦650,000 / day).
                        </span>
                      </label>
                    </div>

                    <div className="flex items-start gap-3 pt-3 border-t border-slate-200">
                      <input
                        type="checkbox"
                        id="doorToggle"
                        checked={isDoorToDoor}
                        onChange={(e) => setIsDoorToDoor(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#ca2484] focus:ring-[#ca2484]"
                      />
                      <label htmlFor="doorToggle" className="cursor-pointer">
                        <span className="text-xs font-bold text-slate-900 block">
                          Door-to-Door Residence Pickup (₦15,000 included)
                        </span>
                        <span className="text-xs text-slate-500 block mt-0.5">
                          Direct chauffeur pickup from your private residential gate or hotel lobby.
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Special Requirements &amp; Baggage Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={specialRequirements}
                      onChange={(e) => setSpecialRequirements(e.target.value)}
                      placeholder="e.g. Executive coolbox required, 4 large travel bags, elderly passenger assistance."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ca2484]"
                    />
                  </div>

                  <div className="pt-4 flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button type="button" onClick={() => setStep(3)}>
                      Review &amp; Contact Details <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: CONTACT & SUBMIT */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Contact Person Name
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Chief Emeka Okafor"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Phone Number (E.164)
                      </label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="08031234567"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="emeka@primeholdings.ng"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ca2484] min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Settlement Preference
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setBillingMethod('paystack_gateway')}
                        className={`p-3 rounded-lg border text-left transition-colors min-h-[44px] ${
                          billingMethod === 'paystack_gateway'
                            ? 'border-[#ca2484] bg-pink-50/40 text-slate-900 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-[#ca2484]" /> Online Card / Transfer
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Paystack Instant Checkout</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBillingMethod('corporate_invoice')}
                        className={`p-3 rounded-lg border text-left transition-colors min-h-[44px] ${
                          billingMethod === 'corporate_invoice'
                            ? 'border-[#ca2484] bg-pink-50/40 text-slate-900 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#ca2484]" /> Invoice My Organization
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Direct B2B Wire Invoice</div>
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button type="submit" disabled={submitting} className="px-8 min-h-[44px]">
                      {submitting ? 'Submitting Reservation...' : 'Confirm Charter Request'}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Pricing & Sienna Specs Sidebar (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Live Pricing Breakdown */}
            <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400">
                Transparent Fare Estimate
              </span>
              <div className="text-3xl font-black text-white">
                {formatNaira(quote.breakdown.totalEstimatedKobo)}
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Base Corridor Hire:</span>
                  <span className="font-semibold text-white">
                    {formatNaira(quote.breakdown.baseCorridorKobo)}
                  </span>
                </div>

                {quote.breakdown.dailyVehicleAllocationKobo > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Extra Days ({quoteParams.durationDays - 1}):</span>
                    <span className="font-semibold text-white">
                      {formatNaira(quote.breakdown.dailyVehicleAllocationKobo)}
                    </span>
                  </div>
                )}

                {quote.breakdown.doorToDoorKobo > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Door-to-Door Surcharge:</span>
                    <span className="font-semibold text-white">
                      {formatNaira(quote.breakdown.doorToDoorKobo)}
                    </span>
                  </div>
                )}

                {quote.breakdown.armedEscortKobo > 0 && (
                  <div className="flex justify-between text-amber-300">
                    <span>Armed Security Escort:</span>
                    <span className="font-bold">
                      {formatNaira(quote.breakdown.armedEscortKobo)}
                    </span>
                  </div>
                )}

                {quote.breakdown.discountKobo > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Return Leg Discount (15%):</span>
                    <span className="font-bold">
                      -{formatNaira(quote.breakdown.discountKobo)}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                Includes dedicated Sienna vehicle, certified highway chauffeur, fuel, and highway tolls across designated Nigerian corridors.
              </div>
            </div>

            {/* Vehicle Specs Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Car className="w-4 h-4 text-[#ca2484]" />
                Toyota Sienna XSE Fleet Standards
              </div>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Max 5 passenger individual captain seats
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Dual high-efficiency AC climate controls
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  USB rapid charging on every row
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Comprehensive speed-governor protection (100 km/h)
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
