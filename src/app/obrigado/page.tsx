import { Suspense } from 'react';
import type { Metadata } from 'next';
import ThankYouContent from '../thank-you/ThankYouContent';

export const metadata: Metadata = {
  title: 'Vielen Dank für Ihre Anmeldung | Frank Hausgeräte',
  description: 'Ihre Anmeldung war erfolgreich. Nutzen Sie Ihren exklusiven Willkommensgutschein!',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: '/thank-you',
  },
};

export default function ObrigadoPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full bg-[#FAF7F2] py-20 px-4 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
