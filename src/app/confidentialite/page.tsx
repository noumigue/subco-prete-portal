export const metadata = {
  title: 'Confidentialité des données — SUBCO-PRETE',
  description: 'Comment la plateforme SUBCO-PRETE traite et protège vos données personnelles.',
};

export default function ConfidentialitePage() {
  return (
    <main className="section section-band">
      <div className="container legal-page">
        <p className="eyebrow">Confidentialité des données</p>
        <h1 className="page-title">Confidentialité des données</h1>
        <p className="legal-lead">
          La protection de vos données est une priorité. Cette page explique quelles données sont traitées, dans quel but, et
          quels sont vos droits.
        </p>

        <section className="legal-section">
          <h2>Données collectées</h2>
          <ul>
            <li><strong>Compte opérateur</strong> : nom de l’organisation, e-mail, et informations saisies dans vos candidatures.</li>
            <li><strong>Test d’éligibilité</strong> : anonyme — vos réponses ne sont pas enregistrées ni rattachées à une identité.</li>
            <li><strong>Réclamations &amp; recours</strong> : les informations que vous fournissez, avec possibilité de signalement anonyme.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Finalités</h2>
          <p>
            Les données servent exclusivement à l’instruction des candidatures, à la gestion des subventions, au support et au
            traitement des réclamations, dans le cadre du Projet PRETE — Nyunganira.
          </p>
        </section>

        <section className="legal-section">
          <h2>Confidentialité &amp; accès</h2>
          <p>
            Vos données sont accessibles uniquement aux personnes habilitées de l’UGP et, le cas échéant, au cabinet d’instruction,
            dans la stricte mesure nécessaire à leur mission. Elles ne sont pas cédées à des tiers à des fins commerciales.
          </p>
        </section>

        <section className="legal-section">
          <h2>Conservation</h2>
          <p>
            Les données sont conservées pendant la durée nécessaire à l’instruction et au suivi, puis archivées conformément aux
            règles du projet et de son bailleur.
          </p>
        </section>

        <section className="legal-section">
          <h2>Vos droits</h2>
          <p>
            Vous pouvez demander l’accès, la rectification ou la suppression de vos données personnelles en écrivant à{' '}
            <a href="mailto:subco@prete.bi">subco@prete.bi</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
