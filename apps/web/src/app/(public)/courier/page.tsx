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
import { Input } from '@/components/ui/Input';
import { NativeSelect } from '@/components/ui/Select';
import { Icon } from '@/components/ui/Icon';
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
  MapPin,
  Calendar,
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
      weightKg,
      declaredValueKobo,
      fragile: fragile || category === 'fragile',
    });
  }, [category, weightKg, declaredValueKobo, fragile]);

  // Terminal objects for display
  const originTerminal = useMemo(
    () => SEED_TERMINALS.find((t) => t.id === originTerminalId),
    [originTerminalId]
  );
  const destinationTerminal = useMemo(
    () => SEED_TERMINALS.find((t) => t.id === destinationTerminalId),
    [destinationTerminalId]
  );

  const handleCopyTrackingCode = () => {
    if (successResult) {
      navigator.clipboard.writeText(successResult.trackingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (originTerminalId === destinationTerminalId) {
      setErrorMsg('Origin and destination terminals must be in different locations');
      return;
    }

    if (!securityDeclaration) {
      setErrorMsg('You must certify that the parcel contains no prohibited items');
      return;
    }

    const payload: BookParcelInput = {
      originTerminalId,
      destinationTerminalId,
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim(),
      senderEmail: senderEmail.trim() || undefined,
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      receiverAltPhone: receiverAltPhone.trim() || undefined,
      receiverAddress: receiverAddress.trim() || undefined,
      category,
      description: description.trim(),
      weightKg,
      declaredValueKobo,
      fragile: fragile || category === 'fragile',
      paymentMethod,
      securityDeclarationAccepted: true,
    };

    // Client Zod validation
    const parsed = bookParcelSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setErrorMsg(issue ? issue.message : 'Please check the entered parcel details');
      return;
    }

    setIsSubmitting(true);

    try {
      // In browser mock / live repo fallback
      const { parcel } = await parcelRepo.createParcel(payload);

      setSuccessResult({
        trackingCode: parcel.trackingCode,
        pickupOtp: parcel.pickupOtp || '',
        totalFeeKobo: parcel.totalFeeKobo ?? pricing.totalFeeKobo,
        originTerminalName: originTerminal ? `${originTerminal.city} (${originTerminal.name})` : 'Origin Hub',
        destTerminalName: destinationTerminal ? `${destinationTerminal.city} (${destinationTerminal.name})` : 'Destination Hub',
        createdAt: typeof parcel.createdAt === 'string' ? parcel.createdAt : (parcel.createdAt ? new Date(parcel.createdAt).toISOString() : new Date().toISOString()),
        paymentMethod: parcel.paymentMethod || paymentMethod,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register consignment. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Ascent Express Courier &amp; Waybill Dispatch"
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
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs font-semibold text-foreground">
            <Icon icon={Truck} size="xs" className="text-primary" />
            <span>Same-Day Highway Transit</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs font-semibold text-foreground">
            <Icon icon={ShieldCheck} size="xs" className="text-emerald-600 dark:text-emerald-400" />
            <span>4-Digit SMS Collection OTP</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs font-semibold text-foreground">
            <Icon icon={CreditCard} size="xs" className="text-sky-600 dark:text-sky-400" />
            <span>Online or Counter Payment</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Booking Form */}
        <div className="lg:col-span-8 relative overflow-hidden rounded-2xl border border-border bg-card/75 backdrop-blur-xl text-card-foreground p-6 sm:p-8 shadow-sm">
          {/* Top specular highlight */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 flex items-start gap-3">
              <Icon icon={AlertTriangle} size="sm" className="flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="text-sm font-medium text-pretty">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Terminal Route */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm">
                  1
                </span>
                <h2 className="text-lg font-bold text-foreground tracking-tight">Route &amp; Terminal Corridors</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="origin-terminal" className="block text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">
                    Origin Terminal (Drop-off)
                  </label>
                  <NativeSelect
                    id="origin-terminal"
                    value={originTerminalId}
                    onChange={(e) => setOriginTerminalId(e.target.value)}
                    startIcon={MapPin}
                  >
                    {SEED_TERMINALS.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.city}: {term.name}
                      </option>
                    ))}
                  </NativeSelect>
                  {originTerminal && (
                    <p className="mt-1.5 text-xs text-muted-foreground truncate">
                      {originTerminal.address}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="dest-terminal" className="block text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">
                    Destination Terminal (Pickup)
                  </label>
                  <NativeSelect
                    id="dest-terminal"
                    value={destinationTerminalId}
                    onChange={(e) => setDestinationTerminalId(e.target.value)}
                    startIcon={MapPin}
                  >
                    {SEED_TERMINALS.filter((t) => t.id !== originTerminalId).map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.city}: {term.name}
                      </option>
                    ))}
                  </NativeSelect>
                  {destinationTerminal && (
                    <p className="mt-1.5 text-xs text-muted-foreground truncate">
                      {destinationTerminal.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Parcel Categorization & Weight */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm">
                  2
                </span>
                <h2 className="text-lg font-bold text-foreground tracking-tight">Consignment &amp; Dimensions</h2>
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                {CATEGORIES.map((cat) => {
                  const CategoryIcon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`text-left p-3.5 rounded-xl border transition-all ${isSelected
                        ? 'bg-primary/10 border-primary text-foreground ring-1 ring-primary shadow-xs'
                        : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                    >
                      <Icon icon={CategoryIcon} size="md" className={`mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="text-xs font-bold">{cat.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{cat.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Weight & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label htmlFor="package-weight" className="block text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">
                    Weight in Kilograms (kg)
                  </label>
                  <Input
                    id="package-weight"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50"
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 1)}
                  />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">First 5kg covered in base rate</p>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="package-desc" className="block text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">
                    Contents Description
                  </label>
                  <Input
                    id="package-desc"
                    type="text"
                    required
                    placeholder="e.g. 1 Laptop, 2 Power adapters, charger cord"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Fragile & Declared Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-muted/30 p-4 rounded-xl border border-border">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fragile || category === 'fragile'}
                    disabled={category === 'fragile'}
                    onChange={(e) => setFragile(e.target.checked)}
                    className="w-4 h-4 rounded text-primary bg-card border-border focus:ring-primary/20"
                  />
                  <div>
                    <span className="text-sm font-semibold text-foreground">Fragile Special Handling</span>
                    <p className="text-xs text-muted-foreground">+₦1,500 priority protective bay loading</p>
                  </div>
                </label>

                <div>
                  <label htmlFor="declared-val" className="block text-xs uppercase font-bold text-muted-foreground tracking-wider mb-1">
                    Declared Value (₦) - Optional
                  </label>
                  <Input
                    id="declared-val"
                    type="text"
                    placeholder="e.g. 50,000"
                    value={declaredValueNaira}
                    onChange={(e) => setDeclaredValueNaira(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">1.5% insurance for declared value above ₦50,000</p>
                </div>
              </div>
            </div>

            {/* Step 3: Sender & Receiver Contacts */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm">
                  3
                </span>
                <h2 className="text-lg font-bold text-foreground tracking-tight">Sender &amp; Recipient Information</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Sender info */}
                <div className="space-y-3.5 bg-muted/30 p-5 rounded-xl border border-border">
                  <div className="text-xs uppercase font-bold text-primary tracking-wider">Sender Details</div>
                  <div>
                    <label htmlFor="sender-name" className="block text-xs font-semibold text-muted-foreground mb-1">Full Name</label>
                    <Input
                      id="sender-name"
                      type="text"
                      required
                      placeholder="e.g. Chidi Okonkwo"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="sender-phone" className="block text-xs font-semibold text-muted-foreground mb-1">Phone Number (SMS receipt)</label>
                    <Input
                      id="sender-phone"
                      type="tel"
                      required
                      placeholder="08031234567"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="sender-email" className="block text-xs font-semibold text-muted-foreground mb-1">Email (Optional)</label>
                    <Input
                      id="sender-email"
                      type="email"
                      placeholder="chidi@example.com"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Receiver info */}
                <div className="space-y-3.5 bg-muted/30 p-5 rounded-xl border border-border">
                  <div className="text-xs uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">Recipient Details</div>
                  <div>
                    <label htmlFor="receiver-name" className="block text-xs font-semibold text-muted-foreground mb-1">Recipient Name</label>
                    <Input
                      id="receiver-name"
                      type="text"
                      required
                      placeholder="e.g. Amina Yusuf"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="receiver-phone" className="block text-xs font-semibold text-muted-foreground mb-1">Recipient Phone (Receives Pickup OTP)</label>
                    <Input
                      id="receiver-phone"
                      type="tel"
                      required
                      placeholder="08029876543"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="receiver-alt-phone" className="block text-xs font-semibold text-muted-foreground mb-1">Alternative Phone (Optional)</label>
                    <Input
                      id="receiver-alt-phone"
                      type="tel"
                      placeholder="08091112233"
                      value={receiverAltPhone}
                      onChange={(e) => setReceiverAltPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Payment Method & Declaration */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm">
                  4
                </span>
                <h2 className="text-lg font-bold text-foreground tracking-tight">Payment Method &amp; Security</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className={`text-left p-4 rounded-xl border transition-all ${paymentMethod === 'online'
                    ? 'bg-primary/10 border-primary text-foreground ring-1 ring-primary shadow-xs'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Icon icon={CreditCard} size="xs" className="text-primary" />
                    <span>Pay Online (Instant Confirmation)</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Cards, Bank Transfer, USSD via Paystack</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('pay_on_dropoff')}
                  className={`text-left p-4 rounded-xl border transition-all ${paymentMethod === 'pay_on_dropoff'
                    ? 'bg-primary/10 border-primary text-foreground ring-1 ring-primary shadow-xs'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Icon icon={Building2} size="xs" />
                    <span>Pay at Terminal Counter</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Cash or POS when dropping package</p>
                </button>
              </div>

              {/* Security confirmation */}
              <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl bg-muted/30 border border-border text-foreground">
                <input
                  type="checkbox"
                  required
                  checked={securityDeclaration}
                  onChange={(e) => setSecurityDeclaration(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-primary bg-card border-border focus:ring-primary/20"
                />
                <div className="text-xs leading-relaxed text-muted-foreground">
                  I confirm that this parcel contains no hazardous chemicals, ammunition, currency notes, or contraband prohibited under Nigerian law. I understand packages are subject to terminal inspection.
                </div>
              </label>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] py-4 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Generating Waybill...</span>
              ) : (
                <>
                  <span>Confirm Booking · {formatNaira(pricing.totalFeeKobo)}</span>
                  <Icon icon={ArrowRight} size="sm" className="text-primary-foreground" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Sticky Summary & Guarantees */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* Live Pricing Breakdown Card */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card/75 backdrop-blur-xl text-card-foreground p-6 shadow-sm">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <h3 className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-4">
              Estimated Freight Summary
            </h3>

            {/* Route pill */}
            <div className="p-3 rounded-xl bg-muted/50 border border-border mb-4 flex items-center justify-between text-xs font-semibold text-foreground">
              <span className="truncate max-w-[110px]">{originTerminal?.city || 'Origin'}</span>
              <Icon icon={ArrowRight} size="xs" className="text-primary flex-shrink-0" />
              <span className="truncate max-w-[110px]">{destinationTerminal?.city || 'Destination'}</span>
            </div>

            <div className="space-y-2.5 text-xs text-muted-foreground border-b border-border pb-4 mb-4">
              <div className="flex justify-between">
                <span className="capitalize">{category} Base Freight:</span>
                <span className="font-semibold text-foreground">{formatNaira(pricing.baseFeeKobo)}</span>
              </div>

              {pricing.weightSurchargeKobo > 0 && (
                <div className="flex justify-between">
                  <span>Additional Weight Surcharge:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">+{formatNaira(pricing.weightSurchargeKobo)}</span>
                </div>
              )}

              {pricing.fragileSurchargeKobo > 0 && (
                <div className="flex justify-between">
                  <span>Fragile Handling:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">+{formatNaira(pricing.fragileSurchargeKobo)}</span>
                </div>
              )}

              {pricing.insuranceFeeKobo > 0 && (
                <div className="flex justify-between">
                  <span>Transit Insurance (1.5%):</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400">+{formatNaira(pricing.insuranceFeeKobo)}</span>
                </div>
              )}
            </div>

            <div className="flex items-baseline justify-between mb-4">
              <span className="text-sm font-bold text-foreground">Total Amount:</span>
              <span className="text-2xl font-extrabold text-foreground">{formatNaira(pricing.totalFeeKobo)}</span>
            </div>

            <p className="text-[11px] text-muted-foreground leading-normal">
              Official rates guaranteed upon drop-off. Final physical scale weigh-in occurs at terminal intake counter.
            </p>
          </div>

          {/* Quick Track Link */}
          <div className="rounded-2xl border border-border bg-card/75 backdrop-blur-xl text-card-foreground p-5 shadow-sm text-center">
            <Icon icon={Package} size="lg" className="text-primary mx-auto mb-2" />
            <h4 className="text-sm font-bold text-foreground mb-1">Already sent a package?</h4>
            <p className="text-xs text-muted-foreground mb-3 text-pretty">
              Track your parcel in real-time using your ATM-EXP code or recipient phone number.
            </p>
            <button
              type="button"
              onClick={() => navigate('/track')}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Go to Tracking Portal</span>
              <Icon icon={ExternalLink} size="xs" />
            </button>
          </div>
        </div>
      </div>

      {/* Booking Success Modal */}
      {successResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative overflow-hidden bg-card text-card-foreground border border-border rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-left">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Icon icon={CheckCircle2} size="md" className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Waybill Booked Successfully</h3>
                <p className="text-xs text-muted-foreground">Present this pass at the terminal intake counter</p>
              </div>
            </div>

            {/* Waybill Slip Box */}
            <div className="bg-muted/30 border border-border rounded-xl p-5 mb-5 space-y-4">
              {/* Tracking Code */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Tracking Code</div>
                  <div className="text-xl font-mono font-extrabold text-primary">{successResult.trackingCode}</div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyTrackingCode}
                  className="px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1 transition-colors shadow-xs"
                >
                  <Icon icon={Copy} size="xs" />
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Pickup Verification OTP */}
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Recipient Pickup OTP Code</div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Required at terminal collection counter</div>
                </div>
                <div className="text-2xl font-mono font-extrabold text-emerald-700 dark:text-emerald-300 tracking-widest bg-card px-3.5 py-1 rounded-md border border-border shadow-xs">
                  {successResult.pickupOtp}
                </div>
              </div>

              {/* Route & Payment */}
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div>
                  <div className="text-muted-foreground font-medium">Drop-off At:</div>
                  <div className="font-semibold text-foreground truncate">{successResult.originTerminalName}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-medium">Collect At:</div>
                  <div className="font-semibold text-foreground truncate">{successResult.destTerminalName}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-medium">Freight Total:</div>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">{formatNaira(successResult.totalFeeKobo)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-medium">Payment Status:</div>
                  <div className="font-semibold text-foreground capitalize">
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
                className="flex-1 min-h-[44px] py-3 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Icon icon={Printer} size="xs" />
                <span>Print Waybill Pass</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/track?q=${successResult.trackingCode}`)}
                className="flex-1 min-h-[44px] py-3 px-4 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <span>Track This Parcel</span>
                <Icon icon={ArrowRight} size="xs" className="text-primary-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
