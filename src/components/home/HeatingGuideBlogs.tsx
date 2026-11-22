import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';

export default async function HeatingGuideBlogs() {
  let articles: any[] = [];
  try {
    articles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 3
    });
  } catch (e) {
    console.error('Error fetching articles for Hausgeraete Guide', e);
  }

  const fallbackArticles = [
    {
      id: 'a1',
      title: 'Kaufberatung: Die richtige Waschmaschine für Ihren Haushalt finden',
      slug: 'kaufberatung-waschmaschine-finden',
      category: 'Kaufberatung',
      excerpt: 'Worauf kommt es wirklich an? Neue Energieeffizienzklassen A bis G, Schleuderdrehzahl und smarte Dosiersysteme im Detail erklärt.',
      image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&q=80&w=600',
      icon: '🧺'
    },
    {
      id: 'a2',
      title: 'Kaffeevollautomat vs. Siebträger: Welcher Kaffeetyp sind Sie?',
      slug: 'kaffeevollautomat-vs-siebtraeger-vergleich',
      category: 'Ratgeber',
      excerpt: 'Bequemer Knopfdruck oder handwerkliche Barista-Kunst? Wir vergleichen Aromen, Pflegeaufwand und Anschaffungskosten.',
      image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&q=80&w=600',
      icon: '☕'
    },
    {
      id: 'a3',
      title: 'Strom sparen in der Küche: Bis zu 250 € jährlich einsparen',
      slug: 'energie-sparen-kuehle-haushalt',
      category: 'Energiesparen',
      excerpt: 'Mit modernen NoFrost Kühl-Gefrierkombinationen und energieeffizienten Induktionskochfeldern die Stromrechnung spürbar senken.',
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600',
      icon: '💡'
    }
  ];

  const items = articles.length > 0 ? articles : fallbackArticles;

  return (
    <section id="magazin" className="py-14 sm:py-16 bg-white border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-red-600 font-extrabold text-xs uppercase tracking-wider block">
              Wissen & Beratung
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
              Aktuelles aus unserem Magazin & Ratgeber
            </h2>
          </div>
          <Link 
            href="/blog" 
            className="text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1 shrink-0 transition-colors group pb-0.5"
          >
            <span>Alle Beiträge lesen</span>
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </Link>
        </div>

        {/* 3 Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((art: any) => (
            <article 
              key={art.id} 
              className="bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="h-48 bg-stone-100 flex items-center justify-center text-5xl overflow-hidden relative">
                  {art.image ? (
                    <Image 
                      src={art.image} 
                      alt={art.title} 
                      width={600} 
                      height={400} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <span className="group-hover:scale-110 transition-transform">{art.icon || '📖'}</span>
                  )}
                  {art.category && (
                    <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
                      {art.category}
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-extrabold text-stone-900 text-base group-hover:text-red-600 transition-colors line-clamp-2">
                    {art.title}
                  </h3>
                  <p className="text-xs text-stone-600 mt-2 line-clamp-3 leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link 
                  href={`/blog/${art.slug}`} 
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 group-hover:text-red-700 transition-colors"
                >
                  <span>Artikel lesen</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
