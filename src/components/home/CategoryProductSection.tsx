'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import QuickViewModal from '@/components/product/QuickViewModal';
import { ProductItem } from './FeaturedProductTabs';

export interface CategoryTab {
  id: string;
  label: string;
  filter: (p: ProductItem) => boolean;
}

interface CategoryProductSectionProps {
  id?: string;
  badge: string;
  badgeStyle?: string;
  title: string;
  subtitle?: string;
  viewAllHref: string;
  viewAllText?: string;
  tabs: CategoryTab[];
  products: ProductItem[];
  fallbackProducts?: ProductItem[];
  bgStyle?: string;
}

function getCategoryEmoji(categorySlug?: string, title?: string): string {
  const s = ((categorySlug || '') + ' ' + (title || '')).toLowerCase();
  if (s.includes('ps5') || s.includes('playstation') || s.includes('switch') || s.includes('nintendo') || s.includes('gaming')) return '🎮';
  if (s.includes('headset') || s.includes('inzone') || s.includes('audio')) return '🎧';
  if (s.includes('kuehl') || s.includes('kühlschrank') || s.includes('gefrier')) return '❄️';
  if (s.includes('wasch') || s.includes('trockner')) return '🧺';
  if (s.includes('kaffee') || s.includes('espresso')) return '☕';
  if (s.includes('geschirr') || s.includes('spül')) return '🍽️';
  if (s.includes('back') || s.includes('ofen') || s.includes('herd') || s.includes('koch')) return '🍳';
  if (s.includes('saug') || s.includes('roboter') || s.includes('staub')) return '🧹';
  if (s.includes('klima') || s.includes('luft')) return '💨';
  if (s.includes('kuechenmaschine') || s.includes('küchen') || s.includes('mixer')) return '🥣';
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

export default function CategoryProductSection({
  id,
  badge,
  badgeStyle = 'text-red-600 bg-red-50 border-red-200',
  title,
  subtitle,
  viewAllHref,
  viewAllText = 'Alle ansehen',
  tabs,
  products,
  fallbackProducts = [],
  bgStyle = 'bg-white'
}: CategoryProductSectionProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'all');
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

  const pool: ProductItem[] = useMemo(() => {
    const raw = products && products.length > 0 ? products : fallbackProducts;
    return raw;
  }, [products, fallbackProducts]);

  const currentTabObj = tabs.find(t => t.id === activeTab) || tabs[0];

  const filteredProducts = useMemo(() => {
    if (!currentTabObj) return pool;
    return pool.filter(currentTabObj.filter);
  }, [pool, currentTabObj]);

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
    <section id={id} className={`py-10 sm:py-14 ${bgStyle} border-t border-stone-200/70 relative`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header: Badge, Title & Description (Full Width) */}
        <div className="mb-5 sm:mb-6">
          {badge && (
            <div className="mb-2">
              <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider border ${badgeStyle}`}>
                {badge}
              </span>
            </div>
          )}
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-stone-600 mt-1.5 max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Subcategories Filter & Navigation Row (Dedicated Bar below title) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          {/* Subcategory Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 max-w-full">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#18181b] text-white shadow-xs'
                      : 'bg-stone-100/80 hover:bg-stone-200/80 text-stone-700 hover:text-stone-900 border border-stone-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Right Side: View All Link + Carousel Buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 transition-colors group shrink-0"
            >
              <span>{viewAllText}</span>
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>

            {/* Carousel Prev/Next Buttons */}
            {hasSlider && (
              <div className="flex items-center gap-1.5 shrink-0 ml-1">
                <button
                  type="button"
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  aria-label="Vorherige Produkte"
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    canScrollLeft
                      ? 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-900 hover:text-white shadow-xs'
                      : 'bg-stone-50/50 border-stone-200/50 text-stone-300 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  aria-label="Nächste Produkte"
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    canScrollRight
                      ? 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-900 hover:text-white shadow-xs'
                      : 'bg-stone-50/50 border-stone-200/50 text-stone-300 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="hidden lg:flex absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white text-stone-900 shadow-xl border border-stone-200 items-center justify-center hover:bg-stone-900 hover:text-white transition-all cursor-pointer"
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
              className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white text-stone-900 shadow-xl border border-stone-200 items-center justify-center hover:bg-stone-900 hover:text-white transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Product Cards Track */}
          <div
            ref={sliderRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-3 pt-1 px-1"
          >
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="w-[84vw] max-w-[300px] sm:max-w-none sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)] shrink-0 snap-start bg-white rounded-2xl border border-stone-200/90 hover:border-stone-900 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-4 flex flex-col justify-between group shadow-xs"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative rounded-xl bg-stone-50 border border-stone-100 aspect-square flex items-center justify-center mb-3.5 overflow-hidden group/img">
                    {/* Top Left Badges */}
                    <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1 pointer-events-none">
                      {prod.discountLabel ? (
                        <span className="px-2 py-0.5 bg-red-600 text-white font-black text-[10px] rounded uppercase tracking-wider shadow-xs">
                          {prod.discountLabel}
                        </span>
                      ) : null}
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[9px] rounded border border-emerald-200 shadow-xs">
                        Sofort lieferbar
                      </span>
                    </div>

                    {/* Top Right Action Icons */}
                    <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleToggleWishlist(e, prod)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm cursor-pointer ${
                          wishlistStore.hasItem(prod.id)
                            ? 'bg-red-600 text-white shadow-red-500/30 ring-2 ring-red-400'
                            : 'bg-white/95 text-stone-700 hover:bg-stone-900 hover:text-white border border-stone-200/80'
                        }`}
                        title={wishlistStore.hasItem(prod.id) ? 'Von Wunschliste entfernen' : 'Auf die Wunschliste'}
                        aria-label="Wunschliste"
                      >
                        <svg className="w-3.5 h-3.5" fill={wishlistStore.hasItem(prod.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleOpenQuickView(e, prod)}
                        className="w-7 h-7 rounded-full bg-white/95 text-stone-700 hover:bg-stone-900 hover:text-white border border-stone-200/80 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                        title="Schnellansicht"
                        aria-label="Schnellansicht"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 line-clamp-1">
                    {prod.categoryName || badge}
                  </div>
                  <Link href={`/produto/${prod.slug}`}>
                    <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm mt-0.5 line-clamp-2 min-h-[36px] group-hover:text-red-600 transition-colors leading-snug">
                      {prod.title}
                    </h4>
                  </Link>

                  {/* Rating & Delivery */}
                  <div className="flex items-center justify-between text-xs mt-2">
                    <div className="flex items-center gap-1 text-amber-500">
                      <span className="tracking-tighter">★★★★★</span>
                      <span className="text-stone-400 font-medium text-[10px]">(4.9)</span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-medium">
                      Lieferzeit 2-4 Tage
                    </span>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="mt-3.5 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    {prod.compareAtPrice && prod.compareAtPrice > prod.price && (
                      <span className="text-stone-400 line-through text-[11px] block font-medium">
                        {prod.compareAtPrice.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </span>
                    )}
                    <span className="text-stone-900 font-black text-base sm:text-lg">
                      {prod.price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddToCart(prod)}
                    className="px-4 py-1.5 bg-[#18181b] hover:bg-neutral-800 text-white rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
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

      {/* Toast */}
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
