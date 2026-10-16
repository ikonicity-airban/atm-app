import React from 'react';
import './globals.css';

export interface Metadata {
  title: string;
  description: string;
  openGraph: {
    title: string;
    description: string;
    type: string;
  };
}

export const metadata: Metadata = {
  title: 'Ascent Transport Management (ATM Nigeria)',
  description: 'Intercity passenger transport, courier parcels, and vehicle charter across Nigeria. Travel Safe and Fast.',
  openGraph: {
    title: 'Ascent Transport Management (ATM Nigeria)',
    description: 'Intercity passenger transport, courier parcels, and vehicle charter across Nigeria. Travel Safe and Fast.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-white text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
