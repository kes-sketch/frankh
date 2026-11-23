import { Metadata } from 'next';
import ContactPageContent from '@/components/contact/ContactPageContent';

export const metadata: Metadata = {
  title: 'Kontakt & Kundenservice | FRANK HAUSGERÄTE',
  description: 'Kontaktieren Sie FRANK HAUSGERÄTE. Schnelle Hilfe zu Produkten, Bestellungen, Showroom-Besuchen und Beratung per E-Mail oder Live-Chat.',
  alternates: {
    canonical: 'https://frankhausgeraete.de/kontakt',
  },
};

export default function KontaktPage() {
  return <ContactPageContent />;
}
