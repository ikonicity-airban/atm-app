/**
 * Dev-Preview Only: Thin Path-to-Component Mapping
 * Maps browser URL paths directly to the authoritative Next.js App Router page components.
 * NO duplicated page markup.
 */

import React from 'react';
import HomePage from '@/app/(public)/page.tsx';
import TripsPage from '@/app/(public)/trips/page.tsx';
import BookTripPage from '@/app/(public)/book/[tripId]/page.tsx';
import BookingSuccessPage from '@/app/(public)/book/success/[ref]/page.tsx';
import ManageBookingPage from '@/app/(public)/manage/page.tsx';
import CancelBookingPage from '@/app/(public)/cancel/page.tsx';
import CourierPage from '@/app/(public)/courier/page.tsx';
import TrackParcelPage from '@/app/(public)/track/page.tsx';
import CharterPage from '@/app/(public)/charter/page.tsx';
import CorporatePage from '@/app/(public)/corporate/page.tsx';
import RoutesPage from '@/app/(public)/routes/page.tsx';
import RouteDetailPage from '@/app/(public)/routes/[corridor]/page.tsx';
import TerminalsPage from '@/app/(public)/terminals/page.tsx';
import AboutPage from '@/app/(public)/about/page.tsx';
import ContactPage from '@/app/(public)/contact/page.tsx';
import FaqPage from '@/app/(public)/faq/page.tsx';
import TermsPage from '@/app/(public)/terms/page.tsx';
import PrivacyPage from '@/app/(public)/privacy/page.tsx';
import DesignSystemPage from '@/app/(public)/design/page.tsx';

import AccountPage from '@/app/(account)/account/page.tsx';
import CustomerLoginPage from '@/app/(auth)/login/page.tsx';
import AdminLoginPage from '@/app/(auth)/admin/login/page.tsx';

import AdminDashboardPage from '@/app/(admin)/admin/page.tsx';
import AdminTripsPage from '@/app/(admin)/admin/trips/page.tsx';
import HighwayManifestPrintPage from '@/app/(admin)/admin/trips/[tripId]/manifest/page.tsx';
import AdminBookingsPage from '@/app/(admin)/admin/bookings/page.tsx';
import AdminCheckInPage from '@/app/(admin)/admin/check-in/page.tsx';
import AdminParcelsPage from '@/app/(admin)/admin/parcels/page.tsx';
import AdminCustomersPage from '@/app/(admin)/admin/customers/page.tsx';
import AdminInquiriesPage from '@/app/(admin)/admin/inquiries/page.tsx';
import AdminRequestsPage from '@/app/(admin)/admin/requests/page.tsx';
import AdminPricingPage from '@/app/(admin)/admin/pricing/page.tsx';
import AdminFleetPage from '@/app/(admin)/admin/fleet/page.tsx';
import AdminTerminalsPage from '@/app/(admin)/admin/terminals/page.tsx';
import AdminReportsPage from '@/app/(admin)/admin/reports/page.tsx';
import AdminSettingsPage from '@/app/(admin)/admin/settings/page.tsx';

export interface RouteMapProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onStaffLogin: () => void;
  onCustomerLogin: () => void;
}

export function renderRouteComponent({
  currentPath,
  onNavigate,
  onStaffLogin,
  onCustomerLogin,
}: RouteMapProps): React.ReactNode {
  // Extract clean pathname without query string for route matching
  const [pathname = '/'] = currentPath.split('?');

  // Public Routes
  if (pathname === '/') return <HomePage onNavigate={onNavigate} />;
  if (pathname === '/trips') return <TripsPage onNavigate={onNavigate} />;
  if (pathname.startsWith('/book/success/')) {
    const ref = pathname.replace('/book/success/', '') || 'ATM-7K9W2P';
    return <BookingSuccessPage params={{ ref }} onNavigate={onNavigate} />;
  }
  if (pathname.startsWith('/book/')) {
    const tripId = pathname.replace('/book/', '') || 'trip-enugu-abuja-01';
    return <BookTripPage params={{ tripId }} onNavigate={onNavigate} />;
  }
  if (pathname === '/manage') return <ManageBookingPage onNavigate={onNavigate} />;
  if (pathname === '/cancel') return <CancelBookingPage />;
  if (pathname === '/courier') return <CourierPage onNavigate={onNavigate} />;
  if (pathname === '/track') return <TrackParcelPage onNavigate={onNavigate} />;
  if (pathname === '/charter') return <CharterPage />;
  if (pathname === '/corporate') return <CorporatePage />;
  if (pathname === '/routes') return <RoutesPage onNavigate={onNavigate} />;
  if (pathname.startsWith('/routes/')) {
    const corridor = pathname.replace('/routes/', '') || 'enugu-abuja';
    return <RouteDetailPage params={Promise.resolve({ corridor })} />;
  }
  if (pathname === '/terminals') return <TerminalsPage />;
  if (pathname === '/about') return <AboutPage />;
  if (pathname === '/contact') return <ContactPage />;
  if (pathname === '/faq') return <FaqPage />;
  if (pathname === '/terms') return <TermsPage />;
  if (pathname === '/privacy') return <PrivacyPage />;
  if (pathname === '/design') return <DesignSystemPage />;

  // Account
  if (pathname === '/account') return <AccountPage {...({ onNavigate } as any)} />;

  // Auth
  if (pathname === '/login') return <CustomerLoginPage {...({ onLoginSuccess: onCustomerLogin } as any)} />;
  if (pathname === '/admin/login') return <AdminLoginPage onLoginSuccess={onStaffLogin} />;

  // Admin
  if (pathname === '/admin') return <AdminDashboardPage onNavigate={onNavigate} />;
  if (pathname.startsWith('/admin/trips/') && pathname.endsWith('/manifest')) {
    const tripId = pathname.replace('/admin/trips/', '').replace('/manifest', '');
    return <HighwayManifestPrintPage params={{ tripId }} />;
  }
  if (pathname === '/admin/trips') return <AdminTripsPage />;
  if (pathname === '/admin/bookings') return <AdminBookingsPage />;
  if (pathname === '/admin/check-in') return <AdminCheckInPage />;
  if (pathname === '/admin/parcels') return <AdminParcelsPage />;
  if (pathname === '/admin/customers') return <AdminCustomersPage />;
  if (pathname === '/admin/inquiries') return <AdminInquiriesPage />;
  if (pathname === '/admin/requests') return <AdminRequestsPage />;
  if (pathname === '/admin/pricing') return <AdminPricingPage />;
  if (pathname === '/admin/fleet') return <AdminFleetPage />;
  if (pathname === '/admin/terminals') return <AdminTerminalsPage />;
  if (pathname === '/admin/reports') return <AdminReportsPage />;
  if (pathname === '/admin/settings') return <AdminSettingsPage />;

  return <HomePage onNavigate={onNavigate} />;
}
