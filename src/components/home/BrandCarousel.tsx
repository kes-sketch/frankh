import React from 'react';
import Link from 'next/link';

const brands = [
  { name: 'Miele', tagline: 'Immer Besser', slug: 'miele', highlight: 'Premium' },
  { name: 'Bosch', tagline: 'Technik fürs Leben', slug: 'bosch', highlight: 'Bestseller' },
  { name: 'Siemens', tagline: 'Zukunft zieht ein', slug: 'siemens', highlight: 'Smart Home' },
  { name: 'Liebherr', tagline: 'Qualität & Frische', slug: 'liebherr', highlight: 'NoFrost' },
  { name: 'AEG', tagline: 'Perfekt in Form & Funktion', slug: 'aeg', highlight: 'EcoLine' },
  { name: 'De\'Longhi', tagline: 'Perfekter Kaffeegenuss', slug: 'delonghi', highlight: 'Barista' },
  { name: 'Smeg', tagline: 'Design & Technologie', slug: 'smeg', highlight: 'Retro Chic' },
  { name: 'Bauknecht', tagline: 'Für mich und mein Zuhause', slug: 'bauknecht', highlight: 'Tradition' },
  { name: 'Dyson', tagline: 'Pure Innovation', slug: 'dyson', highlight: 'Akkupower' },
  { name: 'Philips', tagline: 'Innovation & Komfort', slug: 'philips', highlight: 'Top Deal' },
];

export default function BrandCarousel() {
  return (
    <section className="py-8 bg-stone-50/70 border-y border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-red-600 uppercase">
              Offizielle Markenpartner
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-stone-900">
              Führende Hausgeräte-Hersteller im Sortiment
            </h3>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-stone-600 hover:text-red-600 transition-colors flex items-center gap-1 shrink-0"
          >
            <span>Alle Marken filtern</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {/* Brand Grid / Scroller */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {brands.map((brand, idx) => (
            <Link
              key={idx}
              href={`/shop?search=${encodeURIComponent(brand.name)}`}
              className="group bg-white rounded-xl border border-stone-200/80 p-3.5 hover:border-red-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-stone-900 text-base sm:text-lg tracking-tight group-hover:text-red-600 transition-colors">
                  {brand.name}
                </span>
                <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 group-hover:bg-red-50 group-hover:text-red-600 px-2 py-0.5 rounded transition-colors">
                  {brand.highlight}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-2 line-clamp-1 group-hover:text-stone-700">
                {brand.tagline}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
