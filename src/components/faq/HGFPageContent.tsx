'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AccordionItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

const LEFT_ITEMS: AccordionItem[] = [
  {
    id: 'l1',
    question: 'Was kann ich tun, wenn meine Klimaanlage nicht kühlt?',
    answer: (
      <p>
        Ja, wir bieten Geschenkgutscheine an, die Sie in unserem Online-Shop einlösen können. Sie können die Geschenkgutscheine auf unserer Website erwerben und dem Empfänger per E-Mail senden oder ihm einen physischen Gutschein zusenden lassen.
      </p>
    ),
  },
  {
    id: 'l2',
    question: 'Welche Sicherheitsmaßnahmen gibt es beim Bezahlen?',
    answer: (
      <p>
        Wir verwenden <strong className="font-semibold text-gray-900">SSL-Verschlüsselung</strong> (Secure Socket Layer), um sicherzustellen, dass alle Zahlungen auf unserer Website sicher und geschützt sind. Ihre Zahlungsdaten werden nicht gespeichert und ausschließlich zur Verarbeitung Ihrer Bestellung verwendet. Wir bieten Ihnen sichere Zahlungsmethoden wie Banküberweisung, Kreditkarte und PayPal an.
      </p>
    ),
  },
  {
    id: 'l3',
    question: 'Kann ich meine Bestellung an eine Packstation liefern lassen?',
    answer: (
      <p>
        Ja, wir bieten die Lieferung an Packstationen an. Während des Bestellvorgangs können Sie Ihre Packstation als Lieferadresse angeben. Achten Sie darauf, dass die Größe und das Gewicht Ihrer Bestellung für die Lieferung an eine Packstation geeignet sind.
      </p>
    ),
  },
  {
    id: 'l4',
    question: 'Was passiert, wenn ich meine Lieferung nicht erhalte?',
    answer: (
      <p>
        Falls Ihre Lieferung nicht angekommen ist, überprüfen Sie bitte den Status mit der <strong className="font-semibold text-gray-900">Sendungsverfolgungsnummer</strong>. Sollte das Paket als „zugestellt“ angezeigt werden, aber Sie es nicht erhalten haben, kontaktieren Sie uns bitte umgehend. Wir werden den Fall mit dem Versanddienstleister klären und gegebenenfalls eine Nachforschung einleiten.
      </p>
    ),
  },
  {
    id: 'l5',
    question: 'Wie kann ich den Kundenservice erreichen?',
    answer: (
      <p>
        Unser Kundenservice ist per E-Mail unter{' '}
        <a href="mailto:kontakt@frankhausgeraete.de" className="text-red-600 hover:underline font-medium">
          kontakt@frankhausgeraete.de
        </a>{' '}
        erreichbar. Wir sind bestrebt, Ihre Anfrage so schnell wie möglich zu beantworten und Ihnen zu helfen, eine Lösung zu finden.
      </p>
    ),
  },
];

const RIGHT_ITEMS: AccordionItem[] = [
  {
    id: 'r1',
    question: 'Wie kann ich eine Bestellung aufgeben?',
    answer: (
      <p>
        Um eine Bestellung aufzugeben, gehen Sie einfach auf unsere Website, wählen Sie die gewünschten Produkte aus und fügen Sie diese Ihrem Warenkorb hinzu. Sobald Sie Ihre Auswahl getroffen haben, klicken Sie auf „Zur Kasse gehen“ und folgen den Anweisungen, um Ihre Bestellung abzuschließen. Sie können entweder mit einem bestehenden Konto oder als Gast bestellen.
      </p>
    ),
  },
  {
    id: 'r2',
    question: 'Welche Zahlungsmethoden werden akzeptiert?',
    answer: (
      <div className="space-y-2">
        <p>Wir bieten mehrere Zahlungsmethoden an, um den Einkauf so einfach wie möglich zu gestalten:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="font-semibold text-gray-900">Banküberweisung</strong></li>
          <li><strong className="font-semibold text-gray-900">Kreditkarte (VISA, MasterCard, American Express)</strong></li>
          <li><strong className="font-semibold text-gray-900">PayPal</strong></li>
        </ul>
        <p className="pt-1">
          Alle Zahlungen werden sicher über verschlüsselte Verbindungen abgewickelt, sodass Ihre Daten jederzeit geschützt sind.
        </p>
      </div>
    ),
  },
  {
    id: 'r3',
    question: 'Was passiert, wenn ein Artikel nicht vorrätig ist?',
    answer: (
      <p>
        Wenn ein Artikel vorübergehend nicht verfügbar ist, können Sie diesen auf unserer Website auf die Warteliste setzen lassen, um benachrichtigt zu werden, sobald er wieder auf Lager ist. Alternativ können Sie sich entscheiden, den Artikel zu einem späteren Zeitpunkt zu bestellen oder eine ähnliche Alternative auszuwählen.
      </p>
    ),
  },
  {
    id: 'r4',
    question: 'Wie hoch sind die Versandkosten?',
    answer: (
      <div className="space-y-2">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong className="font-semibold text-gray-900">Kostenlose Lieferung in Deutschland</strong> für Bestellungen ab <strong className="font-semibold text-gray-900">159€</strong>.
          </li>
          <li>
            <strong className="font-semibold text-gray-900">Standardlieferung</strong> in Deutschland: <strong className="font-semibold text-gray-900">14,92€</strong>.
          </li>
          <li>
            <strong className="font-semibold text-gray-900">Expresslieferung</strong> in Deutschland: <strong className="font-semibold text-gray-900">62,89€</strong>.
          </li>
        </ul>
        <p className="pt-1">
          Für internationale Lieferungen berechnen sich die Versandkosten nach Zielort und Gewicht der Bestellung und werden Ihnen während des Bestellvorgangs angezeigt.
        </p>
      </div>
    ),
  },
  {
    id: 'r5',
    question: 'Wie lange dauert es, bis meine Bestellung ankommt?',
    answer: (
      <div className="space-y-2">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong className="font-semibold text-gray-900">Standardlieferung in Deutschland</strong>: 3 bis 6 Werktage nach Zahlungseingang.
          </li>
          <li>
            <strong className="font-semibold text-gray-900">Expresslieferung in Deutschland</strong>: 48 Stunden (bei Bestellung vor 12:00 Uhr).
          </li>
        </ul>
        <p className="pt-1">
          Für internationale Lieferungen können die Lieferzeiten variieren. Die voraussichtliche Lieferzeit wird Ihnen während des Bestellvorgangs angezeigt.
        </p>
      </div>
    ),
  },
  {
    id: 'r6',
    question: 'Kann ich meine Bestellung nach dem Abschicken noch ändern oder stornieren?',
    answer: (
      <p>
        Sobald Ihre Bestellung bestätigt wurde, wird sie in der Regel schnell bearbeitet, um eine schnelle Lieferung zu gewährleisten. Wenn Sie Ihre Bestellung ändern oder stornieren möchten, kontaktieren Sie uns bitte so schnell wie möglich per E-Mail an{' '}
        <a href="mailto:kontakt@frankhausgeraete.de" className="text-red-600 hover:underline font-medium">
          kontakt@frankhausgeraete.de
        </a>
        . Wir werden prüfen, ob dies noch möglich ist.
      </p>
    ),
  },
  {
    id: 'r7',
    question: 'Wie kann ich meine Bestellung verfolgen?',
    answer: (
      <p>
        Nach dem Versand Ihrer Bestellung erhalten Sie eine E-Mail mit einer <strong className="font-semibold text-gray-900">Sendungsverfolgungsnummer</strong>. Mit dieser Nummer können Sie den Status Ihrer Lieferung jederzeit online nachverfolgen.
      </p>
    ),
  },
  {
    id: 'r8',
    question: 'Welche Garantie gilt für meine Produkte?',
    answer: (
      <div className="space-y-2">
        <p>
          Alle Produkte unterliegen der <strong className="font-semibold text-gray-900">gesetzlichen Gewährleistung</strong> von 2 Jahren, gemäß den Bestimmungen des Bürgerlichen Gesetzbuches (BGB). Sollte ein Produkt innerhalb dieser Frist Mängel aufweisen, haben Sie Anspruch auf Reparatur, Austausch oder Rückerstattung.
        </p>
        <p>
          Zusätzlich bieten einige Hersteller <strong className="font-semibold text-gray-900">garantiespezifische Leistungen</strong> an, die über die gesetzliche Gewährleistung hinausgehen. Die genauen Bedingungen finden Sie in der Bedienungsanleitung oder auf der Website des Herstellers.
        </p>
      </div>
    ),
  },
  {
    id: 'r9',
    question: 'Was passiert, wenn ich ein defektes oder beschädigtes Produkt erhalte?',
    answer: (
      <p>
        Falls Sie ein beschädigtes oder defektes Produkt erhalten, kontaktieren Sie uns bitte umgehend per E-Mail an{' '}
        <a href="mailto:kontakt@frankhausgeraete.de" className="text-red-600 hover:underline font-medium">
          kontakt@frankhausgeraete.de
        </a>
        . Wir werden das Problem schnellstmöglich lösen und entweder eine Rückerstattung, einen Austausch oder eine Reparatur veranlassen.
      </p>
    ),
  },
  {
    id: 'r10',
    question: 'Wie kann ich meine Bestellung zurückgeben?',
    answer: (
      <div className="space-y-2">
        <p>
          Sie haben das Recht, Ihre Bestellung innerhalb von <strong className="font-semibold text-gray-900">14 Tagen</strong> nach Erhalt der Ware ohne Angabe von Gründen zu widerrufen. Um von diesem Recht Gebrauch zu machen, müssen Sie uns eine eindeutige Erklärung über Ihren Widerruf senden.
        </p>
        <p>
          Bitte besuchen Sie unsere <strong className="font-semibold text-gray-900">Rückgabe- und Rückerstattungsrichtlinie</strong> für detaillierte Informationen, wie Sie eine Rücksendung vornehmen können.
        </p>
      </div>
    ),
  },
  {
    id: 'r11',
    question: 'Welche Produkte verkaufen Sie?',
    answer: (
      <div className="space-y-3">
        <div>
          <p className="font-medium text-gray-900 mb-1.5">Wir verkaufen eine breite Palette an Haushaltsgeräten, einschließlich:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li><strong className="font-semibold text-gray-900">Kochfelder</strong></li>
            <li><strong className="font-semibold text-gray-900">Waschmaschinen</strong></li>
            <li><strong className="font-semibold text-gray-900">Trockner</strong></li>
            <li><strong className="font-semibold text-gray-900">Geschirrspüler</strong></li>
            <li><strong className="font-semibold text-gray-900">Mikrowellen</strong></li>
            <li><strong className="font-semibold text-gray-900">Herde</strong></li>
            <li><strong className="font-semibold text-gray-900">Kühl- und Gefrierschränke</strong></li>
            <li><strong className="font-semibold text-gray-900">Kaffeemaschinen</strong></li>
            <li><strong className="font-semibold text-gray-900">Staubsauger & Reiniger</strong></li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-gray-900 mb-1.5">Zusätzlich bieten wir auch Elektronikprodukte an, darunter:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li><strong className="font-semibold text-gray-900">PlayStation</strong></li>
            <li><strong className="font-semibold text-gray-900">PC-Gaming-Zubehör</strong></li>
            <li><strong className="font-semibold text-gray-900">Tragbare Spielkonsolen</strong></li>
            <li><strong className="font-semibold text-gray-900">Speichermedien</strong></li>
            <li><strong className="font-semibold text-gray-900">Kopfhörer</strong></li>
            <li><strong className="font-semibold text-gray-900">Microsoft Xbox</strong></li>
            <li><strong className="font-semibold text-gray-900">Nintendo</strong></li>
          </ul>
        </div>
      </div>
    ),
  },
];

export default function HGFPageContent() {
  // Start with l1 and r1 open, exactly as displayed in user screenshot
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    l1: true,
    r1: true,
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderAccordionItem = (item: AccordionItem) => {
    const isOpen = !!openItems[item.id];
    return (
      <div
        key={item.id}
        className="border border-gray-200 rounded-sm mb-2 overflow-hidden bg-white transition-colors"
      >
        <button
          type="button"
          onClick={() => toggleItem(item.id)}
          className="w-full px-4 py-3 sm:py-3.5 flex items-center justify-between text-left gap-3 focus:outline-none transition-colors"
        >
          <span
            className={`text-xs sm:text-sm font-medium transition-colors ${
              isOpen ? 'text-[#2e7d32]' : 'text-[#c0392b] hover:text-[#a93226]'
            }`}
          >
            {item.question}
          </span>
          <span
            className={`shrink-0 transition-transform text-xs font-semibold ${
              isOpen ? 'text-[#2e7d32]' : 'text-[#c0392b]'
            }`}
          >
            {isOpen ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </span>
        </button>

        {isOpen && (
          <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100">
            {item.answer}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8 font-medium">
          <Link href="/" className="hover:text-red-600 transition-colors">Startseite</Link>
          <span>/</span>
          <span className="text-gray-900 font-bold">Häufig gestellte Fragen (HGF)</span>
        </nav>

        {/* 2-column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
          
          {/* Left Column */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 tracking-tight">
              Häufig gestellte Fragen (HGF) – Frank Hausgeräte e.K.
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
              Herzlich willkommen auf unserer HGF-Seite! Hier finden Sie Antworten auf die am häufigsten gestellten Fragen zu unseren Produkten, Bestellungen, Versandoptionen, Rückgaben und vielem mehr. Unser Ziel ist es, Ihnen den bestmöglichen Service zu bieten und Ihre Fragen schnell und einfach zu beantworten. Sollte Ihre Frage hier nicht beantwortet werden, zögern Sie nicht, sich direkt an unseren Kundenservice zu wenden. Wir helfen Ihnen gerne weiter!
            </p>

            {/* Showroom Photo */}
            <div className="overflow-hidden rounded-md border border-gray-100 shadow-sm mb-6">
              <Image
                src="/images/contact-frank-hausgeraete.jpg"
                alt="FRANK HAUSGERÄTE Showroom"
                width={640}
                height={420}
                className="w-full h-auto object-cover"
                priority
              />
            </div>

            {/* Contacts Info */}
            <div className="mb-6 text-xs sm:text-sm">
              <p className="font-bold text-gray-900 mb-1">Kontakte:</p>
              <p className="text-gray-700">
                Email:{' '}
                <a
                  href="mailto:kontakt@frankhausgeraete.de"
                  className="text-red-600 hover:text-red-700 hover:underline font-medium"
                >
                  kontakt@frankhausgeraete.de
                </a>
              </p>
            </div>

            {/* Left Accordions */}
            <div>
              {LEFT_ITEMS.map((item) => renderAccordionItem(item))}
            </div>
          </div>

          {/* Right Column */}
          <div>
            {RIGHT_ITEMS.map((item) => renderAccordionItem(item))}
          </div>

        </div>
      </main>
    </div>
  );
}
