'use client';

import React, { useMemo } from 'react';
import CategoryProductSection, { CategoryTab } from './CategoryProductSection';
import { ProductItem } from './FeaturedProductTabs';

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

    return prods;
  }, [initialProducts]);

  const kleinTabs: CategoryTab[] = useMemo(() => [
    {
      id: 'alle-klein',
      label: '⚡ Alle Kleingeräte',
      filter: () => true
    },
    {
      id: 'kaffee',
      label: '☕ Kaffeevollautomaten',
      filter: (p: ProductItem) => /(kaffee|espresso|vollautomat|siebträger|kapsel|padmaschine|mühle|muehle|delonghi|jura|sage|melitta|philips|siemens|krups)/i.test(`${p.title} ${p.allCategories}`)
    },
    {
      id: 'saugen',
      label: '🧹 Saug- & Wischroboter',
      filter: (p: ProductItem) => /(roboter|staubsauger|sauger|putzroboter|wisch|dyson|dreame|irobot|schbot)/i.test(`${p.title} ${p.allCategories}`)
    },
    {
      id: 'kueche',
      label: '🥣 Küchenmaschinen & Mixer',
      filter: (p: ProductItem) => /(kuechenmaschine|küchenmaschine|küche|kueche|mixer|rühr|knet|blender|kitchenaid|kenwood|bosch mum)/i.test(`${p.title} ${p.allCategories}`)
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
      fallbackProducts={[]}
      bgStyle="bg-white"
    />
  );
}
