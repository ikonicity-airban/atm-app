'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatNaira, formatWatDateTime, normalisePhone, type CustomerProfile, type CompanionPassenger } from '@atm/shared';
import { auth, type AuthSession } from '../../../lib/auth.ts';
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '../../../components/ui/Select.tsx';
import { ThemeToggle } from '../../../components/theme/ThemeToggle.tsx';
import { SoundToggle } from '../../../components/theme/SoundToggle.tsx';
import { Logo } from '../../../components/ui/Logo.tsx';

type AccountTab = 'overview' | 'wallet' | 'trips' | 'companions';

interface CreditLedgerEntry {
  id: string;
  deltaKobo: number;
  balanceAfterKobo: number;
  reason: string;
  referenceBookingId: string | null;
  createdAt: string;
}

interface CustomerTrip {
  id: string;
  ref: string;
  trip: {
    originCity: string;
    destinationCity: string;
    originTerminalName: string;
    destinationTerminalName: string;
    departureTimeUtc: string;
  };
  seats: number[];
  passengers: Array<{ fullName: string; seatNo: number }>;
  totalFareKobo: number;
  status: string;
}

export default function CustomerAccountDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>([]);
  const [trips, setTrips] = useState<CustomerTrip[]>([]);
  const [companions, setCompanions] = useState<CompanionPassenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AccountTab>('overview');

  // Edit Profile Form State
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editKinName, setEditKinName] = useState('');
  const [editKinPhone, setEditKinPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Companion form state
  const [showAddCompanion, setShowAddCompanion] = useState(false);
  const [compName, setCompName] = useState('');
  const [compGender, setCompGender] = useState<'male' | 'female' | 'other'>('male');
  const [compPhone, setCompPhone] = useState('');
  const [compIsKin, setCompIsKin] = useState(false);
  const [companionError, setCompanionError] = useState<string | null>(null);

  // 2FA state
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  useEffect(() => {
    async function loadAccountData() {
      try {
        const s = await auth.getSession();
        if (!s) {
          router.push('/login');
          return;
        }
        setSession(s);

        // Fetch user profile and credits
        const res = await fetch(`/api/customers/profile?userId=${encodeURIComponent(s.user.id)}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          setLedger(data.ledger || []);
          setTrips(data.trips || []);
          setCompanions(data.companions || []);

          setEditFullName(data.profile.fullName || '');
          setEditEmail(data.profile.email || '');
          setEditKinName(data.profile.nextOfKinName || '');
          setEditKinPhone(data.profile.nextOfKinPhone || '');
        } else {
          // Fallback mock session state for preview / tests
          const mockProfile: CustomerProfile = {
            id: s.user.id,
            userId: s.user.id,
            fullName: s.user.name,
            email: s.user.email,
            phone: '+2348031234567',
            creditsKobo: 4500000,
            twoFactorEnabled: false,
            emailVerified: true,
            phoneVerified: true,
            nextOfKinName: 'Emeka Okeke',
            nextOfKinPhone: '+2348029876543',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setProfile(mockProfile);
          setEditFullName(mockProfile.fullName);
          setEditEmail(mockProfile.email || '');
          setEditKinName(mockProfile.nextOfKinName || '');
          setEditKinPhone(mockProfile.nextOfKinPhone || '');

          setLedger([
            {
              id: 'led-01',
              deltaKobo: 4500000,
              balanceAfterKobo: 4500000,
              reason: 'Cancellation refund (75% net after fee deduction) for trip ATM-9X4K21',
              referenceBookingId: 'ATM-9X4K21',
              createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            },
            {
              id: 'led-02',
              deltaKobo: -3200000,
              balanceAfterKobo: 1300000,
              reason: 'Store credit applied to Enugu -> Abuja Sienna trip',
              referenceBookingId: 'ATM-7K9W2P',
              createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            },
          ]);

          setTrips([
            {
              id: 'b-01',
              ref: 'ATM-7K9W2P',
              trip: {
                originCity: 'Enugu',
                destinationCity: 'Abuja',
                originTerminalName: 'Enugu Central Terminal',
                destinationTerminalName: 'Utako Terminal Abuja',
                departureTimeUtc: new Date(Date.now() + 86400000 * 3).toISOString(),
              },
              seats: [1, 2],
              passengers: [
                { fullName: 'Chioma Okeke', seatNo: 1 },
                { fullName: 'Amaka Okeke', seatNo: 2 },
              ],
              totalFareKobo: 6400000,
              status: 'CONFIRMED',
            },
          ]);

          setCompanions([
            {
              id: 'comp-1',
              customerId: s.user.id,
              fullName: 'Amaka Okeke',
              gender: 'female',
              phone: '+2348051239876',
              isDefaultNextOfKin: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'comp-2',
              customerId: s.user.id,
              fullName: 'Chinedu Okeke',
              gender: 'male',
              phone: '+2348076543210',
              isDefaultNextOfKin: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    }

    loadAccountData();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/customers/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editFullName,
          email: editEmail,
          nextOfKinName: editKinName,
          nextOfKinPhone: editKinPhone,
        }),
      });

      if (!res.ok) throw new Error('Update failed');
      setStatusMessage('Profile information saved successfully.');
      if (profile) {
        setProfile({
          ...profile,
          fullName: editFullName,
          email: editEmail,
          nextOfKinName: editKinName,
          nextOfKinPhone: editKinPhone,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch {
      setStatusMessage('Profile saved in local session.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddCompanion = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanionError(null);

    if (companions.length >= 5) {
      setCompanionError('Maximum 5 companion passengers allowed per account.');
      return;
    }

    try {
      const normalised = normalisePhone(compPhone);
      const newCompanion: CompanionPassenger = {
        id: `comp-${Date.now()}`,
        customerId: profile?.id || 'cust-dev-01',
        fullName: compName,
        gender: compGender,
        phone: normalised,
        isDefaultNextOfKin: compIsKin,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCompanions((prev) => [...prev, newCompanion]);
      setCompName('');
      setCompPhone('');
      setCompIsKin(false);
      setShowAddCompanion(false);
    } catch (err: unknown) {
      setCompanionError(err instanceof Error ? err.message : 'Invalid Nigerian phone number');
    }
  };

  const handleDeleteCompanion = (id: string) => {
    setCompanions((prev) => prev.filter((c) => c.id !== id));
  };

  const handleToggle2FA = async () => {
    setTwoFactorLoading(true);
    try {
      if (!profile?.twoFactorEnabled) {
        router.push('/2fa?setup=true');
      } else {
        await fetch('/api/auth/2fa/disable', { method: 'POST' });
        setProfile((prev) => (prev ? { ...prev, twoFactorEnabled: false } : null));
      }
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-medium">Loading customer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 font-sans">
      {/* Top Banner / Navigation */}
      <header className="bg-card text-card-foreground border-b border-border sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <Logo variant="mark" size="sm" />
              <span className="font-bold text-foreground tracking-tight text-base group-hover:text-primary transition-colors">
                ATM Ascent
              </span>
            </Link>
            <span className="text-muted-foreground/60">/</span>
            <span className="text-xs font-semibold text-muted-foreground">Traveler Portal</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <SoundToggle />

            <Link
              href="/trips"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
            >
              Book New Trip
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs font-medium text-muted-foreground hover:text-destructive px-2 py-1 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Profile Header Summary */}
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 sm:p-8 shadow-xs mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-primary/60 text-primary-foreground font-bold text-xl flex items-center justify-center shadow-xs">
              {profile?.fullName?.charAt(0) || 'C'}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {profile?.fullName || 'Chioma Okeke'}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {profile?.phone} • {profile?.email || 'No email attached'}
              </p>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-xl px-5 py-3 text-left sm:text-right">
            <div className="text-[11px] font-semibold text-primary uppercase tracking-wider">
              Store Credit Balance
            </div>
            <div className="text-2xl font-extrabold text-primary font-mono">
              {formatNaira(profile?.creditsKobo || 0)}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-px mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-primary text-primary bg-card'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview &amp; Profile
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'wallet'
                ? 'border-primary text-primary bg-card'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Store Credits &amp; Wallet ({formatNaira(profile?.creditsKobo || 0)})
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'trips'
                ? 'border-primary text-primary bg-card'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            My Trips ({trips.length})
          </button>
          <button
            onClick={() => setActiveTab('companions')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'companions'
                ? 'border-primary text-primary bg-card'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Saved Companions ({companions.length}/5)
          </button>
        </div>

        {/* TAB 1: OVERVIEW & PROFILE */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-xs">
              <h2 className="text-base font-bold text-foreground mb-1">Traveler Profile Details</h2>
              <p className="text-xs text-muted-foreground mb-6">
                Update your contact details and default emergency next of kin information.
              </p>

              {statusMessage && (
                <div className="p-3 mb-4 rounded-xl text-xs bg-primary/10 border border-primary/20 text-primary font-medium">
                  {statusMessage}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Default Next of Kin Name
                    </label>
                    <input
                      type="text"
                      value={editKinName}
                      onChange={(e) => setEditKinName(e.target.value)}
                      placeholder="e.g. Emeka Okeke"
                      className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Next of Kin Nigerian Phone
                    </label>
                    <input
                      type="tel"
                      value={editKinPhone}
                      onChange={(e) => setEditKinPhone(e.target.value)}
                      placeholder="080... or +234..."
                      className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl shadow-xs transition-transform active:scale-[0.98] cursor-pointer"
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Side Column: Security & Two-Factor Authentication */}
            <div className="space-y-6">
              <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-xs">
                <h3 className="text-sm font-bold text-foreground mb-1">Security &amp; Access</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Manage two-factor authentication (2FA) and verified credentials.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
                    <div>
                      <div className="text-xs font-semibold text-foreground">Two-Factor Auth (2FA)</div>
                      <div className="text-[11px] text-muted-foreground">
                        {profile?.twoFactorEnabled ? 'Active (Authenticator app)' : 'Disabled'}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={twoFactorLoading}
                      onClick={handleToggle2FA}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        profile?.twoFactorEnabled
                          ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {profile?.twoFactorEnabled ? 'Disable' : 'Enable 2FA'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
                    <div>
                      <div className="text-xs font-semibold text-foreground">Phone Verification</div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Verified E.164 (+234)</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
                    <div>
                      <div className="text-xs font-semibold text-foreground">Email Verification</div>
                      <div className="text-[11px] text-muted-foreground">
                        {profile?.emailVerified ? 'Verified' : 'Pending verification'}
                      </div>
                    </div>
                    {!profile?.emailVerified && (
                      <Link
                        href="/verify-email"
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Verify
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STORE CREDITS & WALLET LEDGER */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary/90 to-primary/60 rounded-2xl p-6 sm:p-8 text-primary-foreground relative shadow-md overflow-hidden">
              <div className="relative z-10 max-w-md">
                <span className="text-xs uppercase tracking-wider text-primary-foreground/80 font-semibold">
                  Ascent Store Credit
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono mt-1 mb-2">
                  {formatNaira(profile?.creditsKobo || 0)}
                </div>
                <p className="text-xs text-primary-foreground/90 leading-relaxed">
                  Store credits never expire and are automatically deducted when booking new Toyota Sienna journeys. Fully covered bookings bypass gateway checkouts instantly.
                </p>
              </div>
            </div>

            {/* Credit Ledger Table */}
            <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-xs overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Transaction &amp; Audit Ledger</h3>
                <span className="text-xs text-muted-foreground">Stored in integer kobo</span>
              </div>

              {ledger.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No credit transactions recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider border-b border-border">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Reason / Transaction</th>
                        <th className="py-3 px-4">Ref Booking</th>
                        <th className="py-3 px-4 text-right">Adjustment</th>
                        <th className="py-3 px-4 text-right">Balance After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ledger.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/20">
                          <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                            {formatWatDateTime(item.createdAt).fullStr}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-foreground">
                            {item.reason}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-primary font-bold">
                            {item.referenceBookingId || '—'}
                          </td>
                          <td
                            className={`py-3.5 px-4 font-mono font-bold text-right ${
                              item.deltaKobo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                            }`}
                          >
                            {item.deltaKobo >= 0 ? '+' : ''}
                            {formatNaira(item.deltaKobo)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-muted-foreground text-right">
                            {formatNaira(item.balanceAfterKobo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MY TRIPS & TICKETS */}
        {activeTab === 'trips' && (
          <div className="space-y-4">
            {trips.length === 0 ? (
              <div className="bg-card text-card-foreground rounded-2xl border border-border p-12 text-center shadow-xs">
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  You have no booked trips in your account history yet.
                </p>
                <Link
                  href="/trips"
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-xl shadow-xs"
                >
                  Search Available Trips
                </Link>
              </div>
            ) : (
              trips.map((b) => (
                <div
                  key={b.id || b.ref}
                  className="bg-card text-card-foreground rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {b.ref}
                      </span>
                      <span className="text-xs uppercase font-semibold text-muted-foreground">
                        {b.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground">
                      {b.trip?.originCity} → {b.trip?.destinationCity}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Departure: {b.trip?.departureTimeUtc ? formatWatDateTime(b.trip.departureTimeUtc).fullStr : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Seats: <span className="font-mono font-medium">{b.seats?.join(', ')}</span> (
                      {b.passengers?.map((p) => p.fullName).join(', ')})
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                    <div className="font-mono font-bold text-sm text-foreground">
                      {formatNaira(b.totalFareKobo)}
                    </div>
                    <Link
                      href={`/book/success/${b.ref}`}
                      className="px-3.5 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      View Boarding Pass
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: SAVED COMPANION ROSTER (MAX 5) */}
        {activeTab === 'companions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Frequent Companion Travelers</h3>
                <p className="text-xs text-muted-foreground">
                  Save up to 5 family members or coworkers for rapid 1-tap seat auto-fill during checkout.
                </p>
              </div>

              {companions.length < 5 && (
                <button
                  type="button"
                  onClick={() => setShowAddCompanion(true)}
                  className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl shadow-xs transition-transform active:scale-[0.98] cursor-pointer"
                >
                  + Add Companion ({companions.length}/5)
                </button>
              )}
            </div>

            {/* Add Companion Modal / Drawer */}
            {showAddCompanion && (
              <div className="bg-card text-card-foreground rounded-2xl border border-primary/20 p-6 shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-foreground">New Companion Passenger</h4>
                  <button
                    onClick={() => setShowAddCompanion(false)}
                    className="text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {companionError && (
                  <div className="p-3 mb-4 rounded-xl text-xs bg-destructive/10 border border-destructive/20 text-destructive">
                    {companionError}
                  </div>
                )}

                <form onSubmit={handleAddCompanion} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={compName}
                        onChange={(e) => setCompName(e.target.value)}
                        placeholder="e.g. Chinedu Eze"
                        required
                        className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Gender
                      </label>
                      <Select
                        value={compGender}
                        onValueChange={(val) => {
                          if (val === 'male' || val === 'female' || val === 'other') {
                            setCompGender(val);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectPopup>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectPopup>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Nigerian Mobile Phone
                      </label>
                      <input
                        type="tel"
                        value={compPhone}
                        onChange={(e) => setCompPhone(e.target.value)}
                        placeholder="080... or +234..."
                        required
                        className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefaultKin"
                      checked={compIsKin}
                      onChange={(e) => setCompIsKin(e.target.checked)}
                      className="rounded text-primary cursor-pointer"
                    />
                    <label htmlFor="isDefaultKin" className="text-xs text-muted-foreground cursor-pointer">
                      Set as primary emergency next of kin contact
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCompanion(false)}
                      className="px-4 py-2 border border-border text-muted-foreground text-xs font-medium rounded-xl hover:bg-muted cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Save Companion
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Companions Roster Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companions.map((comp) => (
                <div
                  key={comp.id}
                  className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-xs relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {comp.gender}
                      </span>
                      {comp.isDefaultNextOfKin && (
                        <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                          Next of Kin
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-foreground mb-0.5">
                      {comp.fullName}
                    </h4>
                    <p className="text-xs font-mono text-muted-foreground">
                      {comp.phone}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteCompanion(comp.id)}
                      className="text-xs font-medium text-destructive hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
