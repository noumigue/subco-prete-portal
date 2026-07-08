'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { PortalAppel, PortalCandidature, PortalOrganisation, PortalTypePiece } from '@/lib/portal-types';

const LEGAL_STATUSES = ['Coopérative', 'Entreprise', 'Association', 'ONG', 'Fournisseur de services numériques'];
const VALUE_CHAINS = ['Fruits tropicaux', 'Volaille', 'Pisciculture', 'Lait', 'Industrie minière', 'Projet transversal'];
const SITE_STATUSES = ['Propriété', 'Bail / location', 'Mis à disposition', 'À sécuriser'];
const MATURITY_LEVELS = ['Mature', 'Semi-mature', 'Embryonnaire'];
const COUNTERPART_TYPES = ['Numéraire', 'Nature', 'Équipement', 'Travaux préparatoires', 'Infrastructures existantes'];
const INFRA_EXAMPLES = [
  'Unité de transformation ou atelier',
  'Entrepôt, chambre froide ou chaîne du froid',
  'Centre de collecte, distribution ou logistique',
  'Laboratoire ou dispositif de contrôle qualité',
  'Plateforme numérique ou application de mise en relation',
  'Infrastructure immatérielle ou système de gestion',
];
const PROVINCES: Record<string, string[]> = {
  Buhumuza: ['Butaganzwa', 'Butihinda', 'Cankuzo', 'Gisagara', 'Gisuru', 'Muyinga', 'Ruyigi'],
  Bujumbura: ['Bubanza', 'Bukinanyana', 'Cibitoke', 'Isare', 'Mpanda', 'Mugere', 'Mugina', 'Muhuta', 'Mukaza', 'Ntahangwa', 'Rwibaga'],
  Burunga: ['Bururi', 'Makamba', 'Matana', 'Musongati', 'Nyanza', 'Rumonge', 'Rutana'],
  Butanyerera: ['Busoni', 'Kayanza', 'Kiremba', 'Kirundo', 'Matongo', 'Muhanga', 'Ngozi', 'Tangara'],
  Gitega: ['Bugendana', 'Gishubi', 'Gitega', 'Karusi', 'Kiganda', 'Muramvya', 'Mwaro', 'Nyabihanga', 'Shombo'],
};
const STEP_LABELS = ['Cadrage et éligibilité', 'Le projet', 'Économie et impact', 'Pièces et soumission'];
const GATES = [
  'Structure légalement constituée',
  'Conformité fiscale sans contentieux majeur',
  'Aucune activité exclue par le mécanisme',
  'Capacité de mobiliser une contrepartie d’au moins 20 %',
  'Aucun conflit d’intérêt avec le projet ou l’UGP',
];
const ES_FIELDS = [
  'Travaux ou construction',
  'Pollution, déchets ou nuisances',
  'Acquisition foncière ou déplacement',
];
const FALLBACK_PIECES = [
  { id: 'lettre', libelle: 'Lettre de motivation', groupe: 'administratif', exigence: 'obligatoire' },
  { id: 'rc', libelle: 'RC / certificat d’enregistrement', groupe: 'administratif', exigence: 'obligatoire' },
  { id: 'nif', libelle: 'NIF', groupe: 'administratif', exigence: 'obligatoire' },
  { id: 'etats', libelle: 'États financiers (3 exercices)', groupe: 'financier', exigence: 'obligatoire' },
  { id: 'business', libelle: 'Plan d’affaires simplifié', groupe: 'financier', exigence: 'obligatoire' },
  { id: 'site', libelle: 'Preuve de disponibilité du site', groupe: 'technique', exigence: 'obligatoire' },
];

type OperatorCandidatureFormProps = {
  candidature: PortalCandidature | null;
  organisation: PortalOrganisation | null;
  openCall: PortalAppel | null;
  typePieces: PortalTypePiece[];
};

function formatAmount(value: string) {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('fr-FR').format(Number(digits));
}

function toNumber(value: string) {
  return Number(value.replace(/[^0-9]/g, '')) || 0;
}

function statusBadgeClass(exigence?: string) {
  if (exigence === 'obligatoire') return 'operator-piece-badge is-required';
  return 'operator-piece-badge';
}

function statusBadgeLabel(exigence?: string) {
  if (exigence === 'si_applicable') return 'si applicable';
  if (exigence === 'si_disponible') return 'si disponible';
  return 'obligatoire';
}

export function OperatorCandidatureForm({
  candidature,
  organisation,
  openCall,
  typePieces,
}: OperatorCandidatureFormProps) {
  const resolvedCall = candidature?.appel || openCall;
  const basePieces = typePieces.length > 0
    ? typePieces.map((piece) => ({
        id: piece.documentId,
        libelle: piece.libelle || 'Pièce',
        groupe: piece.groupe || 'administratif',
        exigence: piece.exigence || 'obligatoire',
      }))
    : FALLBACK_PIECES;

  const [step, setStep] = useState(1);
  const [toast, setToast] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const [eligibility, setEligibility] = useState<boolean[]>(() => GATES.map(() => false));
  const [sameSite, setSameSite] = useState(false);
  const [deposits, setDeposits] = useState<Record<string, boolean>>({});
  const [esAnswers, setEsAnswers] = useState<string[]>(['Oui', 'Non', 'Non']);
  const [projectTitle, setProjectTitle] = useState(candidature?.titreProjet?.replace(/^Nouvelle candidature - /, '') || '');
  const [note, setNote] = useState('');
  const [budget, setBudget] = useState('100 000 000');
  const [counterpart, setCounterpart] = useState('25 000 000');
  const [mpme, setMpme] = useState('40');
  const [women, setWomen] = useState('24');
  const [youth, setYouth] = useState('10');
  const [refugees, setRefugees] = useState('8');
  const [womenLed, setWomenLed] = useState('Oui');
  const [ruralArea, setRuralArea] = useState('Oui');
  const [operatorProvince, setOperatorProvince] = useState(organisation?.province?.nom || '');
  const [operatorCommune, setOperatorCommune] = useState(organisation?.commune?.nom || '');
  const [siteProvince, setSiteProvince] = useState(organisation?.province?.nom || '');
  const [siteCommune, setSiteCommune] = useState(organisation?.commune?.nom || '');

  const budgetValue = toNumber(budget);
  const counterpartValue = toNumber(counterpart);
  const grantValue = Math.max(0, budgetValue - counterpartValue);
  const counterpartRate = budgetValue > 0 ? Math.round((counterpartValue / budgetValue) * 1000) / 10 : 0;
  const allEligibilityChecked = eligibility.every(Boolean);
  const declaredRisk = esAnswers.some((answer) => answer === 'Oui');
  const womenRate = Number(mpme) > 0 ? Number(women) / Number(mpme) : 0;
  const inclusionBonus = Math.min(
    10,
    ((womenRate >= 0.5 || womenLed === 'Oui') ? 5 : 0) +
      ((Number(youth) > 0 || Number(refugees) > 0) ? 3 : 0) +
      (ruralArea === 'Oui' ? 2 : 0),
  );

  const requiredPieceIds = basePieces.filter((piece) => piece.exigence === 'obligatoire').map((piece) => piece.id);
  if (declaredRisk) {
    requiredPieceIds.push('pges');
  }
  const depositedRequired = requiredPieceIds.filter((pieceId) => deposits[pieceId]).length;
  const missingPieces = requiredPieceIds.filter((pieceId) => !deposits[pieceId]);
  const completenessRate = requiredPieceIds.length > 0 ? Math.round((depositedRequired / requiredPieceIds.length) * 100) : 0;
  const generatedNumber = candidature?.numeroDossier || 'PRETE-AP-C1-2026-00042';

  const groupedPieces = ['administratif', 'financier', 'technique'].map((group) => ({
    key: group,
    label: group === 'administratif' ? 'Administratif' : group === 'financier' ? 'Financier' : 'Technique',
    items: basePieces.filter((piece) => piece.groupe === group),
  }));

  function showToast(message: string) {
    setToast(message);
    window.clearTimeout((showToast as typeof showToast & { timer?: number }).timer);
    (showToast as typeof showToast & { timer?: number }).timer = window.setTimeout(() => setToast(''), 2600);
  }

  function goNext() {
    if (step === 1 && !allEligibilityChecked) {
      showToast('Confirmez toutes les conditions d’éligibilité pour continuer.');
      return;
    }

    if (step === 4) {
      if (missingPieces.length > 0) {
        showToast(`Déposez les ${missingPieces.length} pièce(s) obligatoire(s) manquante(s) avant de soumettre.`);
        return;
      }
      setStep(5);
      return;
    }

    setStep((current) => current + 1);
  }

  function toggleDeposit(id: string) {
    setDeposits((current) => ({ ...current, [id]: !current[id] }));
  }

  function handleCopy() {
    void navigator.clipboard?.writeText(generatedNumber);
    showToast('Numéro de dossier copié.');
  }

  const displayedSiteProvince = sameSite ? operatorProvince : siteProvince;
  const displayedSiteCommune = sameSite ? operatorCommune : siteCommune;
  const operatorCommunes = operatorProvince ? PROVINCES[operatorProvince] || [] : [];
  const siteCommunes = displayedSiteProvince ? PROVINCES[displayedSiteProvince] || [] : [];

  return (
    <div className="operator-form-shell">
      <div className="operator-form-modal">
        <div className="operator-form-head">
          <div>
            <h1>Nouvelle candidature</h1>
            <p>{step === 5 ? 'Dossier soumis' : `Étape ${step} sur 4 · ${STEP_LABELS[step - 1].toLowerCase()}`}</p>
          </div>
          <Link href="/mes-candidatures" className="operator-form-close" aria-label="Fermer">×</Link>
        </div>

        {step < 5 ? (
          <div className="operator-form-progress">
            {STEP_LABELS.map((label, index) => (
              <div
                key={label}
                className={`operator-form-progress-seg${index + 1 < step ? ' is-done' : ''}${index + 1 === step ? ' is-active' : ''}`}
              >
                <div className="operator-form-progress-bar" />
                <small>{label}</small>
              </div>
            ))}
          </div>
        ) : null}

        <div className="operator-form-body">
          {step === 1 ? (
            <section>
              <div className="operator-form-banner">
                Étape de saisie — aucun document à déposer ici. Les pièces se déposent à l’étape 4.
              </div>

              <div className="operator-form-field">
                <label>Appel à propositions</label>
                <select value={resolvedCall?.nom || ''} onChange={() => undefined}>
                  <option>{resolvedCall?.nom || 'Aucun appel ouvert'}</option>
                </select>
              </div>

              <div className="operator-form-card">
                <div className="operator-form-card-head">
                  <span>Conditions d’éligibilité</span>
                  <span className="operator-piece-badge is-required">obligatoire</span>
                </div>
                <div className="operator-form-card-body">
                  <p className="operator-form-subtle">Toutes les conditions doivent être confirmées pour continuer.</p>
                  {GATES.map((gate, index) => (
                    <label key={gate} className="operator-form-check">
                      <input
                        type="checkbox"
                        checked={eligibility[index]}
                        onChange={() =>
                          setEligibility((current) => current.map((value, valueIndex) => (valueIndex === index ? !value : value)))
                        }
                      />
                      <span>{gate}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="operator-form-section-title">
                Opérateur / promoteur
                <span>pré-rempli depuis votre compte, modifiable</span>
              </div>

              <div className="operator-form-grid">
                <div className="operator-form-field">
                  <label>Raison sociale</label>
                  <input type="text" defaultValue={organisation?.nom || candidature?.organisation?.nom || ''} />
                </div>
                <div className="operator-form-field">
                  <label>Statut juridique</label>
                  <select defaultValue={organisation?.statutJuridique?.libelle || ''}>
                    <option value="">Sélectionner…</option>
                    {LEGAL_STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
                <div className="operator-form-field">
                  <label>NIF</label>
                  <input type="text" placeholder="4001234567" />
                </div>
                <div className="operator-form-field">
                  <label>RC / enregistrement</label>
                  <input type="text" placeholder="RC/BJM/2023/1024" />
                </div>
                <div className="operator-form-field">
                  <label>Représentant légal</label>
                  <input type="text" defaultValue={organisation?.contact || ''} />
                </div>
                <div className="operator-form-field">
                  <label>Province</label>
                  <select value={operatorProvince} onChange={(event) => { setOperatorProvince(event.target.value); setOperatorCommune(''); }}>
                    <option value="">Sélectionner une province…</option>
                    {Object.keys(PROVINCES).map((province) => <option key={province}>{province}</option>)}
                  </select>
                </div>
                <div className="operator-form-field">
                  <label>Commune</label>
                  <select value={operatorCommune} onChange={(event) => setOperatorCommune(event.target.value)} disabled={!operatorProvince}>
                    <option value="">{operatorProvince ? 'Sélectionner une commune…' : 'Choisir une province d’abord'}</option>
                    {operatorCommunes.map((commune) => <option key={commune}>{commune}</option>)}
                  </select>
                </div>
                <div className="operator-form-field">
                  <label>Email de contact</label>
                  <input type="email" defaultValue="" placeholder="nom@operateur.bi" />
                </div>
                <div className="operator-form-field">
                  <label>Téléphone</label>
                  <input type="tel" defaultValue={organisation?.telephone || ''} placeholder="+257 …" />
                </div>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section>
              <div className="operator-form-field">
                <label>Titre du projet</label>
                <input type="text" value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} placeholder="Unité de transformation de fruits — Butanyerera" />
              </div>

              <div className="operator-form-grid">
                <div className="operator-form-field">
                  <label>Chaîne de valeur</label>
                  <select defaultValue={organisation?.filierePrincipale?.nom || ''}>
                    <option value="">Sélectionner…</option>
                    {VALUE_CHAINS.map((chain) => <option key={chain}>{chain}</option>)}
                  </select>
                </div>
              </div>

              <div className="operator-form-field">
                <label>Type d’infrastructure à réaliser</label>
                <p className="operator-form-subtle">Décrivez librement, avec vos mots, l’infrastructure que vous souhaitez mettre en œuvre.</p>
                <button type="button" className="operator-form-inline-link" onClick={() => setShowExamples((current) => !current)}>
                  Voir quelques exemples
                </button>
                {showExamples ? (
                  <div className="operator-form-examples">
                    <ul>
                      {INFRA_EXAMPLES.map((example) => <li key={example}>{example}</li>)}
                    </ul>
                  </div>
                ) : null}
                <textarea rows={4} placeholder="Ex. : unité de séchage solaire de mangues d’une capacité de 2 t/jour…" />
              </div>

              <div className="operator-form-card">
                <div className="operator-form-card-head">
                  <span>Localisation du site</span>
                  <label className="operator-form-switch">
                    <input type="checkbox" checked={sameSite} onChange={(event) => setSameSite(event.target.checked)} />
                    <span>Identique au siège</span>
                  </label>
                </div>
                <div className="operator-form-card-body">
                  <div className="operator-form-grid">
                    <div className="operator-form-field">
                      <label>Province</label>
                      <select
                        value={displayedSiteProvince}
                        onChange={(event) => {
                          if (sameSite) return;
                          setSiteProvince(event.target.value);
                          setSiteCommune('');
                        }}
                        disabled={sameSite}
                      >
                        <option value="">Sélectionner une province…</option>
                        {Object.keys(PROVINCES).map((province) => <option key={province}>{province}</option>)}
                      </select>
                    </div>
                    <div className="operator-form-field">
                      <label>Commune</label>
                      <select
                        value={displayedSiteCommune}
                        onChange={(event) => !sameSite && setSiteCommune(event.target.value)}
                        disabled={sameSite || !displayedSiteProvince}
                      >
                        <option value="">{displayedSiteProvince ? 'Sélectionner une commune…' : 'Choisir une province d’abord'}</option>
                        {siteCommunes.map((commune) => <option key={commune}>{commune}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="operator-form-grid">
                <div className="operator-form-field">
                  <label>Statut du site</label>
                  <select>
                    <option value="">Sélectionner…</option>
                    {SITE_STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
                <div className="operator-form-field">
                  <label>Usage collectif ou partagé</label>
                  <select defaultValue="Oui">
                    <option>Oui</option>
                    <option>Non</option>
                  </select>
                </div>
                <div className="operator-form-field">
                  <label>MPME / acteurs desservis</label>
                  <input type="number" min="0" defaultValue="40" />
                </div>
                <div className="operator-form-field">
                  <label>Niveau de maturité</label>
                  <select>
                    <option value="">Sélectionner…</option>
                    {MATURITY_LEVELS.map((level) => <option key={level}>{level}</option>)}
                  </select>
                </div>
              </div>

              <div className="operator-form-field">
                <label>Note conceptuelle</label>
                <textarea
                  rows={3}
                  maxLength={600}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Problème traité, infrastructure proposée, bénéficiaires MPME, résultats attendus…"
                />
                <div className="operator-form-field-foot">
                  <span>Restez bref — le détail va dans le business plan à l’étape 4.</span>
                  <span className={note.length >= 600 ? 'is-alert' : ''}>{600 - note.length} restants</span>
                </div>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section>
              <div className="operator-form-section-title">Financement</div>
              <div className="operator-form-grid">
                <div className="operator-form-field">
                  <label>Budget total du projet (BIF)</label>
                  <input type="text" inputMode="numeric" value={budget} onChange={(event) => setBudget(formatAmount(event.target.value))} />
                </div>
                <div className="operator-form-field">
                  <label>Contrepartie mobilisée (BIF)</label>
                  <input type="text" inputMode="numeric" value={counterpart} onChange={(event) => setCounterpart(formatAmount(event.target.value))} />
                </div>
                <div className="operator-form-field">
                  <label>Type de contrepartie</label>
                  <select defaultValue={COUNTERPART_TYPES[0]}>
                    {COUNTERPART_TYPES.map((type) => <option key={type}>{type}</option>)}
                  </select>
                </div>
              </div>

              <div className="operator-form-recap">
                <div className="operator-form-recap-row">
                  <span>Subvention demandée (auto)</span>
                  <strong>{budgetValue ? `${new Intl.NumberFormat('fr-FR').format(grantValue)} BIF` : '—'}</strong>
                </div>
                <div className="operator-form-recap-row">
                  <span>Part de contrepartie</span>
                  <div className="operator-form-inline-values">
                    <strong>{budgetValue ? `${counterpartRate} %` : '—'}</strong>
                    <span className={`operator-form-pill${counterpartValue > budgetValue ? ' is-danger' : counterpartRate >= 20 ? ' is-ok' : ' is-warn'}`}>
                      {counterpartValue > budgetValue ? 'contrepartie > budget' : counterpartRate >= 20 ? 'conforme (≥ 20 %)' : 'insuffisant (< 20 %)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="operator-form-field">
                <label>Modèle économique</label>
                <textarea rows={2} placeholder="Revenus, coûts, viabilité, exploitation et maintenance…" />
              </div>

              <div className="operator-form-section-title">Impact et inclusion</div>
              <div className="operator-form-grid operator-form-grid-tight">
                <div className="operator-form-field">
                  <label>MPME</label>
                  <input type="number" min="0" value={mpme} onChange={(event) => setMpme(event.target.value)} />
                </div>
                <div className="operator-form-field">
                  <label>Femmes</label>
                  <input type="number" min="0" value={women} onChange={(event) => setWomen(event.target.value)} />
                </div>
                <div className="operator-form-field">
                  <label>Jeunes</label>
                  <input type="number" min="0" value={youth} onChange={(event) => setYouth(event.target.value)} />
                </div>
                <div className="operator-form-field">
                  <label>Réfugiés</label>
                  <input type="number" min="0" value={refugees} onChange={(event) => setRefugees(event.target.value)} />
                </div>
                <div className="operator-form-field">
                  <label>Emplois créés</label>
                  <input type="number" min="0" defaultValue="15" />
                </div>
              </div>

              <div className="operator-form-grid">
                <div className="operator-form-field">
                  <label>Projet porté par une femme</label>
                  <select value={womenLed} onChange={(event) => setWomenLed(event.target.value)}>
                    <option>Oui</option>
                    <option>Non</option>
                  </select>
                </div>
                <div className="operator-form-field">
                  <label>Zone rurale ou fragile</label>
                  <select value={ruralArea} onChange={(event) => setRuralArea(event.target.value)}>
                    <option>Oui</option>
                    <option>Non</option>
                  </select>
                </div>
              </div>

              <div className="operator-form-notice is-strong">
                Bonus inclusion estimé : <strong>+{inclusionBonus} pts</strong> <span>(indicatif, sous réserve d’évaluation)</span>
              </div>
            </section>
          ) : null}

          {step === 4 ? (
            <section>
              <div className="operator-form-banner">
                Étape de dépôt — une pièce par emplacement. Vos données saisies tiennent lieu de formulaire de candidature.
              </div>

              <div className="operator-form-section-title">Screening environnemental et social</div>
              <p className="operator-form-subtle">Obligatoire. Une réponse oui requiert un plan de gestion E&S.</p>
              <div className="operator-form-grid">
                {ES_FIELDS.map((label, index) => (
                  <div className="operator-form-field" key={label}>
                    <label>{label}</label>
                    <select
                      value={esAnswers[index]}
                      onChange={(event) => setEsAnswers((current) => current.map((value, valueIndex) => (valueIndex === index ? event.target.value : value)))}
                    >
                      <option>Oui</option>
                      <option>Non</option>
                    </select>
                  </div>
                ))}
              </div>

              {declaredRisk ? (
                <div className="operator-form-es-box">
                  <span>Plan de gestion E&S (PGES) · requis vu le risque déclaré</span>
                  <button type="button" className={`operator-upload-btn${deposits.pges ? ' is-done' : ''}`} onClick={() => toggleDeposit('pges')}>
                    {deposits.pges ? '✓ Déposé' : 'Choisir un fichier'}
                  </button>
                </div>
              ) : null}

              <div className="operator-form-section-title">Pièces justificatives</div>
              {groupedPieces.map((group) => (
                <details key={group.key} className="operator-piece-group" open={group.key === 'administratif'}>
                  <summary>{group.label}</summary>
                  {group.items.map((piece) => (
                    <div key={piece.id} className="operator-piece-row">
                      <span className="operator-piece-name">
                        {piece.libelle}
                        <span className={statusBadgeClass(piece.exigence)}>{statusBadgeLabel(piece.exigence)}</span>
                      </span>
                      <button
                        type="button"
                        className={`operator-upload-btn${deposits[piece.id] ? ' is-done' : ''}`}
                        onClick={() => toggleDeposit(piece.id)}
                      >
                        {deposits[piece.id] ? '✓ Déposé' : 'Choisir un fichier'}
                      </button>
                    </div>
                  ))}
                </details>
              ))}

              <div className="operator-form-complete-box">
                <div className="operator-form-complete-head">
                  <b>Complétude du dossier</b>
                  <span>{depositedRequired} / {requiredPieceIds.length} obligatoires</span>
                </div>
                <div className="operator-form-complete-bar">
                  <i style={{ width: `${completenessRate}%` }} />
                </div>
                <p className="operator-form-subtle">
                  {missingPieces.length > 0
                    ? `Manquantes : ${missingPieces.join(', ')}`
                    : 'Toutes les pièces obligatoires sont déposées.'}
                </p>
              </div>

              <div className="operator-form-notice is-strong">
                À la soumission : numéro de dossier, accusé par email et SMS, inscription au registre des dépôts. Vos données seront verrouillées.
              </div>
            </section>
          ) : null}

          {step === 5 ? (
            <section>
              <div className="operator-form-confirm-head">
                <div className="operator-form-confirm-check">✓</div>
                <h2>Candidature transmise</h2>
                <p>Votre dossier a été enregistré et horodaté.</p>
              </div>

              <div className="operator-form-dossier-box">
                <div>
                  <p>Numéro de dossier</p>
                  <span>{generatedNumber}</span>
                </div>
                <button type="button" className="operator-secondary-btn inline" onClick={handleCopy}>Copier</button>
              </div>

              <p className="operator-form-confirm-label">Accusé de réception envoyé</p>
              <div className="operator-form-ack-row">Email — {organisation?.contact || 'nom@operateur.bi'} <span>✓ envoyé</span></div>
              <div className="operator-form-ack-row">SMS — {organisation?.telephone || '+257 68 •• •• ••'} <span>✓ envoyé</span></div>
              <p className="operator-form-subtle">Inscrit au registre des dépôts le 04/07/2026 à 14:32.</p>

              <button type="button" className="operator-primary-btn operator-form-block-btn" onClick={() => showToast('Le PDF de votre candidature sera généré.')}>
                Télécharger le PDF de ma candidature
              </button>
              <p className="operator-form-subtle operator-form-centered">
                Disponible à tout moment depuis votre compte, dans <strong>Mes candidatures</strong>.
              </p>

              <div className="operator-form-notice">
                Rien d’autre à faire pour l’instant. Vous recevrez une notification par email et SMS dès que l’instruction avancera.
              </div>
            </section>
          ) : null}
        </div>

        <div className="operator-form-foot">
          <div className="operator-form-foot-left">
            <span className="operator-form-autosave">Enregistré automatiquement</span>
            {step > 1 && step < 5 ? (
              <button type="button" className="operator-secondary-btn inline" onClick={() => setStep((current) => current - 1)}>
                ← Retour
              </button>
            ) : null}
            {step < 5 ? (
              <button type="button" className="operator-secondary-btn inline" onClick={() => showToast('Brouillon enregistré. Vous pourrez le reprendre depuis votre compte.')}>
                Enregistrer et reprendre plus tard
              </button>
            ) : null}
          </div>

          {step < 5 ? (
            <button type="button" className="operator-primary-btn inline" onClick={goNext}>
              {step === 4 ? 'Soumettre le dossier' : 'Continuer →'}
            </button>
          ) : (
            <Link href="/mes-candidatures" className="operator-secondary-btn inline">
              Retour à mon compte
            </Link>
          )}
        </div>
      </div>

      {toast ? <div className="operator-form-toast is-visible">{toast}</div> : null}
    </div>
  );
}
