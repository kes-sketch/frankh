'use client';

import React, { useMemo } from 'react';
import CategoryProductSection, { CategoryTab } from './CategoryProductSection';
import { ProductItem } from './FeaturedProductTabs';

// Fallback products for Gaming
const fallbackGaming: ProductItem[] = [
  {
    id: 'fb-game-1',
    title: 'Sony PlayStation 5 Slim Konsole D-Chassis Bundle',
    slug: 'sony-playstation-5-slim-konsole-bundle',
    price: 499.00,
    compareAtPrice: 549.00,
    images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=800'],
    discountLabel: 'Top Deal',
    categorySlug: 'playstation',
    categoryName: 'PlayStation 5',
    allCategories: 'gaming-vr playstation ps5 sony'
  },
  {
    id: 'fb-game-2',
    title: 'Nintendo Switch OLED-Modell Mario Rot-Edition',
    slug: 'nintendo-switch-oled-modell-mario-rot',
    price: 329.00,
    compareAtPrice: 369.00,
    images: ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&q=80&w=800'],
    discountLabel: 'Aktion',
    categorySlug: 'nintendo',
    categoryName: 'Nintendo Switch',
    allCategories: 'gaming-vr nintendo switch'
  },
  {
    id: 'fb-game-3',
    title: 'Sony INZONE H9 Wireless Noise Cancelling Gaming-Headset Weiß',
    slug: 'sony-inzone-h9-gaming-headset',
    price: 249.00,
    compareAtPrice: 299.00,
    images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800'],
    discountLabel: '-17%',
    categorySlug: 'gaming-headsets',
    categoryName: 'Gaming Audio',
    allCategories: 'gaming-vr headset sony inzone'
  }
];

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
  const gamingRegex = /(ps5|playstation|switch|nintendo|xbox|gaming|headset|inzone|konsole|controller)/i;
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

    return prods.length > 0 ? prods : fallbackGaming;
  }, [initialProducts]);

  const gamingTabs: CategoryTab[] = useMemo(() => [
    {
      id: 'alle-gaming',
      label: '🎮 Alle Gaming-Deals',
      filter: () => true
    },
    {
      id: 'playstation',
      label: '🎮 PlayStation 5',
      filter: (p: ProductItem) => /(ps5|playstation|sony)/i.test(`${p.title} ${p.allCategories}`)
    },
    {
      id: 'nintendo',
      label: '🕹️ Nintendo Switch',
      filter: (p: ProductItem) => /(switch|nintendo)/i.test(`${p.title} ${p.allCategories}`)
    },
    {
      id: 'audio',
      label: '🎧 Headsets & Zubehör',
      filter: (p: ProductItem) => /(headset|audio|zubehoer|inzone|controller|gaming)/i.test(`${p.title} ${p.allCategories}`)
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
      fallbackProducts={fallbackGaming}
      bgStyle="bg-stone-50/60"
    />
  );
}
