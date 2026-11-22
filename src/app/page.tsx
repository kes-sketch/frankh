import ThermalHero from '@/components/home/ThermalHero';
import Newsletter from '@/components/home/Newsletter';
import PromoBanners from '@/components/home/PromoBanners';
import FullWidthBanner from '@/components/home/FullWidthBanner';
import TrustBar from '@/components/home/TrustBar';
import BrandCarousel from '@/components/home/BrandCarousel';
import CategoryExplorer from '@/components/home/CategoryExplorer';
import FeaturedProductTabs from '@/components/home/FeaturedProductTabs';
import HeatingGuideBlogs from '@/components/home/HeatingGuideBlogs';
import prisma from '@/lib/prisma';
import { SectionConfig } from '@/app/admin/(dashboard)/landing/LandingForm';

export const revalidate = 300;

export default async function Home() {
  const settings = await import('@/lib/cache').then(m => m.getCachedSettings());

  // Fetch products from Prisma
  let formattedProducts: any[] = [];
  let promoProducts: any[] = [];

  try {
    const allDbProds = await prisma.product.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        images: true,
        discountLabel: true,
        isBestSeller: true,
        gtin: true,
        brand: { select: { name: true } },
        categories: { select: { name: true, slug: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    formattedProducts = allDbProds.map(p => ({
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

    promoProducts = formattedProducts.filter(p =>
      (p.compareAtPrice && p.compareAtPrice > p.price) ||
      (p.discountLabel && p.discountLabel.trim() !== '')
    );
  } catch (e) {
    console.error('Failed to fetch products for homepage:', e);
  }

  let layout: SectionConfig[] = [];
  try {
    if (settings.HOMEPAGE_LAYOUT) {
      layout = JSON.parse(settings.HOMEPAGE_LAYOUT);
    } else {
      layout = [
        { id: 'sec_1', type: 'Hero', name: 'Hero', enabled: true, settings: {} },
        { id: 'sec_featured', type: 'FeaturedProductTabs', name: 'Aktuelle Angebote', enabled: true, settings: {} },
        { id: 'sec_blogs', type: 'HeatingGuideBlogs', name: 'Ratgeber & Magazin', enabled: true, settings: {} },
        { id: 'sec_newsletter', type: 'Newsletter', name: 'Newsletter', enabled: true, settings: {} }
      ];
    }
  } catch (e) {
    console.error('Failed to parse HOMEPAGE_LAYOUT', e);
  }

  // Extract products with images for Hero Showcase Card rotation
  const heroShowcaseProducts = formattedProducts
    .filter(p => p.images && p.images.length > 0)
    .slice(0, 8)
    .map(p => {
      const savings = p.compareAtPrice && p.compareAtPrice > p.price ? p.compareAtPrice - p.price : 0;
      const discountPct = p.compareAtPrice && p.compareAtPrice > p.price
        ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
        : null;
      return {
        id: p.id,
        title: p.title,
        subtitle: p.categoryName ? `${p.categoryName} • Höchste Energieeffizienz` : 'Geprüfte Markenqualität von Frank Hausgeräte',
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        image: p.images[0],
        badge: discountPct ? `AKTION -${discountPct}%` : 'TOP-ANGEBOT',
        badgeTech: p.categoryName ? `⭐ ${p.categoryName}` : '⭐ Markenqualität',
        badgeTech2: savings > 0 ? `Sie sparen ${savings.toFixed(2).replace('.', ',')} €` : 'Sofort lieferbar',
        categoryName: p.categoryName || ''
      };
    });

  // Filter only enabled sections
  const activeSections = layout.filter(s => s.enabled);

  const renderSection = (section: SectionConfig) => {
    switch (section.type) {
      case 'Hero':
        return (
          <div key={section.id}>
            <ThermalHero config={section.settings} showcaseProducts={heroShowcaseProducts} />
            <TrustBar />
            <CategoryExplorer />
            <BrandCarousel />
          </div>
        );
      case 'FeaturedProductTabs':
      case 'BestDeals':
      case 'ProductGrid':
        return <FeaturedProductTabs key={section.id} initialProducts={formattedProducts} />;
      case 'ShippingSimulator':
      case 'BestSeller':
        // Replace legacy biomass shipping simulator with BrandCarousel
        return <BrandCarousel key={section.id} />;
      case 'HeatingGuideBlogs':
      case 'LatestBlogs':
        return <HeatingGuideBlogs key={section.id} />;
      case 'Newsletter':
        return <Newsletter key={section.id} config={section.settings} />;
      case 'PromoBanners':
        return <PromoBanners key={section.id} config={section.settings} />;
      case 'FullWidthBanner':
        return <FullWidthBanner key={section.id} config={section.settings} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main>
        {activeSections.map(renderSection)}
      </main>
    </div>
  );
}
