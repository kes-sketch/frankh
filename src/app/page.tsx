import ThermalHero from '@/components/home/ThermalHero';
import Newsletter from '@/components/home/Newsletter';
import PromoBanners from '@/components/home/PromoBanners';
import FullWidthBanner from '@/components/home/FullWidthBanner';
import TrustBar from '@/components/home/TrustBar';
import BrandCarousel from '@/components/home/BrandCarousel';
import CategoryExplorer from '@/components/home/CategoryExplorer';
import GrossgeraeteSection from '@/components/home/GrossgeraeteSection';
import KleingeraeteSection from '@/components/home/KleingeraeteSection';
import GamingSection from '@/components/home/GamingSection';
import ProductGrid from '@/components/home/ProductGrid';
import BestDeals from '@/components/home/BestDeals';
import BestSeller from '@/components/home/BestSeller';
import FeaturedProductTabs from '@/components/home/FeaturedProductTabs';
import HeatingGuideBlogs from '@/components/home/HeatingGuideBlogs';
import prisma from '@/lib/prisma';
import { SectionConfig } from '@/app/admin/(dashboard)/landing/LandingForm';
import { getCachedSettings, getCachedHomepageProducts } from '@/lib/cache';

export const revalidate = 300;

export default async function Home() {
  const [settings, { formattedProducts, promoProducts }] = await Promise.all([
    getCachedSettings(),
    getCachedHomepageProducts()
  ]);

  let layout: SectionConfig[] = [];
  try {
    if (settings.HOMEPAGE_LAYOUT) {
      const parsed = JSON.parse(settings.HOMEPAGE_LAYOUT);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // If legacy clumped layout, unpack into individual distinct sections
        const isLegacyClumped = parsed.some(s => s.type === 'Hero') && !parsed.some(s => s.type === 'TrustBar');
        if (isLegacyClumped) {
          const unpacked: SectionConfig[] = [];
          for (const s of parsed) {
            if (s.type === 'Hero') {
              unpacked.push({ ...s, name: 'Hero-Banner (Header)' });
              unpacked.push({ id: 'sec_trustbar', type: 'TrustBar', name: 'Vorteile & Vertrauensleiste', enabled: true, settings: {} });
              unpacked.push({ id: 'sec_categories', type: 'CategoryExplorer', name: 'Kategorie-Schnellzugriff', enabled: true, settings: {} });
            } else if (s.type === 'FeaturedProductTabs') {
              unpacked.push({ id: 'sec_gross', type: 'Grossgeraete', name: 'Große Haushaltsgeräte & Einbauküche', enabled: true, settings: {} });
              unpacked.push({ id: 'sec_brands', type: 'BrandCarousel', name: 'Top Marken & Hersteller', enabled: true, settings: {} });
              unpacked.push({ id: 'sec_klein', type: 'Kleingeraete', name: 'Kleine Haushaltsgeräte & Kaffee', enabled: true, settings: {} });
              unpacked.push({ id: 'sec_gaming', type: 'Gaming', name: 'Gaming, Konsolen & Zubehör', enabled: true, settings: {} });
            } else if (s.type === 'ShippingSimulator') {
              if (!unpacked.some(x => x.type === 'BrandCarousel')) {
                unpacked.push({ id: 'sec_brands', type: 'BrandCarousel', name: 'Top Marken & Hersteller', enabled: true, settings: {} });
              }
            } else {
              unpacked.push(s);
            }
          }
          layout = unpacked;
        } else {
          layout = parsed;
        }
      }
    }

    if (layout.length === 0) {
      layout = [
        { id: 'sec_hero', type: 'Hero', name: 'Hero-Banner (Header)', enabled: true, settings: {} },
        { id: 'sec_trustbar', type: 'TrustBar', name: 'Vorteile & Vertrauensleiste', enabled: true, settings: {} },
        { id: 'sec_categories', type: 'CategoryExplorer', name: 'Kategorie-Schnellzugriff', enabled: true, settings: {} },
        { id: 'sec_gross', type: 'Grossgeraete', name: 'Große Haushaltsgeräte & Einbauküche', enabled: true, settings: {} },
        { id: 'sec_brands', type: 'BrandCarousel', name: 'Top Marken & Partner', enabled: true, settings: {} },
        { id: 'sec_klein', type: 'Kleingeraete', name: 'Kleine Haushaltsgeräte & Kaffeevollautomaten', enabled: true, settings: {} },
        { id: 'sec_gaming', type: 'Gaming', name: 'Gaming, Konsolen & Zubehör', enabled: true, settings: {} },
        { id: 'sec_blogs', type: 'HeatingGuideBlogs', name: 'Ratgeber & Magazin', enabled: true, settings: {} },
        { id: 'sec_newsletter', type: 'Newsletter', name: 'Newsletter-Anmeldung', enabled: true, settings: {} }
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
          <ThermalHero
            key={section.id}
            config={section.settings}
            showcaseProducts={heroShowcaseProducts}
          />
        );
      case 'TrustBar':
        return <TrustBar key={section.id} />;
      case 'CategoryExplorer':
        return <CategoryExplorer key={section.id} />;
      case 'Grossgeraete':
        return (
          <GrossgeraeteSection
            key={section.id}
            initialProducts={formattedProducts}
            config={section.settings}
          />
        );
      case 'BrandCarousel':
        return <BrandCarousel key={section.id} />;
      case 'Kleingeraete':
        return (
          <KleingeraeteSection
            key={section.id}
            initialProducts={formattedProducts}
            config={section.settings}
          />
        );
      case 'Gaming':
        return (
          <GamingSection
            key={section.id}
            initialProducts={formattedProducts}
            config={section.settings}
          />
        );
      case 'ProductGrid':
        return <ProductGrid key={section.id} config={section.settings} />;
      case 'BestDeals':
        return <BestDeals key={section.id} config={section.settings} />;
      case 'BestSeller':
        return <BestSeller key={section.id} config={section.settings} />;
      case 'FeaturedProductTabs':
        return <FeaturedProductTabs key={section.id} initialProducts={formattedProducts} />;
      case 'ShippingSimulator':
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
