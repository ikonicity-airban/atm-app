'use client';

import React, { useState } from 'react';
import { PageShell } from '../../../components/layout/Templates.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { Textarea } from '../../../components/ui/Textarea.tsx';
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '../../../components/ui/Select.tsx';
import { Checkbox } from '../../../components/ui/Checkbox.tsx';
import { FormField } from '../../../components/ui/FormField.tsx';
import { Dialog } from '../../../components/ui/Dialog.tsx';
import { Sheet } from '../../../components/ui/Sheet.tsx';
import { Accordion } from '../../../components/ui/Accordion.tsx';
import { Tabs } from '../../../components/ui/Tabs.tsx';
import { Table } from '../../../components/ui/Table.tsx';
import { Alert } from '../../../components/ui/Alert.tsx';
import { Skeleton } from '../../../components/ui/Skeleton.tsx';
import { Logo } from '../../../components/ui/Logo.tsx';
import {
  PhoneInput,
  MoneyText,
  TimeText,
  Stepper,
  StatusBadge,
  TerminalCard,
  VehicleCard,
  SectionBanner,
  WhatsAppButton,
  CallButton,
} from '../../../components/atm/AtmBlocks.tsx';
import { HoverEffect } from '@/components/ui/card-hover-effect';
import WobbleCardDemo from '@/components/wobble-card-demo';
import { SEED_TERMINALS } from '@atm/shared';

export default function DesignSystemPage() {
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
    return (
      <div className="py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">404 - Not Found</h1>
        <p className="text-xs text-slate-500 mt-2">This design system route is available in development mode only.</p>
      </div>
    );
  }

  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('primitives');
  const [testPhone, setTestPhone] = useState('09070000625');

  const sampleTableData = [
    { id: '1', route: 'Enugu ↔ Abuja', departure: '06:30 AM', seats: '5 Seats', status: 'scheduled' },
    { id: '2', route: 'Enugu ↔ Lagos (Jibowu)', departure: '07:00 AM', seats: '5 Seats', status: 'boarding' },
    { id: '3', route: 'Lagos ↔ Owerri', departure: '06:45 AM', seats: '5 Seats', status: 'in_transit' },
  ];

  const sampleColumns = [
    { key: 'route', header: 'Route' },
    { key: 'departure', header: 'Departure' },
    { key: 'seats', header: 'Capacity' },
    {
      key: 'status',
      header: 'Trip Status',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <PageShell
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Design System & QA' }]}
      title="Design System &amp; QA Catalog"
      description="Interactive verification of design tokens, brand scale, accessible form controls, and ATM domain blocks. Responsive across 360px–1440px."
    >
      <div className="space-y-14">
        {/* Logo Verification */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">
            Brand Identity &amp; Logo
          </h2>
          <div className="flex flex-wrap gap-8 items-center p-6 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <span className="text-xs text-slate-500 font-mono block mb-2">variant=&quot;full&quot;</span>
              <Logo variant="full" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-mono block mb-2">variant=&quot;mark&quot;</span>
              <Logo variant="mark" />
            </div>
          </div>
        </section>

        {/* Color Palette Tokens */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">
            Color Tokens (Brand Magenta/Purple &bull; 50–950)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {[
              { token: 'brand-50', hex: '#fdf2f9', text: 'text-slate-900' },
              { token: 'brand-100', hex: '#fce7f4', text: 'text-slate-900' },
              { token: 'brand-200', hex: '#f9cfea', text: 'text-slate-900' },
              { token: 'brand-300', hex: '#f5a7d7', text: 'text-slate-900' },
              { token: 'brand-400', hex: '#ed70bd', text: 'text-white' },
              { token: 'brand-500', hex: '#df3ea1', text: 'text-white' },
              { token: 'brand-600', hex: '#ca2484', text: 'text-white', isCore: true },
              { token: 'brand-700', hex: '#aa1769', text: 'text-white' },
              { token: 'brand-800', hex: '#8c1656', text: 'text-white' },
              { token: 'brand-900', hex: '#741749', text: 'text-white' },
              { token: 'brand-950', hex: '#47072a', text: 'text-white' },
            ].map((c) => (
              <div
                key={c.token}
                style={{ backgroundColor: c.hex }}
                className={`p-3 rounded-lg flex flex-col justify-between h-20 shadow-xs ${c.text}`}
              >
                <span className="text-xs font-bold">{c.token} {c.isCore && '★'}</span>
                <span className="text-[10px] font-mono opacity-90">{c.hex}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section Tabs for Component Catalog */}
        <Tabs
          tabs={[
            { id: 'primitives', label: 'Form Primitives & Buttons' },
            { id: 'atm-blocks', label: 'ATM Domain Blocks' },
            { id: 'tables-overlays', label: 'Tables, Drawers & Modals' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Tab 1: Form Primitives & Buttons */}
        {activeTab === 'primitives' && (
          <div className="space-y-10">
            {/* Buttons */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-base">Button Variants &amp; Loading States</h3>
              <p className="text-xs text-slate-500">
                All interactive buttons meet the 44px min touch target requirement. Loading states use spinners (NEVER pulse).
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary Action</Button>
                <Button variant="secondary">Secondary Action</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Text Link</Button>
                <Button variant="primary" isLoading>Processing...</Button>
                <Button variant="primary" disabled>Disabled State</Button>
              </div>
            </div>

            {/* Inputs & Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Standard Text Input" helpText="Clear focus outline and accessible contrast.">
                <Input placeholder="Enter passenger name" />
              </FormField>

              <FormField label="Input with Error" isRequired errorMessage="Please enter a valid departure date">
                <Input placeholder="YYYY-MM-DD" hasError />
              </FormField>

              <FormField label="Standard Dropdown Select">
                <Select defaultValue="enugu">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select terminal" />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="enugu">Enugu Central (Ogui Road)</SelectItem>
                    <SelectItem value="abuja">Abuja (Utako)</SelectItem>
                    <SelectItem value="lagos-jibowu">Lagos (Jibowu)</SelectItem>
                  </SelectPopup>
                </Select>
              </FormField>

              <FormField label="Textarea Field">
                <Textarea placeholder="Special passenger requests or fragile cargo details..." />
              </FormField>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Checkboxes &amp; Options</h3>
              <div className="flex flex-col gap-2">
                <Checkbox label="I agree to the 15-minute seat reservation hold policy." defaultChecked />
                <Checkbox label="Add priority SMS tracking updates to my booking." />
              </div>
            </div>

            {/* Static Skeleton Blocks */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Static Skeleton (HARD BAN: Zero Pulse)</h3>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: ATM Domain Blocks */}
        {activeTab === 'atm-blocks' && (
          <div className="space-y-10">
            {/* Phone Normalizer Input */}
            <div className="max-w-md space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Phone Input (+234 Normalizer)</h3>
              <PhoneInput
                value={testPhone}
                onChange={setTestPhone}
                helpText="Identifies user across bookings and courier tracking."
              />
            </div>

            {/* Stepper Progress */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Booking Stepper</h3>
              <Stepper
                steps={['Seat Selection', 'Passenger Details', 'Payment', 'Confirmed']}
                currentStep={1}
              />
            </div>

            {/* Money & Time Formatters */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500 font-mono block">MoneyText (kobo to ₦):</span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  <MoneyText kobo={3200000} />
                </div>
                <span className="text-[11px] text-slate-500">Stored as 3,200,000 integer kobo in database.</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-mono block">TimeText (UTC to WAT Africa/Lagos):</span>
                <div className="text-sm font-semibold text-slate-900 mt-1">
                  <TimeText utcDateString="2026-10-15T05:30:00Z" />
                </div>
                <span className="text-[11px] text-slate-500">Converts 05:30 UTC to 06:30 WAT.</span>
              </div>
            </div>

            {/* Status Badges */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Status Badges (Tables &amp; Cards Only)</h3>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="scheduled" />
                <StatusBadge status="boarding" />
                <StatusBadge status="in_transit" />
                <StatusBadge status="delivered" />
                <StatusBadge status="cancelled" />
              </div>
            </div>

            {/* Vehicle Card */}
            <div className="max-w-md">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Vehicle Card (5-Seat Sienna)</h3>
              <VehicleCard />
            </div>

            {/* Terminal Card */}
            <div className="max-w-md">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Terminal Card</h3>
              <TerminalCard
                terminal={{
                  id: 'term-enugu-ogui',
                  code: 'ENU',
                  name: 'Enugu Central Terminal',
                  city: 'Enugu',
                  state: 'Enugu State',
                  address: '263 Ogui Road, Opp. Fire Service, Enugu State',
                  phones: ['09070000625', '09033933118'],
                  latitude: 6.4474,
                  longitude: 7.5144,
                  isActive: true,
                  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Ascent+Transport+Enugu',
                }}
              />
            </div>

            {/* Aceternity Card Hover Effect Showcase */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Card Hover Effect (Aceternity UI Gliding Animation)</h3>
              <p className="text-xs text-slate-500">
                Smooth gliding background indicator for groups of cards without images across public pages.
              </p>
              <HoverEffect
                items={[
                  {
                    title: '5 Passenger Cabin',
                    description: 'Zero overcrowding with dual zone climate control and individual captain seats.',
                    link: '/trips',
                  },
                  {
                    title: 'Express Waybill Courier',
                    description: 'Send documents and critical merchandise across Nigerian states with same day departure.',
                    link: '/courier',
                  },
                  {
                    title: 'Private Fleet Charter',
                    description: 'Reserve an entire vehicle for your team, family, or corporate delegation.',
                    link: '/charter',
                  },
                ]}
              />
            </div>

            {/* Aceternity Wobble Card Showcase */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Wobble Card (Aceternity UI Parallax Hover Effect)</h3>
              <p className="text-xs text-slate-500">
                Dynamic 2.5D tilt and parallax hover interaction applied to cards with images across the application.
              </p>
              <div className="py-4">
                <WobbleCardDemo />
              </div>
            </div>

            {/* Section Banner */}
            <SectionBanner title="Passenger Comfort Standard">
              Every Toyota Sienna vehicle is deep cleaned prior to every trip, equipped with high-efficiency air conditioning, and driven strictly by vetted commercial operators.
            </SectionBanner>

            {/* Contact Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <WhatsAppButton phone="2349070000625" />
              <CallButton phone="09070000625" label="Call Terminal Hotline" />
            </div>
          </div>
        )}

        {/* Tab 3: Tables, Drawers & Overlays */}
        {activeTab === 'tables-overlays' && (
          <div className="space-y-10">
            {/* Responsive Table with Stacked Mobile Cards */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm">Responsive Table (Stacked on &lt; 640px)</h3>
                <span className="text-[11px] text-slate-500">Resize browser to test mobile card transform</span>
              </div>
              <Table
                columns={sampleColumns}
                data={sampleTableData}
                keyField="id"
              />
            </div>

            {/* Dialog and Sheet Triggers */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Modal Dialog &amp; Drawer Controls</h3>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(true)}>
                  Open Test Dialog Modal
                </Button>
                <Button variant="outline" onClick={() => setSheetOpen(true)}>
                  Open Slide-Over Drawer
                </Button>
              </div>
            </div>

            {/* Alerts */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Semantic Alerts</h3>
              <Alert variant="info" title="Scheduled Maintenance">
                Daily morning dispatch begins at 06:00 AM across all South-East corridors.
              </Alert>
              <Alert variant="success" title="Booking Verified">
                Seat 1 window reserved. Paystack receipt reference generated.
              </Alert>
              <Alert variant="warning" title="Heavy Traffic Advisory">
                Expect a 20-minute delay along the Lagos–Ibadan expressway bypass.
              </Alert>
              <Alert variant="danger" title="Seat Lock Expired">
                Your 15-minute seat hold window has elapsed. Please select your seats again.
              </Alert>
            </div>
          </div>
        )}

        {/* Dialog Modal Instance */}
        <Dialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Terminal Check-In Notice"
          description="Arrive 30 minutes prior to scheduled departure."
        >
          <div className="space-y-4 text-xs text-slate-600">
            <p>
              Please present your booking reference code (<strong className="font-mono text-slate-900">ATM-7K9W2P</strong>) or phone number at the counter for boarding gate clearance.
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => setDialogOpen(false)}>
                Understood
              </Button>
            </div>
          </div>
        </Dialog>

        {/* Slide-over Drawer Sheet Instance */}
        <Sheet
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Station Dispatch Details"
        >
          <div className="space-y-4 text-xs text-slate-600">
            <p>
              Enugu Central Terminal &bull; 263 Ogui Road, Opp. Fire Service, Enugu State.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="font-bold text-slate-900 block mb-1">Supervisor on Duty:</span>
              <span>Mr. Chukwuma Okafor &bull; 09070000625</span>
            </div>
          </div>
        </Sheet>
      </div>
    </PageShell>
  );
}
