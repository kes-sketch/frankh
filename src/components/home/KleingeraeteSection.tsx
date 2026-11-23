'use client';

import React, { useMemo } from 'react';
import CategoryProductSection, { CategoryTab } from './CategoryProductSection';
import { ProductItem } from './FeaturedProductTabs';

// Fallback products for Kleingeräte
const fallbackKlein: ProductItem[] = [
  {
    id: 'fb-kaffee-1',
    title: 'De\'Longhi Magnifica S Kaffeevollautomat mit Milchschaumdüse',
    slug: 'delonghi-magnifica-s-kaffeevollautomat',
    price: 329.00,
    compareAtPrice: 449.00,
    images: ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&q=80&w=800'],
    discountLabel: 'Bestseller',
    categorySlug: 'kaffeevollautomaten',
    categoryName: 'Kaffeevollautomaten',
    allCategories: 'kaffeevollautomaten delonghi kaffee'
  },
  {
    id: 'fb-saugen-1',
    title: 'Dreame L10s Ultra Saug- und Wischroboter mit Absaugstation',
    slug: 'dreame-l10s-ultra-saug-wischroboter',
    price: 699.00,
    compareAtPrice: 899.00,
    images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800'],
    discountLabel: 'Smart Home',
    categorySlug: 'saugroboter',
    categoryName: 'Saug- & Wischroboter',
    allCategories: 'saugroboter staubsauger dreame'
  },
  {
    id: 'fb-kueche-1',
    title: 'Kenwood Titanium Chef Patissier XL Küchenmaschine 1400W',
    slug: 'kenwood-titanium-chef-patissier-xl',
    price: 749.00,
    compareAtPrice: 999.00,
    images: ['https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800'],
    discountLabel: '-25% Aktion',
    categorySlug: 'kuechenmaschinen',
    categoryName: 'Küchenmaschinen',
    allCategories: 'kuechenmaschinen kenwood mixer'
  }
];

interface KleingeraeteSectionProps {
  initialProducts?: ProductItem[];
  config?: {
    title?: string;
    subtitle?: string;
    badge?: string;
    viewAllHref?: string;
    viewAllText?: string;
  };
}

export default function KleingeraeteSection({ initialProducts = [], config }: KleingeraeteSectionProps) {
  const kleinRegex = /(kaffee|espresso|vollautomat|delonghi|jura|sage|acopino|tescoma|roboter|staubsauger|putzroboter|sauger|kuechenmaschine|küchenmaschine|mixer|mikrowelle|kleine-haushalts)/i;
  const grossRegex = /(wasch|trockner|geschirr|spül|spuel|herd|kochfeld|backofen|induktion|kuehl|kühlschrank|gefrier|grosse-haushalts)/i;

  const kleinProds = useMemo(() => {
    const prods = initialProducts.filter(p => {
      const text = `${p.title || ''} ${p.categoryName || ''} ${p.allCategories || ''}`;
      return kleinRegex.test(text) && !grossRegex.test(p.title);
    });

    prods.sort((a, b) => {
      const aHas = a.images && a.images.length > 0 ? 1 : 0;
      const bHas = b.images && b.images.length > 0 ? 1 : 0;
      return bHas - aHas;
    });

    return prods.length > 0 ? prods : fallbackKlein;
  }, [initialProducts]);

  const kleinTabs: CategoryTab[] = useMemo(() => [
    {
      id: 'alle-klein',
      label: '☕ Alle Kleingeräte',
      filter: () => true
    },
    {
      id: 'kaffee',
      label: '☕ Kaffeevollautomaten',
      filter: (p: ProductItem) => /(kaffee|espresso|vollautomat|delonghi|jura|sage|acopino|tescoma)/i.test(`${p.title} ${p.allCategories}`)
    },
    {
      id: 'saugen',
      label: '🧹 Saug- & Wischroboter',
      filter: (p: ProductItem) => /(roboter|staubsauger|putzroboter|sauger|dyson|dreame)/i.test(`${p.title} ${p.allCategories}`)
    },
    {
      id: 'kueche',
      label: '🥣 Küchenmaschinen & Mixer',
      filter: (p: ProductItem) => /(kuechenmaschine|küchen|mixer|waage|patissier)/i.test(`${p.title} ${p.allCategories}`)
    },
    {
      id: 'mikrowelle',
      label: '♨️ Mikrowellen & Grill',
      filter: (p: ProductItem) => /(mikrowelle|grill)/i.test(`${p.title} ${p.allCategories}`)
    }
  ], []);

  return (
    <CategoryProductSection
      id="kleine-haushaltsgeraete"
      badge={config?.badge || "HAUSHALTSKLEINGERÄTE"}
      badgeStyle="text-amber-700 bg-amber-50 border-amber-200"
      title={config?.title || "Kaffeevollautomaten & Smarte Haushaltshelfer"}
      subtitle={config?.subtitle || "Perfekter Kaffeegenuss von De'Longhi & Jura, intelligente Saugroboter für mühelose Bodenpflege und leistungsstarke Küchenmaschinen."}
      viewAllHref={config?.viewAllHref || "/produkt-kategorie/kleine-haushaltsgeraete"}
      viewAllText={config?.viewAllText || "Alle Kleingeräte ansehen"}
      tabs={kleinTabs}
      products={kleinProds}
      fallbackProducts={fallbackKlein}
      bgStyle="bg-white"
    />
  );
}
