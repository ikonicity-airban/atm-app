'use client';

import React, { useState, useMemo } from 'react';
import {
  SEED_TERMINALS,
  calculateParcelDeliveryFee,
  formatNaira,
  type ParcelCategory,
  type BookParcelInput,
  bookParcelSchema,
} from '@atm/shared';
import { PageShell } from '@/components/layout/Templates.tsx';
import { StaticParcelRepository } from '@/server/repositories/parcels.ts';
import {
  Package,
  FileText,
  Laptop,
  Shirt,
  Apple,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Printer,
  Copy,
  ExternalLink,
  Truck,
  CreditCard,
  Building2,
  AlertTriangle,
} from 'lucide-react';

const parcelRepo = new StaticParcelRepository();

const CATEGORIES: Array<{
  id: ParcelCategory;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
    { id: 'documents', name: 'Documents', desc: 'Legal deeds, certificates, contracts (< 1kg)', icon: FileText },
    { id: 'electronics', name: 'Electronics', desc: 'Laptops, phones, cameras, gadgets', icon: Laptop },
    { id: 'clothing', name: 'Clothing & Fabrics', desc: 'Apparel, shoes, textiles, accessories', icon: Shirt },
    { id: 'general', name: 'General Cargo', desc: 'Spare parts, boxed household items, gifts', icon: Package },
    { id: 'perishables', name: 'Perishables', desc: 'Packaged dry foods, spices, urgent items', icon: Apple },
    { id: 'fragile', name: 'Fragile / Glass', desc: 'Glassware, ceramics, delicate instruments', icon: ShieldAlert },
  ];

export default function CourierPage(props?: any) {
  const onNavigate = (props as { onNavigate?: (path: string) => void } | undefined)?.onNavigate;
  const navigate = (path: string) => {
    if (onNavigate) onNavigate(path);
    else if (typeof window !== 'undefined') window.location.href = path;
  };

  // Form state
  const [originTerminalId, setOriginTerminalId] = useState<string>(SEED_TERMINALS[0]?.id || 'term-enugu-ogui');
  const [destinationTerminalId, setDestinationTerminalId] = useState<string>(SEED_TERMINALS[1]?.id || 'term-abuja-utako');
  const [category, setCategory] = useState<ParcelCategory>('general');
  const [description, setDescription] = useState('');
  const [weightKg, setWeightKg] = useState<number>(2);
  const [fragile, setFragile] = useState<boolean>(false);
  const [declaredValueNaira, setDeclaredValueNaira] = useState<string>('0');

  // Contact details
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAltPhone, setReceiverAltPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');

  // Payment & Compliance
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'pay_on_dropoff'>('online');
  const [securityDeclaration, setSecurityDeclaration] = useState<boolean>(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    trackingCode: string;
    pickupOtp: string;
    totalFeeKobo: number;
    originTerminalName: string;
    destTerminalName: string;
    createdAt: string;
    paymentMethod: string;
  } | null>(null);

  // Live price calculation in integer kobo
  const declaredValueKobo = useMemo(() => {
    const val = parseInt(declaredValueNaira.replace(/[^0-9]/g, ''), 10);
    return isNaN(val) ? 0 : val * 100;
  }, [declaredValueNaira]);

  const pricing = useMemo(() => {
    return calculateParcelDeliveryFee({
      category,
      weightKg: Math.max(0.5, weightKg),
      fragile: fragile || category === 'fragile',
      declaredValueKobo,
    });
  }, [category, weightKg, fragile, declaredValueKobo]);

  const originTerminal = SEED_TERMINALS.find((t) => t.id === originTerminalId);
  const destinationTerminal = SEED_TERMINALS.find((t) => t.id === destinationTerminalId);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (originTerminalId === destinationTerminalId) {
      setErrorMsg('Origin and destination terminals cannot be identical.');
      return;
    }

    if (!securityDeclaration) {
      setErrorMsg('You must agree to the security declaration confirming no prohibited items.');
      return;
    }

    const payload: BookParcelInput = {
      originTerminalId,
      destinationTerminalId,
      category,
      description: description.trim() || `${category} consignment`,
      weightKg: Math.max(0.5, weightKg),
      fragile: fragile || category === 'fragile',
      declaredValueKobo,
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim(),
      senderEmail: senderEmail.trim() || undefined,
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      receiverAltPhone: receiverAltPhone.trim() || undefined,
      receiverAddress: receiverAddress.trim() || undefined,
      paymentMethod,
      securityDeclarationAccepted: true,
    };

    const validation = bookParcelSchema.safeParse(payload);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Please check the form inputs.';
      setErrorMsg(firstError);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await parcelRepo.createParcel(validation.data);
      setSuccessResult({
        trackingCode: result.parcel.trackingCode,
        pickupOtp: result.parcel.pickupOtp || '0000',
        totalFeeKobo: result.parcel.totalFeeKobo || pricing.totalFeeKobo,
        originTerminalName: originTerminal?.name || 'Origin Terminal',
        destTerminalName: destinationTerminal?.name || 'Destination Terminal',
        createdAt: result.parcel.createdAt,
        paymentMethod: result.parcel.paymentMethod || 'online',
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to book parcel waybill. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTrackingCode = () => {
    if (!successResult) return;
    navigator.clipboard.writeText(successResult.trackingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <PageShell
      title="Courier &amp; Parcel Express"
      description="Send packages, documents, and commercial goods safely between Enugu, Abuja, Lagos, and Owerri.
          Dispatched on scheduled Toyota Sienna transit runs with four digit SMS pickup code verification."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Courier & Freight' },
      ]}
      density="comfortable"
    >
      {/* Hero Intro Header */}
      <div className="mb-8">
        {/* Feature Highlights */}
        <div className="mt-4 flex flex-wrap gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700">
            <Truck className="w-3.5 h-3.5 text-brand-600" />
            <span>Same-Day Highway Transit</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>4-Digit SMS Collection OTP</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700">
            <CreditCard className="w-3.5 h-3.5 text-sky-600" />
            <span>Online or Counter Payment</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Booking Form */}
        <div className="lg:col-span-8 relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          {/* Top specular highlight */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <div className="text-sm font-medium text-pretty">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Terminal Route */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  1
                </span>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Route &amp; Terminal Corridors</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="origin-terminal" className="block text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                    Origin Terminal (Drop-off)
                  </label>
                  <select
                    id="origin-terminal"
                    value={originTerminalId}
                    onChange={(e) => setOriginTerminalId(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {SEED_TERMINALS.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.city}: {term.name}
                      </option>
                    ))}
                  </select>
                  {originTerminal && (
                    <p className="mt-1.5 text-xs text-slate-500 truncate">
                      {originTerminal.address}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="dest-terminal" className="block text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                    Destination Terminal (Pickup)
                  </label>
                  <select
                    id="dest-terminal"
                    value={destinationTerminalId}
                    onChange={(e) => setDestinationTerminalId(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {SEED_TERMINALS.filter((t) => t.id !== originTerminalId).map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.city}: {term.name}
                      </option>
                    ))}
                  </select>
                  {destinationTerminal && (
                    <p className="mt-1.5 text-xs text-slate-500 truncate">
                      {destinationTerminal.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Parcel Categorization & Weight */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  2
                </span>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Consignment &amp; Dimensions</h2>
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`text-left p-3.5 rounded-xl border transition-all ${isSelected
                        ? 'bg-brand-50/70 border-brand-500 text-brand-950 ring-1 ring-brand-500 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-brand-600' : 'text-slate-500'}`} />
                      <div className="text-xs font-bold">{cat.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{cat.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Weight & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label htmlFor="package-weight" className="block text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                    Weight in Kilograms (kg)
                  </label>
                  <input
                    id="package-weight"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50"
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 1)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500">First 5kg covered in base rate</p>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="package-desc" className="block text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                    Contents Description
                  </label>
                  <input
                    id="package-desc"
                    type="text"
                    required
                    placeholder="e.g. 1 Laptop, 2 Power adapters, charger cord"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              {/* Fragile & Declared Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fragile || category === 'fragile'}
                    disabled={category === 'fragile'}
                    onChange={(e) => setFragile(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 bg-white border-slate-300 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-900">Fragile Special Handling</span>
                    <p className="text-xs text-slate-500">+₦1,500 priority protective bay loading</p>
                  </div>
                </label>

                <div>
                  <label htmlFor="declared-val" className="block text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">
                    Declared Value (₦) - Optional
                  </label>
                  <input
                    id="declared-val"
                    type="text"
                    placeholder="e.g. 50,000"
                    value={declaredValueNaira}
                    onChange={(e) => setDeclaredValueNaira(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">1.5% insurance for declared value above ₦50,000</p>
                </div>
              </div>
            </div>

            {/* Step 3: Sender & Receiver Contacts */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  3
                </span>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Sender &amp; Recipient Information</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Sender info */}
                <div className="space-y-3.5 bg-slate-50/70 p-5 rounded-xl border border-slate-200/80">
                  <div className="text-xs uppercase font-bold text-brand-700 tracking-wider">Sender Details</div>
                  <div>
                    <label htmlFor="sender-name" className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                    <input
                      id="sender-name"
                      type="text"
                      required
                      placeholder="e.g. Chidi Okonkwo"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="sender-phone" className="block text-xs font-semibold text-slate-600 mb-1">Phone Number (SMS receipt)</label>
                    <input
                      id="sender-phone"
                      type="tel"
                      required
                      placeholder="08031234567"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="sender-email" className="block text-xs font-semibold text-slate-600 mb-1">Email (Optional)</label>
                    <input
                      id="sender-email"
                      type="email"
                      placeholder="chidi@example.com"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className="w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                {/* Receiver info */}
                <div className="space-y-3.5 bg-slate-50/70 p-5 rounded-xl border border-slate-200/80">
                  <div className="text-xs uppercase font-bold text-emerald-800 tracking-wider">Recipient Details</div>
                  <div>
                    <label htmlFor="receiver-name" className="block text-xs font-semibold text-slate-600 mb-1">Recipient Name</label>
                    <input
                      id="receiver-name"
                      type="text"
                      required
                      placeholder="e.g. Amina Yusuf"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="receiver-phone" className="block text-xs font-semibold text-slate-600 mb-1">Recipient Phone (Receives Pickup OTP)</label>
                    <input
                      id="receiver-phone"
                      type="tel"
                      required
                      placeholder="08029876543"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                      className="w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="receiver-alt-phone" className="block text-xs font-semibold text-slate-600 mb-1">Alternative Phone (Optional)</label>
                    <input
                      id="receiver-alt-phone"
                      type="tel"
                      placeholder="08091112233"
                      value={receiverAltPhone}
                      onChange={(e) => setReceiverAltPhone(e.target.value)}
                      className="w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Payment Method & Declaration */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  4
                </span>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Payment Method &amp; Security</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className={`text-left p-4 rounded-xl border transition-all ${paymentMethod === 'online'
                    ? 'bg-brand-50/70 border-brand-500 text-brand-950 ring-1 ring-brand-500 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CreditCard className="w-4 h-4 text-brand-600" />
                    <span>Pay Online (Instant Confirmation)</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Cards, Bank Transfer, USSD via Paystack</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('pay_on_dropoff')}
                  className={`text-left p-4 rounded-xl border transition-all ${paymentMethod === 'pay_on_dropoff'
                    ? 'bg-brand-50/70 border-brand-500 text-brand-950 ring-1 ring-brand-500 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Building2 className="w-4 h-4 text-slate-700" />
                    <span>Pay at Terminal Counter</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Cash or POS when dropping package</p>
                </button>
              </div>

              {/* Security confirmation */}
              <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 text-slate-700">
                <input
                  type="checkbox"
                  required
                  checked={securityDeclaration}
                  onChange={(e) => setSecurityDeclaration(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-brand-600 bg-white border-slate-300 focus:ring-brand-500"
                />
                <div className="text-xs leading-relaxed text-slate-700">
                  I confirm that this parcel contains no hazardous chemicals, ammunition, currency notes, or contraband prohibited under Nigerian law. I understand packages are subject to terminal inspection.
                </div>
              </label>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] py-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-base shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Generating Waybill...</span>
              ) : (
                <>
                  <span>Confirm Booking · {formatNaira(pricing.totalFeeKobo)}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Sticky Summary & Guarantees */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* Live Pricing Breakdown Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

            <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4">
              Estimated Freight Summary
            </h3>

            {/* Route pill */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-4 flex items-center justify-between text-xs font-semibold text-slate-900">
              <span className="truncate max-w-[110px]">{originTerminal?.city || 'Origin'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
              <span className="truncate max-w-[110px]">{destinationTerminal?.city || 'Destination'}</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 border-b border-slate-200/80 pb-4 mb-4">
              <div className="flex justify-between">
                <span className="capitalize">{category} Base Freight:</span>
                <span className="font-semibold text-slate-900">{formatNaira(pricing.baseFeeKobo)}</span>
              </div>

              {pricing.weightSurchargeKobo > 0 && (
                <div className="flex justify-between">
                  <span>Additional Weight Surcharge:</span>
                  <span className="font-semibold text-amber-700">+{formatNaira(pricing.weightSurchargeKobo)}</span>
                </div>
              )}

              {pricing.fragileSurchargeKobo > 0 && (
                <div className="flex justify-between">
                  <span>Fragile Handling:</span>
                  <span className="font-semibold text-amber-700">+{formatNaira(pricing.fragileSurchargeKobo)}</span>
                </div>
              )}

              {pricing.insuranceFeeKobo > 0 && (
                <div className="flex justify-between">
                  <span>Transit Insurance (1.5%):</span>
                  <span className="font-semibold text-sky-700">+{formatNaira(pricing.insuranceFeeKobo)}</span>
                </div>
              )}
            </div>

            <div className="flex items-baseline justify-between mb-4">
              <span className="text-sm font-bold text-slate-700">Total Amount:</span>
              <span className="text-2xl font-extrabold text-slate-900">{formatNaira(pricing.totalFeeKobo)}</span>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              Official rates guaranteed upon drop-off. Final physical scale weigh-in occurs at terminal intake counter.
            </p>
          </div>

          {/* Quick Track Link */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] text-center">
            <Package className="w-6 h-6 text-brand-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900 mb-1">Already sent a package?</h4>
            <p className="text-xs text-slate-500 mb-3 text-pretty">
              Track your parcel in real-time using your ATM-EXP code or recipient phone number.
            </p>
            <button
              type="button"
              onClick={() => navigate('/track')}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Go to Tracking Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Booking Success Modal */}
      {successResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-left">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Waybill Booked Successfully</h3>
                <p className="text-xs text-slate-500">Present this pass at the terminal intake counter</p>
              </div>
            </div>

            {/* Waybill Slip Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 mb-5 space-y-4">
              {/* Tracking Code */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Tracking Code</div>
                  <div className="text-xl font-mono font-extrabold text-brand-600">{successResult.trackingCode}</div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyTrackingCode}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Pickup Verification OTP */}
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-950">Recipient Pickup OTP Code</div>
                  <div className="text-[11px] text-emerald-800">Required at terminal collection counter</div>
                </div>
                <div className="text-2xl font-mono font-extrabold text-emerald-800 tracking-widest bg-white px-3.5 py-1 rounded-md border border-emerald-300 shadow-sm">
                  {successResult.pickupOtp}
                </div>
              </div>

              {/* Route & Payment */}
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                <div>
                  <div className="text-slate-500 font-medium">Drop-off At:</div>
                  <div className="font-semibold text-slate-900 truncate">{successResult.originTerminalName}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Collect At:</div>
                  <div className="font-semibold text-slate-900 truncate">{successResult.destTerminalName}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Freight Total:</div>
                  <div className="font-semibold text-emerald-700">{formatNaira(successResult.totalFeeKobo)}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Payment Status:</div>
                  <div className="font-semibold text-slate-900 capitalize">
                    {successResult.paymentMethod === 'online' ? 'Paid Online' : 'Pay on Drop-off'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 min-h-[44px] py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Waybill Pass</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/track?q=${successResult.trackingCode}`)}
                className="flex-1 min-h-[44px] py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-brand-600/20"
              >
                <span>Track This Parcel</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
