import Link from 'next/link';
import { getCalls, getCandidatureGuide } from '@/lib/strapi-public';

const fallbackGuideSections = [
  {
    title: 'Qui peut candidater ?',
    text: 'Les entreprises, coopératives, associations, ONG, fournisseurs de services numériques et plateformes liées aux chaînes de valeur prioritaires peuvent préparer un dossier si elles répondent aux critères de l’appel.',
  },
  {
    title: 'Conditions d’éligibilité',
    text: 'Le candidat doit être actif dans une chaîne de valeur prioritaire, justifier son expérience, proposer un investissement productif viable et mobiliser une contrepartie selon les règles de l’appel.',
  },
  {
    title: 'Ce que finance PRETE SUBCO',
    text: 'Le mécanisme soutient les infrastructures productives matérielles ou immatérielles : équipements, chaîne du froid, transformation, qualité, traçabilité, services techniques, formation ou dispositifs de marché.',
  },
  {
    title: 'Documents à préparer',
    text: 'Préparez les documents d’existence légale, les preuves d’activité, les justificatifs d’actifs, les contrats ou bons de commande, les éléments financiers et tout document utile au projet.',
  },
  {
    title: 'Processus de sélection',
    text: 'Les dossiers sont soumis en ligne, contrôlés pour complétude, analysés selon les critères administratifs et techniques, puis examinés par les instances prévues par le dispositif.',
  },
];

function toDateLabel(value?: string) {
  if (!value) return 'Date à confirmer';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(d);
}

export default async function CandidatureGuidePage() {
  const [calls, candidatureGuide] = await Promise.all([getCalls(), getCandidatureGuide()]);
  const guideSections = candidatureGuide?.sections?.length ? candidatureGuide.sections : fallbackGuideSections;
  const primaryCtaLabel = candidatureGuide?.primaryCtaLabel || 'Déposer une candidature';
  const primaryCtaUrl = candidatureGuide?.primaryCtaUrl || '/candidature/deposer';
  const openCalls = calls.filter((call) => call.callStatus === 'open').slice(0, 3);

  return (
    <main>
      <section className="section">
        <div className="container page-intro candidature-guide-intro">
          <p className="form-kicker">{candidatureGuide?.kicker || 'Candidature'}</p>
          <h1>{candidatureGuide?.title || 'Préparer votre demande de subvention'}</h1>
          <p>
            {candidatureGuide?.intro ||
              'Avant de remplir le formulaire, vérifiez les conditions, les documents attendus et les appels ouverts.'}
          </p>
          <div className="actions">
            <Link href={primaryCtaUrl} className="btn primary">{primaryCtaLabel}</Link>
            <Link href="#appels-ouverts" className="btn secondary">Voir les appels ouverts</Link>
          </div>
        </div>
      </section>

      <section className="section section-band band-chains">
        <div className="container">
          <div className="guide-list">
            {guideSections.map((section, index) => (
              <article key={section.title} className="guide-row">
                <span>{index + 1}</span>
                <div>
                  <h2>{section.title || 'Section'}</h2>
                  <p>{section.text || 'Contenu en cours de publication.'}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="appels-ouverts" className="section section-band band-calls">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <h2 className="section-title">Appels à projets ouverts</h2>
              <p className="meta">Consultez les appels disponibles avant de soumettre votre dossier.</p>
            </div>
            <Link href="/appels" className="btn secondary">Tous les appels</Link>
          </div>
          <div className="grid three">
            {openCalls.length > 0 ? (
              openCalls.map((item) => (
                <article key={item.id} className="card call-card">
                  <div className="call-card-top">
                    <span className="badge open">open</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="call-summary">{item.summary || 'Résumé en cours de publication.'}</p>
                  <div className="call-deadline">
                    <span>Clôture</span>
                    <strong>{toDateLabel(item.deadlineDate)}</strong>
                  </div>
                  {item.slug ? (
                    <p className="call-action">
                      <Link href={`/appels/${item.slug}`}>Voir le détail</Link>
                    </p>
                  ) : null}
                </article>
              ))
            ) : (
              <article className="info-panel">
                <h2>Aucun appel ouvert</h2>
                <p>Les prochains appels seront publiés dans cette section dès validation officielle.</p>
              </article>
            )}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-band-wrap">
          <div>
            <p className="eyebrow">Formulaire en ligne</p>
            <h3>Vous avez les informations nécessaires ?</h3>
          </div>
          <Link href={primaryCtaUrl} className="btn primary">{primaryCtaLabel}</Link>
        </div>
      </section>
    </main>
  );
}
