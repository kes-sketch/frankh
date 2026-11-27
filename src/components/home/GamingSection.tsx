'use client';

import React, { useMemo } from 'react';
import CategoryProductSection, { CategoryTab } from './CategoryProductSection';
import { ProductItem } from './FeaturedProductTabs';

interface GamingSectionProps {
  initialProducts?: ProductItem[];
  config?: {
    title?: string;
    subtitle?: string;
    badge?: string;
    viewAllHref?: string;
    viewAllText?: string;
  };
}

export default function GamingSection({ initialProducts = [], config }: GamingSectionProps) {
  const gamingRegex = /(ps5|playstation|switch|nintendo|xbox|gaming|headset|inzone|konsole|controller|lenkrad)/i;
  const grossRegex = /(wasch|trockner|geschirr|spül|spuel|herd|kochfeld|backofen|induktion|kuehl|kühlschrank|gefrier|grosse-haushalts)/i;
  const kleinRegex = /(kaffee|espresso|vollautomat|delonghi|jura|sage|acopino|tescoma|roboter|staubsauger|putzroboter|sauger|kuechenmaschine|küchenmaschine|mixer|mikrowelle|kleine-haushalts)/i;

  const gamingProds = useMemo(() => {
    const prods = initialProducts.filter(p => {
      const text = `${p.title || ''} ${p.categoryName || ''} ${p.allCategories || ''}`;
      return gamingRegex.test(p.title) || (gamingRegex.test(text) && !grossRegex.test(p.title) && !kleinRegex.test(p.title));
    });

    prods.sort((a, b) => {
      const aHas = a.images && a.images.length > 0 ? 1 : 0;
      const bHas = b.images && b.images.length > 0 ? 1 : 0;
      return bHas - aHas;
    });

    return prods;
  }, [initialProducts]);

  const gamingTabs: CategoryTab[] = useMemo(() => [
    {
      id: 'alle-gaming',
      label: '🎮 Alle Gaming-Deals',
      filter: () => true
    },
    {
      id: 'playstation',
      label: '🎮 PlayStation 5 & 4',
      filter: (p: ProductItem) => /(ps5|playstation|sony)/i.test(`${p.title} ${p.allCategories}`)
    },
    {
      id: 'nintendo',
      label: '🕹️ Nintendo Switch',
      filter: (p: ProductItem) => /(switch|nintendo|mario)/i.test(`${p.title} ${p.allCategories}`)
    },
    {
      id: 'xbox',
      label: '🟢 Xbox Konsolen',
      filter: (p: ProductItem) => /(xbox|microsoft)/i.test(`${p.title} ${p.allCategories}`)
    },
    {
      id: 'zubehoer',
      label: '🎧 Headsets & Zubehör',
      filter: (p: ProductItem) => /(headset|audio|zubehoer|zubehör|inzone|controller|lenkrad|racing|t-gt|ferrari|cockpit|vr|pc-gaming)/i.test(`${p.title} ${p.allCategories}`)
    }
  ], []);

  return (
    <CategoryProductSection
      id="gaming-vr"
      badge={config?.badge || "GAMING & UNTERHALTUNG"}
      badgeStyle="text-purple-700 bg-purple-50 border-purple-200"
      title={config?.title || "Gaming, Konsolen & Zubehör"}
      subtitle={config?.subtitle || "Erleben Sie Next-Gen-Gaming mit PlayStation 5 Bundles, Nintendo Switch und erstklassigen Gaming-Headsets zu unschlagbaren Preisen."}
      viewAllHref={config?.viewAllHref || "/produkt-kategorie/gaming-vr"}
      viewAllText={config?.viewAllText || "Alle Gaming-Angebote ansehen"}
      tabs={gamingTabs}
      products={gamingProds}
      fallbackProducts={[]}
      bgStyle="bg-stone-50/60"
    />
  );
}
