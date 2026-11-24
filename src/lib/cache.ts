import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';

// Sensitive secret keys that must NEVER be leaked to public cache or RSC props
const HIDDEN_SETTING_KEYS = new Set([
  'STRIPE_SECRET_KEY',
  'PAYPAL_SECRET',
  'CRON_SECRET',
  'SMTP_PASSWORD',
  'SMTP_PASS',
  'SMTP_USER',
  'SMTP_HOST',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SETUP_TOKEN',
  'RESEND_API_KEY',
  'CLOUDINARY_API_SECRET',
  'WOOCOMMERCE_CONSUMER_SECRET',
  'WOOCOMMERCE_CONSUMER_KEY',
]);

function isSensitiveKey(key: string): boolean {
  if (HIDDEN_SETTING_KEYS.has(key)) return true;
  const upper = key.toUpperCase();
  if (upper.startsWith('NEXT_PUBLIC_')) return false;
  return upper.includes('SECRET') || upper.includes('PASSWORD') || upper.endsWith('_PASS');
}

// Helper to get raw settings (excluding sensitive payment and service credentials)
async function fetchSettings() {
  const settingsDb = await prisma.setting.findMany();
  return settingsDb
    .filter(s => !isSensitiveKey(s.key))
    .reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
}

// Cached version of settings
export const getCachedSettings = unstable_cache(
  async () => fetchSettings(),
  ['global-settings'],
  { tags: ['settings'], revalidate: 3600 }
);

// We need a helper for dynamic tags per slug since unstable_cache tags must be statically defined in the wrapper
// A common pattern is a factory function:
export const getCachedProductBySlug = async (slug: string) => {
  let decodedSlug = slug;
  try { decodedSlug = decodeURIComponent(slug); } catch (e) {}

  return unstable_cache(
    async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);

      const reEncodedLower = encodeURIComponent(decodedSlug).toLowerCase();
      const reEncodedUpper = encodeURIComponent(decodedSlug);
      const encodedSlugLower = encodeURIComponent(slug).toLowerCase();
      const encodedSlugUpper = encodeURIComponent(slug);

      const candidates = Array.from(new Set([
        slug,
        slug.toLowerCase(),
        decodedSlug,
        decodedSlug.toLowerCase(),
        reEncodedLower,
        reEncodedUpper,
        encodedSlugLower,
        encodedSlugUpper,
      ])).filter(Boolean);

      const orConditions: any[] = candidates.flatMap(c => [
        { slug: c },
        { slug: { equals: c, mode: 'insensitive' } }
      ]);

      if (isUuid) {
        orConditions.push({ id: slug });
      }

      let product = await prisma.product.findFirst({
        where: { 
          isDeleted: false,
          OR: orConditions
        },
        include: {
          categories: true,
          Product_ForceSales_A: true,
          Product_SaleTogether_A: true,
          brand: true,
          tags: true,
          reviews: {
            where: { isApproved: true },
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { email: true } } }
          }
        }
      });

      // SEO Migration Fallback 1: If not found, check if a product exists with slug matching `${decodedSlug}-*` (suffix appended during WP/WooCommerce import)
      if (!product) {
        product = await prisma.product.findFirst({
          where: {
            isDeleted: false,
            OR: [
              { slug: { startsWith: `${decodedSlug}-`, mode: 'insensitive' } },
              { slug: { startsWith: `${reEncodedLower}-`, mode: 'insensitive' } }
            ]
          },
          include: {
            categories: true,
            Product_ForceSales_A: true,
            Product_SaleTogether_A: true,
            brand: true,
            tags: true,
            reviews: {
              where: { isApproved: true },
              orderBy: { createdAt: 'desc' },
              include: { user: { select: { email: true } } }
            }
          }
        });
      }

      // SEO Migration Fallback 2: If not found and input slug ends with numeric suffix (e.g. `-481`), check without suffix
      if (!product && /-\d+$/.test(decodedSlug)) {
        const strippedSlug = decodedSlug.replace(/-\d+$/, '');
        const strippedReEncoded = encodeURIComponent(strippedSlug).toLowerCase();
        product = await prisma.product.findFirst({
          where: {
            isDeleted: false,
            OR: [
              { slug: { equals: strippedSlug, mode: 'insensitive' } },
              { slug: { equals: strippedReEncoded, mode: 'insensitive' } }
            ]
          },
          include: {
            categories: true,
            Product_ForceSales_A: true,
            Product_SaleTogether_A: true,
            brand: true,
            tags: true,
            reviews: {
              where: { isApproved: true },
              orderBy: { createdAt: 'desc' },
              include: { user: { select: { email: true } } }
            }
          }
        });
      }

      if (!product) return null;

      // RGPD: Never leak raw emails to client RSC payload
      const sanitizedReviews = product.reviews.map(r => ({
        id: r.id,
        productId: r.productId,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewerName: r.reviewerName || (r.user?.email ? r.user.email.split('@')[0] : 'Client'),
      }));

      return {
        ...product,
        reviews: sanitizedReviews,
      };
    },
    ['product-details', decodedSlug.toLowerCase()],
    { tags: ['products', `product-${decodedSlug.toLowerCase()}`], revalidate: 3600 }
  )();
};

export const getCachedRelatedProducts = async (categoryIds: string[], excludeProductId: string) => {
  // Sort IDs so the cache key is consistent
  const sortedIds = [...categoryIds].sort();
  return unstable_cache(
    async () => prisma.product.findMany({
      where: { 
        categories: { some: { id: { in: categoryIds } } }, 
        id: { not: excludeProductId } 
      },
      include: { categories: true },
      take: 4,
    }),
    ['related-products', sortedIds.join(','), excludeProductId],
    { tags: ['products'], revalidate: 3600 }
  )();
};

// Minimal projection for product cards/catalogs — excludes heavy HTML description, attributes and logs
export const PRODUCT_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  images: true,
  discountLabel: true,
  isBestSeller: true,
  isDealOfTheDay: true,
  gtin: true,
  brand: { select: { name: true } },
  categories: { select: { id: true, name: true, slug: true } },
  reviews: { select: { rating: true } }
} as const;

// Minimal projection for blog card lists — excludes heavy HTML content
export const ARTICLE_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  image: true,
  excerpt: true,
  category: true,
  createdAt: true,
  authorName: true,
  _count: { select: { comments: { where: { isApproved: true } } } }
} as const;

// Caching for Homepage best sellers
export const getCachedBestSellers = unstable_cache(
  async () => prisma.product.findMany({
    where: { isBestSeller: true, isDeleted: false },
    take: 8,
    select: PRODUCT_CARD_SELECT
  }),
  ['home-best-sellers'],
  { tags: ['products'], revalidate: 3600 }
);

// Caching for Homepage latest products
export const getCachedLatestProducts = unstable_cache(
  async () => prisma.product.findMany({
    where: { isDeleted: false },
    take: 8,
    orderBy: { createdAt: 'desc' },
    select: PRODUCT_CARD_SELECT
  }),
  ['home-latest-products'],
  { tags: ['products'], revalidate: 3600 }
);

// Caching categories tree (only categories with >0 products, structured hierarchically)
export const getCachedCategoriesTree = unstable_cache(
  async () => {
    const allCategories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Only keep categories that have at least 1 product
    const withProducts = allCategories.filter(c => c._count.products > 0);

    // Organize hierarchically: roots first, followed by their children
    const roots = withProducts.filter(c => !c.parentId);
    const children = withProducts.filter(c => c.parentId);

    const childrenByParent = new Map<string, typeof withProducts>();
    for (const child of children) {
      if (child.parentId) {
        if (!childrenByParent.has(child.parentId)) {
          childrenByParent.set(child.parentId, []);
        }
        childrenByParent.get(child.parentId)!.push(child);
      }
    }

    const result: Array<{ id: string; name: string; slug: string | null; parentId: string | null }> = [];

    function addChildren(parentId: string) {
      const directChildren = childrenByParent.get(parentId) || [];
      for (const ch of directChildren) {
        result.push({
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
          parentId: ch.parentId
        });
        addChildren(ch.id);
      }
    }

    for (const root of roots) {
      result.push({
        id: root.id,
        name: root.name,
        slug: root.slug,
        parentId: null
      });
      addChildren(root.id);
    }

    // Include any remaining child category whose root had 0 direct products
    for (const ch of children) {
      if (!result.find(r => r.id === ch.id)) {
        result.push({
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
          parentId: ch.parentId
        });
      }
    }

    return result;
  },
  ['header-categories-with-products'],
  { tags: ['categories', 'products'], revalidate: 3600 }
);

export const getCachedProductCounts = unstable_cache(
  async () => {
    const [newCount, hotCount, saleCount] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { orderItems: { some: {} } } }),
      prisma.product.count({ where: { compareAtPrice: { not: null } } })
    ]);
    return { newCount, hotCount, saleCount };
  },
  ['layout-product-counts'],
  { tags: ['products'], revalidate: 3600 }
);

// High-performance cached homepage products feed (100 products max with light projection)
export const getCachedHomepageProducts = unstable_cache(
  async () => {
    const allDbProds = await prisma.product.findMany({
      where: { isDeleted: false },
      select: PRODUCT_CARD_SELECT,
      orderBy: { createdAt: 'desc' },
      take: 120,
    });

    const formattedProducts = allDbProds.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      images: p.images || [],
      discountLabel: p.discountLabel || (p.compareAtPrice && p.compareAtPrice > p.price ? `-${Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)}%` : null),
      categorySlug: p.categories[0]?.slug || '',
      categoryName: p.categories[0]?.name || '',
      categories: p.categories.map(c => ({ name: c.name, slug: c.slug || '' })),
      allCategories: p.categories.map(c => `${c.name} ${c.slug}`).join(' ')
    }));

    const promoProducts = formattedProducts.filter(p =>
      (p.compareAtPrice && p.compareAtPrice > p.price) ||
      (p.discountLabel && p.discountLabel.trim() !== '')
    );

    return { formattedProducts, promoProducts };
  },
  ['homepage-products-feed'],
  { tags: ['products'], revalidate: 3600 }
);

// High-performance cached shop filter metadata (categories count, price range, brands count, card style)
export const getCachedShopFilterMetadata = unstable_cache(
  async () => {
    const [allCategories, priceAgg, allBrands, settingsDb] = await Promise.all([
      prisma.category.findMany({
        include: {
          _count: {
            select: { products: { where: { isDeleted: false } } }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.product.aggregate({
        where: { isDeleted: false },
        _min: { price: true },
        _max: { price: true }
      }),
      prisma.brand.findMany({
        include: {
          _count: {
            select: { products: { where: { isDeleted: false } } }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.setting.findMany({
        where: { key: { in: ['SHOP_CARD_STYLE', 'SHOP_CARD_BORDER_COLOR'] } }
      })
    ]);

    const globalMinPrice = Math.floor(priceAgg._min?.price || 0);
    const globalMaxPrice = Math.ceil(priceAgg._max?.price || 1000);

    const settingsMap = settingsDb.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
    const cardStyle = (settingsMap.SHOP_CARD_STYLE as 'design1' | 'design2') || 'design2';
    const borderColor = settingsMap.SHOP_CARD_BORDER_COLOR || '';

    return {
      allCategories,
      globalMinPrice,
      globalMaxPrice,
      allBrands,
      cardStyle,
      borderColor
    };
  },
  ['shop-filter-metadata'],
  { tags: ['products', 'categories', 'brands', 'settings'], revalidate: 3600 }
);

// Caching for public blog article previews (excludes heavy content field)
export const getCachedArticles = unstable_cache(
  async (limit: number = 20) => {
    return prisma.article.findMany({
      where: { isPublished: true },
      select: ARTICLE_CARD_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
  ['public-articles-list'],
  { tags: ['articles'], revalidate: 3600 }
);
