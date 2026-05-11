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

const fallbackPreStartItems = [
  {
    label: 'Chaîne ciblée',
    text: 'Votre projet doit s’inscrire dans une chaîne de valeur prioritaire ou fournir un service directement lié.',
  },
  {
    label: 'Expérience',
    text: 'Préparez les éléments montrant l’activité, l’historique et la capacité de gestion de votre structure.',
  },
  {
    label: 'Contrepartie',
    text: 'Vérifiez votre capacité à mobiliser l’apport propre demandé dans le cadre de l’appel.',
  },
  {
    label: 'Pièces prêtes',
    text: 'Rassemblez les justificatifs administratifs, financiers, techniques et les modèles requis.',
  },
];

const fallbackFormStepItems = [
  {
    label: 'Promoteur',
    text: 'Identité, contacts, localisation et informations du représentant.',
  },
  {
    label: 'Structure',
    text: 'Raison sociale, type d’organisation, ancienneté et chaîne de valeur.',
  },
  {
    label: 'Activités',
    text: 'Offre, actifs de production, marchés desservis, forces et défis.',
  },
  {
    label: 'Exploitation',
    text: 'Volumes, chiffre d’affaires, emplois permanents, femmes, jeunes et temporaires.',
  },
  {
    label: 'Partenaires',
    text: 'Partenariats, appuis reçus, montants, dates et historique utile.',
  },
  {
    label: 'Projet',
    text: 'Infrastructure, investissement, contribution propre, résultats attendus, risques et environnement.',
  },
  {
    label: 'Pièces',
    text: 'Téléversement des documents justificatifs et soumission finale.',
  },
];

const fallbackEligibilityItems = [
  {
    label: 'Chaîne prioritaire',
    text: 'Le projet doit être lié aux fruits tropicaux, au lait, à la volaille, à la pisciculture/aquaculture ou aux mines.',
  },
  {
    label: 'Ancrage au Burundi',
    text: 'Le candidat doit être domicilié au Burundi et disposer des autorisations applicables.',
  },
  {
    label: 'Conformité',
    text: 'La situation fiscale, réglementaire, environnementale et sociale doit pouvoir être démontrée.',
  },
  {
    label: 'Capacité de mise en œuvre',
    text: 'La structure doit montrer une capacité de gestion, d’exploitation et de maintenance crédible.',
  },
];

const fallbackProjectProofItems = [
  {
    label: 'Besoin réel',
    text: 'L’infrastructure répond à une contrainte concrète de la chaîne de valeur et du marché.',
  },
  {
    label: 'Utilité collective',
    text: 'Le projet bénéficie à plusieurs MPME, producteurs, coopératives ou opérateurs.',
  },
  {
    label: 'Viabilité',
    text: 'Le modèle technique, économique et financier est réaliste et exploitable durablement.',
  },
  {
    label: 'Résultats mesurables',
    text: 'Le dossier indique les effets attendus sur les ventes, l’emploi, les revenus et la qualité.',
  },
  {
    label: 'Risques maîtrisés',
    text: 'Les principaux risques sont identifiés avec des mesures d’atténuation adaptées.',
  },
  {
    label: 'Environnement',
    text: 'Le projet intègre les mesures environnementales, sociales et sanitaires nécessaires.',
  },
];

const fallbackDocumentItems = [
  {
    label: 'Administratif',
    text: 'Existence légale, autorisations, localisation, fiscalité et documents de conformité.',
  },
  {
    label: 'Financier',
    text: 'Éléments de chiffre d’affaires, comptes, justificatifs d’apport et capacité de cofinancement.',
  },
  {
    label: 'Technique',
    text: 'Description de l’infrastructure, devis, factures, bons de commande ou contrats disponibles.',
  },
  {
    label: 'Modèles',
    text: 'Formulaires, plan d’affaires, engagements et annexes publiés dans les ressources.',
  },
];

const fallbackRiskItems = [
  {
    label: 'Projet hors cible',
    text: 'Projet non lié aux chaînes prioritaires ou limité à la production primaire seule.',
  },
  {
    label: 'Bénéfice trop individuel',
    text: 'Infrastructure sans effet clair pour plusieurs MPME, producteurs ou acteurs de la chaîne.',
  },
  {
    label: 'Contrepartie insuffisante',
    text: 'Apport propre non démontré ou modèle économique trop fragile.',
  },
  {
    label: 'Dossier incomplet',
    text: 'Pièces manquantes, informations incohérentes ou conformité non démontrée.',
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
  const preStartItems = candidatureGuide?.preStartItems?.length ? candidatureGuide.preStartItems : fallbackPreStartItems;
  const formStepItems = candidatureGuide?.formStepItems?.length ? candidatureGuide.formStepItems : fallbackFormStepItems;
  const eligibilityItems = candidatureGuide?.eligibilityItems?.length ? candidatureGuide.eligibilityItems : fallbackEligibilityItems;
  const projectProofItems = candidatureGuide?.projectProofItems?.length ? candidatureGuide.projectProofItems : fallbackProjectProofItems;
  const documentItems = candidatureGuide?.documentItems?.length ? candidatureGuide.documentItems : fallbackDocumentItems;
  const riskItems = candidatureGuide?.riskItems?.length ? candidatureGuide.riskItems : fallbackRiskItems;
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

      <section className="section section-band candidature-precheck-section">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Avant de commencer</p>
              <h2 className="section-title">Les points à vérifier</h2>
            </div>
            <p className="summary-lead">
              Ces repères vous évitent d’ouvrir un dossier sans les informations essentielles.
            </p>
          </div>
          <div className="summary-grid">
            {preStartItems.map((item, index) => (
              <article key={item.label} className="summary-card">
                <span className="summary-index">{String(index + 1).padStart(2, '0')}</span>
                <h3>{item.label || 'Point de vérification'}</h3>
                <p>{item.text || 'Contenu en cours de publication.'}</p>
              </article>
            ))}
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

      <section className="section candidature-steps-section">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Formulaire en ligne</p>
              <h2 className="section-title">Ce que le formulaire va vous demander</h2>
            </div>
            <Link href="/ressources" className="btn secondary">Voir les ressources</Link>
          </div>
          <div className="process-timeline">
            {formStepItems.map((item, index) => (
              <article key={item.label} className="process-step">
                <span>{index + 1}</span>
                <h3>{item.label || 'Étape'}</h3>
                <p>{item.text || 'Contenu en cours de publication.'}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-band candidature-criteria-section">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Éligibilité</p>
              <h2 className="section-title">Critères à vérifier</h2>
            </div>
            <p className="summary-lead">
              Ces éléments ne remplacent pas les conditions détaillées de l’appel, mais ils guident la préparation du dossier.
            </p>
          </div>
          <div className="platform-grid">
            {eligibilityItems.map((item) => (
              <article key={item.label} className="platform-card">
                <span className="platform-marker" aria-hidden="true" />
                <div>
                  <h3>{item.label || 'Critère'}</h3>
                  <p>{item.text || 'Contenu en cours de publication.'}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section candidature-proof-section">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Qualité du projet</p>
              <h2 className="section-title">Votre projet doit démontrer</h2>
            </div>
            <p className="summary-lead">
              Le dossier doit montrer que l’investissement est utile, viable et exploitable durablement.
            </p>
          </div>
          <div className="grid three">
            {projectProofItems.map((item) => (
              <article key={item.label} className="card result-card">
                <h3>{item.label || 'Démonstration'}</h3>
                <p>{item.text || 'Contenu en cours de publication.'}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-band candidature-docs-section">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Pièces justificatives</p>
              <h2 className="section-title">Documents à préparer</h2>
            </div>
            <Link href="/ressources" className="btn secondary">Télécharger les modèles</Link>
          </div>
          <div className="platform-grid">
            {documentItems.map((item) => (
              <article key={item.label} className="platform-card">
                <span className="platform-marker" aria-hidden="true" />
                <div>
                  <h3>{item.label || 'Document'}</h3>
                  <p>{item.text || 'Contenu en cours de publication.'}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section candidature-risk-section">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Points d’attention</p>
              <h2 className="section-title">Ce qui peut fragiliser un dossier</h2>
            </div>
            <p className="summary-lead">
              Vérifiez ces points avant la soumission finale pour limiter les retours ou rejets administratifs.
            </p>
          </div>
          <div className="grid four caution-grid">
            {riskItems.map((item) => (
              <article key={item.label} className="caution-card">
                <h3>{item.label || 'Point de vigilance'}</h3>
                <p>{item.text || 'Contenu en cours de publication.'}</p>
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
            <h3>J’ai vérifié les conditions et préparé mes pièces</h3>
          </div>
          <div className="actions compact">
            <Link href="/ressources" className="btn ghost">Voir les ressources</Link>
            <Link href={primaryCtaUrl} className="btn primary">{primaryCtaLabel}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
