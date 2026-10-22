'use client';

import * as React from 'react';
import {
  SEED_TERMINALS,
  calculateParcelDeliveryFee,
  formatNaira,
  bookParcelSchema,
  type BookParcelInput,
  type ParcelCategory,
} from '@atm/shared';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../common/Form';
import { useZodForm } from '../common/useZodForm';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from '@/components/ui/Select';
import { PhoneInput } from '@/components/atm/AtmBlocks';
import { Alert } from '@/components/ui/Alert';
import { StaticParcelRepository } from '@/server/repositories/parcels';
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
  Copy,
  Printer,
  CreditCard,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const parcelRepo = new StaticParcelRepository();

const CATEGORIES: Array<{
  id: ParcelCategory;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'documents', name: 'Documents', desc: 'Legal deeds, certificates (< 1kg)', icon: FileText },
  { id: 'electronics', name: 'Electronics', desc: 'Laptops, phones, cameras', icon: Laptop },
  { id: 'clothing', name: 'Clothing & Fabrics', desc: 'Apparel, shoes, textiles', icon: Shirt },
  { id: 'general', name: 'General Cargo', desc: 'Spare parts, household items', icon: Package },
  { id: 'perishables', name: 'Perishables', desc: 'Packaged dry foods, spices', icon: Apple },
  { id: 'fragile', name: 'Fragile / Glass', desc: 'Glassware, ceramics, delicate items', icon: ShieldAlert },
];

export interface CourierBookingFormProps {
  className?: string;
  onSuccess?: (result: {
    trackingCode: string;
    pickupOtp: string;
    totalFeeKobo: number;
    originTerminalName: string;
    destTerminalName: string;
  }) => void;
}

export function CourierBookingForm({ className, onSuccess }: CourierBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [successData, setSuccessData] = React.useState<{
    trackingCode: string;
    pickupOtp: string;
    totalFeeKobo: number;
    originTerminalName: string;
    destTerminalName: string;
    createdAt: string;
    paymentMethod: string;
  } | null>(null);

  const form = useZodForm<BookParcelInput>(bookParcelSchema, {
    defaultValues: {
      originTerminalId: SEED_TERMINALS[0]?.id || 'term-enugu-ogui',
      destinationTerminalId: SEED_TERMINALS[1]?.id || 'term-abuja-utako',
      category: 'general',
      description: '',
      weightKg: 2,
      fragile: false,
      declaredValueKobo: 0,
      senderName: '',
      senderPhone: '',
      senderEmail: '',
      receiverName: '',
      receiverPhone: '',
      receiverAltPhone: '',
      receiverAddress: '',
      paymentMethod: 'online',
      securityDeclarationAccepted: true,
    },
  });

  const originTerminalId = form.watch('originTerminalId');
  const destinationTerminalId = form.watch('destinationTerminalId');
  const category = form.watch('category');
  const weightKg = form.watch('weightKg') || 1;
  const fragile = form.watch('fragile');
  const declaredValueKobo = form.watch('declaredValueKobo') || 0;

  // Live calculation of parcel fee in integer kobo
  const liveFee = React.useMemo(() => {
    return calculateParcelDeliveryFee({
      category: (category as ParcelCategory) || 'general',
      weightKg: Number(weightKg),
      fragile: Boolean(fragile || category === 'fragile'),
      declaredValueKobo: Number(declaredValueKobo),
    });
  }, [category, weightKg, fragile, declaredValueKobo]);

  const originTerminal = SEED_TERMINALS.find((t) => t.id === originTerminalId);
  const destTerminal = SEED_TERMINALS.find((t) => t.id === destinationTerminalId);

  const onSubmit = async (values: BookParcelInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const { parcel } = await parcelRepo.createParcel(values);
      const res = {
        trackingCode: parcel.trackingCode,
        pickupOtp: parcel.pickupOtp || '',
        totalFeeKobo: parcel.totalFeeKobo ?? liveFee.totalFeeKobo,
        originTerminalName: originTerminal?.name || 'Origin Terminal',
        destTerminalName: destTerminal?.name || 'Destination Terminal',
        createdAt: parcel.createdAt,
        paymentMethod: values.paymentMethod,
      };

      setSuccessData(res);
      if (onSuccess) onSuccess(res);
    } catch (err: any) {
      setServerError(err.message || 'Failed to register waybill parcel. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (successData) {
      navigator.clipboard.writeText(successData.trackingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (successData) {
    return (
      <div className={cn('p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-md space-y-6 animate-fluid-fade', className)}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Waybill Registered Successfully</h2>
            <p className="text-xs text-muted-foreground">
              Please present this tracking slip at your origin departure terminal.
            </p>
          </div>
        </div>

        {/* Tracking Details Card */}
        <div className="p-4 sm:p-6 bg-muted/40 border border-border rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Official Tracking Reference
              </span>
              <span className="text-xl sm:text-2xl font-mono font-black text-foreground">
                {successData.trackingCode}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Drop-off Terminal</span>
              <strong className="text-foreground">{successData.originTerminalName}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Collection Terminal</span>
              <strong className="text-foreground">{successData.destTerminalName}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Total Fee</span>
              <strong className="text-primary font-mono">{formatNaira(successData.totalFeeKobo)}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Pickup OTP</span>
              <strong className="font-mono text-foreground font-bold">{successData.pickupOtp}</strong>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="flex-1 min-h-[44px] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Waybill Slip</span>
          </Button>

          <Button
            type="button"
            onClick={() => setSuccessData(null)}
            className="flex-1 min-h-[44px] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Book Another Parcel</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn('space-y-6', className)}>
        {serverError && (
          <Alert variant="danger">
            {serverError}
          </Alert>
        )}

        {/* 1. Terminal Routing */}
        <div className="p-5 bg-card border border-border rounded-2xl space-y-4 shadow-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            1. Origin and Destination Terminals
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="originTerminalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Drop-off Terminal</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full text-xs font-semibold h-11 bg-background">
                        <SelectValue placeholder="Select Origin Terminal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectPopup>
                      {SEED_TERMINALS.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.city})
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destinationTerminalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Destination Terminal</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full text-xs font-semibold h-11 bg-background">
                        <SelectValue placeholder="Select Destination Terminal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectPopup>
                      {SEED_TERMINALS.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.city})
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* 2. Parcel Details */}
        <div className="p-5 bg-card border border-border rounded-2xl space-y-4 shadow-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            2. Package Specification &amp; Category
          </h2>

          {/* Category selection */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel isRequired>Category</FormLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const isSelected = field.value === cat.id;
                    const IconComp = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => field.onChange(cat.id)}
                        className={cn(
                          'p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 active:scale-98',
                          isSelected
                            ? 'bg-primary/10 border-primary text-foreground ring-1 ring-primary'
                            : 'bg-background hover:bg-muted text-muted-foreground border-border'
                        )}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                          <IconComp className={cn('w-4 h-4', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                          <span>{cat.name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                          {cat.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel isRequired>Package Contents Description</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 2 cartons of vehicle replacement lamps" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Weight */}
            <FormField
              control={form.control}
              name="weightKg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Weight in Kilograms (Max 50kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="50"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Declared Value */}
            <FormField
              control={form.control}
              name="declaredValueKobo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Declared Value (Naira for insurance)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="e.g. 50000"
                      value={field.value ? field.value / 100 : 0}
                      onChange={(e) => field.onChange((parseInt(e.target.value, 10) || 0) * 100)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Fragile checkbox */}
          <FormField
            control={form.control}
            name="fragile"
            render={({ field }) => (
              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
                />
                <span className="text-xs font-semibold text-foreground">
                  Fragile Item (Requires premium foam padding and top-tier boot positioning)
                </span>
              </label>
            )}
          />
        </div>

        {/* 3. Sender Details */}
        <div className="p-5 bg-card border border-border rounded-2xl space-y-4 shadow-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            3. Sender Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="senderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Sender Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Nnamdi Azikiwe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="senderPhone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PhoneInput
                      value={field.value}
                      onChange={field.onChange}
                      label="Sender Phone Number"
                      placeholder="08031234567"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* 4. Receiver Details */}
        <div className="p-5 bg-card border border-border rounded-2xl space-y-4 shadow-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            4. Recipient Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="receiverName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Receiver Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Amina Bello" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receiverPhone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PhoneInput
                      value={field.value}
                      onChange={field.onChange}
                      label="Receiver Phone Number (Pickup SMS Alert)"
                      placeholder="08091234567"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* 5. Live Pricing Breakdown & Submission */}
        <div className="p-5 bg-card border border-border rounded-2xl space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground block">
                Estimated Delivery Fee
              </span>
              <strong className="text-2xl font-black font-mono text-primary">
                {formatNaira(liveFee.totalFeeKobo)}
              </strong>
            </div>
            <div className="text-right text-[11px] text-muted-foreground">
              <span>Base: {formatNaira(liveFee.baseFeeKobo)}</span>
              {liveFee.weightSurchargeKobo > 0 && <span className="block">Weight: +{formatNaira(liveFee.weightSurchargeKobo)}</span>}
              {liveFee.insuranceFeeKobo > 0 && <span className="block">Insurance: +{formatNaira(liveFee.insuranceFeeKobo)}</span>}
            </div>
          </div>

          <FormField
            control={form.control}
            name="securityDeclarationAccepted"
            render={({ field }) => (
              <FormItem>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
                  />
                  <span className="text-xs text-foreground leading-relaxed">
                    I solemnly certify that this consignment contains no firearms, narcotics, lithium battery banks, or unlawful contraband under Nigerian federal law.{' '}
                    <span className="text-destructive font-bold">*</span>
                  </span>
                </label>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Registering Consignment...</span>
            ) : (
              <>
                <span>Register Consignment &amp; Generate Tracking Code</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
