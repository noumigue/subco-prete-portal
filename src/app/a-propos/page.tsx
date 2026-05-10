import Link from 'next/link';
import { getAboutPage, getPartners, mediaUrl } from '@/lib/strapi-public';

const fallbackSections = [
  {
    title: 'Le projet PRETE / NYUNGANIRA',
    text: 'PRETE soutient la transformation économique locale en améliorant l’accès des MPME aux financements, aux infrastructures productives et aux services nécessaires à leur croissance. Le projet vise des investissements capables de créer des emplois, de renforcer la compétitivité et de produire des effets utiles pour les opérateurs économiques locaux.',
  },
  {
    title: 'Pourquoi des subventions de contrepartie ?',
    text: 'La subvention de contrepartie agit comme un levier. Elle ne remplace pas l’investissement privé : elle permet de déclencher, accélérer ou renforcer des projets cofinancés par les opérateurs, avec une logique de viabilité, d’exploitation durable et de bénéfice pour plusieurs MPME, producteurs, coopératives ou acteurs de marché.',
  },
  {
    title: 'La sous-composante SUBCO',
    text: 'SUBCO porte le dispositif opérationnel dédié aux subventions de contrepartie dans le cadre de PRETE. Il accompagne les investissements liés aux infrastructures productives durables, y compris les solutions numériques, afin de mieux connecter les MPME aux services, aux équipements, aux marchés et aux exigences de qualité.',
  },
  {
    title: 'Ce que PRETE cherche à transformer',
    text: 'Le dispositif répond à des contraintes concrètes des chaînes de valeur : pertes après production, capacités limitées de stockage et de transformation, accès insuffisant à la chaîne du froid, difficultés de traçabilité, qualité irrégulière, coûts logistiques élevés et accès encore limité aux marchés rémunérateurs.',
  },
  {
    title: 'Le rôle de la plateforme',
    text: 'La plateforme SUBCO PRETE centralise les informations officielles du mécanisme : appels à projets, calendriers, annonces, documents de référence, dépôt des candidatures et suivi des principales étapes. Elle vise une information cohérente, accessible et vérifiable pour les candidats et les parties prenantes.',
  },
  {
    title: 'Résultats attendus',
    text: 'PRETE SUBCO vise à accroître le nombre d’infrastructures productives utiles aux chaînes prioritaires, améliorer l’accès des MPME aux services, réduire les pertes, renforcer la qualité des produits, encourager l’investissement privé, soutenir l’emploi et contribuer aux objectifs d’inclusion et de résilience climatique.',
  },
];

const subcoBriefItems = [
  {
    label: 'Dispositif',
    text: 'Un mécanisme de subventions de contrepartie inscrit dans PRETE / NYUNGANIRA.',
  },
  {
    label: 'Cible',
    text: 'Des opérateurs capables de porter des investissements utiles aux chaînes de valeur prioritaires.',
  },
  {
    label: 'Objet',
    text: 'Des infrastructures productives, matérielles ou immatérielles, au service des MPME.',
  },
  {
    label: 'Finalité',
    text: 'Améliorer l’accès aux services, réduire les pertes, renforcer la qualité et créer des emplois.',
  },
];

const platformItems = [
  {
    label: 'Appels',
    text: 'Avis, calendriers, échéances et statuts d’ouverture.',
  },
  {
    label: 'Documents',
    text: 'TDR, guides, formulaires et documents de référence.',
  },
  {
    label: 'Candidature',
    text: 'Orientations pour préparer le dossier et accéder au dépôt en ligne.',
  },
  {
    label: 'Suivi',
    text: 'Traçabilité des soumissions, annonces, clarifications et informations officielles.',
  },
];

const institutionalItems = [
  {
    label: 'Institutions nationales',
    text: 'Ancrage dans les priorités publiques de transformation économique et d’appui au secteur privé.',
  },
  {
    label: 'Partenaires techniques et financiers',
    text: 'Appui au cadre de mise en œuvre, à la supervision et aux exigences de transparence du projet.',
  },
  {
    label: 'Dispositif opérationnel',
    text: 'Organisation pratique du mécanisme SUBCO, de l’information publique au suivi des candidatures.',
  },
];

const fallbackPartners: Array<{ name: string; logo: string; websiteUrl?: string }> = [
  { name: 'Ministère', logo: '/partners/ministere.jpg' },
  { name: 'Banque mondiale', logo: '/partners/world-bank.jpg' },
  { name: 'PRETE', logo: '/partners/prete.png' },
  { name: 'AFDB', logo: '/partners/afdb.png' },
  { name: 'ADB Burundi', logo: '/partners/adb-burundi.png' },
];

export default async function AboutPage() {
  const [aboutPage, partners] = await Promise.all([getAboutPage(), getPartners()]);
  const sections = aboutPage?.sections?.length ? aboutPage.sections : fallbackSections;
  const briefItems = aboutPage?.briefItems?.length ? aboutPage.briefItems : subcoBriefItems;
  const centralItems = aboutPage?.platformItems?.length ? aboutPage.platformItems : platformItems;
  const institutionItems = aboutPage?.institutionalItems?.length ? aboutPage.institutionalItems : institutionalItems;
  const partnerItems = partners.length
    ? partners.map((item) => ({
        name: item.name || 'Partenaire',
        logo: mediaUrl(item.logo),
        websiteUrl: item.websiteUrl,
      }))
    : fallbackPartners;

  return (
    <main className="section">
      <div className="container page-intro">
        <p className="form-kicker">{aboutPage?.kicker || 'À propos'}</p>
        <h1>{aboutPage?.title || 'Comprendre PRETE / NYUNGANIRA et SUBCO'}</h1>
        <p>
          {aboutPage?.intro ||
            'PRETE / NYUNGANIRA accompagne la transformation économique locale en soutenant des investissements productifs capables de renforcer les chaînes de valeur prioritaires, d’améliorer l’accès des MPME aux services essentiels et de mobiliser davantage d’investissement privé.'}
        </p>
      </div>

      <section className="section section-band band-chains">
        <div className="container">
          <div className="grid two about-grid">
            {sections.map((section) => (
              <article key={section.title} className="info-panel">
                <h2>{section.title || 'Section'}</h2>
                <p>{section.text || 'Contenu en cours de publication.'}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section about-summary-section">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Repères essentiels</p>
              <h2 className="section-title">SUBCO en bref</h2>
            </div>
            <p className="summary-lead">
              Une lecture rapide du dispositif, de sa cible et de la finalité recherchée.
            </p>
          </div>
          <div className="summary-grid">
            {briefItems.map((item, index) => (
              <article key={item.label} className="summary-card">
                <span className="summary-index">{String(index + 1).padStart(2, '0')}</span>
                <h3>{item.label || 'Repère'}</h3>
                <p>{item.text || 'Contenu en cours de publication.'}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-band about-platform-section">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Point d’entrée officiel</p>
              <h2 className="section-title">Ce que la plateforme centralise</h2>
            </div>
            <p className="summary-lead">
              Les informations et services utiles pour comprendre le mécanisme, préparer une demande et suivre les communications officielles.
            </p>
          </div>
          <div className="platform-grid">
            {centralItems.map((item) => (
              <article key={item.label} className="platform-card">
                <span className="platform-marker" aria-hidden="true" />
                <div>
                  <h3>{item.label || 'Élément'}</h3>
                  <p>{item.text || 'Contenu en cours de publication.'}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-band band-partners about-partners-section">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Cadre institutionnel</p>
              <h2 className="section-title">Partenaires institutionnels</h2>
            </div>
            <p className="summary-lead">
              Le dispositif s’inscrit dans l’écosystème institutionnel et technique de PRETE / NYUNGANIRA.
            </p>
          </div>
          <div className="institutional-grid">
            {institutionItems.map((item) => (
              <article key={item.label} className="institutional-card">
                <h3>{item.label || 'Repère institutionnel'}</h3>
                <p>{item.text || 'Contenu en cours de publication.'}</p>
              </article>
            ))}
          </div>
          <div className="partners-strip" aria-label="Partenaires PRETE SUBCO">
            {partnerItems.map((item) => {
              const content = item.logo ? (
                <img src={item.logo} alt={item.name} />
              ) : (
                <span>{item.name}</span>
              );

              return item.websiteUrl ? (
                <a key={item.name} className="partner-logo" href={item.websiteUrl} target="_blank" rel="noreferrer">
                  {content}
                </a>
              ) : (
                <div key={item.name} className="partner-logo">
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-band-wrap">
          <div>
            <p className="eyebrow">Parcours candidat</p>
            <h3>Consultez les chaînes de valeur ou préparez votre dossier</h3>
          </div>
          <div className="actions compact">
            <Link href="/chaines-valeur" className="btn ghost">Chaînes de valeur</Link>
            <Link href="/candidature/deposer" className="btn primary">Candidater</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
