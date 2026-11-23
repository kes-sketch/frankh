"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import NewsletterFooterForm from './NewsletterFooterForm';

type FooterProps = {
  supportPhone?: string;
  supportEmail?: string;
  footerBgColor?: string;
  footerTextColor?: string;
  footerHeadingColor?: string;
  footerAddress1?: string;
  footerAddress2?: string;
  footerLocationsTitle?: string;
  footerNewsletterTitle?: string;
  footerNewsletterText?: string;
  footerNewsletterPlaceholder?: string;
  footerCallUsText?: string;
  footerCopyright?: string;
  footerSocialFacebook?: string;
  footerSocialTwitter?: string;
  footerSocialInstagram?: string;
  footerSocialLinkedin?: string;
  footerColumns?: Array<{ title: string, links: Array<{ label: string, url: string }> }>;
  categories?: Array<{ id: string, name: string, slug: string | null }>;
  footerLogoImage?: string;
  footerDescription?: string;
  footerShowAddress?: boolean;
  footerShowEmail?: boolean;
  footerShowPhone?: boolean;
  footerPaymentAmex?: boolean;
  footerPaymentApplePay?: boolean;
  footerPaymentGooglePay?: boolean;
  footerPaymentMastercard?: boolean;
  footerPaymentVisa?: boolean;
  footerPaymentOpay?: boolean;
  contactSlug?: string;
};

export default function Footer({ 
  supportEmail = 'kontakt@frankhausgeraete.de',
  footerBgColor = '#ffffff',
  footerTextColor = '#4b5563',
  footerHeadingColor = '#111827',
  footerAddress1 = 'Wildbader Straße 51 75394 Oberreichenbach Deutschland',
  footerCopyright = '© 2025 Frank Hausgeräte e.K. Alle Rechte vorbehalten.',
  footerLogoImage = 'https://res.cloudinary.com/zgshdhdu/image/upload/v1795391212/topkaminbrennstoffe/media/gl0t7qisrv0klazsqtav.png',
  footerDescription = 'Legen großen Wert auf Qualität, Kundenzufriedenheit und eine transparente Geschäftsabwicklung. Mit einer umfangreichen Auswahl an Produkten aus den Bereichen Haushaltsgeräte, Unterhaltungselektronik und Klimaanlagen bieten wir Ihnen alles, was Sie für Ihr Zuhause und Ihre Freizeit benötigen.',
}: FooterProps) {
  // Mobile accordion state for collapsible footer sections on small screens
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSection(prev => prev === id ? null : id);
  };

  const logoSrc = footerLogoImage && footerLogoImage !== '/logo.png' && footerLogoImage !== '/logo.jpg' && !footerLogoImage.includes('logo-flame')
    ? footerLogoImage
    : 'https://res.cloudinary.com/zgshdhdu/image/upload/v1795391212/topkaminbrennstoffe/media/gl0t7qisrv0klazsqtav.png';

  return (
    <footer 
      className="font-sans pt-12 sm:pt-14 pb-28 lg:pb-10 relative border-t border-gray-200 bg-white text-gray-700" 
      style={{ backgroundColor: footerBgColor, color: footerTextColor }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 w-full">
        
        {/* Top 5-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 mb-12">
          
          {/* Column 1: Store Brand & Info (~28%) */}
          <div className="lg:col-span-3 space-y-4">
            <Link href="/" className="inline-block mb-1">
              <Image 
                src={logoSrc} 
                alt="FRANK HAUSGERÄTE" 
                width={200} 
                height={50} 
                className="max-h-12 w-auto object-contain" 
              />
            </Link>
            
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {footerDescription}
            </p>
            
            <div className="space-y-2.5 text-xs sm:text-sm pt-2">
              <div className="flex items-start gap-2">
                <span className="font-bold text-gray-900 shrink-0">Email:</span>
                <a href={`mailto:${supportEmail}`} className="text-gray-700 hover:text-red-600 transition break-all">
                  {supportEmail}
                </a>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="font-bold text-gray-900 shrink-0">Address:</span>
                <span className="text-gray-700 leading-snug">
                  {footerAddress1}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: KUNDEN (~18%) */}
          <div className="lg:col-span-2 border-t border-gray-100 pt-4 md:border-none md:pt-0">
            <button 
              type="button" 
              onClick={() => toggleSection('kunden')} 
              className="w-full flex md:hidden items-center justify-between font-bold text-sm tracking-wider uppercase mb-3 text-gray-900 cursor-pointer"
            >
              <span>KUNDEN</span>
              <svg className={`w-4 h-4 transition-transform ${openSection === 'kunden' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <h4 className="hidden md:block font-bold text-sm tracking-wider uppercase mb-4 text-gray-900" style={{ color: footerHeadingColor }}>
              KUNDEN
            </h4>
            <ul className={`space-y-2.5 text-xs sm:text-sm text-gray-600 ${openSection === 'kunden' ? 'block pb-3' : 'hidden md:block'}`}>
              <li><Link href="/hgf" className="hover:text-red-600 transition">HGF</Link></li>
              <li><Link href="/wishlist" className="hover:text-red-600 transition">Wunschliste</Link></li>
              <li><Link href="/cart" className="hover:text-red-600 transition">Warenkorb</Link></li>
              <li><Link href="/account" className="hover:text-red-600 transition">Mein Konto</Link></li>
              <li><Link href="/checkout" className="hover:text-red-600 transition">Checkout</Link></li>
              <li><Link href="/cookie-richtlinie" className="hover:text-red-600 transition">Cookie-Richtlinie</Link></li>
            </ul>
          </div>

          {/* Column 3: RECHTLICHES (~22%) */}
          <div className="lg:col-span-2 border-t border-gray-100 pt-4 md:border-none md:pt-0">
            <button 
              type="button" 
              onClick={() => toggleSection('rechtliches')} 
              className="w-full flex md:hidden items-center justify-between font-bold text-sm tracking-wider uppercase mb-3 text-gray-900 cursor-pointer"
            >
              <span>RECHTLICHES</span>
              <svg className={`w-4 h-4 transition-transform ${openSection === 'rechtliches' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <h4 className="hidden md:block font-bold text-sm tracking-wider uppercase mb-4 text-gray-900" style={{ color: footerHeadingColor }}>
              RECHTLICHES
            </h4>
            <ul className={`space-y-2.5 text-xs sm:text-sm text-gray-600 ${openSection === 'rechtliches' ? 'block pb-3' : 'hidden md:block'}`}>
              <li><Link href="/allgemeine-geschaeftsbedingungen-agb" className="hover:text-red-600 transition">AGB</Link></li>
              <li><Link href="/impressum" className="hover:text-red-600 transition">Impressum</Link></li>
              <li><Link href="/ueber-uns" className="hover:text-red-600 transition">Über uns</Link></li>
              <li><Link href="/datenschutzrichtlinie" className="hover:text-red-600 transition">Datenschutzrichtlinie</Link></li>
              <li><Link href="/versandpolitik" className="hover:text-red-600 transition">Versandpolitik</Link></li>
              <li><Link href="/rueckgabe-und-rueckerstattung" className="hover:text-red-600 transition">Rückgabe &amp; Rückerstattung</Link></li>
              <li><Link href="/zahlungsart" className="hover:text-red-600 transition">Zahlungsart</Link></li>
              <li><Link href="/garantie" className="hover:text-red-600 transition">Garantie</Link></li>
              <li><Link href="/contact" className="hover:text-red-600 transition">Kontakt</Link></li>
            </ul>
          </div>

          {/* Column 4: KATALOG (~22%) */}
          <div className="lg:col-span-2 border-t border-gray-100 pt-4 md:border-none md:pt-0">
            <button 
              type="button" 
              onClick={() => toggleSection('katalog')} 
              className="w-full flex md:hidden items-center justify-between font-bold text-sm tracking-wider uppercase mb-3 text-gray-900 cursor-pointer"
            >
              <span>KATALOG</span>
              <svg className={`w-4 h-4 transition-transform ${openSection === 'katalog' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <h4 className="hidden md:block font-bold text-sm tracking-wider uppercase mb-4 text-gray-900" style={{ color: footerHeadingColor }}>
              KATALOG
            </h4>
            <ul className={`space-y-2.5 text-xs sm:text-sm text-gray-600 ${openSection === 'katalog' ? 'block pb-3' : 'hidden md:block'}`}>
              <li><Link href="/produkt-kategorie/kaffeemaschinen" className="hover:text-red-600 transition">Kaffeemaschinen</Link></li>
              <li><Link href="/produkt-kategorie/kuechenmaschinen-mixer" className="hover:text-red-600 transition">Küchenmaschinen</Link></li>
              <li><Link href="/produkt-kategorie/kuehlen-gefrieren" className="hover:text-red-600 transition">Kühlen &amp; Gefrieren</Link></li>
              <li><Link href="/produkt-kategorie/trockner" className="hover:text-red-600 transition">Trockner</Link></li>
              <li><Link href="/produkt-kategorie/waschmaschinen" className="hover:text-red-600 transition">Waschmaschinen</Link></li>
              <li><Link href="/produkt-kategorie/kochfelder" className="hover:text-red-600 transition">Kochfelder</Link></li>
              <li><Link href="/produkt-kategorie/herde" className="hover:text-red-600 transition">Herde</Link></li>
              <li><Link href="/produkt-kategorie/geschirrspueler" className="hover:text-red-600 transition">Geschirrspüler</Link></li>
              <li><Link href="/produkt-kategorie/heizen-klima" className="hover:text-red-600 transition">Heizen &amp; Klima</Link></li>
              <li><Link href="/produkt-kategorie/gaming-vr" className="hover:text-red-600 transition">Gaming &amp; VR</Link></li>
            </ul>
          </div>

          {/* Column 5: NEWSLETTER (~26%) */}
          <div className="lg:col-span-3 border-t border-gray-100 pt-6 md:border-none md:pt-0">
            <h4 className="font-bold text-sm tracking-wider uppercase mb-3 text-gray-900" style={{ color: footerHeadingColor }}>
              NEWSLETTER
            </h4>
            <p className="text-xs sm:text-sm mb-4 leading-relaxed text-gray-600">
              Melden Sie sich für unseren Newsletter an und erhalten Sie 27 € Rabatt auf Ihren ersten Einkauf.
            </p>
            <NewsletterFooterForm placeholder="E-Mail-Adresse" />
          </div>

        </div>

        {/* Bottom Bar: Copyright & Payment Badges */}
        <div className="border-t border-gray-200 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-600 text-center sm:text-left">
            {footerCopyright}
          </div>

          {/* Payment Badges (VISA, Mastercard, AMEX, PayPal, Maestro, Discover) */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {/* VISA */}
            <div className="h-6 px-2 py-0.5 rounded bg-white border border-gray-200 flex items-center justify-center shadow-xs">
              <span className="text-[#1A1F71] font-black italic text-xs tracking-wider">VISA</span>
            </div>

            {/* Mastercard */}
            <div className="h-6 px-2 py-0.5 rounded bg-white border border-gray-200 flex items-center gap-0.5 shadow-xs">
              <div className="w-3 h-3 rounded-full bg-[#EB001B]"></div>
              <div className="w-3 h-3 rounded-full bg-[#F79E1B] -ml-1.5 opacity-90"></div>
            </div>

            {/* AMEX */}
            <div className="h-6 px-2 py-0.5 rounded bg-[#016FD0] text-white font-black text-[9px] tracking-tight flex items-center justify-center shadow-xs">
              AMEX
            </div>

            {/* PayPal */}
            <div className="h-6 px-2 py-0.5 rounded bg-white border border-gray-200 flex items-center gap-0.5 shadow-xs">
              <span className="text-[#003087] font-black italic text-[11px]">Pay</span>
              <span className="text-[#0079C1] font-black italic text-[11px]">Pal</span>
            </div>

            {/* Maestro */}
            <div className="h-6 px-2 py-0.5 rounded bg-white border border-gray-200 flex items-center gap-0.5 shadow-xs">
              <div className="w-3 h-3 rounded-full bg-[#EB001B]"></div>
              <div className="w-3 h-3 rounded-full bg-[#006699] -ml-1.5 opacity-90"></div>
            </div>

            {/* Discover */}
            <div className="h-6 px-2 py-0.5 rounded bg-[#FF6000] text-white font-extrabold text-[9px] tracking-tight flex items-center justify-center shadow-xs">
              DISCOVER
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
