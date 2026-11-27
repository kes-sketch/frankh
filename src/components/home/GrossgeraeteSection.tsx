'use client';

import React, { useMemo } from 'react';
import CategoryProductSection, { CategoryTab } from './CategoryProductSection';
import { ProductItem } from './FeaturedProductTabs';

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
  const grossRegex = /(wasch|trockn|geschirr|spül|spuel|herd|kochfeld|backofen|induktion|dunstabzug|kuehl|kühlschrank|gefrier|klima|luftentfeuchter|heizen|grosse-haushalts)/i;
  const gamingRegex = /(ps5|playstation|switch|nintendo|xbox|gaming|inzone|konsole|controller)/i;
  const kleinRegex = /(kaffee|espresso|vollautomat|delonghi|jura|sage|acopino|tescoma|roboter|staubsauger|putzroboter|kuechenmaschine|küchenmaschine|mixer|mikrowelle|kleine-haushalts)/i;

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

    return prods;
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
      filter: (p: ProductItem) => /(wasch|trockn|frontlader|toplader|waermepumpen)/i.test(`${p.title} ${p.allCategories}`)
    },
    {
      id: 'geschirr',
      label: '🍽️ Geschirrspüler',
      filter: (p: ProductItem) => /(geschirr|spül|spuel)/i.test(`${p.title} ${p.allCategories}`)
    },
    {
      id: 'kochen',
      label: '🍳 Kochen & Backen',
      filter: (p: ProductItem) => /(herd|kochfeld|backofen|induktion|dunstabzug)/i.test(`${p.title} ${p.allCategories}`)
    },
    {
      id: 'kuehlen',
      label: '❄️ Kühlen & Gefrieren',
      filter: (p: ProductItem) => /(kuehl|kühlschrank|gefrier|side-by-side|french-door|liebherr)/i.test(`${p.title} ${p.allCategories}`)
    },
    {
      id: 'klima',
      label: '💨 Klima & Heizen',
      filter: (p: ProductItem) => /(klima|luftentfeuchter|heizen|split-klima)/i.test(`${p.title} ${p.allCategories}`)
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
      fallbackProducts={[]}
      bgStyle="bg-stone-50/60"
    />
  );
}
