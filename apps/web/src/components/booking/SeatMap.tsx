'use client';

import React from 'react';
import {
  SIENNA_5_SEAT_LAYOUT,
  type VehicleSeatLayout,
  type SeatLayoutItem,
} from '@atm/shared';
import { Check, Lock, User, Shield } from 'lucide-react';
import { cn } from '../../lib/utils.ts';

export interface SeatMapProps {
  layout?: VehicleSeatLayout;
  selectedSeats: number[];
  occupiedSeats: number[];
  maxSelectable: number;
  onSeatToggle: (seatNo: number) => void;
  disabled?: boolean;
  className?: string;
}

export function SeatMap({
  layout = SIENNA_5_SEAT_LAYOUT,
  selectedSeats,
  occupiedSeats,
  maxSelectable,
  onSeatToggle,
  disabled = false,
  className,
}: SeatMapProps) {
  const occupiedSet = new Set(occupiedSeats);
  const selectedSet = new Set(selectedSeats);

  const getSeatStatus = (seatNo: number): 'selected' | 'occupied' | 'available' => {
    if (selectedSet.has(seatNo)) return 'selected';
    if (occupiedSet.has(seatNo)) return 'occupied';
    return 'available';
  };

  const handleSeatClick = (seatNo: number) => {
    if (disabled || occupiedSet.has(seatNo)) return;

    // If not selected and already reached maxSelectable, don't allow selecting more
    if (!selectedSet.has(seatNo) && selectedSeats.length >= maxSelectable) {
      return;
    }

    onSeatToggle(seatNo);
  };

  // Organize seats by row
  const rows = [
    // Row 1: Driver (left) and Seat 1 (right)
    {
      rowNumber: 1,
      label: 'Front Row',
      isDriverRow: true,
      left: undefined,
      right: layout.seats.find((s) => s.seatNo === 1),
    },
    // Row 2: Seat 2 (left) and Seat 3 (right)
    {
      rowNumber: 2,
      label: 'Middle Row',
      isDriverRow: false,
      left: layout.seats.find((s) => s.seatNo === 2),
      right: layout.seats.find((s) => s.seatNo === 3),
    },
    // Row 3: Seat 4 (left) and Seat 5 (right)
    {
      rowNumber: 3,
      label: 'Rear Row',
      isDriverRow: false,
      left: layout.seats.find((s) => s.seatNo === 4),
      right: layout.seats.find((s) => s.seatNo === 5),
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Visual Sienna Cabin Frame */}
      <div className="bg-card border-2 border-border rounded-3xl p-6 sm:p-8 max-w-sm mx-auto shadow-inner">
        {/* Windshield / Vehicle Front indicator */}
        <div className="text-center pb-4 border-b border-dashed border-border mb-6">
          <div className="inline-block px-4 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
            ▲ Front Windshield (Direction of Travel)
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.rowNumber} className="flex items-center justify-between gap-4">
              {/* Left Position */}
              <div className="flex-1">
                {row.isDriverRow ? (
                  // Driver Seat (Blocked)
                  <div
                    className="h-20 w-full rounded-xl border border-border bg-muted/60 text-muted-foreground flex flex-col items-center justify-center p-2 text-center select-none"
                    aria-label="Driver position, unavailable"
                    title="Driver position"
                  >
                    <User className="w-5 h-5 mb-1 text-muted-foreground" />
                    <span className="text-xs font-bold leading-tight">Driver</span>
                    <span className="text-[10px] text-muted-foreground/70">(Blocked)</span>
                  </div>
                ) : row.left ? (
                  renderSeatButton(row.left)
                ) : null}
              </div>

              {/* Aisle Spacer */}
              <div className="w-6 text-center select-none text-muted-foreground/30 font-mono text-xs">
                |
              </div>

              {/* Right Position */}
              <div className="flex-1">
                {row.right ? renderSeatButton(row.right) : null}
              </div>
            </div>
          ))}
        </div>

        {/* Rear Trunk Indicator */}
        <div className="text-center pt-6 mt-6 border-t border-dashed border-border">
          <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
            ▼ Rear Luggage Compartment
          </span>
        </div>
      </div>

      {/* Accessible Legend */}
      <div
        className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-foreground pt-2 border-t border-border"
        role="region"
        aria-label="Seat map legend"
      >
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded border-2 border-border bg-card inline-block" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-primary border-2 border-primary inline-block" />
          <span className="font-semibold text-foreground">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-muted border-2 border-border inline-block text-center text-muted-foreground leading-none">
            ✕
          </span>
          <span className="text-muted-foreground">Taken</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-muted/80 border-2 border-border inline-block" />
          <span className="text-muted-foreground">Driver</span>
        </div>
      </div>
    </div>
  );

  function renderSeatButton(seat: SeatLayoutItem) {
    const status = getSeatStatus(seat.seatNo);
    const isOccupied = status === 'occupied';
    const isSelected = status === 'selected';
    const isAtCapacity = !isSelected && selectedSeats.length >= maxSelectable;

    let accessibleLabel = `Seat ${seat.seatNo}, ${seat.label}`;
    if (isOccupied) accessibleLabel += ' - Taken, unavailable';
    else if (isSelected) accessibleLabel += ' - Currently selected';
    else if (isAtCapacity) accessibleLabel += ' - Available (selection limit reached)';
    else accessibleLabel += ' - Available for booking';

    return (
      <button
        key={seat.seatNo}
        type="button"
        disabled={disabled || isOccupied}
        onClick={() => handleSeatClick(seat.seatNo)}
        aria-label={accessibleLabel}
        aria-pressed={isSelected}
        className={cn(
          'h-20 w-full rounded-xl border-2 transition-all flex flex-col items-center justify-center p-2 text-center relative focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px]',
          // Occupied state
          isOccupied &&
            'bg-muted border-border text-muted-foreground cursor-not-allowed opacity-75',
          // Selected state
          isSelected &&
            'bg-primary border-primary text-primary-foreground shadow-md font-bold cursor-pointer scale-102',
          // Available state
          !isOccupied &&
            !isSelected &&
            'bg-card border-border text-foreground hover:border-primary hover:bg-primary/10 cursor-pointer',
          // At capacity state
          isAtCapacity && !isOccupied && 'opacity-60 cursor-not-allowed'
        )}
      >
        <div className="flex items-center justify-center gap-1 mb-0.5">
          <span className="text-base font-black tracking-tight">Seat {seat.seatNo}</span>
          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
          {isOccupied && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
        <span
          className={cn(
            'text-[10px] leading-tight line-clamp-1',
            isSelected ? 'text-primary-foreground/80' : isOccupied ? 'text-muted-foreground' : 'text-muted-foreground'
          )}
        >
          {seat.label.replace(`Seat ${seat.seatNo}`, '').trim() || 'Passenger'}
        </span>
        <span
          className={cn(
            'text-[9px] font-bold uppercase mt-1 tracking-wider',
            isSelected ? 'text-primary-foreground' : isOccupied ? 'text-muted-foreground' : 'text-emerald-600 dark:text-emerald-400'
          )}
        >
          {status}
        </span>
      </button>
    );
  }
}
