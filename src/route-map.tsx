/**
 * Dev-Preview Only: Thin Path-to-Component Mapping
 * Maps browser URL paths directly to the authoritative Next.js App Router page components.
 * NO duplicated page markup.
 */

import React from 'react';
import HomePage from '../apps/web/src/app/(public)/page.tsx';
import TripsPage from '../apps/web/src/app/(public)/trips/page.tsx';
import BookTripPage from '../apps/web/src/app/(public)/book/[tripId]/page.tsx';
import BookingSuccessPage from '../apps/web/src/app/(public)/book/success/[ref]/page.tsx';
import ManageBookingPage from '../apps/web/src/app/(public)/manage/page.tsx';
import CancelBookingPage from '../apps/web/src/app/(public)/cancel/page.tsx';
import CourierPage from '../apps/web/src/app/(public)/courier/page.tsx';
import TrackParcelPage from '../apps/web/src/app/(public)/track/page.tsx';
import CharterPage from '../apps/web/src/app/(public)/charter/page.tsx';
import CorporatePage from '../apps/web/src/app/(public)/corporate/page.tsx';
import RoutesPage from '../apps/web/src/app/(public)/routes/page.tsx';
import RouteDetailPage from '../apps/web/src/app/(public)/routes/[slug]/page.tsx';
import TerminalsPage from '../apps/web/src/app/(public)/terminals/page.tsx';
import AboutPage from '../apps/web/src/app/(public)/about/page.tsx';
import ContactPage from '../apps/web/src/app/(public)/contact/page.tsx';
import FaqPage from '../apps/web/src/app/(public)/faq/page.tsx';
import TermsPage from '../apps/web/src/app/(public)/terms/page.tsx';
import PrivacyPage from '../apps/web/src/app/(public)/privacy/page.tsx';
import DesignSystemPage from '../apps/web/src/app/(public)/design/page.tsx';

import AccountPage from '../apps/web/src/app/(account)/account/page.tsx';
import CustomerLoginPage from '../apps/web/src/app/(auth)/login/page.tsx';
import AdminLoginPage from '../apps/web/src/app/(auth)/admin/login/page.tsx';

import AdminDashboardPage from '../apps/web/src/app/(admin)/admin/page.tsx';
import AdminTripsPage from '../apps/web/src/app/(admin)/admin/trips/page.tsx';
import AdminBookingsPage from '../apps/web/src/app/(admin)/admin/bookings/page.tsx';
import AdminCheckInPage from '../apps/web/src/app/(admin)/admin/check-in/page.tsx';
import AdminParcelsPage from '../apps/web/src/app/(admin)/admin/parcels/page.tsx';
import AdminCustomersPage from '../apps/web/src/app/(admin)/admin/customers/page.tsx';
import AdminInquiriesPage from '../apps/web/src/app/(admin)/admin/inquiries/page.tsx';
import AdminRequestsPage from '../apps/web/src/app/(admin)/admin/requests/page.tsx';
import AdminPricingPage from '../apps/web/src/app/(admin)/admin/pricing/page.tsx';
import AdminFleetPage from '../apps/web/src/app/(admin)/admin/fleet/page.tsx';
import AdminTerminalsPage from '../apps/web/src/app/(admin)/admin/terminals/page.tsx';
import AdminReportsPage from '../apps/web/src/app/(admin)/admin/reports/page.tsx';
import AdminSettingsPage from '../apps/web/src/app/(admin)/admin/settings/page.tsx';

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
  // Public Routes
  if (currentPath === '/') return <HomePage onNavigate={onNavigate} />;
  if (currentPath === '/trips') return <TripsPage onNavigate={onNavigate} />;
  if (currentPath.startsWith('/book/success/')) {
    const ref = currentPath.replace('/book/success/', '') || 'ATM-7K9W2P';
    return <BookingSuccessPage params={{ ref }} onNavigate={onNavigate} />;
  }
  if (currentPath.startsWith('/book/')) {
    const tripId = currentPath.replace('/book/', '').split('?')[0] || 'trip-enugu-abuja-01';
    return <BookTripPage params={{ tripId }} onNavigate={onNavigate} />;
  }
  if (currentPath === '/manage') return <ManageBookingPage onNavigate={onNavigate} />;
  if (currentPath === '/cancel') return <CancelBookingPage />;
  if (currentPath === '/courier') return <CourierPage onNavigate={onNavigate} />;
  if (currentPath === '/track') return <TrackParcelPage />;
  if (currentPath === '/charter') return <CharterPage />;
  if (currentPath === '/corporate') return <CorporatePage />;
  if (currentPath === '/routes') return <RoutesPage onNavigate={onNavigate} />;
  if (currentPath.startsWith('/routes/')) {
    const slug = currentPath.replace('/routes/', '') || 'enugu-abuja';
    return <RouteDetailPage params={{ slug }} onNavigate={onNavigate} />;
  }
  if (currentPath === '/terminals') return <TerminalsPage />;
  if (currentPath === '/about') return <AboutPage />;
  if (currentPath === '/contact') return <ContactPage />;
  if (currentPath === '/faq') return <FaqPage />;
  if (currentPath === '/terms') return <TermsPage />;
  if (currentPath === '/privacy') return <PrivacyPage />;
  if (currentPath === '/design') return <DesignSystemPage />;

  // Account
  if (currentPath === '/account') return <AccountPage onNavigate={onNavigate} />;

  // Auth
  if (currentPath === '/login') return <CustomerLoginPage onLoginSuccess={onCustomerLogin} />;
  if (currentPath === '/admin/login') return <AdminLoginPage onLoginSuccess={onStaffLogin} />;

  // Admin
  if (currentPath === '/admin') return <AdminDashboardPage onNavigate={onNavigate} />;
  if (currentPath === '/admin/trips') return <AdminTripsPage />;
  if (currentPath === '/admin/bookings') return <AdminBookingsPage />;
  if (currentPath === '/admin/check-in') return <AdminCheckInPage />;
  if (currentPath === '/admin/parcels') return <AdminParcelsPage />;
  if (currentPath === '/admin/customers') return <AdminCustomersPage />;
  if (currentPath === '/admin/inquiries') return <AdminInquiriesPage />;
  if (currentPath === '/admin/requests') return <AdminRequestsPage />;
  if (currentPath === '/admin/pricing') return <AdminPricingPage />;
  if (currentPath === '/admin/fleet') return <AdminFleetPage />;
  if (currentPath === '/admin/terminals') return <AdminTerminalsPage />;
  if (currentPath === '/admin/reports') return <AdminReportsPage />;
  if (currentPath === '/admin/settings') return <AdminSettingsPage />;

  return <HomePage onNavigate={onNavigate} />;
}
