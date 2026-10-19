'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatNaira, formatWatDateTime, normalisePhone, type CustomerProfile, type CompanionPassenger } from '@atm/shared';
import { auth, type AuthSession } from '../../../lib/auth.ts';

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
  passengers: Array<{ seatNo: number; fullName: string }>;
  totalFareKobo: number;
  status: string;
}

export default function CustomerAccountDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AccountTab>('overview');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [companions, setCompanions] = useState<CompanionPassenger[]>([]);
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>([]);
  const [trips, setTrips] = useState<CustomerTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Companion form state
  const [showAddCompanion, setShowAddCompanion] = useState(false);
  const [compName, setCompName] = useState('');
  const [compGender, setCompGender] = useState<'male' | 'female' | 'other'>('female');
  const [compPhone, setCompPhone] = useState('');
  const [compIsKin, setCompIsKin] = useState(false);
  const [companionError, setCompanionError] = useState<string | null>(null);

  // Profile form state
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editKinName, setEditKinName] = useState('');
  const [editKinPhone, setEditKinPhone] = useState('');

  // 2FA state
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const sess = await auth.getSession();
        setSession(sess);

        // Fetch customer profile
        const profRes = await fetch('/api/account/profile?customerId=cust-dev-01');
        const profData = await profRes.json();
        if (profData.profile) {
          setProfile(profData.profile);
          setEditFullName(profData.profile.fullName || '');
          setEditEmail(profData.profile.email || '');
          setEditKinName(profData.profile.nextOfKinName || '');
          setEditKinPhone(profData.profile.nextOfKinPhone || '');
        }

        // Fetch companions
        const compRes = await fetch('/api/account/companions?customerId=cust-dev-01');
        const compData = await compRes.json();
        if (compData.companions) {
          setCompanions(compData.companions);
        }

        // Fetch credit ledger
        const credRes = await fetch('/api/account/credits?customerId=cust-dev-01');
        const credData = await credRes.json();
        if (credData.ledger) {
          setLedger(credData.ledger);
        }

        // Fetch trips
        const tripRes = await fetch('/api/account/trips?customerId=cust-dev-01');
        const tripData = await tripRes.json();
        if (tripData.trips) {
          setTrips(tripData.trips);
        }
      } catch (err) {
        console.error('Failed to load customer account data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: profile?.id || 'cust-dev-01',
          fullName: editFullName,
          email: editEmail,
          nextOfKinName: editKinName,
          nextOfKinPhone: editKinPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setProfile(data.profile);
      setStatusMessage('Profile successfully updated.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddCompanion = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanionError(null);

    try {
      const res = await fetch('/api/account/companions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: profile?.id || 'cust-dev-01',
          fullName: compName,
          gender: compGender,
          phone: compPhone,
          isDefaultNextOfKin: compIsKin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add companion');
      }

      setCompanions((prev) => [...prev, data.companion]);
      setShowAddCompanion(false);
      setCompName('');
      setCompPhone('');
      setCompIsKin(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding companion';
      setCompanionError(msg);
    }
  };

  const handleDeleteCompanion = async (id: string) => {
    try {
      const res = await fetch(`/api/account/companions/${id}?customerId=${profile?.id || 'cust-dev-01'}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCompanions((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete companion:', err);
    }
  };

  const handleToggle2FA = async () => {
    setTwoFactorLoading(true);
    try {
      const isCurrentlyEnabled = profile?.twoFactorEnabled;
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile?.userId || 'user-cust-dev-01',
          enabled: !isCurrentlyEnabled,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile((prev) => (prev ? { ...prev, twoFactorEnabled: data.enabled } : null));
      }
    } catch (err) {
      console.error('Failed to toggle 2FA:', err);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading customer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 font-sans">
      {/* Top Banner / Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex items-center -space-x-1.5">
                <div className="w-4 h-4 rounded-full bg-indigo-600 shadow-xs" />
                <div className="w-4 h-4 rounded-full bg-indigo-400 opacity-80" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-base group-hover:text-indigo-600 transition-colors">
                ATM Ascent
              </span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-600">Traveler Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/trips"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              Book New Trip
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs font-medium text-slate-500 hover:text-red-600 px-2 py-1 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Profile Header Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold text-xl flex items-center justify-center shadow-xs">
              {profile?.fullName?.charAt(0) || 'C'}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {profile?.fullName || 'Chioma Okeke'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {profile?.phone} • {profile?.email || 'No email attached'}
              </p>
            </div>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl px-5 py-3 text-left sm:text-right">
            <div className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider">
              Store Credit Balance
            </div>
            <div className="text-2xl font-extrabold text-indigo-600 font-mono">
              {formatNaira(profile?.creditsKobo || 0)}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-px mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Profile
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'wallet'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Store Credits & Wallet ({formatNaira(profile?.creditsKobo || 0)})
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'trips'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            My Trips ({trips.length})
          </button>
          <button
            onClick={() => setActiveTab('companions')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'companions'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Saved Companions ({companions.length}/5)
          </button>
        </div>

        {/* TAB 1: OVERVIEW & PROFILE */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-1">Traveler Profile Details</h2>
              <p className="text-xs text-slate-500 mb-6">
                Update your contact details and default emergency next of kin information.
              </p>

              {statusMessage && (
                <div className="p-3 mb-4 rounded-xl text-xs bg-indigo-50 border border-indigo-200 text-indigo-700">
                  {statusMessage}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Default Next of Kin Name
                    </label>
                    <input
                      type="text"
                      value={editKinName}
                      onChange={(e) => setEditKinName(e.target.value)}
                      placeholder="e.g. Emeka Okeke"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Next of Kin Nigerian Phone
                    </label>
                    <input
                      type="tel"
                      value={editKinPhone}
                      onChange={(e) => setEditKinPhone(e.target.value)}
                      placeholder="080... or +234..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-transform active:scale-[0.98] cursor-pointer"
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Side Column: Security & Two-Factor Authentication */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1">Security & Access</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Manage two-factor authentication (2FA) and verified credentials.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Two-Factor Auth (2FA)</div>
                      <div className="text-[11px] text-slate-500">
                        {profile?.twoFactorEnabled ? 'Active (Authenticator app)' : 'Disabled'}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={twoFactorLoading}
                      onClick={handleToggle2FA}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        profile?.twoFactorEnabled
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {profile?.twoFactorEnabled ? 'Disable' : 'Enable 2FA'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Phone Verification</div>
                      <div className="text-[11px] text-emerald-600 font-medium">Verified E.164 (+234)</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Email Verification</div>
                      <div className="text-[11px] text-slate-500">
                        {profile?.emailVerified ? 'Verified' : 'Pending verification'}
                      </div>
                    </div>
                    {!profile?.emailVerified && (
                      <Link
                        href="/verify-email"
                        className="text-xs font-semibold text-indigo-600 hover:underline"
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
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white relative shadow-md overflow-hidden">
              <div className="relative z-10 max-w-md">
                <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">
                  Ascent Store Credit
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono mt-1 mb-2">
                  {formatNaira(profile?.creditsKobo || 0)}
                </div>
                <p className="text-xs text-indigo-100/80 leading-relaxed">
                  Store credits never expire and are automatically deducted when booking new Toyota Sienna journeys. Fully covered bookings bypass gateway checkouts instantly.
                </p>
              </div>
            </div>

            {/* Credit Ledger Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Transaction & Audit Ledger</h3>
                <span className="text-xs text-slate-500">Stored in integer kobo</span>
              </div>

              {ledger.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No credit transactions recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Reason / Transaction</th>
                        <th className="py-3 px-4">Ref Booking</th>
                        <th className="py-3 px-4 text-right">Adjustment</th>
                        <th className="py-3 px-4 text-right">Balance After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ledger.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {formatWatDateTime(item.createdAt).fullStr}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800">
                            {item.reason}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-indigo-600">
                            {item.referenceBookingId || '—'}
                          </td>
                          <td
                            className={`py-3.5 px-4 font-mono font-bold text-right ${
                              item.deltaKobo >= 0 ? 'text-emerald-600' : 'text-slate-800'
                            }`}
                          >
                            {item.deltaKobo >= 0 ? '+' : ''}
                            {formatNaira(item.deltaKobo)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500 text-right">
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
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
                <p className="text-xs sm:text-sm text-slate-500 mb-4">
                  You have no booked trips in your account history yet.
                </p>
                <Link
                  href="/trips"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  Search Available Trips
                </Link>
              </div>
            ) : (
              trips.map((b) => (
                <div
                  key={b.id || b.ref}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {b.ref}
                      </span>
                      <span className="text-xs uppercase font-semibold text-slate-500">
                        {b.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {b.trip?.originCity} → {b.trip?.destinationCity}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Departure: {b.trip?.departureTimeUtc ? formatWatDateTime(b.trip.departureTimeUtc).fullStr : '—'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Seats: <span className="font-mono font-medium">{b.seats?.join(', ')}</span> (
                      {b.passengers?.map((p) => p.fullName).join(', ')})
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                    <div className="font-mono font-bold text-sm text-slate-900">
                      {formatNaira(b.totalFareKobo)}
                    </div>
                    <Link
                      href={`/book/success/${b.ref}`}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
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
                <h3 className="text-base font-bold text-slate-900">Frequent Companion Travelers</h3>
                <p className="text-xs text-slate-500">
                  Save up to 5 family members or coworkers for rapid 1-tap seat auto-fill during checkout.
                </p>
              </div>

              {companions.length < 5 && (
                <button
                  type="button"
                  onClick={() => setShowAddCompanion(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-transform active:scale-[0.98] cursor-pointer"
                >
                  + Add Companion ({companions.length}/5)
                </button>
              )}
            </div>

            {/* Add Companion Modal / Drawer */}
            {showAddCompanion && (
              <div className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-slate-900">New Companion Passenger</h4>
                  <button
                    onClick={() => setShowAddCompanion(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                {companionError && (
                  <div className="p-3 mb-4 rounded-xl text-xs bg-red-50 border border-red-200 text-red-700">
                    {companionError}
                  </div>
                )}

                <form onSubmit={handleAddCompanion} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={compName}
                        onChange={(e) => setCompName(e.target.value)}
                        placeholder="e.g. Chinedu Eze"
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={compGender}
                        onChange={(e) => setCompGender(e.target.value as 'male' | 'female' | 'other')}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nigerian Mobile Phone
                      </label>
                      <input
                        type="tel"
                        value={compPhone}
                        onChange={(e) => setCompPhone(e.target.value)}
                        placeholder="080... or +234..."
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefaultKin"
                      checked={compIsKin}
                      onChange={(e) => setCompIsKin(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <label htmlFor="isDefaultKin" className="text-xs text-slate-600">
                      Set as primary emergency next of kin contact
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCompanion(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-medium rounded-xl hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
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
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {comp.gender}
                      </span>
                      {comp.isDefaultNextOfKin && (
                        <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                          Next of Kin
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-0.5">
                      {comp.fullName}
                    </h4>
                    <p className="text-xs font-mono text-slate-500">
                      {comp.phone}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteCompanion(comp.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer"
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
