import { MetadataRoute } from 'next';
import prisma from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://punnamihotels.com';

  // Base static routes
  const routes = [
    '',
    '/about',
    '/contact',
    '/bookings',
    '/rooms',
    '/cancellation',
    '/privacy',
    '/terms',
    '/refund',
    '/shipping-policy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic room slug routes
  try {
    const rooms = await prisma.roomType.findMany({
      where: { status: 'PUBLISHED', isActive: true },
      select: { slug: true, updatedAt: true },
    });

    const roomRoutes = rooms.map((room) => ({
      url: `${baseUrl}/rooms/${room.slug}`,
      lastModified: room.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));

    return [...routes, ...roomRoutes];
  } catch (err) {
    console.error('[Sitemap generation] Error prefetching dynamic routes:', err);
    return routes;
  }
}
