import Image from 'next/image';
import ContactForm from './ContactForm';

export default function ContactPageContent() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Main 2-column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">

          {/* Left Column: Image & Legal Text */}
          <div>
            {/* Showroom Image */}
            <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm mb-8">
              <Image
                src="/images/contact-frank-hausgeraete.jpg"
                alt="FRANK HAUSGERÄTE Showroom"
                width={640}
                height={440}
                className="w-full h-auto object-cover"
                priority
              />
            </div>

            {/* Section 1: Verarbeitung personenbezogener Daten */}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 tracking-tight">
              Verarbeitung personenbezogener Daten
            </h2>
            <div className="text-sm text-gray-600 leading-relaxed space-y-3">
              <p>
                <strong className="text-gray-900 font-bold">FRANK HAUSGERÄTE</strong> verpflichtet sich, die Vertraulichkeit der über diese Website erhobenen personenbezogenen Daten zu wahren.
              </p>
              <p>
                Ohne ausdrückliche Zustimmung des Nutzers werden keine personenbezogenen Daten erhoben.
              </p>
              <p>
                Gemäß der Verordnung (EU) 2016/679 (Datenschutz-Grundverordnung – DSGVO) haben Nutzer folgende Rechte:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 my-2">
                <li>Recht auf Auskunft</li>
                <li>Recht auf Berichtigung</li>
                <li>Recht auf Löschung</li>
                <li>Recht auf Einschränkung der Verarbeitung</li>
                <li>Recht auf Widerspruch</li>
              </ul>
              <p className="pt-2">
                Bei Fragen zum Schutz personenbezogener Daten oder zur Ausübung dieser Rechte wenden Sie sich bitte an:{' '}
                <a
                  href="mailto:kontakt@frankhausgeraete.de"
                  className="text-red-600 hover:text-red-700 font-medium hover:underline"
                >
                  kontakt@frankhausgeraete.de
                </a>
              </p>
            </div>

            {/* Section 2: Haftungsbeschränkung */}
            <div className="mt-8 pt-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                Haftungsbeschränkung
              </h2>
              <div className="text-sm text-gray-600 leading-relaxed space-y-3">
                <p>
                  <strong className="text-gray-900 font-bold">FRANK HAUSGERÄTE</strong> trifft alle zumutbaren Vorkehrungen, um die Richtigkeit und Aktualität der auf dieser Website bereitgestellten Informationen sicherzustellen. Trotzdem kann das Unternehmen nicht für etwaige Fehler oder Auslassungen haftbar gemacht werden.
                </p>
                <p>
                  Der Zugriff auf die Website sowie deren Nutzung erfolgen auf eigene Verantwortung des Nutzers.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Support Text & Contact Form */}
          <div>
            {/* Schnelle Hilfe */}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 tracking-tight">
              Schnelle Hilfe
            </h2>
            <div className="text-sm text-gray-600 leading-relaxed space-y-3 mb-8">
              <div>
                <p className="font-bold text-gray-900 text-sm sm:text-base">
                  Sie haben eine Frage? Benötigen Sie schnelle Hilfe?
                </p>
                <p className="text-gray-600">Unser Team ist für Sie da!</p>
              </div>
              <p>
                Egal ob es um unsere Produkte, Ihre Bestellung oder eine persönliche Beratung geht – schreiben Sie uns einfach über den{' '}
                <strong className="text-gray-900 font-bold">Live-Chat</strong> oder per{' '}
                <strong className="text-gray-900 font-bold">E-mail</strong>. Schnell, unkompliziert und direkt – wir antworten Ihnen so rasch wie möglich.
              </p>
              <p>
                Wir sind gerne für Sie da, um Ihnen den bestmöglichen Service zu bieten. Zögern Sie also nicht – schreiben Sie uns, wir helfen Ihnen gerne weiter!
              </p>
            </div>

            {/* Form Title & Subtitle */}
            <div className="mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5">
                Benötigen Sie Informationen? Kontaktieren Sie uns.
              </h3>
              <p className="text-sm sm:text-base font-semibold text-gray-700">
                Füllen Sie Das Untenstehende Formular Aus
              </p>
            </div>

            {/* Contact Form */}
            <ContactForm />
          </div>

        </div>

        {/* Bottom Contact Info Bar (4 Columns) */}
        <div className="mt-16 sm:mt-20 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* 1. Address */}
            <div className="flex items-start gap-3.5">
              <div className="text-[#ea580c] shrink-0 mt-0.5">
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-xs sm:text-sm text-gray-700 leading-snug">
                <p className="font-semibold text-gray-900">Wildbader Straße 51 75394</p>
                <p className="text-gray-600">Oberreichenbach Deutschland</p>
              </div>
            </div>

            {/* 2. Live Chat */}
            <div className="flex items-start gap-3.5">
              <div className="text-[#ea580c] shrink-0 mt-0.5">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.874-.874 5.967 5.967 0 011.057-3.035C4.03 15.656 3 13.916 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <div className="text-xs sm:text-sm leading-snug">
                <p className="font-semibold text-gray-900">Schnelle Kommunikation?</p>
                <p className="text-gray-600">Chatten Sie mit uns</p>
              </div>
            </div>

            {/* 3. Email */}
            <div className="flex items-start gap-3.5">
              <div className="text-[#ea580c] shrink-0 mt-0.5">
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                  <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                  <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                </svg>
              </div>
              <div className="text-xs sm:text-sm leading-snug">
                <p className="font-semibold text-gray-900">Senden Sie uns eine E-Mail: :</p>
                <a
                  href="mailto:kontakt@frankhausgeraete.de"
                  className="text-red-600 hover:text-red-700 hover:underline font-medium break-all"
                >
                  kontakt@frankhausgeraete.de
                </a>
              </div>
            </div>

            {/* 4. Opening Hours */}
            <div className="flex items-start gap-3.5">
              <div className="text-[#ea580c] shrink-0 mt-0.5">
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-xs sm:text-sm leading-snug">
                <p className="font-semibold text-gray-900">Öffnungszeiten:</p>
                <p className="text-gray-600">09:00-20:00</p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
