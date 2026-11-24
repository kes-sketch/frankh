import { MetadataRoute } from 'next';
import { getCachedSettings } from '@/lib/cache';
import { SITE_URL } from '@/lib/site';

const DEFAULT_DISALLOW_PATHS = [
  '/admin/', 
  '/account/', 
  '/checkout/', 
  '/api/', 
  '/categorie-produit/', 
  '/produit/',
  '/search',
  '/*?sort=*',
  '/*?page=*',
  '/*?filter*=*',
  '/*?q=*',
  '/*?minPrice=*',
  '/*?maxPrice=*',
  '/*?brand=*',
  '/*?rating=*',
  '/*?category=*',
  '/*?*view=*',
  '/*?filter_cat=*',
  '/*?column=*',
  '/*?per_page=*',
  '/*?rating_filter=*',
  '/*?stock_status=*',
  '/*?featured=*',
  '/*?best_seller=*',
  '/*?add-to-cart=*',
];

// Aggressive SEO/AI scrapers that burn Vercel Serverless active CPU without providing value
const BLOCKED_BOTS = [
  'AhrefsBot',
  'SemrushBot',
  'DotBot',
  'PetalBot',
  'MJ12bot',
  'Bytespider',
  'DataForSeoBot',
  'ClaudeBot',
  'Amazonbot',
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = SITE_URL;

  // Read robots settings from cached settings to avoid extra database hits
  const settingsMap = await getCachedSettings();

  // Parse disallow paths from DB or use defaults
  let disallowPaths: string[] = DEFAULT_DISALLOW_PATHS;
  if (settingsMap['ROBOTS_DISALLOW_PATHS']) {
    try {
      const parsed = JSON.parse(settingsMap['ROBOTS_DISALLOW_PATHS']);
      if (Array.isArray(parsed) && parsed.length > 0) {
        disallowPaths = Array.from(new Set([...DEFAULT_DISALLOW_PATHS, ...parsed]));
      }
    } catch {
      disallowPaths = DEFAULT_DISALLOW_PATHS;
    }
  }

  // Parse crawl delay (optional)
  const crawlDelay = settingsMap['ROBOTS_CRAWL_DELAY']
    ? parseInt(settingsMap['ROBOTS_CRAWL_DELAY'], 10)
    : undefined;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowPaths,
        ...(crawlDelay && !isNaN(crawlDelay) ? { crawlDelay } : {}),
      },
      ...BLOCKED_BOTS.map(bot => ({
        userAgent: bot,
        disallow: ['/'],
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
