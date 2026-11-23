'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateSettingsBatch } from '@/actions/settings';
import Link from 'next/link';

export default function ThankYouPageForm({ initialSettings }: { initialSettings: Record<string, string> }) {
  const tSettings = useTranslations('AdminSettings');
  const router = useRouter();

  // General & Header
  const [eyebrow, setEyebrow] = useState(initialSettings.THANK_YOU_EYEBROW || 'WILLKOMMEN BEI FRANK HAUSGERÄTE');
  const [title, setTitle] = useState(initialSettings.THANK_YOU_TITLE || 'Vielen Dank für Ihre Anmeldung!');
  const [subtitle, setSubtitle] = useState(initialSettings.THANK_YOU_SUBTITLE || 'Ihre Anmeldung wurde erfolgreich abgeschlossen.');

  // Section 1: Presentation & Comfort
  const [section1Heading, setSection1Heading] = useState(initialSettings.THANK_YOU_SECTION1_HEADING || 'Qualität und Komfort für Ihr Zuhause.');
  const [section1Text, setSection1Text] = useState(initialSettings.THANK_YOU_SECTION1_TEXT || 'Freuen Sie sich auf exklusive Angebote, wertvolle Expertentipps und die besten Haushaltsgeräte für ein modernes und energieeffizientes Zuhause.');

  // Gift & Coupon Box
  const [giftEyebrow, setGiftEyebrow] = useState(initialSettings.THANK_YOU_GIFT_EYEBROW || 'EIN BESONDERES GESCHENK FÜR SIE');
  const [giftTitle, setGiftTitle] = useState(initialSettings.THANK_YOU_GIFT_TITLE || 'Ihr persönlicher Willkommensrabatt!');
  const [giftDesc, setGiftDesc] = useState(initialSettings.THANK_YOU_GIFT_DESC || 'Als Dankeschön für Ihr Vertrauen erhalten Sie einen exklusiven Rabatt auf Ihre nächste Bestellung.');
  const [couponBadge, setCouponBadge] = useState(initialSettings.THANK_YOU_COUPON_BADGE || '10% RABATT');
  const [couponCode, setCouponCode] = useState(initialSettings.THANK_YOU_COUPON_CODE || 'WELCOME10');
  const [couponNote, setCouponNote] = useState(initialSettings.THANK_YOU_COUPON_NOTE || 'Lösen Sie diesen Code einfach beim Checkout Ihrer Bestellung ein.');
  const [ctaText, setCtaText] = useState(initialSettings.THANK_YOU_CTA_TEXT || 'PRODUKTE JETZT ENTDECKEN');
  const [ctaUrl, setCtaUrl] = useState(initialSettings.THANK_YOU_CTA_URL || '/produkt');

  // Signoff & Footer message
  const [signoffHeading, setSignoffHeading] = useState(initialSettings.THANK_YOU_SIGNOFF_HEADING || 'Zuverlässige Technik. Erstklassiger Service. Mehr Lebensqualität.');
  const [signoffText, setSignoffText] = useState(initialSettings.THANK_YOU_SIGNOFF_TEXT || 'Vielen Dank, dass Sie Teil unserer Community sind. Bei allen Fragen rund um Ihre Geräte sind wir jederzeit gerne für Sie da!');
  const [signoffName, setSignoffName] = useState(initialSettings.THANK_YOU_SIGNOFF_NAME || 'Ihr Team von Frank Hausgeräte e.K.');

  // Checkout order confirmation page message
  const [orderSuccessMessage, setOrderSuccessMessage] = useState(initialSettings.ORDER_SUCCESS_MESSAGE || 'Vielen Dank. Ihre Bestellung ist bei uns eingegangen.');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    await updateSettingsBatch({
      THANK_YOU_EYEBROW: eyebrow,
      THANK_YOU_TITLE: title,
      THANK_YOU_SUBTITLE: subtitle,
      THANK_YOU_SECTION1_HEADING: section1Heading,
      THANK_YOU_SECTION1_TEXT: section1Text,
      THANK_YOU_GIFT_EYEBROW: giftEyebrow,
      THANK_YOU_GIFT_TITLE: giftTitle,
      THANK_YOU_GIFT_DESC: giftDesc,
      THANK_YOU_COUPON_BADGE: couponBadge,
      THANK_YOU_COUPON_CODE: couponCode,
      THANK_YOU_COUPON_NOTE: couponNote,
      THANK_YOU_CTA_TEXT: ctaText,
      THANK_YOU_CTA_URL: ctaUrl,
      THANK_YOU_SIGNOFF_HEADING: signoffHeading,
      THANK_YOU_SIGNOFF_TEXT: signoffText,
      THANK_YOU_SIGNOFF_NAME: signoffName,
      ORDER_SUCCESS_MESSAGE: orderSuccessMessage
    });

    setMessage(tSettings('update_success') || 'Paramètres mis à jour avec succès.');
    setIsLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Page Thank You (Dankeseite)</h2>
          <p className="text-gray-500 mt-1">Personnalisez l'affichage de la page de remerciement et de bienvenue.</p>
        </div>
        <Link
          href="/thank-you"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
        >
          <span>Voir la page en direct</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </Link>
      </div>

      {message && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md border border-green-200">
          {message}
        </div>
      )}

      {/* Section 1: En-tête */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="text-md font-bold text-gray-900 border-b border-gray-200 pb-2">1. En-tête de la page</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Texte chapeau (Eyebrow)</label>
            <input
              type="text"
              value={eyebrow}
              onChange={(e) => setEyebrow(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre principal (H1)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Promesse & Confort */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="text-md font-bold text-gray-900 border-b border-gray-200 pb-2">2. Message de présentation</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre de section</label>
          <input
            type="text"
            value={section1Heading}
            onChange={(e) => setSection1Heading(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Texte explicatif</label>
          <textarea
            rows={2}
            value={section1Text}
            onChange={(e) => setSection1Text(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Section 3: Bloc Cadeau & Code Promo */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="text-md font-bold text-gray-900 border-b border-gray-200 pb-2">3. Encadré Cadeau & Code de réduction</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chapeau du cadeau</label>
            <input
              type="text"
              value={giftEyebrow}
              onChange={(e) => setGiftEyebrow(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre du cadeau</label>
            <input
              type="text"
              value={giftTitle}
              onChange={(e) => setGiftTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description du cadeau</label>
            <input
              type="text"
              value={giftDesc}
              onChange={(e) => setGiftDesc(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Badge de réduction</label>
            <input
              type="text"
              value={couponBadge}
              onChange={(e) => setCouponBadge(e.target.value)}
              placeholder="10% RABATT"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 font-bold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code coupon (copiable en 1 clic)</label>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="WELCOME10"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 font-mono font-bold"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Consigne du code coupon</label>
            <input
              type="text"
              value={couponNote}
              onChange={(e) => setCouponNote(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texte du bouton CTA</label>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lien du bouton CTA</label>
            <input
              type="text"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Signature */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="text-md font-bold text-gray-900 border-b border-gray-200 pb-2">4. Conclusion & Signature</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre de fin</label>
          <input
            type="text"
            value={signoffHeading}
            onChange={(e) => setSignoffHeading(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message d'accompagnement</label>
          <textarea
            rows={2}
            value={signoffText}
            onChange={(e) => setSignoffText(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom / Signature</label>
          <input
            type="text"
            value={signoffName}
            onChange={(e) => setSignoffName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Section 5: Confirmation de commande */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="text-md font-bold text-gray-900 border-b border-gray-200 pb-2">5. Message de confirmation de commande (/checkout/success)</h3>
        <p className="text-xs text-gray-500">Ce message s'affiche sur la page de succès après qu'un client a passé une commande.</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message de confirmation</label>
          <textarea
            rows={2}
            value={orderSuccessMessage}
            onChange={(e) => setOrderSuccessMessage(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Live Preview */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Aperçu en direct (Page Thank You)</h3>
          <span className="text-xs bg-orange-100 text-orange-800 font-semibold px-2.5 py-0.5 rounded-full">Live Preview</span>
        </div>

        <div className="bg-[#FAF7F2] p-6 sm:p-8 rounded-2xl border border-[#E7DFD4] max-w-lg mx-auto text-center font-sans">
          <p className="text-[10px] font-bold tracking-widest text-[#8C6D53] uppercase mb-1">{eyebrow}</p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1F1D1A]">{title}</h2>
          <p className="text-xs text-[#666059] mt-1">{subtitle}</p>
          <div className="w-full border-t border-[#ECE5DB] my-4" />
          <h3 className="text-sm font-bold text-[#1F1D1A]">{section1Heading}</h3>
          <p className="text-xs text-[#666059] mt-1 leading-relaxed">{section1Text}</p>

          <div className="bg-white border border-[#E7DFD4] rounded-xl p-4 mt-4 shadow-xs">
            <p className="text-[9px] font-bold text-[#8B5E3C] tracking-widest uppercase">{giftEyebrow}</p>
            <h4 className="text-base font-black text-[#1F1D1A] mt-0.5">{giftTitle}</h4>
            <p className="text-[11px] text-[#666059] mt-1">{giftDesc}</p>

            <div className="border border-dashed border-[#CBB89D] bg-stone-50/60 rounded-lg p-3 my-3">
              <div className="text-sm font-black text-[#8B5E3C]">{couponBadge}</div>
              <div className="font-mono font-black text-xl text-[#1F1D1A] my-1 tracking-widest">{couponCode}</div>
              <div className="text-[10px] text-[#78716A]">{couponNote}</div>
            </div>

            <div className="inline-block bg-red-600 text-white font-bold text-xs py-2 px-5 rounded-md mt-1 uppercase tracking-wider">
              {ctaText}
            </div>
          </div>

          <div className="w-full border-t border-[#ECE5DB] my-4" />
          <h4 className="text-xs font-bold text-[#1F1D1A]">{signoffHeading}</h4>
          <p className="text-[11px] text-[#666059] mt-1">{signoffText}</p>
          <p className="italic font-serif text-[#A86438] text-sm mt-2 font-semibold">Herzliche Grüße<br/><span className="text-xs font-sans text-[#1F1D1A] not-italic">{signoffName}</span></p>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 text-sm font-bold transition-colors shadow-sm"
        >
          {isLoading ? (tSettings('saving') || 'Enregistrement...') : (tSettings('save_changes') || 'Enregistrer les modifications')}
        </button>
      </div>
    </form>
  );
}
