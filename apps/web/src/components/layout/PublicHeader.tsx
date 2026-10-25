'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
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
import { SoundToggle } from '../theme/SoundToggle.tsx';
import { Button } from '../ui/Button.tsx';
import { Icon } from '../ui/Icon.tsx';
import { GooeyInput } from '../ui/gooey-input.tsx';

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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [openMobileAccordion, setOpenMobileAccordion] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(1024);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => setWindowWidth(window.innerWidth);
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const toggleMobileAccordion = (section: string) => {
    setOpenMobileAccordion((prev) => (prev === section ? null : section));
  };

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

  // Prevent background page scrolling while mobile navigation drawer is open and trigger 3D page push
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('mobile-drawer-open');
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.classList.remove('mobile-drawer-open');
        document.body.style.overflow = originalOverflow || '';
      };
    } else {
      document.body.classList.remove('mobile-drawer-open');
    }
  }, [isMobileMenuOpen]);

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

  // Set default opened accordion when mobile drawer opens based on active route
  useEffect(() => {
    if (isMobileMenuOpen) {
      if (travelLinks.some((l) => currentPath.startsWith(l.path))) {
        setOpenMobileAccordion('travel');
      } else if (courierLinks.some((l) => currentPath.startsWith(l.path))) {
        setOpenMobileAccordion('courier');
      } else if (charterLinks.some((l) => currentPath.startsWith(l.path))) {
        setOpenMobileAccordion('charter');
      } else if (supportLinks.some((l) => currentPath.startsWith(l.path))) {
        setOpenMobileAccordion('support');
      } else {
        setOpenMobileAccordion(null);
      }
    }
  }, [isMobileMenuOpen, currentPath]);

  const handleNav = (path: string) => {
    onNavigate(path);
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  const handleHeaderSearch = (query: string) => {
    const q = query.trim();
    if (!q) return;
    setIsSearchExpanded(false);

    if (/^ATM-EXP/i.test(q) || /^EXP-/i.test(q)) {
      handleNav(`/track?q=${encodeURIComponent(q)}`);
      return;
    }

    if (/^ATM-/i.test(q)) {
      handleNav(`/manage?ref=${encodeURIComponent(q)}`);
      return;
    }

    const lower = q.toLowerCase();
    const matchedCity = ['Lagos', 'Abuja', 'Enugu', 'Owerri'].find((c) => c.toLowerCase() === lower);
    if (matchedCity) {
      handleNav(`/trips?to=${encodeURIComponent(matchedCity)}`);
      return;
    }

    handleNav(`/trips?search=${encodeURIComponent(q)}`);
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out flex justify-center [--muted-foreground:#231923] dark:[--muted-foreground:#a9a] ${isScrolled
        ? 'pt-3 sm:pt-4 px-2 sm:px-4 pointer-events-none'
        : 'pt-0 px-4 sm:px-6 lg:px-8 bg-transparent'
        }`}
    >
      <div
        className={`w-full transition-all duration-300 ease-out flex items-center justify-between pointer-events-auto ${isScrolled
          ? 'max-w-5xl lg:max-w-6xl bg-card/50 backdrop-blur-lg rounded-full px-4 sm:px-6 py-2.5 shadow-lg'
          : 'max-w-7xl mx-auto py-4 sm:py-6 bg-transparent border-0'
          }`}
      >
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => handleNav('/')}
          className="flex items-center text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1 cursor-pointer transition-transform hover:scale-[1.01]"
          aria-label="Ascent Transport Management Home"
        >
          <Logo variant="full" size="lg" className={!isScrolled ? "mix-blend-lighten" : ""} />
        </button>

        {/* Desktop Navigation Links with Magnetic Tracking Pill */}
        <nav
          className={`hidden md:flex items-center relative gap-0.5 lg:gap-1 transition-all duration-300 ease-out ${
            isSearchExpanded
              ? 'opacity-0 pointer-events-none scale-95 w-0 max-w-0 overflow-hidden m-0 p-0'
              : 'opacity-100 scale-100 max-w-3xl'
          }`}
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
              className={`relative z-10 px-3.5 py-2 text-sm font-bold rounded-full min-h-11 flex items-center gap-1.5 cursor-pointer transition-colors ${currentPath === '/trips' || currentPath.startsWith('/book')
                ? 'text-primary'
                : 'text-foreground/90 hover:text-foreground'
                }`}
            >
              <Icon icon={Bus} size="default" className="text-primary/90" />
              <span>Find Trips</span>
            </button>
            {highlightedIndex === 0 && (
              <motion.span
                layoutId="navHoverPill"
                className="absolute inset-0 rounded-full bg-primary/10 shadow-2xs z-0"
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
              className={`relative z-10 px-3.5 py-2 text-sm font-semibold rounded-full min-h-11 flex items-center gap-1 cursor-pointer transition-colors ${travelLinks.some((l) => currentPath.startsWith(l.path))
                ? 'text-primary'
                : 'text-foreground/80 hover:text-foreground'
                }`}
              aria-expanded={activeDropdown === 'travel'}
              aria-haspopup="true"
            >
              <span>Travel</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'travel' ? 'rotate-180 text-primary' : 'text-muted-foreground'
                  }`}
              />
            </button>
            {highlightedIndex === 1 && (
              <motion.span
                layoutId="navHoverPill"
                className="absolute inset-0 rounded-full bg-primary/10 shadow-2xs z-0"
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
                  className="absolute top-full left-0 mt-2 w-72 bg-card/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-border p-2 z-50 overflow-hidden"
                  onMouseEnter={() => {
                    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
                  }}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Passenger Transit
                  </div>
                  <div className="space-y-1">
                    {travelLinks.map((item) => {
                      const LinkIcon = item.icon;
                      const isItemActive = currentPath.startsWith(item.path);
                      return (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => handleNav(item.path)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${isItemActive ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                            }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg mt-0.5 ${isItemActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                              }`}
                          >
                            <Icon icon={LinkIcon} size="default" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-tight">{item.label}</div>
                            <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{item.sub}</div>
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
              className={`relative z-10 px-3.5 py-2 text-sm font-semibold rounded-full min-h-11 flex items-center gap-1 cursor-pointer transition-colors ${courierLinks.some((l) => currentPath.startsWith(l.path))
                ? 'text-primary'
                : 'text-foreground/80 hover:text-foreground'
                }`}
              aria-expanded={activeDropdown === 'courier'}
              aria-haspopup="true"
            >
              <span>Courier</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'courier' ? 'rotate-180 text-primary' : 'text-muted-foreground'
                  }`}
              />
            </button>
            {highlightedIndex === 2 && (
              <motion.span
                layoutId="navHoverPill"
                className="absolute inset-0 rounded-full bg-primary/10 shadow-2xs z-0"
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
                  className="absolute top-full left-0 mt-2 w-72 bg-card/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-border p-2 z-50 overflow-hidden"
                  onMouseEnter={() => {
                    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
                  }}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Intercity Waybill Freight
                  </div>
                  <div className="space-y-1">
                    {courierLinks.map((item) => {
                      const LinkIcon = item.icon;
                      const isItemActive = currentPath.startsWith(item.path);
                      return (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => handleNav(item.path)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${isItemActive ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                            }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg mt-0.5 ${isItemActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                              }`}
                          >
                            <Icon icon={LinkIcon} size="default" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-tight">{item.label}</div>
                            <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{item.sub}</div>
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
              className={`relative z-10 px-3.5 py-2 text-sm font-semibold rounded-full min-h-11 flex items-center gap-1 cursor-pointer transition-colors ${charterLinks.some((l) => currentPath.startsWith(l.path))
                ? 'text-primary'
                : 'text-foreground/80 hover:text-foreground'
                }`}
              aria-expanded={activeDropdown === 'charter'}
              aria-haspopup="true"
            >
              <span>Charter &amp; Fleet</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'charter' ? 'rotate-180 text-primary' : 'text-muted-foreground'
                  }`}
              />
            </button>
            {highlightedIndex === 3 && (
              <motion.span
                layoutId="navHoverPill"
                className="absolute inset-0 rounded-full bg-primary/10 shadow-2xs z-0"
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
                  className="absolute top-full left-0 mt-2 w-72 bg-card/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-border p-2 z-50 overflow-hidden"
                  onMouseEnter={() => {
                    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
                  }}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Dedicated Vehicle Hire
                  </div>
                  <div className="space-y-1">
                    {charterLinks.map((item) => {
                      const LinkIcon = item.icon;
                      const isItemActive = currentPath.startsWith(item.path);
                      return (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => handleNav(item.path)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${isItemActive ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                            }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg mt-0.5 ${isItemActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                              }`}
                          >
                            <Icon icon={LinkIcon} size="default" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-tight">{item.label}</div>
                            <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{item.sub}</div>
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
              className={`relative z-10 px-3.5 py-2 text-sm font-semibold rounded-full min-h-11 flex items-center gap-1 cursor-pointer transition-colors ${supportLinks.some((l) => currentPath.startsWith(l.path))
                ? 'text-primary'
                : 'text-foreground/80 hover:text-foreground'
                }`}
              aria-expanded={activeDropdown === 'support'}
              aria-haspopup="true"
            >
              <span>Support</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'support' ? 'rotate-180 text-primary' : 'text-muted-foreground'
                  }`}
              />
            </button>
            {highlightedIndex === 4 && (
              <motion.span
                layoutId="navHoverPill"
                className="absolute inset-0 rounded-full bg-primary/10 shadow-2xs z-0"
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
                  className="absolute top-full right-0 lg:left-0 mt-2 w-72 bg-card/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-border p-2 z-50 overflow-hidden"
                  onMouseEnter={() => {
                    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
                  }}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Customer Care &amp; Policies
                  </div>
                  <div className="space-y-1">
                    {supportLinks.map((item) => {
                      const LinkIcon = item.icon;
                      const isItemActive = currentPath.startsWith(item.path);
                      return (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => handleNav(item.path)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${isItemActive ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                            }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg mt-0.5 ${isItemActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                              }`}
                          >
                            <Icon icon={LinkIcon} size="default" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-tight">{item.label}</div>
                            <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{item.sub}</div>
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

        {/* Action CTAs: Search + Theme + Manage Booking */}
        <div className={`flex items-center gap-2 sm:gap-3 transition-all duration-300 ${
          isSearchExpanded ? 'flex-1 justify-end' : ''
        }`}>
          {/* Gooey Interactive Search for Mobile and Desktop */}
          <div className={`flex items-center transition-all duration-300 ${
            isSearchExpanded ? 'flex-1 max-w-lg justify-end' : ''
          }`}>
            <GooeyInput
              placeholder="Search destinations, bookings, or waybills..."
              collapsedWidth={windowWidth < 640 ? 40 : 100}
              expandedWidth={windowWidth < 640 ? Math.min(240, windowWidth - 110) : 380}
              expandedOffset={windowWidth < 640 ? 42 : 48}
              onOpenChange={setIsSearchExpanded}
              onSubmit={handleHeaderSearch}
            />
          </div>

          {/* Theme Switcher Toggle (Desktop Dropdown) */}
          <ThemeToggle variant="dropdown" />

          {/* Sound Toggle */}
          <div className="hidden sm:flex items-center">
            <SoundToggle />
          </div>

          {/* Primary Manage Booking Button */}
          <Button
            variant={isScrolled ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleNav('/manage')}
            className={`${isSearchExpanded ? 'hidden xl:flex' : 'hidden md:flex'} rounded-full font-bold px-4 sm:px-5 min-h-10 transition-all ${isScrolled ? "hover:bg-primary/80" : "hover:bg-primary focus:bg-primary hover:text-primary-foreground"}`}
          >
            Manage Booking
          </Button>

          {userRole === 'staff' ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleNav('/admin')}
              className="hidden sm:inline-flex rounded-full text-xs font-semibold gap-1.5"
            >
              <Icon icon={User} size="xs" />
              <span>Staff Portal</span>
            </Button>
          ) : userRole === 'customer' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNav('/account')}
              className="hidden sm:inline-flex rounded-full text-xs font-semibold gap-1.5"
            >
              <Icon icon={User} size="xs" />
              <span>Account</span>
            </Button>
          ) : null}

          {/* Mobile Hamburger Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden rounded-full min-h-11 min-w-11"
            aria-label="Toggle mobile navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <Icon icon={isMobileMenuOpen ? X : Menu} size="md" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex justify-end">
            {/* Backdrop overlay prevents touching or scrolling page behind */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Sliding Drawer Container */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.82 }}
              className="relative w-full max-w-sm sm:max-w-md h-full bg-card text-card-foreground shadow-2xl border-l border-border z-10 flex flex-col focus:outline-none"
            >
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => handleNav('/')}
                  className="flex items-center text-left focus:outline-hidden cursor-pointer"
                  aria-label="Ascent Transport Management Home"
                >
                  <Logo variant="mark" size="sm" />
                  <span className="ml-2 font-bold text-sm tracking-tight text-foreground">Menu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center focus:ring-2 focus:ring-primary cursor-pointer active:scale-95 transition-all"
                  aria-label="Close navigation menu drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Drawer Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-6 scroll-smooth touch-pan-y">
                {/* Mobile Drawer Gooey Search */}
                <div className="flex justify-center w-full py-1">
                  <GooeyInput
                    placeholder="Search trips, waybills..."
                    collapsedWidth={120}
                    expandedWidth={Math.min(260, windowWidth - 90)}
                    expandedOffset={42}
                    onSubmit={(q) => {
                      handleHeaderSearch(q);
                      setIsMobileMenuOpen(false);
                    }}
                  />
                </div>

                {/* High Visibility Find Trips Button with Chevron Right */}
                <button
                  type="button"
                  onClick={() => handleNav('/trips')}
                  className="w-full min-h-12 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-sm flex items-center justify-between shadow-xs transition-transform active:scale-[0.99] cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Bus className="w-4 h-4 text-primary-foreground" />
                    <span>Find Scheduled Trips</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-md font-semibold">
                      5 Seat Sienna
                    </span>
                    <ChevronRight className="w-4 h-4 text-primary-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>

                {/* Accordion Navigation Groups */}
                <div className="space-y-2.5">
                  {/* 1. Passenger Travel Accordion */}
                  <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleMobileAccordion('travel')}
                      className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                      aria-expanded={openMobileAccordion === 'travel'}
                    >
                      <div className="flex items-center gap-2.5">
                        <Bus className="w-4 h-4 text-primary" />
                        <span>Passenger Travel</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                          {travelLinks.length}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                            openMobileAccordion === 'travel' ? 'rotate-180 text-primary' : ''
                          }`}
                        />
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {openMobileAccordion === 'travel' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="p-2 pt-0 grid grid-cols-1 gap-1 border-t border-border/60">
                            {travelLinks.map((item) => {
                              const LinkIcon = item.icon;
                              const isItemActive = currentPath.startsWith(item.path);
                              return (
                                <button
                                  key={item.path}
                                  type="button"
                                  onClick={() => handleNav(item.path)}
                                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 min-h-11 cursor-pointer transition-colors ${
                                    isItemActive
                                      ? 'bg-primary/10 text-primary font-bold'
                                      : 'text-foreground hover:bg-muted'
                                  }`}
                                >
                                  <Icon icon={LinkIcon} size="default" className="text-primary shrink-0" />
                                  <div>
                                    <div className="text-xs font-semibold leading-tight">{item.label}</div>
                                    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{item.sub}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 2. Express Courier Accordion */}
                  <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleMobileAccordion('courier')}
                      className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                      aria-expanded={openMobileAccordion === 'courier'}
                    >
                      <div className="flex items-center gap-2.5">
                        <Package className="w-4 h-4 text-primary" />
                        <span>Express Courier</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                          {courierLinks.length}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                            openMobileAccordion === 'courier' ? 'rotate-180 text-primary' : ''
                          }`}
                        />
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {openMobileAccordion === 'courier' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="p-2 pt-0 grid grid-cols-1 gap-1 border-t border-border/60">
                            {courierLinks.map((item) => {
                              const LinkIcon = item.icon;
                              const isItemActive = currentPath.startsWith(item.path);
                              return (
                                <button
                                  key={item.path}
                                  type="button"
                                  onClick={() => handleNav(item.path)}
                                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 min-h-11 cursor-pointer transition-colors ${
                                    isItemActive
                                      ? 'bg-primary/10 text-primary font-bold'
                                      : 'text-foreground hover:bg-muted'
                                  }`}
                                >
                                  <Icon icon={LinkIcon} size="default" className="text-primary shrink-0" />
                                  <div>
                                    <div className="text-xs font-semibold leading-tight">{item.label}</div>
                                    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{item.sub}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 3. Charter & Fleet Accordion */}
                  <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleMobileAccordion('charter')}
                      className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                      aria-expanded={openMobileAccordion === 'charter'}
                    >
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span>Charter &amp; Corporate</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                          {charterLinks.length}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                            openMobileAccordion === 'charter' ? 'rotate-180 text-primary' : ''
                          }`}
                        />
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {openMobileAccordion === 'charter' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="p-2 pt-0 grid grid-cols-1 gap-1 border-t border-border/60">
                            {charterLinks.map((item) => {
                              const LinkIcon = item.icon;
                              const isItemActive = currentPath.startsWith(item.path);
                              return (
                                <button
                                  key={item.path}
                                  type="button"
                                  onClick={() => handleNav(item.path)}
                                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 min-h-11 cursor-pointer transition-colors ${
                                    isItemActive
                                      ? 'bg-primary/10 text-primary font-bold'
                                      : 'text-foreground hover:bg-muted'
                                  }`}
                                >
                                  <Icon icon={LinkIcon} size="default" className="text-primary shrink-0" />
                                  <div>
                                    <div className="text-xs font-semibold leading-tight">{item.label}</div>
                                    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{item.sub}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 4. Support & Policies Accordion */}
                  <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleMobileAccordion('support')}
                      className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                      aria-expanded={openMobileAccordion === 'support'}
                    >
                      <div className="flex items-center gap-2.5">
                        <HelpCircle className="w-4 h-4 text-primary" />
                        <span>Support &amp; Policies</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                          {supportLinks.length}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                            openMobileAccordion === 'support' ? 'rotate-180 text-primary' : ''
                          }`}
                        />
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {openMobileAccordion === 'support' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="p-2 pt-0 grid grid-cols-2 gap-1 text-xs border-t border-border/60">
                            {supportLinks.map((item) => {
                              const isItemActive = currentPath.startsWith(item.path);
                              return (
                                <button
                                  key={item.path}
                                  type="button"
                                  onClick={() => handleNav(item.path)}
                                  className={`text-left px-3 py-2.5 rounded-lg min-h-11 flex items-center cursor-pointer transition-colors ${
                                    isItemActive
                                      ? 'text-primary font-bold bg-primary/10'
                                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Self-Service Action Bar at Bottom of Mobile Menu */}
                <div className="pt-3 border-t border-border flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5 px-1 py-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Color Theme</span>
                    <ThemeToggle variant="segmented" className="w-full" />
                  </div>
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-medium text-muted-foreground">Sound Effects</span>
                    <SoundToggle showLabel />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleNav('/track')}
                    className="w-full rounded-xl text-xs font-bold gap-2 min-h-11"
                  >
                    <Icon icon={Search} size="xs" />
                    <span>Track Waybill Parcel</span>
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleNav('/manage')}
                    className="w-full rounded-xl text-xs font-bold gap-2 min-h-11"
                  >
                    Manage Booking
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
