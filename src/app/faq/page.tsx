import Link from 'next/link';
import FaqSection from '../FaqSection';
import { getFaqItems } from '@/lib/strapi-public';

export const metadata = {
  title: 'FAQ — SUBCO-PRETE',
};

export default async function FaqPage() {
  const items = await getFaqItems();

  return (
    <main className="section section-band band-faq-page">
      <div className="container">
        <p className="meta" style={{ marginBottom: '1rem' }}>
          <Link href="/">Retour à l&apos;accueil</Link>
        </p>
        <FaqSection items={items} />
      </div>
    </main>
  );
}
