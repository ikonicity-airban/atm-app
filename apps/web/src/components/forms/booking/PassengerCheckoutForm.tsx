'use client';

import * as React from 'react';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../common/Form';
import { useZodForm } from '../common/useZodForm';
import {
  passengerCheckoutFormSchema,
  type PassengerCheckoutFormValues,
} from './booking.schema';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/atm/AtmBlocks';
import { ArrowRight, ArrowLeft, Users, ShieldCheck, CheckCircle2, Wallet } from 'lucide-react';
import { formatNaira } from '@atm/shared';
import { cn } from '@/lib/utils';

export interface PassengerCheckoutFormProps {
  tripId: string;
  selectedSeats: number[];
  initialValues?: Partial<PassengerCheckoutFormValues>;
  savedCompanions?: Array<{ id: string; fullName: string; phone: string }>;
  customerCreditsKobo?: number;
  isSubmitting?: boolean;
  onSubmit: (values: PassengerCheckoutFormValues) => Promise<void> | void;
  onBack: () => void;
  className?: string;
}

export function PassengerCheckoutForm({
  tripId,
  selectedSeats,
  initialValues,
  savedCompanions = [],
  customerCreditsKobo = 0,
  isSubmitting = false,
  onSubmit,
  onBack,
  className,
}: PassengerCheckoutFormProps) {
  const defaultPassengers = React.useMemo(() => {
    return selectedSeats.map((seatNo) => {
      const existing = initialValues?.passengers?.find((p) => p.seatNo === seatNo);
      return {
        seatNo,
        fullName: existing?.fullName || '',
      };
    });
  }, [selectedSeats, initialValues]);

  const form = useZodForm(passengerCheckoutFormSchema, {
    defaultValues: {
      tripId,
      seats: selectedSeats,
      passengers: defaultPassengers,
      contact: {
        fullName: initialValues?.contact?.fullName || '',
        phone: initialValues?.contact?.phone || '',
        email: initialValues?.contact?.email || '',
        nextOfKinPhone: initialValues?.contact?.nextOfKinPhone || '',
      },
      smsConsent: initialValues?.smsConsent ?? true,
      applyStoreCredit: initialValues?.applyStoreCredit ?? (customerCreditsKobo > 0),
    },
  });

  // Keep seats and passengers synchronized when selectedSeats change
  React.useEffect(() => {
    form.setValue('seats', selectedSeats);
    const currentPassengers = form.getValues('passengers') || [];
    const updated = selectedSeats.map((seatNo) => {
      const match = currentPassengers.find((p) => p.seatNo === seatNo);
      return {
        seatNo,
        fullName: match?.fullName || '',
      };
    });
    form.setValue('passengers', updated);
  }, [selectedSeats, form]);

  const handleFillCompanion = (comp: { fullName: string; phone: string }) => {
    const passengers = form.getValues('passengers');
    const unfilledIndex = passengers.findIndex((p) => !p.fullName.trim());
    const targetIndex = unfilledIndex !== -1 ? unfilledIndex : 0;

    if (passengers[targetIndex]) {
      form.setValue(`passengers.${targetIndex}.fullName`, comp.fullName, {
        shouldValidate: true,
      });
    }

    const currentContactName = form.getValues('contact.fullName');
    const currentContactPhone = form.getValues('contact.phone');

    if (!currentContactName) {
      form.setValue('contact.fullName', comp.fullName, { shouldValidate: true });
    }
    if (!currentContactPhone) {
      form.setValue('contact.phone', comp.phone, { shouldValidate: true });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-6', className)}
      >
        {/* Passenger Names Block */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Passenger Names for Selected Seats
            </h2>
          </div>

          {/* Saved Companions Auto-fill Bar */}
          {savedCompanions.length > 0 && (
            <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
              <span className="text-xs font-bold text-foreground block">
                Saved Companions (1-Tap Auto-Fill):
              </span>
              <div className="flex flex-wrap gap-2">
                {savedCompanions.map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => handleFillCompanion(comp)}
                    className="px-2.5 py-1 text-xs font-semibold bg-background border border-border text-foreground rounded-lg hover:bg-muted transition-all shadow-2xs active:scale-95 cursor-pointer"
                  >
                    + {comp.fullName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Seat Inputs */}
          {selectedSeats.map((seatNo, index) => (
            <div
              key={seatNo}
              className="p-4 bg-card border border-border rounded-xl space-y-2 shadow-xs"
            >
              <FormField
                control={form.control}
                name={`passengers.${index}.fullName`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">
                      Seat {seatNo} Passenger Full Name{' '}
                      {index === 0 && (
                        <span className="text-primary font-bold">(Lead Traveller)</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="e.g. Chukwuemeka Obi"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>

        {/* Lead Contact Details Block */}
        <div className="p-5 bg-card border border-border rounded-xl space-y-4 shadow-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Lead Passenger Contact Details
          </h2>

          {/* Full Name */}
          <FormField
            control={form.control}
            name="contact.fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel isRequired>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Chukwuemeka Obi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Lead Phone */}
          <FormField
            control={form.control}
            name="contact.phone"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    label="Phone Number (SMS / WhatsApp Delivery)"
                    placeholder="09070000625"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="contact.email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Email Address <span className="text-muted-foreground font-normal">(Optional for receipt)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="traveller@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Next of Kin Phone */}
          <FormField
            control={form.control}
            name="contact.nextOfKinPhone"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PhoneInput
                    value={field.value || ''}
                    onChange={field.onChange}
                    label="Next of Kin Phone (Optional for manifest)"
                    placeholder="08023456789"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* SMS & WhatsApp Consent Checkbox */}
          <FormField
            control={form.control}
            name="smsConsent"
            render={({ field }) => (
              <FormItem className="pt-2 border-t border-border">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
                  />
                  <span className="text-xs text-foreground leading-relaxed">
                    I agree to receive booking confirmation, digital boarding pass, and departure notifications via SMS and WhatsApp.{' '}
                    <span className="text-destructive font-bold">*</span>
                  </span>
                </label>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Store Credit Option (if applicable) */}
          {customerCreditsKobo > 0 && (
            <FormField
              control={form.control}
              name="applyStoreCredit"
              render={({ field }) => (
                <div className="p-3 bg-muted/60 border border-border rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Apply Wallet Credits</p>
                      <p className="text-[11px] text-muted-foreground">
                        Available balance: {formatNaira(customerCreditsKobo)}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
                  />
                </div>
              )}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="w-full sm:w-auto min-h-[44px] text-xs font-bold order-2 sm:order-1 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Seat Selection</span>
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:flex-1 min-h-[46px] text-xs uppercase tracking-wider font-bold shadow-md order-1 sm:order-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Reserving Seats (10 min hold)...</span>
            ) : (
              <>
                <span>Secure 10-Minute Hold &amp; Review</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
