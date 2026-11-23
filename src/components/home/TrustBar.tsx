import React from 'react';

export default function TrustBar() {
  const trustItems = [
    {
      title: 'Kostenloser Versand ab 150 €',
      desc: 'Schnelle & sichere Speditionslieferung',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      ),
      bg: 'bg-red-50 text-red-600',
    },
    {
      title: '2 Jahre Garantie',
      desc: 'Volle Herstellergarantie auf alle Neugeräte',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      bg: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: '30 Tage Rückgaberecht',
      desc: 'Bequem testen mit einfacher Retoure',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      bg: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Sicherer Kauf auf Rechnung',
      desc: 'Klarna, PayPal, Sofort & Kreditkarte',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      bg: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <section className="bg-white border-y border-stone-200/80 py-5 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {trustItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 sm:gap-3.5 group">
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-sm`}>
              {item.icon}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-stone-900 leading-tight truncate sm:whitespace-normal">
                {item.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 line-clamp-1">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
