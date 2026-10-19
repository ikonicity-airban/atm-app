'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  X,
  ChevronDown,
  Bus,
  Package,
  Calendar,
  Building2,
  Info,
  Phone,
  HelpCircle,
  FileText,
  Shield,
  User,
  MapPin,
  Search,
  Sparkles,
} from 'lucide-react';
import { Logo } from '../ui/Logo.tsx';
import { ThemeToggle } from '../theme/ThemeToggle.tsx';

interface PublicHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  userRole?: 'customer' | 'staff' | null;
}

interface DropdownLink {
  label: string;
  sub: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function PublicHeader({ currentPath, onNavigate, userRole }: PublicHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'travel' | 'courier' | 'charter' | 'support' | null>(null);
  const [hoveredNavIndex, setHoveredNavIndex] = useState<number | null>(null);

  const headerRef = useRef<HTMLElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor scroll offset to transition from transparent to floating rounded pill
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setIsScrolled(window.scrollY > 20);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Travel Links (Passenger Transport)
  const travelLinks: DropdownLink[] = [
    {
      label: 'Corridors & Schedules',
      sub: 'Daily fixed schedule Toyota Sienna departures',
      path: '/routes',
      icon: Bus,
    },
    {
      label: 'Terminal Directory',
      sub: 'Official departure and arrival hubs across Nigeria',
      path: '/terminals',
      icon: MapPin,
    },
  ];

  // 2. Courier Links (Freight Logistics)
  const courierLinks: DropdownLink[] = [
    {
      label: 'Send Express Parcel',
      sub: 'Same day intercity freight and waybills',
      path: '/courier',
      icon: Package,
    },
    {
      label: 'Track Waybill Shipment',
      sub: 'Real time chain of custody by ATM tracking code',
      path: '/track',
      icon: Search,
    },
  ];

  // 3. Charter & Fleet Links (Vehicle Hire & B2B)
  const charterLinks: DropdownLink[] = [
    {
      label: 'Private Sienna Charter',
      sub: 'Dedicated 5 seat executive vehicle hire',
      path: '/charter',
      icon: Calendar,
    },
    {
      label: 'Corporate Fleet Logistics',
      sub: 'Bespoke staff transit and intercity contracts',
      path: '/corporate',
      icon: Building2,
    },
  ];

  // 4. Support & Governance Links
  const supportLinks: DropdownLink[] = [
    {
      label: 'Frequently Asked Questions',
      sub: 'Seat selection, 15 minute holds, and luggage rules',
      path: '/faq',
      icon: HelpCircle,
    },
    {
      label: 'Contact & Helplines',
      sub: 'Terminal phone desks and customer support',
      path: '/contact',
      icon: Phone,
    },
    {
      label: 'About Ascent Fleet',
      sub: 'Executive Sienna travel standards and safety mission',
      path: '/about',
      icon: Info,
    },
    {
      label: 'Terms of Carriage',
      sub: 'Passenger rights, baggage, and cancellation policies',
      path: '/terms',
      icon: FileText,
    },
    {
      label: 'Privacy Policy',
      sub: 'Data protection and passenger security',
      path: '/privacy',
      icon: Shield,
    },
  ];

  // Determine active nav index for magnetic hover tracking pill
  const getActiveNavIndex = () => {
    if (currentPath === '/trips' || currentPath.startsWith('/book')) return 0;
    if (travelLinks.some((l) => currentPath.startsWith(l.path))) return 1;
    if (courierLinks.some((l) => currentPath.startsWith(l.path))) return 2;
    if (charterLinks.some((l) => currentPath.startsWith(l.path))) return 3;
    if (supportLinks.some((l) => currentPath.startsWith(l.path))) return 4;
    return null;
  };

  const activeIndex = getActiveNavIndex();
  const highlightedIndex = hoveredNavIndex !== null ? hoveredNavIndex : activeIndex;

  const handleNav = (path: string) => {
    onNavigate(path);
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  const handleMouseEnter = (type: 'travel' | 'courier' | 'charter' | 'support', index: number) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(type);
    setHoveredNavIndex(index);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
      setHoveredNavIndex(null);
    }, 180);
  };

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out flex justify-center ${isScrolled
        ? 'pt-3 sm:pt-4 px-4 sm:px-6 pointer-events-none'
        : 'pt-0 px-4 sm:px-6 lg:px-8 bg-transparent'
        }`}
    >
      <div
        className={`w-full transition-all duration-300 ease-out flex items-center justify-between pointer-events-auto ${isScrolled
          ? 'max-w-5xl lg:max-w-6xl bg-white/40 backdrop-blur-lg rounded-full px-4 sm:px-6 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-0 ring-1 ring-slate-900/5'
          : 'max-w-7xl mx-auto py-4 sm:py-6 bg-transparent border-0'
          }`}
      >
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => handleNav('/')}
          className="flex items-center text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#ca2484] rounded-lg p-1 cursor-pointer transition-transform hover:scale-[1.01]"
          aria-label="Ascent Transport Management Home"
        >
          <Logo variant="full" size="md" />
        </button>

        {/* Desktop Navigation Links with Magnetic Tracking Pill */}
        <nav
          className="hidden md:flex items-center relative gap-0.5 lg:gap-1"
          aria-label="Main navigation"
          onMouseLeave={handleMouseLeave}
        >
          {/* 1. Direct "Find Trips" Link */}
          <div
            className="relative"
            onMouseEnter={() => {
              if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
              setActiveDropdown(null);
              setHoveredNavIndex(0);
            }}
          >
            <button
              type="button"
              onClick={() => handleNav('/trips')}
              className={`relative z-10 px-3.5 py-2 text-sm font-bold rounded-full min-h-[44px] flex items-center gap-1.5 cursor-pointer transition-colors ${currentPath === '/trips' || currentPath.startsWith('/book')
                ? 'text-[#ca2484]'
                : 'text-slate-800 hover:text-slate-950'
                }`}
            >
              <Bus className="w-4 h-4 text-[#ca2484]" />
              <span>Find Trips</span>
            </button>
            {highlightedIndex === 0 && (
              <motion.span
                layoutId="navHoverPill"
                className="absolute inset-0 rounded-full bg-pink-50/90 shadow-2xs -z-0"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
          </div>

          {/* 2. Travel Dropdown (Routes & Terminals) */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('travel', 1)}
          >
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'travel' ? null : 'travel')}
              className={`relative z-10 px-3.5 py-2 text-sm font-semibold rounded-full min-h-[44px] flex items-center gap-1 cursor-pointer transition-colors ${travelLinks.some((l) => currentPath.startsWith(l.path))
                ? 'text-[#ca2484]'
                : 'text-slate-700 hover:text-slate-950'
                }`}
              aria-expanded={activeDropdown === 'travel'}
              aria-haspopup="true"
            >
              <span>Travel</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'travel' ? 'rotate-180 text-[#ca2484]' : 'text-slate-400'
                  }`}
              />
            </button>
            {highlightedIndex === 1 && (
              <motion.span
                layoutId="navHoverPill"
                className="absolute inset-0 rounded-full bg-pink-50/90 shadow-2xs -z-0"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}

            <AnimatePresence>
              {activeDropdown === 'travel' && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute top-full left-0 mt-2 w-72 bg-white/98 backdrop-blur-2xl rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] ring-1 ring-slate-900/10 p-2 z-50 overflow-hidden"
                  onMouseEnter={() => {
                    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
                  }}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Passenger Transit
                  </div>
                  <div className="space-y-1">
                    {travelLinks.map((item) => {
                      const Icon = item.icon;
                      const isItemActive = currentPath.startsWith(item.path);
                      return (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => handleNav(item.path)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${isItemActive ? 'bg-pink-50 text-[#ca2484]' : 'hover:bg-slate-50 text-slate-800'
                            }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg mt-0.5 ${isItemActive ? 'bg-[#ca2484] text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-tight">{item.label}</div>
                            <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.sub}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. Courier Dropdown (Freight & Tracking) */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('courier', 2)}
          >
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'courier' ? null : 'courier')}
              className={`relative z-10 px-3.5 py-2 text-sm font-semibold rounded-full min-h-[44px] flex items-center gap-1 cursor-pointer transition-colors ${courierLinks.some((l) => currentPath.startsWith(l.path))
                ? 'text-[#ca2484]'
                : 'text-slate-700 hover:text-slate-950'
                }`}
              aria-expanded={activeDropdown === 'courier'}
              aria-haspopup="true"
            >
              <span>Courier</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'courier' ? 'rotate-180 text-[#ca2484]' : 'text-slate-400'
                  }`}
              />
            </button>
            {highlightedIndex === 2 && (
              <motion.span
                layoutId="navHoverPill"
                className="absolute inset-0 rounded-full bg-pink-50/90 shadow-2xs -z-0"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}

            <AnimatePresence>
              {activeDropdown === 'courier' && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute top-full left-0 mt-2 w-72 bg-white/98 backdrop-blur-2xl rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] ring-1 ring-slate-900/10 p-2 z-50 overflow-hidden"
                  onMouseEnter={() => {
                    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
                  }}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Intercity Waybill Freight
                  </div>
                  <div className="space-y-1">
                    {courierLinks.map((item) => {
                      const Icon = item.icon;
                      const isItemActive = currentPath.startsWith(item.path);
                      return (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => handleNav(item.path)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${isItemActive ? 'bg-pink-50 text-[#ca2484]' : 'hover:bg-slate-50 text-slate-800'
                            }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg mt-0.5 ${isItemActive ? 'bg-[#ca2484] text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-tight">{item.label}</div>
                            <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.sub}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 4. Charter & Fleet Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('charter', 3)}
          >
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'charter' ? null : 'charter')}
              className={`relative z-10 px-3.5 py-2 text-sm font-semibold rounded-full min-h-[44px] flex items-center gap-1 cursor-pointer transition-colors ${charterLinks.some((l) => currentPath.startsWith(l.path))
                ? 'text-[#ca2484]'
                : 'text-slate-700 hover:text-slate-950'
                }`}
              aria-expanded={activeDropdown === 'charter'}
              aria-haspopup="true"
            >
              <span>Charter &amp; Fleet</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'charter' ? 'rotate-180 text-[#ca2484]' : 'text-slate-400'
                  }`}
              />
            </button>
            {highlightedIndex === 3 && (
              <motion.span
                layoutId="navHoverPill"
                className="absolute inset-0 rounded-full bg-pink-50/90 shadow-2xs -z-0"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}

            <AnimatePresence>
              {activeDropdown === 'charter' && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute top-full left-0 mt-2 w-72 bg-white/98 backdrop-blur-2xl rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] ring-1 ring-slate-900/10 p-2 z-50 overflow-hidden"
                  onMouseEnter={() => {
                    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
                  }}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Dedicated Vehicle Hire
                  </div>
                  <div className="space-y-1">
                    {charterLinks.map((item) => {
                      const Icon = item.icon;
                      const isItemActive = currentPath.startsWith(item.path);
                      return (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => handleNav(item.path)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${isItemActive ? 'bg-pink-50 text-[#ca2484]' : 'hover:bg-slate-50 text-slate-800'
                            }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg mt-0.5 ${isItemActive ? 'bg-[#ca2484] text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-tight">{item.label}</div>
                            <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.sub}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 5. Support Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('support', 4)}
          >
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'support' ? null : 'support')}
              className={`relative z-10 px-3.5 py-2 text-sm font-semibold rounded-full min-h-[44px] flex items-center gap-1 cursor-pointer transition-colors ${supportLinks.some((l) => currentPath.startsWith(l.path))
                ? 'text-[#ca2484]'
                : 'text-slate-700 hover:text-slate-950'
                }`}
              aria-expanded={activeDropdown === 'support'}
              aria-haspopup="true"
            >
              <span>Support</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'support' ? 'rotate-180 text-[#ca2484]' : 'text-slate-400'
                  }`}
              />
            </button>
            {highlightedIndex === 4 && (
              <motion.span
                layoutId="navHoverPill"
                className="absolute inset-0 rounded-full bg-pink-50/90 shadow-2xs -z-0"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}

            <AnimatePresence>
              {activeDropdown === 'support' && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute top-full right-0 lg:left-0 mt-2 w-72 bg-white/98 backdrop-blur-2xl rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] ring-1 ring-slate-900/10 p-2 z-50 overflow-hidden"
                  onMouseEnter={() => {
                    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
                  }}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Customer Care &amp; Policies
                  </div>
                  <div className="space-y-1">
                    {supportLinks.map((item) => {
                      const Icon = item.icon;
                      const isItemActive = currentPath.startsWith(item.path);
                      return (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => handleNav(item.path)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${isItemActive ? 'bg-pink-50 text-[#ca2484]' : 'hover:bg-slate-50 text-slate-800'
                            }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg mt-0.5 ${isItemActive ? 'bg-[#ca2484] text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-tight">{item.label}</div>
                            <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.sub}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Action CTAs: Track Parcel + Manage Booking */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Switcher Toggle */}
          <ThemeToggle />

          {/* Track Parcel Fast Utility Link */}
          <button
            type="button"
            onClick={() => handleNav('/track')}
            className={`hidden lg:flex px-3.5 py-2 text-xs font-bold rounded-full min-h-[44px] items-center gap-1.5 transition-colors cursor-pointer ${currentPath === '/track' ? 'text-[#ca2484] bg-pink-50' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
          >
            <Search className="w-3.5 h-3.5 text-[#ca2484]" />
            <span>Track Parcel</span>
          </button>

          {/* Primary Manage Booking Button */}
          <button
            type="button"
            onClick={() => handleNav('/manage')}
            className={`px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-slate-900 border border-slate-900/80 rounded-full hover:bg-slate-900 hover:text-white transition-all shadow-2xs min-h-10 flex items-center cursor-pointer ${isScrolled && "bg-primary border-white text-white border-2"}`}
          >
            Manage Booking
          </button>

          {userRole === 'staff' ? (
            <button
              type="button"
              onClick={() => handleNav('/admin')}
              className="hidden sm:flex px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-full min-h-[44px] items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Staff Portal</span>
            </button>
          ) : userRole === 'customer' ? (
            <button
              type="button"
              onClick={() => handleNav('/account')}
              className="hidden sm:flex px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full min-h-[44px] items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Account</span>
            </button>
          ) : null}

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-11 h-11 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle mobile navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-20 left-4 right-4 bg-white/98 backdrop-blur-2xl rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.15)] ring-1 ring-slate-900/10 p-5 z-50 max-h-[85vh] overflow-y-auto"
          >
            <div className="space-y-6">
              {/* High Visibility "Find Trips" Button */}
              <button
                type="button"
                onClick={() => handleNav('/trips')}
                className="w-full min-h-[48px] px-4 py-3 bg-[#ca2484] hover:bg-[#aa1769] text-white rounded-xl font-bold text-sm flex items-center justify-between shadow-xs transition-transform active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Bus className="w-4 h-4 text-white" />
                  <span>Find Scheduled Trips</span>
                </div>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md font-semibold">
                  5 Seat Sienna
                </span>
              </button>

              {/* 1. Passenger Travel Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                  Passenger Travel
                </span>
                <div className="grid grid-cols-1 gap-1">
                  {travelLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => handleNav(item.path)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 min-h-[44px] cursor-pointer ${currentPath.startsWith(item.path)
                          ? 'bg-pink-50 text-[#ca2484] font-bold'
                          : 'text-slate-800 hover:bg-slate-50'
                          }`}
                      >
                        <Icon className="w-4 h-4 text-[#ca2484] flex-shrink-0" />
                        <div>
                          <div className="text-xs font-semibold leading-tight">{item.label}</div>
                          <div className="text-[10px] text-slate-500 leading-tight">{item.sub}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Express Courier Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                  Express Courier
                </span>
                <div className="grid grid-cols-1 gap-1">
                  {courierLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => handleNav(item.path)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 min-h-[44px] cursor-pointer ${currentPath.startsWith(item.path)
                          ? 'bg-pink-50 text-[#ca2484] font-bold'
                          : 'text-slate-800 hover:bg-slate-50'
                          }`}
                      >
                        <Icon className="w-4 h-4 text-[#ca2484] flex-shrink-0" />
                        <div>
                          <div className="text-xs font-semibold leading-tight">{item.label}</div>
                          <div className="text-[10px] text-slate-500 leading-tight">{item.sub}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Charter & Fleet Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                  Charter &amp; Corporate
                </span>
                <div className="grid grid-cols-1 gap-1">
                  {charterLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => handleNav(item.path)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 min-h-[44px] cursor-pointer ${currentPath.startsWith(item.path)
                          ? 'bg-pink-50 text-[#ca2484] font-bold'
                          : 'text-slate-800 hover:bg-slate-50'
                          }`}
                      >
                        <Icon className="w-4 h-4 text-[#ca2484] flex-shrink-0" />
                        <div>
                          <div className="text-xs font-semibold leading-tight">{item.label}</div>
                          <div className="text-[10px] text-slate-500 leading-tight">{item.sub}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Support & Policies Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                  Customer Support &amp; Policies
                </span>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {supportLinks.map((item) => (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => handleNav(item.path)}
                      className={`text-left px-3 py-2 rounded-lg min-h-[44px] flex items-center cursor-pointer ${currentPath.startsWith(item.path)
                        ? 'text-[#ca2484] font-bold bg-pink-50'
                        : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Self-Service Action Bar at Bottom of Mobile Menu */}
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-medium text-slate-600">Theme</span>
                  <ThemeToggle showLabel />
                </div>
                <button
                  type="button"
                  onClick={() => handleNav('/track')}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-[#ca2484]" />
                  <span>Track Waybill Parcel</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('/manage')}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Manage / Cancel Booking</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
