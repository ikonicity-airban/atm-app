/**
 * Next.js Dynamic Sitemap Generator
 */
import { routeRepository } from '../server/repositories/routes.ts';

export default async function sitemap() {
  const baseUrl = 'https://atmnigeria.com';

  const staticRoutes = [
    '',
    '/trips',
    '/terminals',
    '/routes',
    '/courier',
    '/track',
    '/charter',
    '/corporate',
    '/about',
    '/contact',
    '/faq',
    '/terms',
    '/privacy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const slugs = await routeRepository.getAllSlugs();
  const routeUrls = slugs.map((slug) => ({
    url: `${baseUrl}/routes/${slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...routeUrls];
}
