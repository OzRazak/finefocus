
import { MetadataRoute } from 'next';
import { APP_NAME } from '@/lib/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  // IMPORTANT: Replace this placeholder with your actual production domain
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-app-url.com';

  // Ensure all paths are absolute
  const ensureAbsoluteUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return [
    {
      url: ensureAbsoluteUrl('/'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: ensureAbsoluteUrl('/overview'),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: ensureAbsoluteUrl('/features'), // New Features page
      lastModified: new Date(),
      changeFrequency: 'weekly', // Potentially updated often as features evolve
      priority: 0.9,
    },
    {
      url: ensureAbsoluteUrl('/why-focus'),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: ensureAbsoluteUrl('/lifespan'),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: ensureAbsoluteUrl('/focus-dna'), 
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: ensureAbsoluteUrl('/focus-sanctuary'),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: ensureAbsoluteUrl('/planner'), 
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: ensureAbsoluteUrl('/start-my-day'), // Content changed to placeholder
      lastModified: new Date(),
      changeFrequency: 'yearly', // Less frequent as it's "coming soon"
      priority: 0.4, // Lower priority
    },
    {
      url: ensureAbsoluteUrl('/feedback'),
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: ensureAbsoluteUrl('/terms'),
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: ensureAbsoluteUrl('/privacy'),
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}

    