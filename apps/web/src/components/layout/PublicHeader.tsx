import React, { useState } from 'react';
import { Menu, X, Bus, Package, Search, Phone, ShieldCheck, User } from 'lucide-react';
import { Logo } from '../ui/Logo.tsx';
import { Button } from '../ui/Button.tsx';

interface PublicHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  userRole?: 'customer' | 'staff' | null;
}

export function PublicHeader({ currentPath, onNavigate, userRole }: PublicHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Book', path: '/trips', icon: Bus },
    { label: 'Courier', path: '/courier', icon: Package },
    { label: 'Track', path: '/track', icon: Search },
    { label: 'Charter', path: '/charter', icon: ShieldCheck },
    { label: 'Terminals', path: '/terminals', icon: Bus },
    { label: 'Contact', path: '/contact', icon: Phone },
  ];

  const handleNav = (path: string) => {
    onNavigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => handleNav('/')}
            className="flex items-center text-left focus:outline-none focus:ring-2 focus:ring-[#ca2484] rounded p-1 cursor-pointer"
            aria-label="Ascent Transport Management Home"
          >
            <Logo variant="full" />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNav(item.path)}
                  className={`px-3 py-2 text-sm font-semibold rounded transition-colors min-h-[44px] flex items-center cursor-pointer ${
                    isActive
                      ? 'text-[#ca2484] bg-pink-50'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Action CTAs: Primary "Book a seat" and user status */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleNav('/trips')}
              className="px-4 py-2.5 text-xs font-bold text-white bg-[#ca2484] hover:bg-[#aa1769] rounded shadow-xs min-h-[44px] flex items-center gap-1.5 cursor-pointer"
            >
              Book a seat
            </button>

            {userRole === 'staff' ? (
              <button
                type="button"
                onClick={() => handleNav('/admin')}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded min-h-[44px] flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                Staff Portal
              </button>
            ) : userRole === 'customer' ? (
              <button
                type="button"
                onClick={() => handleNav('/account')}
                className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded min-h-[44px] flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                Account
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleNav('/login')}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 min-h-[44px] flex items-center cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 min-w-[44px] min-h-[44px] flex items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-[#ca2484] cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Solid Sticky Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-1 shadow-lg">
          <button
            type="button"
            onClick={() => handleNav('/trips')}
            className="w-full mb-3 text-center px-4 py-3 text-sm font-bold text-white bg-[#ca2484] rounded min-h-[44px] flex items-center justify-center shadow-xs"
          >
            Book a seat
          </button>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded text-base font-medium min-h-[44px] cursor-pointer ${
                  isActive
                    ? 'text-[#ca2484] bg-pink-50 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5 text-slate-500" />
                {item.label}
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-200 space-y-2">
            <button
              type="button"
              onClick={() => handleNav('/manage')}
              className="w-full text-left px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded min-h-[44px] flex items-center"
            >
              Manage Booking / Cancellation
            </button>
            <button
              type="button"
              onClick={() => handleNav(userRole === 'staff' ? '/admin' : '/login')}
              className="w-full text-center px-4 py-3 text-sm font-semibold text-white bg-slate-900 rounded min-h-[44px] flex items-center justify-center"
            >
              {userRole === 'staff' ? 'Staff Portal' : 'Customer Sign In'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
