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
  const [activeDropdown, setActiveDropdown] = useState<'services' | 'support' | null>(null);

  const headerRef = useRef<HTMLElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor scroll offset to adjust navbar height and background smoothly
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setIsScrolled(window.scrollY > 15);
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

  // Services Links (Track removed as requested)
  const serviceLinks: DropdownLink[] = [
    {
      label: 'Express Courier',
      sub: 'Same day intercity parcel and waybill delivery',
      path: '/courier',
      icon: Package,
    },
    {
      label: 'Private Charter',
      sub: 'Dedicated 5 passenger executive Sienna hire',
      path: '/charter',
      icon: Calendar,
    },
    {
      label: 'Corporate Fleet',
      sub: 'Contracted staff transit and business logistics',
      path: '/corporate',
      icon: Building2,
    },
  ];

  // Support & Information Links
  const supportLinks: DropdownLink[] = [
    {
      label: 'Frequently Asked Questions',
      sub: 'Seat selection, 15 minute holds, and luggage limits',
      path: '/faq',
      icon: HelpCircle,
    },
    {
      label: 'Contact & Helplines',
      sub: 'Terminal phone desks and 24/7 WhatsApp dispatch',
      path: '/contact',
      icon: Phone,
    },
    {
      label: 'About Ascent Fleet',
      sub: 'Executive 5 seat standard and safety mission',
      path: '/about',
      icon: Info,
    },
    {
      label: 'Terms of Carriage',
      sub: 'Passenger rights, luggage guidelines, and policies',
      path: '/terms',
      icon: FileText,
    },
    {
      label: 'Privacy Policy',
      sub: 'Data protection and passenger security guidelines',
      path: '/privacy',
      icon: Shield,
    },
  ];

  const handleNav = (path: string) => {
    onNavigate(path);
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  const handleMouseEnter = (type: 'services' | 'support') => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(type);
  };

  const handleMouseLeave = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const toggleDropdown = (type: 'services' | 'support') => {
    setActiveDropdown((prev) => (prev === type ? null : type));
  };

  const isTripsActive = currentPath === '/trips' || currentPath.startsWith('/book');
  const isRoutesActive = currentPath.startsWith('/routes');
  const isTerminalsActive = currentPath.startsWith('/terminals');
  const isServicesActive = serviceLinks.some((l) => currentPath.startsWith(l.path));
  const isSupportActive = supportLinks.some((l) => currentPath.startsWith(l.path));

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-200 bg-background/85 backdrop-blur-md border-b ${
        isScrolled
          ? 'py-2.5 border-border shadow-xs bg-background/95'
          : 'py-4 border-border/40 bg-background/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={() => handleNav('/')}
            className="flex items-center text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1 cursor-pointer transition-transform hover:scale-[1.01]"
            aria-label="Ascent Transport Management Home"
          >
            <Logo variant="full" size="md" />
          </button>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center justify-center flex-1 max-w-xl mx-auto gap-1"
          aria-label="Main navigation"
        >
          {/* 1. Book Trip */}
          <button
            type="button"
            onClick={() => handleNav('/trips')}
            className={`px-3 py-1.5 text-sm font-normal rounded-lg min-h-[44px] flex items-center gap-1.5 cursor-pointer transition-colors ${
              isTripsActive
                ? 'text-primary font-medium bg-primary/10'
                : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Bus className="w-4 h-4 text-primary" />
            <span>Book Trip</span>
          </button>

          {/* 2. Routes */}
          <button
            type="button"
            onClick={() => handleNav('/routes')}
            className={`px-3 py-1.5 text-sm font-normal rounded-lg min-h-[44px] flex items-center gap-1 cursor-pointer transition-colors ${
              isRoutesActive
                ? 'text-primary font-medium bg-primary/10'
                : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <span>Routes</span>
          </button>

          {/* 3. Terminals */}
          <button
            type="button"
            onClick={() => handleNav('/terminals')}
            className={`px-3 py-1.5 text-sm font-normal rounded-lg min-h-[44px] flex items-center gap-1 cursor-pointer transition-colors ${
              isTerminalsActive
                ? 'text-primary font-medium bg-primary/10'
                : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <span>Terminals</span>
          </button>

          {/* 4. Services Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('services')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => toggleDropdown('services')}
              className={`px-3 py-1.5 text-sm font-normal rounded-lg min-h-[44px] flex items-center gap-1 cursor-pointer transition-colors ${
                isServicesActive || activeDropdown === 'services'
                  ? 'text-primary font-medium bg-primary/10'
                  : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
              }`}
              aria-expanded={activeDropdown === 'services'}
              aria-haspopup="true"
            >
              <span>Services</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === 'services' ? 'rotate-180 text-primary' : 'text-muted-foreground'
                }`}
              />
            </button>

            {/* Seamless dropdown wrapper */}
            <AnimatePresence>
              {activeDropdown === 'services' && (
                <div className="absolute top-full left-0 pt-2 z-50">
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="w-72 bg-popover/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-border p-2 overflow-hidden"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Logistics &amp; Private Fleet
                    </div>
                    <div className="space-y-1">
                      {serviceLinks.map((item) => {
                        const Icon = item.icon;
                        const isItemActive = currentPath.startsWith(item.path);
                        return (
                          <button
                            key={item.path}
                            type="button"
                            onClick={() => handleNav(item.path)}
                            className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-start gap-3 cursor-pointer ${
                              isItemActive
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted/60 text-foreground'
                            }`}
                          >
                            <div
                              className={`p-1.5 rounded-lg mt-0.5 ${
                                isItemActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-normal leading-tight">{item.label}</div>
                              <div className="text-xs text-muted-foreground leading-tight mt-0.5">{item.sub}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* 5. Support Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('support')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => toggleDropdown('support')}
              className={`px-3 py-1.5 text-sm font-normal rounded-lg min-h-[44px] flex items-center gap-1 cursor-pointer transition-colors ${
                isSupportActive || activeDropdown === 'support'
                  ? 'text-primary font-medium bg-primary/10'
                  : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
              }`}
              aria-expanded={activeDropdown === 'support'}
              aria-haspopup="true"
            >
              <span>Support</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === 'support' ? 'rotate-180 text-primary' : 'text-muted-foreground'
                }`}
              />
            </button>

            {/* Seamless dropdown wrapper */}
            <AnimatePresence>
              {activeDropdown === 'support' && (
                <div className="absolute top-full left-0 pt-2 z-50">
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="w-72 bg-popover/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-border p-2 overflow-hidden"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
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
                            className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-start gap-3 cursor-pointer ${
                              isItemActive
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted/60 text-foreground'
                            }`}
                          >
                            <div
                              className={`p-1.5 rounded-lg mt-0.5 ${
                                isItemActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-normal leading-tight">{item.label}</div>
                              <div className="text-xs text-muted-foreground leading-tight mt-0.5">{item.sub}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Right: Actions (Theme Toggle + Manage Booking) */}
        <div className="flex items-center gap-2.5">
          {/* Theme Changer */}
          <ThemeToggle />

          {/* Primary Manage Booking Button with Small Text and Normal Font Weight */}
          <button
            type="button"
            onClick={() => handleNav('/manage')}
            className="px-4 py-2 text-xs font-normal text-foreground border border-border rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors min-h-[44px] flex items-center cursor-pointer"
          >
            Manage Booking
          </button>

          {userRole === 'staff' ? (
            <button
              type="button"
              onClick={() => handleNav('/admin')}
              className="hidden sm:flex px-3.5 py-2 text-xs font-normal text-primary-foreground bg-primary hover:opacity-90 rounded-full min-h-[44px] items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Staff Portal</span>
            </button>
          ) : userRole === 'customer' ? (
            <button
              type="button"
              onClick={() => handleNav('/account')}
              className="hidden sm:flex px-3.5 py-2 text-xs font-normal text-foreground bg-muted hover:bg-muted/80 rounded-full min-h-[44px] items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Account</span>
            </button>
          ) : null}

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-11 h-11 rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors cursor-pointer"
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
            className="md:hidden fixed top-16 left-4 right-4 bg-popover/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-border p-5 z-50 max-h-[85vh] overflow-y-auto text-popover-foreground"
          >
            <div className="space-y-6">
              {/* High Visibility Book Trip Button */}
              <button
                type="button"
                onClick={() => handleNav('/trips')}
                className="w-full min-h-[48px] px-4 py-3 bg-primary hover:opacity-90 text-primary-foreground rounded-xl font-normal text-sm flex items-center justify-between shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Bus className="w-4 h-4" />
                  <span>Book Trip</span>
                </div>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md font-normal">
                  5 Seat Sienna
                </span>
              </button>

              {/* Direct Links Grid: Routes & Terminals */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleNav('/routes')}
                  className={`px-3 py-2.5 rounded-xl flex items-center gap-2 border text-xs font-normal ${
                    isRoutesActive
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'border-border text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Bus className="w-4 h-4 text-primary" />
                  <span>Routes</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('/terminals')}
                  className={`px-3 py-2.5 rounded-xl flex items-center gap-2 border text-xs font-normal ${
                    isTerminalsActive
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'border-border text-foreground hover:bg-muted/50'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Terminals</span>
                </button>
              </div>

              {/* Theme Switcher Row in Mobile Menu */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-xs font-normal text-foreground">Appearance</span>
                <ThemeToggle showLabel={true} />
              </div>

              {/* Services Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block px-1">
                  Services
                </span>
                <div className="grid grid-cols-1 gap-1">
                  {serviceLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => handleNav(item.path)}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 min-h-[44px] cursor-pointer ${
                          currentPath.startsWith(item.path)
                            ? 'bg-primary/10 text-primary font-normal'
                            : 'text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                        <div>
                          <div className="text-sm font-normal leading-tight">{item.label}</div>
                          <div className="text-xs text-muted-foreground leading-tight">{item.sub}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Support & Policies Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block px-1">
                  Support &amp; Policies
                </span>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {supportLinks.map((item) => (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => handleNav(item.path)}
                      className={`text-left px-3 py-2 rounded-lg min-h-[44px] flex items-center cursor-pointer ${
                        currentPath.startsWith(item.path)
                          ? 'text-primary font-normal bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Self-Service Action Bar at Bottom of Mobile Menu */}
              <div className="pt-3 border-t border-border flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleNav('/manage')}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-foreground text-background text-xs font-normal hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer"
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
