import React from 'react';
import Link from 'next/link';

interface CategoryExplorerProps {
  categories?: Array<{ id: string; name: string; slug: string | null }>;
}

const defaultCategories = [
  {
    name: 'Kühlen & Gefrieren',
    desc: 'Kühl-Gefrierkombis & Side-by-Side',
    href: '/produkt-kategorie/kuehlen-gefrieren',
    badge: 'Beliebt',
    icon: (
      <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="5" y1="10" x2="19" y2="10" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="6" x2="8" y2="7" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="8" y1="14" x2="8" y2="16" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    accent: 'hover:border-sky-300 hover:bg-sky-50/40',
    iconBg: 'bg-sky-50 group-hover:bg-sky-100',
  },
  {
    name: 'Waschen & Trocknen',
    desc: 'Waschmaschinen & Wärmepumpen',
    href: '/produkt-kategorie/waschen-trocknen',
    badge: 'A+++ Effizienz',
    icon: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="13" r="5" strokeWidth="2" />
        <path d="M10 13c1-1 3-1 4 0" strokeWidth="2" strokeLinecap="round" />
        <circle cx="8" cy="5" r="1" fill="currentColor" />
        <circle cx="11" cy="5" r="1" fill="currentColor" />
      </svg>
    ),
    accent: 'hover:border-blue-300 hover:bg-blue-50/40',
    iconBg: 'bg-blue-50 group-hover:bg-blue-100',
  },
  {
    name: 'Kochen & Backen',
    desc: 'Einbaubacköfen & Induktion',
    href: '/produkt-kategorie/kochen-backen',
    badge: 'Top Marken',
    icon: (
      <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8" cy="7" r="1.5" strokeWidth="1.5" />
        <circle cx="12" cy="7" r="1.5" strokeWidth="1.5" />
        <circle cx="16" cy="7" r="1.5" strokeWidth="1.5" />
        <rect x="6" y="11" width="12" height="7" rx="1" strokeWidth="2" />
      </svg>
    ),
    accent: 'hover:border-amber-300 hover:bg-amber-50/40',
    iconBg: 'bg-amber-50 group-hover:bg-amber-100',
  },
  {
    name: 'Geschirrspüler',
    desc: 'Vollintegriert, Unterbau & Stand',
    href: '/produkt-kategorie/geschirrspueler',
    badge: 'Flüsterleise',
    icon: (
      <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="2" width="18" height="20" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="3" y1="7" x2="21" y2="7" strokeWidth="2" />
        <line x1="7" y1="4.5" x2="11" y2="4.5" strokeWidth="2" strokeLinecap="round" />
        <circle cx="17" cy="4.5" r="1" fill="currentColor" />
        <circle cx="12" cy="14" r="3.5" strokeWidth="2" />
      </svg>
    ),
    accent: 'hover:border-teal-300 hover:bg-teal-50/40',
    iconBg: 'bg-teal-50 group-hover:bg-teal-100',
  },
  {
    name: 'Kaffeevollautomaten',
    desc: 'Bohnen-zu-Tasse & Siebträger',
    href: '/produkt-kategorie/kaffeevollautomaten',
    badge: 'Genuss',
    icon: (
      <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M18 8h1a4 4 0 010 8h-1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="6" y1="1" x2="6" y2="4" strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="1" x2="10" y2="4" strokeWidth="2" strokeLinecap="round" />
        <line x1="14" y1="1" x2="14" y2="4" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    accent: 'hover:border-orange-300 hover:bg-orange-50/40',
    iconBg: 'bg-orange-50 group-hover:bg-orange-100',
  },
  {
    name: 'Saugroboter & Boden',
    desc: 'Saug- & Wischroboter, Akkusauger',
    href: '/produkt-kategorie/saugroboter',
    badge: 'Smart Home',
    icon: (
      <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" strokeWidth="2" />
        <circle cx="12" cy="12" r="3" strokeWidth="2" />
        <line x1="12" y1="3" x2="12" y2="6" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="15" r="1.5" fill="currentColor" />
        <circle cx="8" cy="15" r="1.5" fill="currentColor" />
      </svg>
    ),
    accent: 'hover:border-indigo-300 hover:bg-indigo-50/40',
    iconBg: 'bg-indigo-50 group-hover:bg-indigo-100',
  },
  {
    name: 'Klima & Heizen',
    desc: 'Split-Klimageräte & Entfeuchter',
    href: '/produkt-kategorie/klima-heizen',
    badge: 'Komfort',
    icon: (
      <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v18m0-18l3 3m-3-3L9 6m3 15l3-3m-3 3l-3-3M3 12h18m-18 0l3-3m-3 3l3 3m15-3l-3-3m3 3l-3 3" />
      </svg>
    ),
    accent: 'hover:border-cyan-300 hover:bg-cyan-50/40',
    iconBg: 'bg-cyan-50 group-hover:bg-cyan-100',
  },
  {
    name: 'Küchenkleingeräte',
    desc: 'Heißluftfritteusen, Mixer & Toaster',
    href: '/produkt-kategorie/kuechenkleingeraete',
    badge: 'Kompakt',
    icon: (
      <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 3v4m-5 4h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="15" r="2" strokeWidth="2" />
        <path d="M9 7h6" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    accent: 'hover:border-rose-300 hover:bg-rose-50/40',
    iconBg: 'bg-rose-50 group-hover:bg-rose-100',
  },
];

export default function CategoryExplorer({ categories }: CategoryExplorerProps) {
  return (
    <section className="py-10 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <span className="text-red-600 font-extrabold text-xs uppercase tracking-wider block">
            Sortiment im Überblick
          </span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Beliebte Kategorien entdecken
          </h2>
        </div>
        <Link
          href="/shop"
          className="text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 shrink-0 transition-colors group pb-0.5"
        >
          <span>Alle Kategorien ansehen</span>
          <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
        </Link>
      </div>

      {/* Grid of 8 categories */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {defaultCategories.map((cat, idx) => (
          <Link
            key={idx}
            href={cat.href}
            className={`group relative bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 transition-all duration-200 flex flex-col items-start justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5 ${cat.accent}`}
          >
            <div className="w-full flex items-start justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${cat.iconBg}`}>
                {cat.icon}
              </div>
              {cat.badge && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 group-hover:bg-white group-hover:text-stone-900 transition-colors">
                  {cat.badge}
                </span>
              )}
            </div>

            <div>
              <h3 className="font-extrabold text-stone-900 text-sm sm:text-base group-hover:text-red-600 transition-colors line-clamp-1">
                {cat.name}
              </h3>
              <p className="text-xs text-stone-500 mt-1 line-clamp-1">
                {cat.desc}
              </p>
            </div>

            <div className="mt-4 flex items-center text-xs font-semibold text-stone-400 group-hover:text-red-600 transition-colors gap-1">
              <span>Jetzt entdecken</span>
              <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
