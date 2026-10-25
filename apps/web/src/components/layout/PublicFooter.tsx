'use client';

import React, { useState } from 'react';
import { BRAND, SEED_TERMINALS } from '@atm/shared';
import { Logo } from '../ui/Logo.tsx';
import { ChevronDown, MessageSquare } from 'lucide-react';

interface PublicFooterProps {
  onNavigate: (path: string) => void;
}

export function PublicFooter({ onNavigate }: PublicFooterProps) {
  const [openSection, setOpenSection] = useState<'services' | 'terminals' | 'support' | null>(null);

  const toggleSection = (section: 'services' | 'terminals' | 'support') => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const socialLinks = [
    {
      name: 'Facebook',
      url: 'https://facebook.com/ascenttransport',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'X (Twitter)',
      url: 'https://x.com/ascentng',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com/ascenttransport',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      url: 'https://linkedin.com/company/ascent-transport-management',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
    },
    {
      name: 'WhatsApp Desk',
      url: `https://wa.me/${BRAND.supportDeskWhatsapp.replace(/[^0-9]/g, '')}`,
      icon: <MessageSquare className="w-4 h-4" />,
    },
  ];

  return (
    <footer className="bg-card text-muted-foreground border-t border-border mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Desktop 4-Column Layout */}
        <div className="hidden md:grid md:grid-cols-4 gap-8">
          {/* Column 1: Company Profile */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Logo variant="full" size="md" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Intercity passenger transport in 5-seat Toyota Siennas with air conditioning and extra legroom. Reliable express courier parcels. Founded {BRAND.foundedYear}.
            </p>
            <p className="text-xs text-muted-foreground">
              Dispatch Hotline: <a href={`tel:${BRAND.contactPhones[0]}`} className="text-primary hover:underline font-medium">{BRAND.contactPhones[0]}</a>
            </p>

            {/* Social Media Links */}
            <div className="pt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Follow Ascent
              </div>
              <div className="flex items-center gap-2">
                {socialLinks.map((s) => (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow Ascent on ${s.name}`}
                    title={s.name}
                    className="w-8 h-8 rounded-full border border-border bg-muted/40 hover:bg-primary/10 hover:text-primary hover:border-primary/30 flex items-center justify-center transition-colors text-muted-foreground"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
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

        {/* Mobile Accordion Layout */}
        <div className="md:hidden space-y-4">
          {/* Company Intro & Social */}
          <div className="space-y-3 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Logo variant="full" size="sm" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              5-seat Toyota Sienna passenger comfort &amp; express courier logistics across Nigeria.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {socialLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow Ascent on ${s.name}`}
                  className="w-8 h-8 rounded-full border border-border bg-muted/40 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors text-muted-foreground"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Accordion 1: Services */}
          <div className="border border-border rounded-2xl overflow-hidden bg-card/60">
            <button
              type="button"
              onClick={() => toggleSection('services')}
              className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-foreground uppercase tracking-wider cursor-pointer"
              aria-expanded={openSection === 'services'}
            >
              <span>Services</span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                  openSection === 'services' ? 'rotate-180 text-primary' : ''
                }`}
              />
            </button>
            {openSection === 'services' && (
              <ul className="px-4 pb-4 space-y-2 text-xs border-t border-border/50 pt-2">
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
            )}
          </div>

          {/* Accordion 2: Terminals & Corridors */}
          <div className="border border-border rounded-2xl overflow-hidden bg-card/60">
            <button
              type="button"
              onClick={() => toggleSection('terminals')}
              className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-foreground uppercase tracking-wider cursor-pointer"
              aria-expanded={openSection === 'terminals'}
            >
              <span>Terminals &amp; Corridors</span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                  openSection === 'terminals' ? 'rotate-180 text-primary' : ''
                }`}
              />
            </button>
            {openSection === 'terminals' && (
              <ul className="px-4 pb-4 space-y-2 text-xs border-t border-border/50 pt-2">
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
            )}
          </div>

          {/* Accordion 3: Support & Legal */}
          <div className="border border-border rounded-2xl overflow-hidden bg-card/60">
            <button
              type="button"
              onClick={() => toggleSection('support')}
              className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-foreground uppercase tracking-wider cursor-pointer"
              aria-expanded={openSection === 'support'}
            >
              <span>Support &amp; Legal</span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                  openSection === 'support' ? 'rotate-180 text-primary' : ''
                }`}
              />
            </button>
            {openSection === 'support' && (
              <ul className="px-4 pb-4 space-y-2 text-xs border-t border-border/50 pt-2">
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
            )}
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <p className="text-[11px]">Executive 5-Seat Intercity Fleet Across Nigeria</p>
        </div>
      </div>
    </footer>
  );
}
