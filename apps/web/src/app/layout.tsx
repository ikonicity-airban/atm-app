import { Overpass, Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../components/theme/ThemeProvider.tsx';

const overpass = Overpass({
  subsets: ['latin'],
  variable: '--font-overpass',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

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
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${overpass.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('atm_theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground font-sans transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
