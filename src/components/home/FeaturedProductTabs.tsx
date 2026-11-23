'use client';

import React, { useMemo } from 'react';
import CategoryProductSection, { CategoryTab } from './CategoryProductSection';
import BrandCarousel from './BrandCarousel';

export interface ProductItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  discountLabel?: string | null;
  categorySlug?: string;
  categoryName?: string;
  allCategories?: string;
  categories?: { name: string; slug: string }[];
}

interface FeaturedProductTabsProps {
  initialProducts?: ProductItem[];
}

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

export default function FeaturedProductTabs({ initialProducts = [] }: FeaturedProductTabsProps) {
  // Regex classifiers
  const grossRegex = /(wasch|trockner|geschirr|spül|spuel|herd|kochfeld|backofen|induktion|kuehl|kühlschrank|gefrier|klima|luftentfeuchter|grosse-haushalts)/i;
  const gamingRegex = /(ps5|playstation|switch|nintendo|xbox|gaming|headset|inzone|konsole|controller)/i;
  const kleinRegex = /(kaffee|espresso|vollautomat|delonghi|jura|sage|acopino|tescoma|roboter|staubsauger|putzroboter|sauger|kuechenmaschine|küchenmaschine|mixer|mikrowelle|kleine-haushalts)/i;

  // Split into 3 pools and sort products with images first
  const { grossProds, kleinProds, gamingProds } = useMemo(() => {
    const gross: ProductItem[] = [];
    const klein: ProductItem[] = [];
    const gaming: ProductItem[] = [];

    for (const p of initialProducts) {
      const text = `${p.title || ''} ${p.categoryName || ''} ${p.allCategories || ''}`;

      if (gamingRegex.test(p.title) || (gamingRegex.test(text) && !grossRegex.test(p.title) && !kleinRegex.test(p.title))) {
        gaming.push(p);
      } else if (kleinRegex.test(text) && !grossRegex.test(p.title)) {
        klein.push(p);
      } else if (grossRegex.test(text)) {
        gross.push(p);
      } else {
        gross.push(p);
      }
    }

    const sortByImage = (a: ProductItem, b: ProductItem) => {
      const aHas = a.images && a.images.length > 0 ? 1 : 0;
      const bHas = b.images && b.images.length > 0 ? 1 : 0;
      return bHas - aHas;
    };

    gross.sort(sortByImage);
    klein.sort(sortByImage);
    gaming.sort(sortByImage);

    return {
      grossProds: gross.length > 0 ? gross : fallbackGross,
      kleinProds: klein.length > 0 ? klein : fallbackKlein,
      gamingProds: gaming.length > 0 ? gaming : fallbackGaming
    };
  }, [initialProducts]);

  // Tabs for Großgeräte (Gros électroménager)
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

  // Tabs for Kleingeräte (Petit électroménager)
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

  // Tabs for Gaming & Unterhaltung (Jeux)
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
    <div className="w-full space-y-0">
      {/* SECTION 1: GROSSE HAUSHALTSGERÄTE (Gros électroménager) */}
      <CategoryProductSection
        id="grosse-haushaltsgeraete"
        badge="HAUSHALTSGROSSGERÄTE"
        badgeStyle="text-blue-700 bg-blue-50 border-blue-200"
        title="Große Haushaltsgeräte & Einbauküche"
        subtitle="Entdecken Sie erstklassige Waschmaschinen, energiesparende Geschirrspüler, moderne Induktionskochfelder und geräumige Kühl-Gefrierkombinationen."
        viewAllHref="/produkt-kategorie/grosse-haushaltsgeraete"
        viewAllText="Alle Großgeräte ansehen"
        tabs={grossTabs}
        products={grossProds}
        fallbackProducts={fallbackGross}
        bgStyle="bg-stone-50/60"
      />

      {/* BRAND CAROUSEL (Transition visuelle entre les deux rayons) */}
      <BrandCarousel />

      {/* SECTION 2: KLEINE HAUSHALTSGERÄTE (Petit électroménager) */}
      <CategoryProductSection
        id="kleine-haushaltsgeraete"
        badge="HAUSHALTSKLEINGERÄTE"
        badgeStyle="text-amber-700 bg-amber-50 border-amber-200"
        title="Kaffeevollautomaten & Smarte Haushaltshelfer"
        subtitle="Perfekter Kaffeegenuss von De'Longhi & Jura, intelligente Saugroboter für mühelose Bodenpflege und leistungsstarke Küchenmaschinen."
        viewAllHref="/produkt-kategorie/kleine-haushaltsgeraete"
        viewAllText="Alle Kleingeräte ansehen"
        tabs={kleinTabs}
        products={kleinProds}
        fallbackProducts={fallbackKlein}
        bgStyle="bg-white"
      />

      {/* SECTION 3: GAMING & UNTERHALTUNG (Jeux & Consoles) */}
      <CategoryProductSection
        id="gaming-vr"
        badge="GAMING & UNTERHALTUNG"
        badgeStyle="text-purple-700 bg-purple-50 border-purple-200"
        title="Gaming, Konsolen & Zubehör"
        subtitle="Erleben Sie Next-Gen-Gaming mit PlayStation 5 Bundles, Nintendo Switch und erstklassigen Gaming-Headsets zu unschlagbaren Preisen."
        viewAllHref="/produkt-kategorie/gaming-vr"
        viewAllText="Alle Gaming-Angebote ansehen"
        tabs={gamingTabs}
        products={gamingProds}
        fallbackProducts={fallbackGaming}
        bgStyle="bg-stone-50/60"
      />
    </div>
  );
}
