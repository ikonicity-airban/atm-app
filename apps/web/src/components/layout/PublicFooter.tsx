import React from 'react';
import { BRAND, SEED_TERMINALS } from '@atm/shared';

interface PublicFooterProps {
  onNavigate: (path: string) => void;
}

export function PublicFooter({ onNavigate }: PublicFooterProps) {
  return (
    <footer className="bg-card text-muted-foreground border-t border-border mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Company Profile */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-xs">
                A
              </div>
              <span className="font-extrabold text-foreground text-base tracking-tight">
                {BRAND.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Intercity passenger transport in 5-seat Toyota Siennas with air conditioning and extra legroom. Reliable express courier parcels. Founded {BRAND.foundedYear}.
            </p>
            <p className="text-xs text-muted-foreground pt-1">
              Dispatch Hotline: <a href={`tel:${BRAND.contactPhones[0]}`} className="text-primary hover:underline font-medium">{BRAND.contactPhones[0]}</a>
            </p>
          </div>

          {/* Column 2: Passenger & Courier Services */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              Services
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/trips')}
                  className="hover:text-foreground transition-colors py-1 block cursor-pointer text-left"
                >
                  Book Intercity Seat
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/courier')}
                  className="hover:text-foreground transition-colors py-1 block cursor-pointer text-left"
                >
                  Courier &amp; Parcels
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/track')}
                  className="hover:text-foreground transition-colors py-1 block cursor-pointer text-left"
                >
                  Track Parcel
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/charter')}
                  className="hover:text-foreground transition-colors py-1 block cursor-pointer text-left"
                >
                  Private Vehicle Charter
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/corporate')}
                  className="hover:text-foreground transition-colors py-1 block cursor-pointer text-left"
                >
                  Corporate Fleet Services
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Terminals & Key Corridors */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              Terminals &amp; Corridors
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/terminals')}
                  className="hover:text-foreground transition-colors py-1 block cursor-pointer text-left font-semibold text-primary"
                >
                  All Terminals ({SEED_TERMINALS.length})
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/routes/enugu-abuja')}
                  className="hover:text-foreground transition-colors py-1 block cursor-pointer text-left"
                >
                  Enugu ↔ Abuja
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/routes/enugu-lagos')}
                  className="hover:text-foreground transition-colors py-1 block cursor-pointer text-left"
                >
                  Enugu ↔ Lagos (Jibowu / Ajah / Festac)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/routes/lagos-owerri')}
                  className="hover:text-foreground transition-colors py-1 block cursor-pointer text-left"
                >
                  Lagos ↔ Owerri
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/manage')}
                  className="hover:text-foreground transition-colors py-1 block cursor-pointer text-left text-muted-foreground"
                >
                  Manage Booking or Cancel
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Support & Legal */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              Support &amp; Legal
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/faq')}
                  className="hover:text-foreground transition-colors py-1 block cursor-pointer text-left"
                >
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/contact')}
                  className="hover:text-foreground transition-colors py-1 block cursor-pointer text-left"
                >
                  Contact &amp; Terminals
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/terms')}
                  className="hover:text-foreground transition-colors py-1 block cursor-pointer text-left"
                >
                  Terms of Carriage
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/privacy')}
                  className="hover:text-foreground transition-colors py-1 block cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/admin')}
                  className="hover:text-foreground transition-colors py-1 block cursor-pointer text-left text-muted-foreground/80"
                >
                  Staff Portal
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <p className="text-[11px]">Executive 5-Seat Intercity Fleet Across Nigeria</p>
        </div>
      </div>
    </footer>
  );
}
