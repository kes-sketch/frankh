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
  supportPhone = '', 
  supportEmail = 'kontakt@frankhausgeraete.de',
  footerBgColor = '#111827',
  footerTextColor = '#ffffff',
  footerHeadingColor = '#ffffff',
  footerAddress1 = 'Wildbader Straße 51, 75394 Oberreichenbach – Deutschland',
  footerNewsletterTitle = 'Exklusive Angebote sichern',
  footerNewsletterText = 'Abonnieren Sie unseren Newsletter und verpassen Sie keine Rabattaktionen auf Marken-Hausgeräte.',
  footerNewsletterPlaceholder = 'Ihre E-Mail-Adresse...',
  footerCopyright = '© 2026 FRANK HAUSGERÄTE. Alle Rechte vorbehalten.',
  footerColumns = [],
  categories = [],
  footerLogoImage = '',
  footerDescription = 'Ihr zuverlässiger Fachhändler für Premium-Hausgeräte in Deutschland. Große Auswahl an Groß- und Kleingeräten von Miele, Bosch, Siemens, Liebherr mit 2 Jahren Garantie und schnellem Speditionsversand.',
  footerShowAddress = true,
  footerShowEmail = true,
  footerShowPhone = false,
  contactSlug = 'contact'
}: FooterProps) {
  // Mobile accordion state for collapsible footer sections on small screens
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSection(prev => prev === id ? null : id);
  };

  return (
    <footer 
      className="font-sans pt-12 sm:pt-16 pb-28 lg:pb-12 relative border-t border-stone-800" 
      style={{ backgroundColor: footerBgColor, color: footerTextColor }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 w-full">
        
        {/* Top Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 mb-12">
          
          {/* Column 1: Store Brand & Contacts */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center">
              {footerLogoImage && footerLogoImage !== '/logo.png' && footerLogoImage !== '/logo.jpg' && !footerLogoImage.includes('logo-flame') ? (
                <Image src={footerLogoImage} alt="FRANK HAUSGERÄTE" width={200} height={48} className="max-h-12 w-auto object-contain" />
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="bg-[#DC2626] text-white font-black text-xl italic px-3 py-1 rounded-lg tracking-tight shadow-sm flex items-center justify-center">
                    Frank
                  </div>
                  <div>
                    <span className="font-extrabold text-base tracking-tight text-white block leading-tight">HAUSGERÄTE</span>
                    <span className="text-[10px] font-bold tracking-wider text-red-500 uppercase block">Fachhandel &amp; Service</span>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              {footerDescription}
            </p>
            
            <div className="space-y-2.5 text-xs sm:text-sm text-stone-300 pt-2 border-t border-stone-800">
              {footerShowAddress && footerAddress1 && (
                <div className="flex items-start">
                  <svg className="w-4 h-4 mr-2.5 mt-0.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <p>{footerAddress1}</p>
                </div>
              )}
              {footerShowEmail && supportEmail && (
                <div className="flex items-start">
                  <svg className="w-4 h-4 mr-2.5 mt-0.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <a href={`mailto:${supportEmail}`} className="hover:text-red-400 transition truncate">{supportEmail}</a>
                </div>
              )}
              {footerShowPhone && supportPhone && (
                <div className="flex items-start">
                  <svg className="w-4 h-4 mr-2.5 mt-0.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <a href={`tel:${supportPhone.replace(/\s+/g, '')}`} className="hover:text-red-400 transition">{supportPhone}</a>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Footer Columns from Admin if present */}
          {footerColumns && footerColumns.length > 0 ? (
            footerColumns.map((col, idx) => (
              <div key={idx} className="lg:col-span-1 border-t border-stone-800 pt-4 md:border-none md:pt-0">
                <button 
                  type="button" 
                  onClick={() => toggleSection(`col-${idx}`)} 
                  className="w-full flex md:hidden items-center justify-between font-bold text-sm sm:text-base mb-2 cursor-pointer"
                  style={{ color: footerHeadingColor }}
                >
                  <span>{col.title}</span>
                  <svg className={`w-4 h-4 transition-transform ${openSection === `col-${idx}` ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <h3 className="hidden md:block font-bold text-base mb-5" style={{ color: footerHeadingColor }}>{col.title}</h3>
                <ul className={`space-y-3 text-xs sm:text-sm text-stone-300 ${openSection === `col-${idx}` ? 'block pb-3' : 'hidden md:block'}`}>
                  {col.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <Link href={link.url} className="hover:text-red-400 transition">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <>
              {/* Column 2: Rechtliches (German Legal Compliance) */}
              <div className="lg:col-span-1 border-t border-stone-800 pt-4 md:border-none md:pt-0">
                <button 
                  type="button" 
                  onClick={() => toggleSection('legal')} 
                  className="w-full flex md:hidden items-center justify-between font-bold text-sm sm:text-base mb-2 cursor-pointer"
                  style={{ color: footerHeadingColor }}
                >
                  <span>Rechtliches</span>
                  <svg className={`w-4 h-4 transition-transform ${openSection === 'legal' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <h3 className="hidden md:block font-bold text-base mb-5" style={{ color: footerHeadingColor }}>Rechtliches</h3>
                <ul className={`space-y-3 text-xs sm:text-sm text-stone-300 ${openSection === 'legal' ? 'block pb-3' : 'hidden md:block'}`}>
                  <li><Link href="/impressum" className="hover:text-red-400 transition">Impressum</Link></li>
                  <li><Link href="/agb" className="hover:text-red-400 transition">AGB &amp; Kundeninfo</Link></li>
                  <li><Link href="/datenschutz" className="hover:text-red-400 transition">Datenschutzerklärung</Link></li>
                  <li><Link href="/widerrufsbelehrung" className="hover:text-red-400 transition">Widerrufsbelehrung</Link></li>
                  <li><Link href="/elektrog" className="hover:text-red-400 transition">Batterie- &amp; ElektroG</Link></li>
                  <li><Link href="/zahlungsarten" className="hover:text-red-400 transition">Zahlungsarten</Link></li>
                </ul>
              </div>

              {/* Column 3: Kundenservice & Hilfe */}
              <div className="lg:col-span-1 border-t border-stone-800 pt-4 md:border-none md:pt-0">
                <button 
                  type="button" 
                  onClick={() => toggleSection('service')} 
                  className="w-full flex md:hidden items-center justify-between font-bold text-sm sm:text-base mb-2 cursor-pointer"
                  style={{ color: footerHeadingColor }}
                >
                  <span>Kundenservice</span>
                  <svg className={`w-4 h-4 transition-transform ${openSection === 'service' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <h3 className="hidden md:block font-bold text-base mb-5" style={{ color: footerHeadingColor }}>Kundenservice</h3>
                <ul className={`space-y-3 text-xs sm:text-sm text-stone-300 ${openSection === 'service' ? 'block pb-3' : 'hidden md:block'}`}>
                  <li><Link href="/hgf" className="hover:text-red-400 transition">Häufig gestellte Fragen (HGF)</Link></li>
                  <li><Link href="/order-tracking" className="hover:text-red-400 transition">Bestellung verfolgen</Link></li>
                  <li><Link href="/versand-und-lieferung" className="hover:text-red-400 transition">Versand &amp; Spedition</Link></li>
                  <li><Link href="/rueckgabe" className="hover:text-red-400 transition">30 Tage Rückgaberecht</Link></li>
                  <li><Link href="/account" className="hover:text-red-400 transition">Kundenkonto</Link></li>
                  <li><Link href="/cart" className="hover:text-red-400 transition">Warenkorb</Link></li>
                  <li><Link href={`/${contactSlug}`} className="hover:text-red-400 transition">Kontakt &amp; Beratung</Link></li>
                </ul>
              </div>

              {/* Column 4: Beliebte Kategorien */}
              <div className="lg:col-span-1 border-t border-stone-800 pt-4 md:border-none md:pt-0">
                <button 
                  type="button" 
                  onClick={() => toggleSection('categories')} 
                  className="w-full flex md:hidden items-center justify-between font-bold text-sm sm:text-base mb-2 cursor-pointer"
                  style={{ color: footerHeadingColor }}
                >
                  <span>Sortiment</span>
                  <svg className={`w-4 h-4 transition-transform ${openSection === 'categories' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <h3 className="hidden md:block font-bold text-base mb-5" style={{ color: footerHeadingColor }}>Sortiment</h3>
                <ul className={`space-y-3 text-xs sm:text-sm text-stone-300 ${openSection === 'categories' ? 'block pb-3' : 'hidden md:block'}`}>
                  {categories && categories.length > 0 ? (
                    categories.slice(0, 7).map((cat) => (
                      <li key={cat.id}>
                        <Link href={`/shop?category=${cat.slug || cat.id}`} className="hover:text-red-400 transition">
                          {cat.name}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <>
                      <li><Link href="/shop?category=kuehlen-gefrieren" className="hover:text-red-400 transition">Kühlen &amp; Gefrieren</Link></li>
                      <li><Link href="/shop?category=waschen-trocknen" className="hover:text-red-400 transition">Waschen &amp; Trocknen</Link></li>
                      <li><Link href="/shop?category=kochen-backen" className="hover:text-red-400 transition">Kochen &amp; Backen</Link></li>
                      <li><Link href="/shop?category=geschirrspueler" className="hover:text-red-400 transition">Geschirrspüler</Link></li>
                      <li><Link href="/shop?category=kaffeevollautomaten" className="hover:text-red-400 transition">Kaffeevollautomaten</Link></li>
                      <li><Link href="/shop?category=saugroboter" className="hover:text-red-400 transition">Saugroboter &amp; Boden</Link></li>
                    </>
                  )}
                </ul>
              </div>
            </>
          )}

          {/* Column 5: Newsletter */}
          <div className="lg:col-span-1 border-t border-stone-800 pt-6 md:border-none md:pt-0">
            <h3 className="font-bold text-sm sm:text-base mb-3 sm:mb-5" style={{ color: footerHeadingColor }}>{footerNewsletterTitle}</h3>
            <p className="text-xs sm:text-sm mb-4 leading-relaxed text-stone-300">
              {footerNewsletterText}
            </p>
            <NewsletterFooterForm placeholder={footerNewsletterPlaceholder} />
          </div>

        </div>

        {/* Bottom Bar: Copyright & Verified German Payment Badges */}
        <div className="border-t border-stone-800/80 pt-6 mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-stone-400 text-center md:text-left">
            {footerCopyright}
          </div>

          {/* Official German & European Payment Methods */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* PayPal */}
            <div className="bg-white px-2.5 py-1 rounded-md text-[#003087] font-black text-[11px] flex items-center gap-0.5 shadow-sm border border-stone-300">
              <span className="text-[#0079C1] italic">Pay</span>
              <span className="text-[#00457C] italic">Pal</span>
            </div>

            {/* Klarna */}
            <div className="bg-[#FFB3C7] px-2.5 py-1 rounded-md text-stone-900 font-black text-[11px] shadow-sm tracking-tight">
              Klarna.
            </div>

            {/* Sofort */}
            <div className="bg-white px-2.5 py-1 rounded-md text-stone-800 font-bold text-[10px] shadow-sm border border-stone-300">
              SOFORT
            </div>

            {/* Visa */}
            <div className="bg-white px-2.5 py-1 rounded-md text-[#1A1F71] font-black text-[11px] shadow-sm border border-stone-300 tracking-wider">
              VISA
            </div>

            {/* Mastercard */}
            <div className="bg-white px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm border border-stone-300">
              <span className="w-3.5 h-3.5 rounded-full bg-[#EB001B] inline-block -mr-2"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#F79E1B]/90 inline-block"></span>
              <span className="text-[10px] font-bold text-stone-800 ml-1">mastercard</span>
            </div>

            {/* Apple Pay */}
            <div className="bg-white px-2.5 py-1 rounded-md text-black font-semibold text-[11px] flex items-center gap-1 shadow-sm border border-stone-300">
              <svg className="w-3.5 h-3.5" viewBox="0 0 170 170" fill="currentColor">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.72-7.87-12.08-14.37-6.53-9.82-11.66-21.2-15.38-34.13-3.72-12.94-5.59-24.89-5.59-35.86 0-14.16 3.51-26.02 10.53-35.58 7.02-9.56 16.03-14.47 27.03-14.74 5.25 0 10.74 1.34 16.48 4.02 5.73 2.68 9.53 4.08 11.4 4.2 1.45 0 5.48-1.56 12.08-4.69 6.6-3.13 12.35-4.5 17.25-4.12 12.63.76 22.86 5.51 30.69 14.25-10.97 6.64-16.34 15.68-16.11 27.13.23 8.92 3.69 16.42 10.38 22.5 6.69 6.08 14.47 9.49 23.34 10.23-2.12 6.63-4.69 13.56-7.72 20.78zM119.22 31.84c0-7.37 2.66-14.37 7.98-21 5.32-6.63 11.83-10.45 19.53-11.45.22 1.12.33 2.24.33 3.35 0 7.26-2.8 14.33-8.38 21.2-5.59 6.87-12.18 10.74-19.78 11.61-.45-1.23-.68-2.47-.68-3.71z" />
              </svg>
              <span>Pay</span>
            </div>

            {/* Google Pay */}
            <div className="bg-white px-2.5 py-1 rounded-md text-stone-800 font-bold text-[11px] shadow-sm border border-stone-300">
              G Pay
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
