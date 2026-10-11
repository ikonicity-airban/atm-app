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
      <div className="bg-slate-50 border-2 border-slate-300 rounded-3xl p-6 sm:p-8 max-w-sm mx-auto shadow-inner">
        {/* Windshield / Vehicle Front indicator */}
        <div className="text-center pb-4 border-b border-dashed border-slate-300 mb-6">
          <div className="inline-block px-4 py-1 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold tracking-wider uppercase">
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
                    className="h-20 w-full rounded-xl border border-slate-300 bg-slate-200/80 text-slate-500 flex flex-col items-center justify-center p-2 text-center select-none"
                    aria-label="Driver position, unavailable"
                    title="Driver position"
                  >
                    <User className="w-5 h-5 mb-1 text-slate-400" />
                    <span className="text-xs font-bold leading-tight">Driver</span>
                    <span className="text-[10px] text-slate-400">(Blocked)</span>
                  </div>
                ) : row.left ? (
                  renderSeatButton(row.left)
                ) : null}
              </div>

              {/* Aisle Spacer */}
              <div className="w-6 text-center select-none text-slate-300 font-mono text-xs">
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
        <div className="text-center pt-6 mt-6 border-t border-dashed border-slate-300">
          <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
            ▼ Rear Luggage Compartment
          </span>
        </div>
      </div>

      {/* Accessible Legend */}
      <div
        className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-700 pt-2 border-t border-slate-200"
        role="region"
        aria-label="Seat map legend"
      >
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded border-2 border-slate-300 bg-white inline-block" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-[#ca2484] border-2 border-[#ca2484] inline-block" />
          <span className="font-semibold text-slate-900">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-slate-200 border-2 border-slate-300 inline-block text-center text-slate-400 leading-none">
            ✕
          </span>
          <span className="text-slate-500">Taken</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-slate-300 border-2 border-slate-400 inline-block" />
          <span className="text-slate-500">Driver</span>
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
          'h-20 w-full rounded-xl border-2 transition-all flex flex-col items-center justify-center p-2 text-center relative focus:outline-none focus:ring-2 focus:ring-[#ca2484] focus:ring-offset-2 min-h-[44px]',
          // Occupied state
          isOccupied &&
            'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75',
          // Selected state
          isSelected &&
            'bg-[#ca2484] border-[#ca2484] text-white shadow-md font-bold cursor-pointer scale-102',
          // Available state
          !isOccupied &&
            !isSelected &&
            'bg-white border-slate-300 text-slate-800 hover:border-[#ca2484] hover:bg-pink-50/50 cursor-pointer',
          // At capacity state
          isAtCapacity && !isOccupied && 'opacity-60 cursor-not-allowed'
        )}
      >
        <div className="flex items-center justify-center gap-1 mb-0.5">
          <span className="text-base font-black tracking-tight">Seat {seat.seatNo}</span>
          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
          {isOccupied && <Lock className="w-3.5 h-3.5 text-slate-400" />}
        </div>
        <span
          className={cn(
            'text-[10px] leading-tight line-clamp-1',
            isSelected ? 'text-pink-100' : isOccupied ? 'text-slate-400' : 'text-slate-500'
          )}
        >
          {seat.label.replace(`Seat ${seat.seatNo}`, '').trim() || 'Passenger'}
        </span>
        <span
          className={cn(
            'text-[9px] font-bold uppercase mt-1 tracking-wider',
            isSelected ? 'text-white' : isOccupied ? 'text-slate-400' : 'text-emerald-700'
          )}
        >
          {status}
        </span>
      </button>
    );
  }
}
