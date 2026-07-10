import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/agent/',
          '/api/',
          '/booking/',
          '/my-bookings/',
        ],
      },
    ],
    sitemap: 'https://punnamihotels.com/sitemap.xml',
  };
}
