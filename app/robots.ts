import type { MetadataRoute } from 'next';

/**
 * Keep crawlers out of the auth and one-click entry surfaces (which mutate
 * state or mint sessions) and off the intentionally-unlisted Krava page, while
 * letting the marketing landing be indexed. Advisory only for well-behaved bots;
 * session-minting routes like /gemini still need a real gate.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/auth/', '/gemini', '/login', '/krava', '/app', '/topic/', '/subject/', '/facets', '/nest', '/recent', '/search'],
    },
    sitemap: 'https://magpie.wiki/sitemap.xml',
    host: 'https://magpie.wiki',
  };
}
