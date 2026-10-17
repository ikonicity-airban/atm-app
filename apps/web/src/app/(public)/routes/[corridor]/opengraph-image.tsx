import { ImageResponse } from 'next/og';
import { routeRepository } from '../../../../server/repositories/routes.ts';
import { BRAND } from '@atm/shared';

export const runtime = 'edge';
export const alt = 'Ascent Transport Management Corridor Preview';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ corridor: string }>;
}) {
  const { corridor } = await params;
  const route = await routeRepository.getBySlug(corridor);

  const title = route ? route.title : 'Intercity Travel Corridor';
  const fare = route && route.baseFareKobo ? `₦${(route.baseFareKobo / 100).toLocaleString()}` : '₦32,000';
  const duration = route ? `${route.durationHours} hrs` : 'Direct';
  const originCity = route ? route.origin.city : 'Nigeria';
  const destinationCity = route ? route.destination.city : 'Nigeria';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#090d16',
          backgroundImage: 'radial-gradient(circle at 25px 25px, #1a2333 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1a2333 2%, transparent 0%)',
          backgroundSize: '100px 100px',
          color: '#ffffff',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#ca2484',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#ffffff',
              }}
            >
              A
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
                {BRAND.name}
              </span>
              <span style={{ fontSize: '16px', color: '#94a3b8' }}>
                {BRAND.tagline}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '8px 20px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(202, 36, 132, 0.15)',
              border: '1px solid #ca2484',
              color: '#f472b6',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            Toyota Sienna 5-Seater
          </div>
        </div>

        {/* Corridor Banner */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '56px', fontWeight: 900, color: '#ffffff', letterSpacing: '-1.5px' }}>
              {originCity}
            </span>
            <span style={{ fontSize: '48px', color: '#ca2484', fontWeight: 900 }}>
              ➔
            </span>
            <span style={{ fontSize: '56px', fontWeight: 900, color: '#ffffff', letterSpacing: '-1.5px' }}>
              {destinationCity}
            </span>
          </div>

          <span style={{ fontSize: '24px', color: '#cbd5e1', maxWidth: '900px', lineHeight: 1.4 }}>
            Direct executive intercity passenger transit. Punctual departures, air-conditioned comfort, and instant seat reservation.
          </span>
        </div>

        {/* Footer Metrics */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '32px',
            borderTop: '1px solid #1e293b',
          }}
        >
          <div style={{ display: 'flex', gap: '48px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
                Starting Fare
              </span>
              <span style={{ fontSize: '36px', fontWeight: 800, color: '#ca2484' }}>
                {fare}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
                Transit Time
              </span>
              <span style={{ fontSize: '36px', fontWeight: 800, color: '#f8fafc' }}>
                {duration}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
                Daily Departures
              </span>
              <span style={{ fontSize: '36px', fontWeight: 800, color: '#f8fafc' }}>
                Morning WAT
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '16px 32px',
              borderRadius: '12px',
              backgroundColor: '#ca2484',
              color: '#ffffff',
              fontSize: '20px',
              fontWeight: 800,
            }}
          >
            Book on atmnigeria.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
