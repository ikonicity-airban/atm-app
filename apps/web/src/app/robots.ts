/**
 * Next.js Dynamic Robots Generator
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/account/'],
      },
    ],
    sitemap: 'https://atmnigeria.com/sitemap.xml',
  };
}
