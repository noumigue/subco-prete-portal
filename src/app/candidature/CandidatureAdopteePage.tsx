import Link from 'next/link';
import { getHomeAppels, getResourceDocuments, getTypePieces, mediaUrl, type CallItem } from '@/lib/strapi-public';

const procedureSteps = [
  {
    title: 'Créer un compte',
    detail: 'Créez votre profil candidat et validez votre contact. Cette étape est rapide et réversible.',
  },
  {
    title: 'Remplir le dossier',
    detail: 'Saisissez les informations en plusieurs parties avec sauvegarde automatique.',
  },
  {
    title: 'Soumettre et suivre',
    detail: "Vous recevez un accusé puis suivez l'avancement de l'instruction.",
  },
  {
    title: 'Décision du comité',
    detail: 'Le projet est examiné selon les critères techniques, administratifs et de conformité.',
  },
];

const constraints = [
  {
    title: 'Cofinancement',
    detail: 'Un apport propre réel doit être attesté dans le dossier (apports en trésorerie, équipements ou travaux).',
  },
  {
    title: 'Usage collectif',
    detail: "L'infrastructure doit bénéficier à une chaîne de valeur ou plusieurs producteurs/MPME.",
  },
  {
    title: 'Délai de dépôt',
    detail: 'Les candidatures déposées après la clôture ne sont pas prises en compte.',
  },
  {
    title: 'Dossier complet',
    detail: 'Une pièce manquante peut bloquer la validation au premier contrôle de complétude.',
  },
];

// Libellés de la checklist Annexe 9 (mêmes conventions que /faq-documents).
const PIECE_GROUP_LABELS: Record<string, string> = {
  administratif: 'Administratives',
  financier: 'Financières',
  technique: 'Techniques',
};
const PIECE_EXIGENCE_LABELS: Record<string, string> = {
  obligatoire: 'Obligatoire',
  si_applicable: 'Si applicable',
  si_disponible: 'Si disponible',
};

// Liste canonique Annexe 9 (identique au référentiel `type-piece` du CMS). Sert de
// secours : la checklist affiche le référentiel live (route `/api/types-piece`) quand il
// répond, sinon cette liste, afin de rester fonctionnelle si le référentiel est vide/indispo.
type ChecklistPiece = { id: number; libelle: string; groupe: string; exigence: string; ordre: number };
const CANONICAL_ANNEXE9_PIECES: ChecklistPiece[] = [
  { id: 10, libelle: "Attestation d'existence légale (RC / acte constitutif)", groupe: 'administratif', exigence: 'obligatoire', ordre: 10 },
  { id: 20, libelle: "Numéro d'identification fiscale (NIF)", groupe: 'administratif', exigence: 'obligatoire', ordre: 20 },
  { id: 30, libelle: 'Attestation de non-redevance fiscale', groupe: 'administratif', exigence: 'si_applicable', ordre: 30 },
  { id: 40, libelle: "Déclaration de conflit d'intérêt", groupe: 'administratif', exigence: 'obligatoire', ordre: 40 },
  { id: 50, libelle: 'États financiers récents (3 exercices)', groupe: 'financier', exigence: 'obligatoire', ordre: 50 },
  { id: 60, libelle: 'Justificatif de mobilisation de la contrepartie', groupe: 'financier', exigence: 'obligatoire', ordre: 60 },
  { id: 70, libelle: "Plan d'affaires / budget détaillé", groupe: 'financier', exigence: 'obligatoire', ordre: 70 },
  { id: 80, libelle: 'Note conceptuelle du projet', groupe: 'technique', exigence: 'obligatoire', ordre: 80 },
  { id: 90, libelle: 'Preuve de disponibilité du site', groupe: 'technique', exigence: 'obligatoire', ordre: 90 },
  { id: 100, libelle: "Devis / plans d'infrastructure", groupe: 'technique', exigence: 'si_disponible', ordre: 100 },
  { id: 110, libelle: 'Plan de gestion environnementale et sociale (PGES)', groupe: 'technique', exigence: 'si_applicable', ordre: 110 },
];

// Type de fichier lisible (PDF / DOCX…) depuis l'extension du média.
function fileTypeLabel(url?: string | null): string {
  if (!url) return 'Fichier';
  const ext = url.split('?')[0].split('.').pop() || '';
  return ext ? ext.toUpperCase() : 'Fichier';
}

// Ordre d'affichage : le Manuel d'abord, puis les annexes par numéro (Annexe 1..10),
// le reste à la fin (le tri CMS title:asc placerait « Annexe 10 » avant « Annexe 1 »).
function docSortKey(title?: string): number {
  const t = String(title || '');
  if (/manuel/i.test(t)) return 0;
  const m = /annexe\s*(\d+)/i.exec(t);
  if (m) return Number(m[1]);
  return 99;
}

const profileRows = [
  {
    title: 'Statuts éligibles',
    detail: 'Société, coopérative, association, ONG, ou fournisseur de services liés au dispositif.',
  },
  {
    title: 'Conformité requise',
    detail: 'Documents fiscaux, légaux et statutaires en ordre et joignables avant soumission.',
  },
  {
    title: "Zone d'intervention",
    detail: "Le projet doit s'inscrire dans les territoires et priorités définis dans l'appel.",
  },
];

function formatDate(value?: string) {
  if (!value) return 'Date à confirmer';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date);
}

function resolveCallStatus(item?: CallItem | null) {
  if (!item) return 'upcoming';
  const now = new Date();
  const opening = item.openingDate ? new Date(item.openingDate) : null;
  const deadline = item.deadlineDate ? new Date(item.deadlineDate) : null;

  if (deadline && !Number.isNaN(deadline.getTime()) && deadline.getTime() < now.getTime()) return 'closed';
  if (opening && !Number.isNaN(opening.getTime()) && opening.getTime() > now.getTime()) return 'upcoming';
  if ((item.callStatus || '').toLowerCase() === 'closed') return 'closed';
  return 'open';
}

function buildOpenCallBanner(item?: CallItem | null) {
  if (!item) {
    return {
      status: 'Aucun appel en cours',
      meta: 'La prochaine cohorte sera publiée depuis le CMS.',
      href: '/appels',
    };
  }

  const status = resolveCallStatus(item);
  if (status === 'upcoming') {
    return {
      status: 'À venir — Cohorte 1',
      meta: `Ouverture prévue le ${formatDate(item.openingDate)} · clôture le ${formatDate(item.deadlineDate)}`,
      href: item.slug ? `/appels/${item.slug}` : '/appels',
    };
  }

  if (status === 'closed') {
    return {
      status: 'Appel clôturé — Cohorte 1',
      meta: `Clôturé le ${formatDate(item.deadlineDate)}`,
      href: item.slug ? `/appels/${item.slug}` : '/appels',
    };
  }

  return {
    status: 'Appel ouvert — Cohorte 1',
    meta: `Clôture le ${formatDate(item.deadlineDate)}`,
    href: item.slug ? `/appels/${item.slug}` : '/appels',
  };
}

export default async function CandidatureAdopteePage() {
  const [calls, resourceDocs, typePieces] = await Promise.all([
    getHomeAppels(),
    getResourceDocuments(),
    getTypePieces(),
  ]);
  const featuredCall = calls[0] || null;
  const openCallBanner = buildOpenCallBanner(featuredCall);

  // Documents « Pour vous préparer » = les documents réels du CMS (resource-document),
  // en tuiles téléchargeables. On exclut le Manuel de gestion des subventions (les Annexes
  // seules sont pertinentes ici pour préparer la candidature).
  const documentItems = resourceDocs
    .filter((doc) => !/manuel/i.test(doc.title || ''))
    .map((doc) => {
      const url = mediaUrl(doc.file) || null;
      const type = fileTypeLabel(url);
      const detail = [type, doc.description].filter(Boolean).join(' · ');
      return { title: doc.title || 'Document', detail, url, sortKey: docSortKey(doc.title) };
    })
    .filter((d) => d.url)
    .sort((a, b) => a.sortKey - b.sortKey);

  // Checklist Annexe 9 : référentiel `type-piece` live s'il répond, sinon liste canonique
  // de secours (référentiel vide/indispo → la checklist reste affichée).
  const checklistPieces = typePieces.length > 0
    ? [...typePieces].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
    : CANONICAL_ANNEXE9_PIECES;
  const pieceGroups = ['administratif', 'financier', 'technique']
    .map((group) => ({
      key: group,
      label: PIECE_GROUP_LABELS[group],
      items: checklistPieces.filter((p) => p.groupe === group),
    }))
    .filter((g) => g.items.length > 0);
  const heroBandStyle = {
    background:
      'linear-gradient(145deg, rgba(16, 76, 58, 0.86), rgba(19, 102, 74, 0.84)), linear-gradient(160deg, #0c5c47, #0a473a)',
    color: '#e8f7f1',
  };

  const heroIntroTextStyle = {
    color: '#d8efe2',
  };

  const heroKickerStyle = {
    color: '#9ce6c8',
  };

  const heroSecondaryButtonStyle = {
    borderColor: 'rgba(228, 247, 235, 0.6)',
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#ecfff8',
  };

  const finalCardTextStyle = {
    color: '#d7f1e7',
  };

  const finalSecondaryButtonStyle = {
    background: '#ffffff',
    color: 'var(--brand-deep)',
    borderColor: 'rgba(255, 255, 255, 0.7)',
  };

  return (
    <main className="candidature-bis-page">
      <section
        className="section section-band candidature-bis-hero"
        style={heroBandStyle}
      >
        <div className="container page-intro">
          <p className="form-kicker" style={heroKickerStyle}>Déposer une candidature</p>
          <h1>{"Tout ce qu'il faut savoir avant de candidater"}</h1>
          <p style={heroIntroTextStyle}>
            {"Cette page présente la préparation recommandée avant la soumission : prérequis, étapes, documents clés et critères d'éligibilité. La candidature se dépose ensuite via le formulaire en ligne."}
          </p>
          <div className="actions">
            <Link href="/candidatures/nouvelle" className="btn primary" target="_blank" rel="noopener noreferrer" aria-label="Déposer une candidature (nouvel onglet)">Déposer une candidature ↗</Link>
            <Link href="#appels" className="btn secondary" style={heroSecondaryButtonStyle}>Voir les appels</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container candidature-bis-open-banner-wrap">
          <article className="candidature-bis-open-banner">
            <p className="candidature-bis-open-badge">{openCallBanner.status}</p>
            <div>
              <p className="candidature-bis-open-meta">{openCallBanner.meta}</p>
              <Link href={openCallBanner.href} className="candidature-bis-open-link">
                Voir le détail de l&apos;appel
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="section candidature-bis-section-white">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow candidature-bis-eyebrow">Comment candidater</p>
              <h2 className="section-title">La procédure en 4 étapes</h2>
            </div>
          </div>
          <div className="candidature-bis-steps">
            {procedureSteps.map((step, index) => (
              <article key={step.title} className="candidature-bis-step-card">
                <span>{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section candidature-bis-section-alt">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow candidature-bis-eyebrow">Avant de vous lancer</p>
              <h2 className="section-title">Contraintes à anticiper</h2>
            </div>
          </div>
          <div className="candidature-bis-constraints">
            {constraints.map((constraint) => (
              <article key={constraint.title} className="candidature-bis-constraint-card">
                <h3>{constraint.title}</h3>
                <p>{constraint.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section candidature-bis-section-white">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow candidature-bis-eyebrow">Pour vous préparer</p>
              <h2 className="section-title">Documents et modèles à télécharger</h2>
            </div>
          </div>
          <div className="candidature-bis-docs">
            {documentItems.length === 0 ? (
              <p className="candidature-bis-profile-intro">Documents bientôt disponibles.</p>
            ) : documentItems.map((doc) => (
              <a key={doc.title} className="candidature-bis-doc-card" href={doc.url ?? '#'} target="_blank" rel="noopener noreferrer">
                <div>
                  <h3>{doc.title}</h3>
                  <p>{doc.detail}</p>
                </div>
                <svg className="candidature-bis-doc-download" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </a>
            ))}
          </div>

          {pieceGroups.length > 0 ? (
            <div className="candidature-bis-checklist">
              <h3 className="candidature-bis-checklist-title">Pièces du dossier (Annexe 9)</h3>
              <p className="candidature-bis-checklist-intro">La liste des pièces à réunir pour un dossier complet, par nature.</p>
              <div className="candidature-bis-checklist-grid">
                {pieceGroups.map((group) => (
                  <div key={group.key} className="candidature-bis-checklist-col">
                    <h4>{group.label}</h4>
                    <ul>
                      {group.items.map((piece) => (
                        <li key={piece.id}>
                          <span className="candidature-bis-check" aria-hidden="true">✓</span>
                          <span className="candidature-bis-check-label">{piece.libelle}</span>
                          {piece.exigence ? <span className={`candidature-bis-check-exig exig-${piece.exigence}`}>{PIECE_EXIGENCE_LABELS[piece.exigence] || piece.exigence}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section candidature-bis-section-alt">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow candidature-bis-eyebrow">Avant de créer votre compte</p>
              <h2 className="section-title">Êtes-vous le profil attendu ?</h2>
            </div>
          </div>
          <p className="candidature-bis-profile-intro">
            {"Les conditions sont cumulatives et vérifiées au démarrage de l'instruction."}
          </p>
          <div className="candidature-bis-profile-grid">
            {profileRows.map((row) => (
              <article key={row.title} className="candidature-bis-profile-card">
                <h3>{row.title}</h3>
                <p>{row.detail}</p>
              </article>
            ))}
          </div>
          <p className="candidature-bis-profile-link">
            Pas sûr de votre éligibilité ? <Link href="/eligibilite">Faire le test rapide →</Link>
          </p>
        </div>
      </section>

      <section className="section section-band candidature-bis-final-band" id="appels">
        <div className="container candidature-bis-final-band-wrap">
          <div className="candidature-bis-final-intro">
            <p className="eyebrow">Étape de soumission</p>
            <h3>Prêt à déposer votre candidature ?</h3>
            <p>Créez votre compte ou connectez-vous pour continuer votre dossier.</p>
          </div>
          <div className="candidature-bis-final-cards">
            <article className="candidature-bis-final-card">
              <h4>{"Je n'ai pas de compte"}</h4>
              <p style={finalCardTextStyle}>Créer un compte et commencer la candidature.</p>
              <Link href="/inscription?next=/candidatures/nouvelle" className="btn primary">Créer mon compte →</Link>
            </article>
            <article className="candidature-bis-final-card">
              <h4>{"J'ai déjà un compte"}</h4>
              <p style={finalCardTextStyle}>Reprendre votre brouillon ou suivre votre dossier.</p>
              <Link href="/connexion?next=/candidatures/nouvelle" className="btn secondary" style={finalSecondaryButtonStyle}>Me connecter →</Link>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
