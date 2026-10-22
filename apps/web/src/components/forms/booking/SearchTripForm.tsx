'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  SERVED_CITIES,
  getServedDestinations,
  getLagosDate,
  isServedPair,
  type ServedCity,
} from '@atm/shared';
import {
  MapPin,
  Calendar as CalendarIcon,
  Users,
  ArrowLeftRight,
  Search,
  Sun,
  Sunset,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
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
  tripSearchFormSchema,
  type TripSearchFormValues,
} from './booking.schema';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from '@/components/ui/Select';
import { Calendar as CossCalendar } from '@/components/ui/Calendar';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface SearchTripFormProps {
  initialValues?: Partial<TripSearchFormValues>;
  variant?: 'sidebar' | 'bar';
  className?: string;
  onSearchSubmit?: (values: TripSearchFormValues) => void;
  onReset?: () => void;
  showFilters?: boolean;
}

function parseDateParam(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date();
}

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function SearchTripForm({
  initialValues,
  variant = 'sidebar',
  className,
  onSearchSubmit,
  onReset,
  showFilters = true,
}: SearchTripFormProps) {
  const router = useRouter();
  const todayLagos = getLagosDate();

  const form = useZodForm(tripSearchFormSchema, {
    defaultValues: {
      from: (initialValues?.from as ServedCity) || 'Enugu',
      to: (initialValues?.to as ServedCity) || 'Abuja',
      date: initialValues?.date || todayLagos,
      passengers: initialValues?.passengers || 1,
      timeWindow: initialValues?.timeWindow || 'all',
      sortBy: initialValues?.sortBy || 'earliest',
      terminal: initialValues?.terminal || 'all',
    },
  });

  const fromCity = form.watch('from');
  const toCity = form.watch('to');
  const selectedDate = form.watch('date');
  const selectedPassengers = form.watch('passengers');
  const selectedTimeWindow = form.watch('timeWindow');
  const selectedSortBy = form.watch('sortBy');
  const selectedTerminal = form.watch('terminal');

  // Filter valid destinations when origin changes
  const servedDestinations = React.useMemo(() => {
    return getServedDestinations(fromCity);
  }, [fromCity]);

  // Ensure destination is valid for chosen origin
  React.useEffect(() => {
    if (servedDestinations.length > 0 && !servedDestinations.includes(toCity as ServedCity)) {
      form.setValue('to', servedDestinations[0] as ServedCity);
    }
  }, [servedDestinations, toCity, form]);

  const handleSwapCities = () => {
    if (isServedPair(toCity, fromCity)) {
      form.setValue('from', toCity);
      form.setValue('to', fromCity);
    }
  };

  const handleFormSubmit = (data: TripSearchFormValues) => {
    if (onSearchSubmit) {
      onSearchSubmit(data);
    } else {
      const searchParams = new URLSearchParams({
        from: data.from,
        to: data.to,
        date: data.date,
        passengers: String(data.passengers),
      });
      if (data.timeWindow && data.timeWindow !== 'all') {
        searchParams.set('time', data.timeWindow);
      }
      if (data.sortBy && data.sortBy !== 'earliest') {
        searchParams.set('sort', data.sortBy);
      }
      if (data.terminal && data.terminal !== 'all') {
        searchParams.set('terminal', data.terminal);
      }
      router.push(`/trips?${searchParams.toString()}`);
    }
  };

  const handleResetForm = () => {
    form.reset({
      from: 'Enugu',
      to: 'Abuja',
      date: todayLagos,
      passengers: 1,
      timeWindow: 'all',
      sortBy: 'earliest',
      terminal: 'all',
    });
    if (onReset) {
      onReset();
    }
  };

  if (variant === 'bar') {
    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className={cn(
            'bg-card rounded-2xl border border-border/80 p-3 sm:p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center gap-3',
            className
          )}
        >
          {/* Origin */}
          <div className="flex-1 min-w-0">
            <FormField
              control={form.control}
              name="from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-muted-foreground">Origin</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full font-bold text-xs h-10 bg-background">
                        <MapPin className="w-3.5 h-3.5 text-primary mr-1.5 shrink-0" />
                        <SelectValue placeholder="From" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectPopup>
                      {SERVED_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Swap button */}
          <div className="hidden md:flex items-center justify-center pt-4">
            <button
              type="button"
              onClick={handleSwapCities}
              className="p-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-transform active:scale-90"
              title="Swap origin and destination"
              aria-label="Swap origin and destination"
            >
              <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Destination */}
          <div className="flex-1 min-w-0">
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-muted-foreground">Destination</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full font-bold text-xs h-10 bg-background">
                        <MapPin className="w-3.5 h-3.5 text-secondary mr-1.5 shrink-0" />
                        <SelectValue placeholder="To" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectPopup>
                      {servedDestinations.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Travel Date */}
          <div className="flex-1 min-w-0">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-muted-foreground">Date</FormLabel>
                  <FormControl>
                    <div className="flex items-center h-10 px-3 rounded-xl border border-input bg-background text-xs font-bold text-foreground">
                      <CalendarIcon className="w-3.5 h-3.5 text-primary mr-1.5 shrink-0" />
                      <input
                        type="date"
                        min={todayLagos}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="bg-transparent border-none outline-hidden w-full text-xs font-bold text-foreground cursor-pointer"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Passengers */}
          <div className="w-full md:w-32">
            <FormField
              control={form.control}
              name="passengers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-muted-foreground">Seats</FormLabel>
                  <Select
                    value={String(field.value)}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full font-bold text-xs h-10 bg-background">
                        <Users className="w-3.5 h-3.5 text-primary mr-1.5 shrink-0" />
                        <SelectValue placeholder="Seats" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectPopup>
                      {[1, 2, 3, 4, 5].map((count) => (
                        <SelectItem key={count} value={String(count)}>
                          {count} {count === 1 ? 'Seat' : 'Seats'}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Submit */}
          <div className="pt-0 md:pt-4">
            <Button
              type="submit"
              className="w-full md:w-auto h-10 px-6 font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  // Sidebar variant (Used on /trips sidebar and mobile bottom sheet)
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className={cn('space-y-4', className)}>
        {/* 1. Origin and Destination Corridor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
              Corridor Route
            </label>
            <button
              type="button"
              onClick={handleSwapCities}
              className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>Swap Route</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="from"
              render={({ field }) => (
                <FormItem>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full text-xs font-bold min-h-[40px] bg-background">
                        <MapPin className="w-3.5 h-3.5 text-primary mr-1 shrink-0" />
                        <SelectValue placeholder="From" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectPopup>
                      {SERVED_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
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
              name="to"
              render={({ field }) => (
                <FormItem>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full text-xs font-bold min-h-[40px] bg-background">
                        <MapPin className="w-3.5 h-3.5 text-secondary mr-1 shrink-0" />
                        <SelectValue placeholder="To" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectPopup>
                      {servedDestinations.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
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

        {/* 2. Seat Capacity Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Seat Count</span>
            <span className="text-[11px] font-mono text-muted-foreground font-semibold">
              Max 5 seats
            </span>
          </label>
          <FormField
            control={form.control}
            name="passengers"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((count) => {
                    const isSelected = field.value === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => field.onChange(count)}
                        className={cn(
                          'min-h-[36px] rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95',
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'bg-background hover:bg-muted text-foreground border-border'
                        )}
                      >
                        {count} {count === 1 ? 'Seat' : 'Seats'}
                      </button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 3. Interactive Coss UI Calendar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-primary" />
              <span>Select Travel Date</span>
            </label>
            <span className="text-[11px] font-mono text-muted-foreground font-semibold">
              {selectedDate}
            </span>
          </div>

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <div className="rounded-2xl border border-border bg-background p-2 shadow-xs overflow-hidden flex justify-center [--cell-size:2rem]">
                  <CossCalendar
                    mode="single"
                    selected={parseDateParam(field.value)}
                    onSelect={(selectedDay) => {
                      if (selectedDay) {
                        field.onChange(toDateString(selectedDay));
                      }
                    }}
                    disabled={{ before: parseDateParam(todayLagos) }}
                    className="w-full"
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 4. Departure Time Filter */}
        {showFilters && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
              Departure Time
            </label>
            <FormField
              control={form.control}
              name="timeWindow"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => field.onChange('all')}
                      className={cn(
                        'min-h-[34px] px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95',
                        field.value === 'all'
                          ? 'bg-card text-foreground border-primary shadow-xs font-black'
                          : 'bg-background hover:bg-muted text-muted-foreground border-border'
                      )}
                    >
                      All Day
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange('morning')}
                      className={cn(
                        'min-h-[34px] px-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer active:scale-95',
                        field.value === 'morning'
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs font-black'
                          : 'bg-background hover:bg-muted text-muted-foreground border-border'
                      )}
                    >
                      <Sun className="w-3 h-3" />
                      <span>Morning</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange('afternoon')}
                      className={cn(
                        'min-h-[34px] px-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer active:scale-95',
                        field.value === 'afternoon'
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs font-black'
                          : 'bg-background hover:bg-muted text-muted-foreground border-border'
                      )}
                    >
                      <Sunset className="w-3 h-3" />
                      <span>Afternoon</span>
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* 5. Sort Order */}
        {showFilters && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
              Sort Results
            </label>
            <FormField
              control={form.control}
              name="sortBy"
              render={({ field }) => (
                <FormItem>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full text-xs font-semibold min-h-[40px] bg-background">
                        <SelectValue placeholder="Sort Trips" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectPopup>
                      <SelectItem value="earliest">Earliest Departure Time</SelectItem>
                      <SelectItem value="cheapest">Lowest Fare First</SelectItem>
                    </SelectPopup>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* 6. Lagos Terminal Filter (if corridor involves Lagos) */}
        {showFilters && (fromCity === 'Lagos' || toCity === 'Lagos') && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
              Lagos Terminal Hub
            </label>
            <FormField
              control={form.control}
              name="terminal"
              render={({ field }) => (
                <FormItem>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full text-xs font-semibold min-h-[40px] bg-background">
                        <SelectValue placeholder="All Terminals" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectPopup>
                      <SelectItem value="all">All Lagos Terminals</SelectItem>
                      <SelectItem value="jibowu">Jibowu (Yaba)</SelectItem>
                      <SelectItem value="ajah">Ajah (Lekki)</SelectItem>
                      <SelectItem value="festac">Festac Town</SelectItem>
                    </SelectPopup>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <Button
            type="submit"
            className="w-full min-h-[42px] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Search className="w-4 h-4" />
            <span>Apply Search</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handleResetForm}
            className="w-full min-h-[36px] font-medium text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Search</span>
          </Button>
        </div>
      </form>
    </Form>
  );
}
