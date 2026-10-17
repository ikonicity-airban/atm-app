/**
 * Next.js Dynamic Robots Generator
 */
import type { MetadataRoute } from 'next';
import { env } from '../lib/env.ts';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_APP_URL || 'https://atmnigeria.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/account/', '/login', '/register'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
