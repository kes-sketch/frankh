'use client';

import React from 'react';
import GrossgeraeteSection from './GrossgeraeteSection';
import BrandCarousel from './BrandCarousel';
import KleingeraeteSection from './KleingeraeteSection';
import GamingSection from './GamingSection';

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

export default function FeaturedProductTabs({ initialProducts = [] }: FeaturedProductTabsProps) {
  return (
    <div className="w-full space-y-0">
      {/* SECTION 1: GROSSE HAUSHALTSGERÄTE (Gros électroménager) */}
      <GrossgeraeteSection initialProducts={initialProducts} />

      {/* BRAND CAROUSEL (Transition visuelle entre les deux rayons) */}
      <BrandCarousel />

      {/* SECTION 2: KLEINE HAUSHALTSGERÄTE (Petit électroménager) */}
      <KleingeraeteSection initialProducts={initialProducts} />

      {/* SECTION 3: GAMING & UNTERHALTUNG (Jeux & Consoles) */}
      <GamingSection initialProducts={initialProducts} />
    </div>
  );
}
