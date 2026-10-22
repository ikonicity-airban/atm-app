'use client';

import * as React from 'react';
import {
  calculateCharterQuote,
  formatNaira,
  createCharterRequestSchema,
  type CreateCharterRequestInput,
  type CharterQuoteInput,
  type ServiceType,
  type TripType,
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
import { Textarea } from '@/components/ui/Textarea';
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
import {
  Car,
  Calendar,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MAJOR_CITIES = ['Enugu', 'Abuja', 'Lagos', 'Owerri', 'Port Harcourt', 'Onitsha', 'Awka', 'Asaba'];

export interface CharterRequestFormProps {
  className?: string;
  onSuccess?: (reference: string) => void;
}

export function CharterRequestForm({ className, onSuccess }: CharterRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = React.useState<string | null>(null);

  const form = useZodForm<CreateCharterRequestInput>(createCharterRequestSchema, {
    defaultValues: {
      serviceType: 'private_charter',
      tripType: 'one_way',
      originCity: 'Enugu',
      originAddress: '',
      destinationCity: 'Abuja',
      destinationAddress: '',
      departureDate: new Date().toISOString().split('T')[0] || '2026-10-25',
      returnDate: null,
      durationDays: 1,
      passengerCount: 4,
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      organizationName: null,
      organizationTaxId: null,
      specialRequirements: null,
      billingMethod: 'paystack_gateway',
      estimatedFareKobo: 15000000,
    },
  });

  const serviceType = form.watch('serviceType');
  const tripType = form.watch('tripType');
  const originCity = form.watch('originCity');
  const destinationCity = form.watch('destinationCity');
  const durationDays = form.watch('durationDays') || 1;
  const passengerCount = form.watch('passengerCount') || 1;

  // Live estimate computation
  const liveQuote = React.useMemo(() => {
    const quoteParams: CharterQuoteInput = {
      serviceType: (serviceType as ServiceType) || 'private_charter',
      tripType: (tripType as TripType) || 'one_way',
      originCity: originCity || 'Enugu',
      destinationCity: destinationCity || 'Abuja',
      durationDays: tripType === 'multi_day' ? Number(durationDays) : tripType === 'round_trip' ? 2 : 1,
      passengerCount: Number(passengerCount),
      isDoorToDoor: true,
      hasArmedEscort: false,
    };
    return calculateCharterQuote(quoteParams);
  }, [serviceType, tripType, originCity, destinationCity, durationDays, passengerCount]);

  React.useEffect(() => {
    form.setValue('estimatedFareKobo', liveQuote.breakdown.totalEstimatedKobo);
  }, [liveQuote.breakdown.totalEstimatedKobo, form]);

  const onSubmit = async (values: CreateCharterRequestInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const generatedRef = `CHR-${Date.now().toString().slice(-6)}`;
      setSubmittedRef(generatedRef);
      if (onSuccess) onSuccess(generatedRef);
    } catch (err: any) {
      setServerError(err.message || 'Failed to submit charter quote request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedRef) {
    return (
      <div className={cn('p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-md text-center space-y-4 animate-fluid-fade', className)}>
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Charter Request Submitted</h2>
        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
          Your request has been received. Our executive charter dispatch supervisor will review your route, confirm Sienna fleet availability, and issue your official dispatch invoice within 1 hour.
        </p>
        <div className="p-3 bg-muted/60 rounded-xl inline-block text-xs font-mono font-bold text-foreground">
          Reference: {submittedRef}
        </div>
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setSubmittedRef(null)}
            className="font-bold cursor-pointer"
          >
            Submit Another Request
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

        {/* 1. Service & Route */}
        <div className="p-5 bg-card border border-border rounded-2xl space-y-4 shadow-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            1. Service Tier &amp; Corridor Route
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Service Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full text-xs font-semibold h-11 bg-background">
                        <SelectValue placeholder="Service Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectPopup>
                      <SelectItem value="private_charter">Private VIP Sienna Charter</SelectItem>
                      <SelectItem value="corporate_transit">Corporate Team Transit</SelectItem>
                      <SelectItem value="custom_cargo">Dedicated Secure Cargo</SelectItem>
                    </SelectPopup>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tripType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Journey Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full text-xs font-semibold h-11 bg-background">
                        <SelectValue placeholder="Trip Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectPopup>
                      <SelectItem value="one_way">One-Way Direct</SelectItem>
                      <SelectItem value="round_trip">Round Trip Return</SelectItem>
                      <SelectItem value="multi_day">Multi-Day Fleet Standby</SelectItem>
                    </SelectPopup>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="originCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Origin City</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full text-xs font-semibold h-11 bg-background">
                        <SelectValue placeholder="Origin City" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectPopup>
                      {MAJOR_CITIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="originAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Pickup Address</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Plot 14 Independence Layout, Enugu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="destinationCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Destination City</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full text-xs font-semibold h-11 bg-background">
                        <SelectValue placeholder="Destination City" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectPopup>
                      {MAJOR_CITIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destinationAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Drop-off Destination Address</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Transcorp Hilton, Maitama, Abuja" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* 2. Schedule & Party */}
        <div className="p-5 bg-card border border-border rounded-2xl space-y-4 shadow-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            2. Dates &amp; Passenger Capacity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="departureDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Departure Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tripType !== 'one_way' && (
              <FormField
                control={form.control}
                name="returnDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Return Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="passengerCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Passengers (Max 5)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* 3. Contact & Billing */}
        <div className="p-5 bg-card border border-border rounded-2xl space-y-4 shadow-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            3. Lead Client &amp; Billing Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Dr. Ngozi Okonjo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PhoneInput
                      value={field.value}
                      onChange={field.onChange}
                      label="Contact Phone"
                      placeholder="08021234567"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="client@organization.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="specialRequirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Instructions or Route Stops (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder="e.g. Flight arrival pickup at Abuja Airport, extra luggage boot space..."
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 4. Live Quote Estimate Banner & Submission */}
        <div className="p-5 bg-card border border-border rounded-2xl space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground block">
                Estimated Charter Fare
              </span>
              <strong className="text-2xl font-black font-mono text-primary">
                {formatNaira(liveQuote.breakdown.totalEstimatedKobo)}
              </strong>
            </div>
            <div className="text-right text-[11px] text-muted-foreground">
              <span>Dedicated Sienna 5-Seat Vehicle</span>
              <span className="block">Fuel, Tolls &amp; Chauffeur Included</span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Submitting Request...</span>
            ) : (
              <>
                <span>Submit Private Charter Request</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
