'use client';

import React, { useState, useEffect } from 'react';
import { routeRepository, STATIC_ROUTES, type RouteDetail } from '../../../server/repositories/routes.ts';
import { RouteCard, SectionBanner } from '../../../components/atm/AtmBlocks.tsx';
import { PageShell } from '../../../components/layout/Templates.tsx';
import { CardHoverGroup } from '@/components/ui/card-hover-effect';
import { GooeyInput } from '@/components/ui/gooey-input';

export default function RoutesPage(props?: any) {
  const onNavigate = props?.onNavigate;
  const [routes, setRoutes] = useState<RouteDetail[]>(STATIC_ROUTES);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    routeRepository.getAll().then(setRoutes);
  }, []);

  const filteredRoutes = routes.filter(
    (r) =>
      !filter ||
      r.title.toLowerCase().includes(filter.toLowerCase()) ||
      r.origin.city.toLowerCase().includes(filter.toLowerCase()) ||
      r.destination.city.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <PageShell
      width='compact'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Routes' }]}
      title="Scheduled Intercity Routes"
      description="Daily departures connecting South-East and Federal Capital Territory. All services operate with 5-passenger Toyota Siennas with air conditioning and extra legroom."
    >
      <div className="space-y-8">
        {/* Dynamic Corridor Filter with GooeyInput */}
        <div className="flex justify-end">
          <GooeyInput
            placeholder="Search routes or cities..."
            value={filter}
            onValueChange={setFilter}
            collapsedWidth={120}
            expandedWidth={240}
            expandedOffset={48}
          />
        </div>

        <CardHoverGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredRoutes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              onSelect={() => {
                if (onNavigate) {
                  onNavigate(`/routes/${route.slug}`);
                } else if (typeof window !== 'undefined') {
                  window.location.href = `/routes/${route.slug}`;
                }
              }}
            />
          ))}
        </CardHoverGroup>

        {filteredRoutes.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No intercity routes found matching &quot;{filter}&quot;.
          </div>
        )}

        <SectionBanner title="Guaranteed Fixed Departures">
          <p>
            All Ascent Transport Management trips operate on fixed departure times regardless of weather or minor delays. Vehicles do not wait for random roadside passengers. Book your seat in advance to secure your preferred window or aisle position.
          </p>
        </SectionBanner>
      </div>
    </PageShell>
  );
}
