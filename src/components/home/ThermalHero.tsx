'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import HeroPreviewEditButton from '@/components/admin/HeroPreviewEditButton';

export interface ThermalHeroConfig {
  // Global & Background
  bgImageUrl?: string;
  bgOverlayOpacity?: string | number;

  // Showcase Card Controls
  showShowcase?: boolean | string;
  showShowcaseImage?: boolean | string;
  showcaseBadge?: string;
  showcaseImage?: string;
  showcaseImageFit?: 'contain' | 'cover';
  showcaseBgImage?: string;
  showcaseTitle?: string;
  showcaseSubtitle?: string;
  showcaseBadgeTech?: string;
  showcaseBadgeTech2?: string;
  showcasePrice?: string | number;
  showcaseComparePrice?: string | number;
  showcaseSavings?: string;
  showcaseBtnText?: string;

  // Hero Left Controls
  campaignBadge?: string;
  titlePrefix?: string;
  titleGradient?: string;
  description?: string;
  cta1Text?: string;
  cta1Link?: string;
  cta2Text?: string;
  cta2Link?: string;

  // Trust Badges
  showTrustBadges?: boolean | string;
  badge1Title?: string;
  badge1Subtitle?: string;
  badge2Title?: string;
  badge2Subtitle?: string;
  badge3Title?: string;
  badge3Subtitle?: string;
}

export interface HeroShowcaseProduct {
  id: string;
  title: string;
  subtitle?: string;
  price: number;
  compareAtPrice?: number | null;
  image: string;
  badge?: string;
  badgeTech?: string;
  badgeTech2?: string;
  categoryName?: string;
}

interface ThermalHeroProps {
  config?: ThermalHeroConfig;
  showcaseProducts?: HeroShowcaseProduct[];
  isPreview?: boolean;
  sectionId?: string;
}

export default function ThermalHero({ config, showcaseProducts, isPreview, sectionId }: ThermalHeroProps) {
  const [added, setAdded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const cartStore = useCartStore();

  // Visibility toggles
  const isShowcaseVisible = config?.showShowcase !== false && config?.showShowcase !== 'false';
  const isShowcaseImageVisible = config?.showShowcaseImage !== false && config?.showShowcaseImage !== 'false';
  const isTrustBadgesVisible = config?.showTrustBadges !== false && config?.showTrustBadges !== 'false';

  // Background settings
  const bgImageUrl = config?.bgImageUrl || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1600';
  const rawBgOpacity = config?.bgOverlayOpacity !== undefined && config?.bgOverlayOpacity !== ''
    ? parseFloat(config.bgOverlayOpacity.toString())
    : 0.50;
  const bgOpacity = isNaN(rawBgOpacity) ? 0.50 : Math.min(Math.max(rawBgOpacity, 0.1), 1.0);

  // Hero Left Content (German Hausgeräte defaults)
  const campaignBadge = config?.campaignBadge ?? 'Aktion 2026 • Jetzt bis zu 40% Rabatt auf Premium-Hausgeräte';
  const titlePrefix = config?.titlePrefix ?? 'PROFITIEREN SIE VON DEN';
  const titleGradient = config?.titleGradient ?? 'AKTUELLEN ANGEBOTEN';
  const description = config?.description ?? 'Entdecken Sie energieeffiziente Marken-Hausgeräte von Miele, Bosch, Siemens & Liebherr. Schnelle Speditionslieferung, 30 Tage Rückgaberecht und 2 Jahre Herstellergarantie.';
  const cta1Text = config?.cta1Text ?? 'Jetzt Angebote entdecken';
  const cta1Link = config?.cta1Link ?? '/shop';
  const cta2Text = (config?.cta2Text && config.cta2Text !== 'Showroom Oberreichenbach') ? config.cta2Text : '';
  const cta2Link = config?.cta2Link ?? '/contact';

  // Trust Badges
  const badge1Title = config?.badge1Title ?? 'Kostenloser Versand';
  const badge1Subtitle = config?.badge1Subtitle ?? 'Ab 150 € deutschlandweit';
  const badge2Title = config?.badge2Title ?? '2 Jahre Garantie';
  const badge2Subtitle = config?.badge2Subtitle ?? 'Volle Herstellergarantie';
  const badge3Title = config?.badge3Title ?? 'Sichere Zahlung';
  const badge3Subtitle = config?.badge3Subtitle ?? 'Klarna, PayPal & Rechnung';

  // Default German Hausgeräte Top Sellers for showcase rotation
  const defaultShowcaseProducts: HeroShowcaseProduct[] = useMemo(() => [
    {
      id: 'hero-kuehl-gefrier-fridge',
      title: config?.showcaseTitle || 'Liebherr French Door Kühl-Gefrierkombination NoFrost',
      subtitle: config?.showcaseSubtitle || 'BioFresh Frischezonen • DuoCooling • Edelstahl Antifingerprint',
      price: typeof config?.showcasePrice === 'number'
        ? config.showcasePrice
        : (config?.showcasePrice ? parseFloat(config.showcasePrice.toString().replace(/[^0-9.,]/g, '').replace(',', '.')) : 1299.00) || 1299.00,
      compareAtPrice: typeof config?.showcaseComparePrice === 'number'
        ? config.showcaseComparePrice
        : (config?.showcaseComparePrice ? parseFloat(config.showcaseComparePrice.toString().replace(/[^0-9.,]/g, '').replace(',', '.')) : 1799.00) || 1799.00,
      image: config?.showcaseImage || 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&q=80&w=800',
      badge: config?.showcaseBadge || 'TOP-ANGEBOT -28%',
      badgeTech: config?.showcaseBadgeTech || '❄️ NoFrost & BioFresh',
      badgeTech2: config?.showcaseBadgeTech2 || 'Energieklasse A'
    },
    {
      id: 'hero-waschmaschine-miele',
      title: 'Miele W1 TwinDos Waschmaschine 9kg 1600 U/min',
      subtitle: 'Automatische Waschmitteldosierung • PowerWash • Schontrommel',
      price: 1149.00,
      compareAtPrice: 1399.00,
      image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&q=80&w=800',
      badge: 'BESTSELLER -18%',
      badgeTech: '🧺 TwinDos Dosiersystem',
      badgeTech2: 'A+++ Effizienz'
    },
    {
      id: 'hero-kaffeevollautomat-delonghi',
      title: 'De\'Longhi PrimaDonna Soul Kaffeevollautomat',
      subtitle: 'Bean Adapt Technologie • LatteCrema System • 4,3" Farbdisplay',
      price: 849.00,
      compareAtPrice: 1199.00,
      image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&q=80&w=800',
      badge: 'SPAR-TIPP -29%',
      badgeTech: '☕ 19 Bar & Milchsystem',
      badgeTech2: 'Smart Coffee App'
    },
    {
      id: 'hero-geschirrspueler-bosch',
      title: 'Bosch Serie 8 Vollintegrierter Geschirrspüler',
      subtitle: 'Zeolith-Trocknung • Flüsterleise 42dB • Home Connect WLAN',
      price: 799.00,
      compareAtPrice: 1049.00,
      image: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&q=80&w=800',
      badge: 'AKTION -24%',
      badgeTech: '🍽️ Zeolith-Trocknung',
      badgeTech2: '14 Maßgedecke'
    }
  ], [config]);

  const showcaseList = useMemo(() => {
    if (showcaseProducts && showcaseProducts.length > 0) {
      return showcaseProducts;
    }
    return defaultShowcaseProducts;
  }, [showcaseProducts, defaultShowcaseProducts]);

  const currentItem = showcaseList[currentIndex] || showcaseList[0] || defaultShowcaseProducts[0];

  const handleNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % showcaseList.length);
      setIsAnimating(false);
    }, 180);
  };

  const handlePrev = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + showcaseList.length) % showcaseList.length);
      setIsAnimating(false);
    }, 180);
  };

  // Auto-rotate every 5.5s unless hovered
  useEffect(() => {
    if (showcaseList.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5500);
    return () => clearInterval(interval);
  }, [showcaseList.length, isHovered, currentIndex]);

  const showcaseImageFit = config?.showcaseImageFit === 'cover' ? 'cover' : 'contain';
  const showcaseBgImage = config?.showcaseBgImage || '';
  const showcaseBtnText = config?.showcaseBtnText ?? 'In den Warenkorb';

  const savingsText = useMemo(() => {
    if (currentItem.compareAtPrice && currentItem.compareAtPrice > currentItem.price) {
      const diff = currentItem.compareAtPrice - currentItem.price;
      return `Sie sparen ${diff.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`;
    }
    return null;
  }, [currentItem]);

  const handleAddToCart = () => {
    if (!currentItem) return;
    cartStore.addItem({
      id: currentItem.id,
      productId: currentItem.id,
      title: currentItem.title,
      price: currentItem.price,
      image: currentItem.image,
      quantity: 1
    });
    cartStore.setIsOpen(true);

    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <section className="relative bg-stone-950 text-white overflow-hidden py-12 lg:py-18 border-b border-stone-800 group">
      {/* Admin preview edit button */}
      {isPreview && sectionId && (
        <HeroPreviewEditButton sectionId={sectionId} blockNum={0} />
      )}

      {/* Main Hero Background Image & Lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Glow ambient effects */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* User Background Image */}
        {bgImageUrl && (
          <Image
            src={bgImageUrl}
            alt="Frank Hausgeräte - Premium Haushaltsgeräte"
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            quality={80}
            className="hidden lg:block object-cover object-center pointer-events-none"
            style={{ opacity: bgOpacity }}
          />
        )}

        {/* Gradient overlay for high text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/98 via-stone-950/85 to-stone-950/40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/40 pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={`grid grid-cols-1 ${isShowcaseVisible ? 'lg:grid-cols-12 gap-8 lg:gap-10 items-center' : 'max-w-4xl'}`}>

          {/* Left Column: Headlines & Call to Actions */}
          <div className={`${isShowcaseVisible ? 'lg:col-span-7' : 'w-full'} space-y-6`}>
            {campaignBadge && (
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-red-950/70 border border-red-600/40 rounded-full text-xs backdrop-blur-md shadow-sm">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 animate-pulse" />
                </span>
                <span className="text-white font-bold tracking-wide">
                  {campaignBadge}
                </span>
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
              {titlePrefix && <span className="block text-stone-100">{titlePrefix}</span>}
              {titleGradient && (
                <span className="text-red-500 font-black">
                  {titleGradient}
                </span>
              )}
            </h1>

            {description && (
              <p className="text-stone-300 text-sm sm:text-base max-w-xl leading-relaxed">
                {description}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              {cta1Text && (
                <Link
                  href={cta1Link}
                  className="px-7 py-3.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl font-bold text-sm shadow-xl shadow-red-600/30 transition-all flex items-center gap-2 group/btn"
                >
                  <span>{cta1Text}</span>
                  <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              )}

              {cta2Text && (
                <Link
                  href={cta2Link}
                  className="px-6 py-3.5 bg-stone-900/90 hover:bg-stone-800/90 active:scale-95 text-stone-200 border border-stone-700 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-sm cursor-pointer backdrop-blur-sm"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{cta2Text}</span>
                </Link>
              )}
            </div>

            {/* Mini Trust Badges */}
            {isTrustBadgesVisible && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-5 sm:pt-6 border-t border-stone-800 text-xs text-stone-300 max-w-lg">
                <div className="space-y-0.5">
                  <span className="block text-white font-bold text-xs sm:text-sm tracking-wide">{badge1Title}</span>
                  <span className="text-[10px] sm:text-[11px] text-stone-400">{badge1Subtitle}</span>
                </div>
                <div className="space-y-0.5 border-l border-stone-800 pl-2 sm:pl-4">
                  <span className="block text-white font-bold text-xs sm:text-sm tracking-wide">{badge2Title}</span>
                  <span className="text-[10px] sm:text-[11px] text-stone-400">{badge2Subtitle}</span>
                </div>
                <div className="space-y-0.5 border-l border-stone-800 pl-2 sm:pl-4">
                  <span className="block text-white font-bold text-xs sm:text-sm tracking-wide">{badge3Title}</span>
                  <span className="text-[10px] sm:text-[11px] text-stone-400">{badge3Subtitle}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Visual Showcase Card */}
          {isShowcaseVisible && (
            <div
              className="lg:col-span-5 relative"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="relative bg-gradient-to-b from-stone-900/95 via-stone-850/95 to-stone-950/95 border border-stone-700/70 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl transition-all duration-300">

                {/* Card Top Bar */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    {currentItem.badge && (
                      <span className="px-3 py-1 bg-red-600 text-white font-black text-[11px] uppercase tracking-wider rounded-full shadow-lg shadow-red-600/40 border border-red-500">
                        {currentItem.badge}
                      </span>
                    )}
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider bg-stone-800/80 px-2 py-0.5 rounded border border-stone-700/60">
                      Top-Angebot • {currentIndex + 1}/{showcaseList.length}
                    </span>
                  </div>

                  {/* Manual Controls */}
                  {showcaseList.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePrev}
                        title="Vorheriges Produkt"
                        className="w-7 h-7 rounded-full bg-stone-800 hover:bg-red-600 border border-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        title="Nächstes Produkt"
                        className="w-7 h-7 rounded-full bg-stone-800 hover:bg-red-600 border border-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Showcase Image */}
                {isShowcaseImageVisible && (
                  <div className="aspect-4/3 rounded-2xl bg-stone-950/90 border border-stone-800 relative overflow-hidden group/img flex items-center justify-center p-3">
                    {showcaseBgImage && (
                      <div
                        className="absolute inset-0 bg-cover bg-center z-0 transition-opacity"
                        style={{
                          backgroundImage: `url('${showcaseBgImage}')`,
                          opacity: 0.85
                        }}
                      />
                    )}

                    <div className={`relative w-full h-full transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                      {currentItem.image ? (
                        <Image
                          src={currentItem.image}
                          alt={currentItem.title}
                          fill
                          referrerPolicy="no-referrer"
                          className={`${showcaseImageFit === 'cover' ? 'object-cover' : 'object-contain p-2'} object-center group-hover/img:scale-105 transition-transform duration-700 z-10`}
                          sizes="(max-width: 768px) 100vw, 500px"
                          priority
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          ❄️
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent z-10 pointer-events-none" />

                    {/* Tech Badges on image */}
                    <div className={`absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                      {currentItem.badgeTech && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-900/90 rounded-md text-[11px] font-semibold text-amber-300 border border-stone-700/60 shadow-sm">
                          {currentItem.badgeTech}
                        </span>
                      )}
                      {currentItem.badgeTech2 && (
                        <span className="text-[11px] font-medium text-stone-300 bg-black/70 px-2 py-0.5 rounded shadow-sm">
                          {currentItem.badgeTech2}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Product Info */}
                <div className={`mt-4 space-y-2 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                  <div>
                    <h3 className="text-white font-bold text-base sm:text-lg leading-tight line-clamp-1">
                      {currentItem.title}
                    </h3>
                    {currentItem.subtitle && (
                      <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                        {currentItem.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-baseline gap-3 pt-1">
                    <span className="text-red-400 font-extrabold text-2xl sm:text-3xl">
                      {currentItem.price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                    {currentItem.compareAtPrice && currentItem.compareAtPrice > currentItem.price && (
                      <span className="text-stone-500 line-through text-sm">
                        {currentItem.compareAtPrice.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </span>
                    )}
                    {savingsText && (
                      <span className="text-[11px] font-bold text-emerald-400 ml-auto bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                        {savingsText}
                      </span>
                    )}
                  </div>
                </div>

                {/* Interactive Dots Pagination */}
                {showcaseList.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5 pt-3">
                    {showcaseList.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setIsAnimating(true);
                          setTimeout(() => {
                            setCurrentIndex(idx);
                            setIsAnimating(false);
                          }, 150);
                        }}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === currentIndex ? 'w-6 bg-red-500' : 'w-1.5 bg-stone-700 hover:bg-stone-500'
                          }`}
                        title={`Zu Produkt ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={handleAddToCart}
                  className={`w-full mt-3.5 py-3.5 px-4 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-red-600 hover:bg-red-700 active:scale-98 text-white shadow-red-600/30'
                    }`}
                >
                  {added ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>In den Warenkorb gelegt!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span>{showcaseBtnText}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
