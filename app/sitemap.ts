import type { MetadataRoute } from 'next';

/**
 * The public marketing landing is the only crawlable page (everything else is
 * auth-gated shared-account content, disallowed in robots.ts).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://magpie.wiki',
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
