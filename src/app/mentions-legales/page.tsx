export const metadata = {
  title: 'Mentions légales — SUBCO-PRETE',
  description: 'Mentions légales de la plateforme SUBCO-PRETE (Projet PRETE Nyunganira).',
};

export default function MentionsLegalesPage() {
  return (
    <main className="section section-band">
      <div className="container legal-page">
        <p className="eyebrow">Mentions légales</p>
        <h1 className="page-title">Mentions légales</h1>
        <p className="legal-lead">
          Informations relatives à l’éditeur et à l’hébergement de la plateforme SUBCO-PRETE.
        </p>

        <section className="legal-section">
          <h2>Éditeur</h2>
          <p>
            La plateforme SUBCO-PRETE est éditée par l’Unité de Gestion du Projet (UGP) du Projet PRETE — Nyunganira,
            programme de subventions de contrepartie financé par la Banque mondiale.<br />
            Contact : <a href="mailto:subco@prete.bi">subco@prete.bi</a>
          </p>
        </section>

        <section className="legal-section">
          <h2>Objet de la plateforme</h2>
          <p>
            La plateforme a pour objet d’informer sur le mécanisme, de permettre la vérification d’éligibilité, le dépôt et le
            suivi des candidatures aux appels à propositions, ainsi que la gestion des subventions accordées.
          </p>
        </section>

        <section className="legal-section">
          <h2>Propriété intellectuelle</h2>
          <p>
            Les contenus (textes, éléments graphiques, documents) sont la propriété de l’UGP PRETE ou de ses partenaires, sauf
            mention contraire. Toute reproduction sans autorisation est interdite.
          </p>
        </section>

        <section className="legal-section">
          <h2>Responsabilité</h2>
          <p>
            L’UGP s’efforce d’assurer l’exactitude des informations publiées. Seuls les documents officiels des appels à
            propositions font foi. Les résultats des candidatures sont notifiés par les canaux officiels.
          </p>
        </section>

        <section className="legal-section">
          <h2>Données personnelles</h2>
          <p>
            Le traitement des données est décrit dans la page <a href="/confidentialite">Confidentialité des données</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
