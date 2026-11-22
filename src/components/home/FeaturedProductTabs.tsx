'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import QuickViewModal from '@/components/product/QuickViewModal';

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

// Verified Hausgeräte fallback products with high-resolution imagery
const fallbackProducts: ProductItem[] = [
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
    id: 'fb-wasch-1',
    title: 'Bosch Serie 6 Waschmaschine 9kg 1400 U/min EcoSilence',
    slug: 'bosch-serie-6-waschmaschine-9kg',
    price: 649.00,
    compareAtPrice: 849.00,
    images: ['https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&q=80&w=800'],
    discountLabel: 'A+++ Effizienz',
    categorySlug: 'waschen-trocknen',
    categoryName: 'Waschen & Trocknen',
    allCategories: 'waschen-trocknen waschmaschine bosch'
  },
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
    id: 'fb-back-1',
    title: 'Siemens iQ500 Einbaubackofen mit Pyrolyse & 3D Heißluft',
    slug: 'siemens-iq500-einbaubackofen-pyrolyse',
    price: 699.00,
    compareAtPrice: 949.00,
    images: ['https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800'],
    discountLabel: '-26% Sparpreis',
    categorySlug: 'kochen-backen',
    categoryName: 'Kochen & Backen',
    allCategories: 'kochen-backen backofen siemens'
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
    categoryName: 'Saugroboter',
    allCategories: 'saugroboter staubsauger dreame'
  }
];

function getCategoryEmoji(categorySlug?: string, title?: string): string {
  const s = ((categorySlug || '') + ' ' + (title || '')).toLowerCase();
  if (s.includes('kuehl') || s.includes('kühlschrank') || s.includes('gefrier')) return '❄️';
  if (s.includes('wasch') || s.includes('trockner')) return '🧺';
  if (s.includes('kaffee') || s.includes('espresso')) return '☕';
  if (s.includes('geschirr') || s.includes('spül')) return '🍽️';
  if (s.includes('back') || s.includes('ofen') || s.includes('koch')) return '🍳';
  if (s.includes('saug') || s.includes('roboter') || s.includes('staub')) return '🧹';
  if (s.includes('klima') || s.includes('luft')) return '💨';
  return '⚡';
}

function ProductCardImage({
  src,
  alt,
  categorySlug,
  title,
  categoryName
}: {
  src?: string;
  alt: string;
  categorySlug?: string;
  title: string;
  categoryName?: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200/70 p-4 text-center select-none">
        <span className="text-5xl mb-2 drop-shadow-sm">
          {getCategoryEmoji(categorySlug, title)}
        </span>
        <span className="text-[11px] font-bold tracking-wider text-stone-500 uppercase line-clamp-1">
          {categoryName || 'Frank Hausgeräte'}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      title={title}
      fill
      referrerPolicy="no-referrer"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      onError={() => setImgError(true)}
      className="object-contain p-2.5 group-hover:scale-105 transition-transform duration-500"
    />
  );
}

// Classifier for German Hausgeräte
function classifyProductForTab(p: ProductItem): 'kuehlen' | 'waschen' | 'kochen' | 'kaffee' | 'geschirr' | 'saugen' | 'other' {
  const text = `${p.title || ''} ${p.categoryName || ''} ${p.categorySlug || ''} ${p.allCategories || ''}`.toLowerCase();

  if (text.includes('kuehl') || text.includes('kühlschrank') || text.includes('gefrier') || text.includes('side by side') || text.includes('fridge') || text.includes('liebherr')) {
    return 'kuehlen';
  }
  if (text.includes('wasch') || text.includes('trockner') || text.includes('wäschetrockner') || text.includes('waschmaschine') || text.includes('waschtrockner')) {
    return 'waschen';
  }
  if (text.includes('kaffee') || text.includes('espresso') || text.includes('vollautomat') || text.includes('delonghi') || text.includes("de'longhi") || text.includes('siebträger')) {
    return 'kaffee';
  }
  if (text.includes('geschirr') || text.includes('spül') || text.includes('spueler') || text.includes('geschirrspüler')) {
    return 'geschirr';
  }
  if (text.includes('backofen') || text.includes('kochfeld') || text.includes('induktion') || text.includes('herd') || text.includes('dunstabzug') || text.includes('mikrowelle') || text.includes('kochen') || text.includes('backen')) {
    return 'kochen';
  }
  if (text.includes('saug') || text.includes('roboter') || text.includes('staubsauger') || text.includes('dyson') || text.includes('dreame') || text.includes('roborock')) {
    return 'saugen';
  }
  return 'other';
}

export default function FeaturedProductTabs({ initialProducts }: FeaturedProductTabsProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const handleToggleWishlist = (e: React.MouseEvent, prod: ProductItem) => {
    e.preventDefault();
    e.stopPropagation();
    const wasWishlisted = wishlistStore.hasItem(prod.id);
    wishlistStore.toggleItem(prod.id);
    if (!wasWishlisted) {
      wishlistStore.setIsOpen(true);
    }
  };

  const handleOpenQuickView = (e: React.MouseEvent, prod: ProductItem) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct({
      id: prod.id,
      title: prod.title,
      slug: prod.slug,
      price: prod.price,
      compareAtPrice: prod.compareAtPrice,
      images: prod.images,
      description: '',
      shortDescription: prod.discountLabel || '',
      category: prod.categoryName || '',
      stock: 15,
      type: 'SIMPLE'
    });
    setIsQuickViewOpen(true);
  };

  const products: ProductItem[] = React.useMemo(() => {
    const rawList = initialProducts && initialProducts.length > 0 ? initialProducts : fallbackProducts;
    const existingIds = new Set(rawList.map(p => p.id || p.slug));
    const extras = fallbackProducts.filter(f => !existingIds.has(f.id) && !existingIds.has(f.slug));
    return [...rawList, ...extras];
  }, [initialProducts]);

  const tabs = [
    { id: 'all', label: '🔥 Alle Angebote' },
    { id: 'kuehlen', label: '❄️ Kühlen & Gefrieren' },
    { id: 'waschen', label: '🧺 Waschen & Trocknen' },
    { id: 'kochen', label: '🍳 Kochen & Backen' },
    { id: 'kaffee', label: '☕ Kaffeevollautomaten' },
    { id: 'geschirr', label: '🍽️ Geschirrspüler' },
    { id: 'saugen', label: '🧹 Saugroboter' },
  ];

  const filteredProducts = React.useMemo(() => {
    return products.filter(p => {
      if (activeTab === 'all') return true;
      return classifyProductForTab(p) === activeTab;
    });
  }, [products, activeTab]);

  const checkScrollState = () => {
    if (!sliderRef.current) return;
    requestAnimationFrame(() => {
      if (!sliderRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 15);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);
    });
  };

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    checkScrollState();
    el.addEventListener('scroll', checkScrollState, { passive: true });
    window.addEventListener('resize', checkScrollState);
    return () => {
      el.removeEventListener('scroll', checkScrollState);
      window.removeEventListener('resize', checkScrollState);
    };
  }, [filteredProducts]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (sliderRef.current) {
      sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const container = sliderRef.current;
    const scrollAmount = container.clientWidth * 0.85;
    container.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleAddToCart = (product: ProductItem) => {
    cartStore.addItem({
      id: product.id,
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.images[0] || '',
      quantity: 1
    });
    cartStore.setIsOpen(true);

    setToastMessage(`✓ ${product.title} wurde in den Warenkorb gelegt!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const hasSlider = filteredProducts.length > 4;

  return (
    <section id="angebote" className="py-12 sm:py-16 bg-stone-50 border-t border-stone-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header & Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-red-600 font-extrabold text-xs uppercase tracking-wider block">
              Top Marken & Direktpreise
            </span>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Aktuelle Hausgeräte-Highlights
              </h2>
              {hasSlider && (
                <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                  {filteredProducts.length} Geräte
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Interactive Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-200 shadow-xs overflow-x-auto no-scrollbar max-w-full">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${isActive
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Carousel Navigation Arrows in Header */}
            {hasSlider && (
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  aria-label="Vorherige Produkte"
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${canScrollLeft
                    ? 'bg-white border-stone-300 text-stone-800 hover:bg-red-600 hover:text-white hover:border-red-600 shadow-sm'
                    : 'bg-stone-100 border-stone-200 text-stone-300 cursor-not-allowed'
                    }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  aria-label="Nächste Produkte"
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${canScrollRight
                    ? 'bg-white border-stone-300 text-stone-800 hover:bg-red-600 hover:text-white hover:border-red-600 shadow-sm'
                    : 'bg-stone-100 border-stone-200 text-stone-300 cursor-not-allowed'
                    }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Carousel / Slider Container */}
        <div className="relative group/carousel">

          {/* Floating Left Arrow */}
          {hasSlider && canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Vorherige Produkte"
              className="hidden lg:flex absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white text-stone-900 shadow-xl border border-stone-200 items-center justify-center hover:bg-red-600 hover:text-white hover:border-red-600 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Floating Right Arrow */}
          {hasSlider && canScrollRight && (
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Nächste Produkte"
              className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white text-stone-900 shadow-xl border border-stone-200 items-center justify-center hover:bg-red-600 hover:text-white hover:border-red-600 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Product Cards Track */}
          <div
            ref={sliderRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-3 pt-1 px-1"
          >
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="w-[84vw] max-w-[320px] sm:max-w-none sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] shrink-0 snap-start bg-white rounded-2xl border border-stone-200 hover:border-red-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-4 flex flex-col justify-between group"
              >
                <div>
                  {/* Image & Badges Container */}
                  <div className="relative rounded-xl bg-stone-50 border border-stone-100 aspect-square flex items-center justify-center mb-4 overflow-hidden group/img">

                    {/* Top Left Badges */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex flex-col items-start gap-1 pointer-events-none">
                      {prod.discountLabel ? (
                        <span className="px-2.5 py-1 bg-red-600 text-white font-extrabold text-[10px] rounded-md uppercase tracking-wider shadow-sm">
                          {prod.discountLabel}
                        </span>
                      ) : null}
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold text-[10px] rounded border border-emerald-200 shadow-xs">
                        Sofort lieferbar
                      </span>
                    </div>

                    {/* Top Right Action Icons */}
                    <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleToggleWishlist(e, prod)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${wishlistStore.hasItem(prod.id)
                          ? 'bg-red-600 text-white shadow-red-500/30 ring-2 ring-red-400'
                          : 'bg-white/95 text-stone-700 hover:bg-red-600 hover:text-white border border-stone-200/80 hover:border-red-600'
                          }`}
                        title={wishlistStore.hasItem(prod.id) ? 'Von der Wunschliste entfernen' : 'Auf die Wunschliste'}
                        aria-label="Wunschliste"
                      >
                        <svg className="w-4 h-4" fill={wishlistStore.hasItem(prod.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleOpenQuickView(e, prod)}
                        className="w-8 h-8 rounded-full bg-white/95 text-stone-700 hover:bg-red-600 hover:text-white border border-stone-200/80 hover:border-red-600 flex items-center justify-center transition-all shadow-md cursor-pointer"
                        title="Schnellansicht"
                        aria-label="Schnellansicht"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>

                    {/* Product Image */}
                    <Link href={`/produto/${prod.slug}`} className="w-full h-full block">
                      <ProductCardImage
                        src={prod.images && prod.images[0] ? prod.images[0] : undefined}
                        alt={prod.title}
                        categorySlug={prod.categorySlug}
                        title={prod.title}
                        categoryName={prod.categoryName}
                      />
                    </Link>
                  </div>

                  {/* Category & Title */}
                  <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-1 line-clamp-1">
                    {prod.categoryName || 'Hausgeräte'}
                  </div>
                  <Link href={`/produto/${prod.slug}`}>
                    <h4 className="font-extrabold text-stone-900 text-sm mt-1 line-clamp-2 min-h-[40px] group-hover:text-red-600 transition-colors">
                      {prod.title}
                    </h4>
                  </Link>

                  {/* Trust Rating & Delivery */}
                  <div className="flex items-center justify-between text-xs mt-2.5">
                    <div className="flex items-center gap-1 text-amber-500">
                      <span className="tracking-tighter">★★★★★</span>
                      <span className="text-stone-400 font-medium text-[11px]">(4.9)</span>
                    </div>
                    <span className="text-[11px] text-stone-500 font-medium">
                      Lieferzeit 2-4 Tage
                    </span>
                  </div>
                </div>

                {/* Price & Add to Cart */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    {prod.compareAtPrice && prod.compareAtPrice > prod.price && (
                      <span className="text-stone-400 line-through text-xs block font-medium">
                        {prod.compareAtPrice.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </span>
                    )}
                    <span className="text-stone-900 font-black text-lg">
                      {prod.price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddToCart(prod)}
                    className="px-3 py-2 bg-stone-900 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5 group/btn"
                    title={`${prod.title} in den Warenkorb`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Kaufen</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-stone-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-stone-700 text-xs font-semibold flex items-center gap-3 z-50 animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
          product={quickViewProduct}
        />
      )}
    </section>
  );
}
