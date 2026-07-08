import Link from 'next/link';

export const metadata = {
  title: 'Accessibilité — SUBCO-PRETE',
  description: 'Engagement d’accessibilité de la plateforme SUBCO-PRETE.',
};

export default function AccessibilitePage() {
  return (
    <main className="section section-band">
      <div className="container legal-page">
        <p className="eyebrow">Accessibilité</p>
        <h1 className="page-title">Accessibilité</h1>
        <p className="legal-lead">
          Nous voulons que la plateforme soit utilisable par le plus grand nombre, y compris les personnes en situation de handicap
          et sur connexion mobile limitée.
        </p>

        <section className="legal-section">
          <h2>Notre engagement</h2>
          <p>
            La plateforme vise à respecter les bonnes pratiques d’accessibilité (contrastes suffisants, navigation au clavier,
            textes lisibles, compatibilité mobile). Le test d’éligibilité et le dépôt de candidature sont pensés pour rester
            simples et accessibles.
          </p>
        </section>

        <section className="legal-section">
          <h2>Signaler un problème</h2>
          <p>
            Vous rencontrez un obstacle d’accessibilité ? Écrivez-nous à{' '}
            <a href="mailto:support@subco-prete.bi">support@subco-prete.bi</a> en décrivant la page et la difficulté — nous nous
            efforçons de corriger rapidement. Vous pouvez aussi passer par la page <Link href="/contact">Contact &amp; support</Link>.
          </p>
        </section>

        <section className="legal-section">
          <h2>Alternatives</h2>
          <p>
            Si une démarche en ligne vous est impossible, contactez l’UGP pour convenir d’un accompagnement adapté.
          </p>
        </section>
      </div>
    </main>
  );
}
