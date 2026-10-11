'use client';

import React, { useState, useEffect } from 'react';
import { routeRepository, STATIC_ROUTES, type RouteDetail } from '../../../server/repositories/routes.ts';
import { RouteCard, SectionBanner } from '../../../components/atm/AtmBlocks.tsx';
import { PageShell } from '../../../components/layout/Templates.tsx';

export default function RoutesPage({ onNavigate }: { onNavigate?: (path: string) => void } = {}) {
  const [routes, setRoutes] = useState<RouteDetail[]>(STATIC_ROUTES);

  useEffect(() => {
    routeRepository.getAll().then(setRoutes);
  }, []);

  return (
    <PageShell
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Routes' }]}
      title="Scheduled Intercity Routes"
      description="Daily departures connecting South-East and Federal Capital Territory. All services operate with 5-passenger Toyota Siennas with air conditioning and extra legroom."
    >
      <div className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route) => (
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
        </div>

        <SectionBanner title="Guaranteed Fixed Departures">
          <p>
            All Ascent Transport Management trips operate on fixed departure times regardless of weather or minor delays. Vehicles do not wait for random roadside passengers. Book your seat in advance to secure your preferred window or aisle position.
          </p>
        </SectionBanner>
      </div>
    </PageShell>
  );
}
