'use client';

import React, { useMemo } from 'react';
import CategoryProductSection, { CategoryTab } from './CategoryProductSection';
import { ProductItem } from './FeaturedProductTabs';

// Fallback products for Großgeräte
const fallbackGross: ProductItem[] = [
  {
    id: 'fb-wasch-1',
    title: 'Bosch Serie 6 Waschmaschine 9kg 1400 U/min EcoSilence',
    slug: 'bosch-serie-6-waschmaschine-9kg',
    price: 649.00,
    compareAtPrice: 849.00,
    images: ['https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&q=80&w=800'],
    discountLabel: 'A+++ Effizienz',
    categorySlug: 'waschen-trocknen',
    categoryName: 'Waschmaschinen',
    allCategories: 'waschen-trocknen waschmaschinen bosch'
  },
  {
    id: 'fb-geschirr-1',
    title: 'Miele G 7110 SCi Teilintegrierter Geschirrspüler 60cm',
    slug: 'miele-g-7110-geschirrspueler',
    price: 1049.00,
    compareAtPrice: 1299.00,
    images: ['https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&q=80&w=800'],
    discountLabel: 'Premium Miele',
    categorySlug: 'geschirrspueler',
    categoryName: 'Geschirrspüler',
    allCategories: 'geschirrspueler spuelmaschine miele'
  },
  {
    id: 'fb-kuehl-1',
    title: 'Liebherr NoFrost Kühl-Gefrierkombination Premium BioFresh',
    slug: 'liebherr-nofrost-kuehl-gefrierkombination-premium',
    price: 1199.00,
    compareAtPrice: 1599.00,
    images: ['https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&q=80&w=800'],
    discountLabel: '-25% Rabatt',
    categorySlug: 'kuehlen-gefrieren',
    categoryName: 'Kühlen & Gefrieren',
    allCategories: 'kuehlen-gefrieren kuehlschrank liebherr'
  },
  {
    id: 'fb-back-1',
    title: 'Siemens iQ500 Einbaubackofen mit Pyrolyse & 3D Heißluft',
    slug: 'siemens-iq500-einbaubackofen-pyrolyse',
    price: 699.00,
    compareAtPrice: 949.00,
    images: ['https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800'],
    discountLabel: '-26% Sparpreis',
    categorySlug: 'kochen-backen',
    categoryName: 'Herde & Backöfen',
    allCategories: 'kochen-backen backofen siemens'
  }
];

interface GrossgeraeteSectionProps {
  initialProducts?: ProductItem[];
  config?: {
    title?: string;
    subtitle?: string;
    badge?: string;
    viewAllHref?: string;
    viewAllText?: string;
  };
}

export default function GrossgeraeteSection({ initialProducts = [], config }: GrossgeraeteSectionProps) {
  const grossRegex = /(wasch|trockner|geschirr|spül|spuel|herd|kochfeld|backofen|induktion|kuehl|kühlschrank|gefrier|klima|luftentfeuchter|grosse-haushalts)/i;
  const gamingRegex = /(ps5|playstation|switch|nintendo|xbox|gaming|headset|inzone|konsole|controller)/i;
  const kleinRegex = /(kaffee|espresso|vollautomat|delonghi|jura|sage|acopino|tescoma|roboter|staubsauger|putzroboter|sauger|kuechenmaschine|küchenmaschine|mixer|mikrowelle|kleine-haushalts)/i;

  const grossProds = useMemo(() => {
    const prods: ProductItem[] = [];

    for (const p of initialProducts) {
      const text = `${p.title || ''} ${p.categoryName || ''} ${p.allCategories || ''}`;

      if (gamingRegex.test(p.title) || (gamingRegex.test(text) && !grossRegex.test(p.title) && !kleinRegex.test(p.title))) {
        continue;
      } else if (kleinRegex.test(text) && !grossRegex.test(p.title)) {
        continue;
      } else {
        prods.push(p);
      }
    }

    prods.sort((a, b) => {
      const aHas = a.images && a.images.length > 0 ? 1 : 0;
      const bHas = b.images && b.images.length > 0 ? 1 : 0;
      return bHas - aHas;
    });

    return prods.length > 0 ? prods : fallbackGross;
  }, [initialProducts]);

  const grossTabs: CategoryTab[] = useMemo(() => [
    {
      id: 'alle-gross',
      label: '🔥 Alle Großgeräte',
      filter: () => true
    },
    {
      id: 'waschen',
      label: '🧺 Waschen & Trocknen',
      filter: (p: ProductItem) => /(wasch|trockner|frontlader|waermepumpen)/i.test(`${p.title} ${p.allCategories}`)
    },
    {
      id: 'geschirr',
      label: '🍽️ Geschirrspüler',
      filter: (p: ProductItem) => /(geschirr|spül|spuel)/i.test(`${p.title} ${p.allCategories}`)
    },
    {
      id: 'kochen',
      label: '🍳 Kochen & Backen',
      filter: (p: ProductItem) => /(herd|kochfeld|backofen|induktion)/i.test(`${p.title} ${p.allCategories}`)
    },
    {
      id: 'kuehlen',
      label: '❄️ Kühlen & Gefrieren',
      filter: (p: ProductItem) => /(kuehl|kühlschrank|gefrier|side by side|liebherr)/i.test(`${p.title} ${p.allCategories}`)
    },
    {
      id: 'klima',
      label: '💨 Klima & Heizen',
      filter: (p: ProductItem) => /(klima|luftentfeuchter|heizen)/i.test(`${p.title} ${p.allCategories}`)
    }
  ], []);

  return (
    <CategoryProductSection
      id="grosse-haushaltsgeraete"
      badge={config?.badge || "HAUSHALTSGROSSGERÄTE"}
      badgeStyle="text-blue-700 bg-blue-50 border-blue-200"
      title={config?.title || "Große Haushaltsgeräte & Einbauküche"}
      subtitle={config?.subtitle || "Entdecken Sie erstklassige Waschmaschinen, energiesparende Geschirrspüler, moderne Induktionskochfelder und geräumige Kühl-Gefrierkombinationen."}
      viewAllHref={config?.viewAllHref || "/produkt-kategorie/grosse-haushaltsgeraete"}
      viewAllText={config?.viewAllText || "Alle Großgeräte ansehen"}
      tabs={grossTabs}
      products={grossProds}
      fallbackProducts={fallbackGross}
      bgStyle="bg-stone-50/60"
    />
  );
}
