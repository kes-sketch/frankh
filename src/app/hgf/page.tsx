import { Metadata } from 'next';
import HGFPageContent from '@/components/faq/HGFPageContent';

export const metadata: Metadata = {
  title: 'Häufig gestellte Fragen (HGF) | FRANK HAUSGERÄTE',
  description: 'Finden Sie Antworten auf häufig gestellte Fragen (HGF) zu Bestellungen, Zahlungsmethoden, Versand, Rückgabe und Garantie bei FRANK HAUSGERÄTE.',
  alternates: {
    canonical: 'https://frankhausgeraete.de/hgf',
  },
};

export default function HGFPage() {
  return <HGFPageContent />;
}
