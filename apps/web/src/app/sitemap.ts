/**
 * Next.js Dynamic Sitemap Generator
 */
import type { MetadataRoute } from 'next';
import { routeRepository } from '../server/repositories/routes.ts';
import { env } from '../lib/env.ts';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_APP_URL || 'https://atmnigeria.com';
  const now = new Date().toISOString();

  // Primary public marketing, booking, courier, and legal routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/trips`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/routes`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/terminals`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/courier`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/track`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/manage`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/charter`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/corporate`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];

  // All 12 active intercity corridor landing pages
  const slugs = await routeRepository.getAllSlugs();
  const corridorRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${baseUrl}/routes/${slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  return [...staticRoutes, ...corridorRoutes];
}
