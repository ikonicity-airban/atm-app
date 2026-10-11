import React from 'react';
import { BRAND, SEED_TERMINALS } from '@atm/shared';

interface PublicFooterProps {
  onNavigate: (path: string) => void;
}

export function PublicFooter({ onNavigate }: PublicFooterProps) {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Company Profile */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#ca2484] flex items-center justify-center text-white font-black text-sm">
                A
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">
                {BRAND.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Intercity passenger transport in 5-seat Toyota Siennas with air conditioning and extra legroom. Reliable express courier parcels. Founded {BRAND.foundedYear}.
            </p>
            <p className="text-xs text-slate-400 pt-1">
              Dispatch Hotline: <a href={`tel:${BRAND.contactPhones[0]}`} className="text-pink-400 hover:underline">{BRAND.contactPhones[0]}</a>
            </p>
          </div>

          {/* Column 2: Passenger & Courier Services */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Services
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/trips')}
                  className="hover:text-white transition-colors py-1 block cursor-pointer text-left"
                >
                  Book Intercity Seat
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/courier')}
                  className="hover:text-white transition-colors py-1 block cursor-pointer text-left"
                >
                  Courier &amp; Parcels
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/track')}
                  className="hover:text-white transition-colors py-1 block cursor-pointer text-left"
                >
                  Track Parcel
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/charter')}
                  className="hover:text-white transition-colors py-1 block cursor-pointer text-left"
                >
                  Private Vehicle Charter
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/corporate')}
                  className="hover:text-white transition-colors py-1 block cursor-pointer text-left"
                >
                  Corporate Fleet Services
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Terminals & Key Corridors */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Terminals &amp; Corridors
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/terminals')}
                  className="hover:text-white transition-colors py-1 block cursor-pointer text-left font-semibold text-pink-400"
                >
                  All Terminals ({SEED_TERMINALS.length})
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/routes/enugu-abuja')}
                  className="hover:text-white transition-colors py-1 block cursor-pointer text-left"
                >
                  Enugu ↔ Abuja
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/routes/enugu-lagos')}
                  className="hover:text-white transition-colors py-1 block cursor-pointer text-left"
                >
                  Enugu ↔ Lagos (Jibowu / Ajah / Festac)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/routes/lagos-owerri')}
                  className="hover:text-white transition-colors py-1 block cursor-pointer text-left"
                >
                  Lagos ↔ Owerri
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/manage')}
                  className="hover:text-white transition-colors py-1 block cursor-pointer text-left text-slate-400"
                >
                  Manage Booking or Cancel
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Support & Legal */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Support &amp; Legal
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/about')}
                  className="hover:text-white transition-colors py-1 block cursor-pointer text-left"
                >
                  About Ascent Transport
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/contact')}
                  className="hover:text-white transition-colors py-1 block cursor-pointer text-left"
                >
                  Contact &amp; Terminals
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/faq')}
                  className="hover:text-white transition-colors py-1 block cursor-pointer text-left"
                >
                  FAQ &amp; Help Center
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/terms')}
                  className="hover:text-white transition-colors py-1 block cursor-pointer text-left"
                >
                  Terms &amp; Cancellation Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/privacy')}
                  className="hover:text-white transition-colors py-1 block cursor-pointer text-left"
                >
                  Privacy Policy (NDPA)
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved. &bull; Tagline: &quot;{BRAND.tagline}&quot;
          </p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Head Office: 263 Ogui Road, Enugu</span>
            <button
              type="button"
              onClick={() => onNavigate('/admin/login')}
              className="text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              Staff Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
