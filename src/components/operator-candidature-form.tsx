'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import type {
  PortalAppel,
  PortalCandidature,
  PortalDonneesProjet,
  PortalFiliere,
  PortalOrganisation,
  PortalPieceDepot,
  PortalProvince,
  PortalSession,
  PortalStatutJuridique,
  PortalTypeContrepartie,
  PortalTypePiece,
} from '@/lib/portal-types';
import { remapProvinceName } from '@/lib/portal-provinces';
import {
  saveCandidatureStepAction,
  submitCandidatureAction,
  uploadPieceAction,
  type SaveStepInput,
} from '@/app/(operator)/actions';

// Textes STRUCTURELS du parcours, fixes par le Manuel (pas des referentiels CMS) :
// - GATES = declarations d'eligibilite §5 (bloquantes, verifiees aussi cote serveur) ;
// - ES_FIELDS = screening E&S leger ;
// - SITE_STATUSES / MATURITY_LEVELS = echelles du formulaire (maquette module 3).
// Les listes METIER (provinces/communes, statuts juridiques, filieres, contreparties,
// pieces Annexe 9, exemples d'infrastructure) viennent TOUTES des referentiels via props.
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
const SITE_STATUSES = ['Propriété', 'Bail / location', 'Mis à disposition', 'À sécuriser'];
const MATURITY_LEVELS = ['Mature', 'Semi-mature', 'Embryonnaire'];

type OperatorCandidatureFormProps = {
  candidature: PortalCandidature | null;
  organisation: PortalOrganisation | null;
  openCall: PortalAppel | null;
  typePieces: PortalTypePiece[];
  provinces: PortalProvince[];
  statutJuridiques: PortalStatutJuridique[];
  filieres: PortalFiliere[];
  typeContreparties: PortalTypeContrepartie[];
  infraExemples: string[];
  session: PortalSession;
};

function formatAmount(value: string) {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('fr-FR').format(Number(digits));
}

function toNumber(value: string) {
  return Number(value.replace(/[^0-9]/g, '')) || 0;
}

function formatDateTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
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
  provinces,
  statutJuridiques,
  filieres,
  typeContreparties,
  infraExemples,
  session,
}: OperatorCandidatureFormProps) {
  const router = useRouter();
  const resolvedCall = candidature?.appel || openCall;
  const saved: PortalDonneesProjet = useMemo(
    () => (candidature?.donneesProjet as PortalDonneesProjet) || {},
    [candidature?.donneesProjet],
  );

  // ——— Reprise fidele : etat initialise depuis le brouillon serveur ———
  const initialStep = Math.min(Math.max(Number(saved.etape) || 1, 1), 4);

  // Garde-fou remap provinces (1.4) : la valeur stockee du profil est remappee vers
  // le decoupage actuel a la lecture — on n'ecrit jamais une province perimee.
  const initialProvince = useMemo(() => {
    const storedSiegeName = organisation?.province?.nom;
    const { current } = remapProvinceName(provinces, storedSiegeName);
    const province = provinces.find((item) => item.nom === current) || null;
    const commune = province?.communes?.find((item) => item.nom === organisation?.commune?.nom) || null;
    return { provinceId: province?.documentId || '', communeId: commune?.documentId || '' };
  }, [provinces, organisation]);

  const initialSite = useMemo(() => {
    const { current } = remapProvinceName(provinces, saved.projet?.siteProvince);
    const province = provinces.find((item) => item.nom === current) || null;
    const commune = province?.communes?.find((item) => item.nom === saved.projet?.siteCommune) || null;
    return { provinceId: province?.documentId || '', communeId: commune?.documentId || '' };
  }, [provinces, saved.projet?.siteProvince, saved.projet?.siteCommune]);

  const basePieces: PortalPieceDepot[] = useMemo(() => {
    const savedPieces = saved.pieces || [];
    return typePieces.map((piece) => {
      const match = savedPieces.find((item) => item.id === piece.documentId);
      return {
        id: piece.documentId,
        libelle: piece.libelle || 'Pièce',
        groupe: piece.groupe || 'administratif',
        exigence: piece.exigence || 'obligatoire',
        depose: Boolean(match?.depose && match?.fileId),
        fileId: match?.fileId || null,
        nomFichier: match?.nomFichier || null,
      };
    });
  }, [typePieces, saved.pieces]);

  const [step, setStep] = useState(initialStep);
  const [maxStepReached, setMaxStepReached] = useState(initialStep);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>('');
  const [showExamples, setShowExamples] = useState(false);

  // Etape 1 — eligibilite §5 + identite operateur (consolidation → organisation)
  const [eligibility, setEligibility] = useState<boolean[]>(() =>
    GATES.map((gate, index) => Boolean(saved.eligibilite?.[index]?.confirme && saved.eligibilite?.[index]?.libelle === gate)),
  );
  const [orgNom, setOrgNom] = useState(organisation?.nom || session.orgName || '');
  const [statutJuridiqueId, setStatutJuridiqueId] = useState(() =>
    statutJuridiques.find((item) => item.libelle === organisation?.statutJuridique?.libelle)?.documentId || '',
  );
  const [nif, setNif] = useState(saved.operateur?.nif || '');
  const [rc, setRc] = useState(saved.operateur?.rc || '');
  const [contact, setContact] = useState(organisation?.contact || '');
  const [operatorProvinceId, setOperatorProvinceId] = useState(initialProvince.provinceId);
  const [operatorCommuneId, setOperatorCommuneId] = useState(initialProvince.communeId);
  const [contactEmail, setContactEmail] = useState(saved.operateur?.email || session.email || '');
  const [telephone, setTelephone] = useState(saved.operateur?.telephone || organisation?.telephone || session.phone || '');

  // Etape 2 — le projet (→ candidature.donneesProjet)
  const [projectTitle, setProjectTitle] = useState(candidature?.titreProjet?.replace(/^Nouvelle candidature.*$/, '') || candidature?.titreProjet || '');
  const [filiereId, setFiliereId] = useState(() =>
    saved.projet?.filiereId ||
    filieres.find((item) => item.nom === organisation?.filierePrincipale?.nom)?.documentId ||
    '',
  );
  const [typeInfrastructure, setTypeInfrastructure] = useState(saved.projet?.typeInfrastructure || '');
  const [sameSite, setSameSite] = useState(Boolean(saved.projet?.memeSiege));
  const [siteProvinceId, setSiteProvinceId] = useState(initialSite.provinceId);
  const [siteCommuneId, setSiteCommuneId] = useState(initialSite.communeId);
  const [statutSite, setStatutSite] = useState(saved.projet?.statutSite || '');
  const [usageCollectif, setUsageCollectif] = useState(saved.projet?.usageCollectif || 'Oui');
  const [mpmeDesservies, setMpmeDesservies] = useState(saved.projet?.mpmeDesservies || '');
  const [maturite, setMaturite] = useState(saved.projet?.maturite || '');
  const [note, setNote] = useState(saved.projet?.noteConceptuelle || '');

  // Etape 3 — financement & impact
  const [budget, setBudget] = useState(saved.financement?.budgetTotal ? formatAmount(String(saved.financement.budgetTotal)) : '');
  const [counterpart, setCounterpart] = useState(saved.financement?.contrepartie ? formatAmount(String(saved.financement.contrepartie)) : '');
  const [typeContrepartie, setTypeContrepartie] = useState(saved.financement?.typeContrepartie || '');
  const [modeleEconomique, setModeleEconomique] = useState(saved.financement?.modeleEconomique || '');
  const [mpme, setMpme] = useState(saved.impact?.mpme || '');
  const [women, setWomen] = useState(saved.impact?.femmes || '');
  const [youth, setYouth] = useState(saved.impact?.jeunes || '');
  const [refugees, setRefugees] = useState(saved.impact?.refugies || '');
  const [jobs, setJobs] = useState(saved.impact?.emplois || '');
  const [womenLed, setWomenLed] = useState(saved.impact?.porteParFemme || 'Non');
  const [ruralArea, setRuralArea] = useState(saved.impact?.zoneRurale || 'Non');

  // Etape 4 — screening E&S + pieces (vrais depots)
  const [esAnswers, setEsAnswers] = useState<string[]>(() =>
    ES_FIELDS.map((field, index) => saved.es?.reponses?.[index]?.reponse || 'Non'),
  );
  const [pges, setPges] = useState<{ fileId?: number; nomFichier?: string } | null>(saved.es?.pges || null);
  const [pieces, setPieces] = useState<PortalPieceDepot[]>(basePieces);
  const [uploadingId, setUploadingId] = useState<string>('');

  // Etape 5 — resultat de soumission (effets serveur reels)
  const [submitInfo, setSubmitInfo] = useState<{ numeroDossier?: string; dateDepot?: string; pdfUrl?: string | null }>({});

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

  const requiredPieces = pieces.filter((piece) => piece.exigence === 'obligatoire');
  const requiredTotal = requiredPieces.length + (declaredRisk ? 1 : 0);
  const depositedRequired = requiredPieces.filter((piece) => piece.depose).length + (declaredRisk && pges?.fileId ? 1 : 0);
  const missingLabels = [
    ...requiredPieces.filter((piece) => !piece.depose).map((piece) => piece.libelle),
    ...(declaredRisk && !pges?.fileId ? ['Plan de gestion E&S (PGES)'] : []),
  ];
  const completenessRate = requiredTotal > 0 ? Math.round((depositedRequired / requiredTotal) * 100) : 0;

  const groupedPieces = ['administratif', 'financier', 'technique'].map((group) => ({
    key: group,
    label: group === 'administratif' ? 'Administratif' : group === 'financier' ? 'Financier' : 'Technique',
    items: pieces.filter((piece) => piece.groupe === group),
  }));

  const operatorProvince = provinces.find((item) => item.documentId === operatorProvinceId) || null;
  const siteProvince = provinces.find((item) => item.documentId === (sameSite ? operatorProvinceId : siteProvinceId)) || null;
  const displayedSiteCommuneId = sameSite ? operatorCommuneId : siteCommuneId;

  const toastTimer = useRef<number | undefined>(undefined);
  function showToast(message: string) {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3200);
  }

  // ——— Assemblage du contrat donneesProjet (etape = derniere etape atteinte) ———
  function buildDonnees(reachedStep: number): PortalDonneesProjet {
    return {
      etape: Math.max(reachedStep, maxStepReached),
      eligibilite: GATES.map((gate, index) => ({ libelle: gate, confirme: Boolean(eligibility[index]) })),
      operateur: { nif, rc, email: contactEmail, telephone },
      projet: {
        filiereId: filiereId || null,
        filiere: filieres.find((item) => item.documentId === filiereId)?.nom || '',
        typeInfrastructure,
        memeSiege: sameSite,
        siteProvinceId: sameSite ? operatorProvinceId || null : siteProvinceId || null,
        siteProvince: (sameSite ? operatorProvince?.nom : siteProvince?.nom) || '',
        siteCommuneId: displayedSiteCommuneId || null,
        siteCommune: siteProvince?.communes?.find((item) => item.documentId === displayedSiteCommuneId)?.nom || '',
        statutSite,
        usageCollectif,
        mpmeDesservies,
        maturite,
        noteConceptuelle: note,
      },
      financement: {
        budgetTotal: budgetValue,
        contrepartie: counterpartValue,
        typeContrepartie,
        modeleEconomique,
      },
      impact: {
        mpme,
        femmes: women,
        jeunes: youth,
        refugies: refugees,
        emplois: jobs,
        porteParFemme: womenLed,
        zoneRurale: ruralArea,
      },
      es: {
        reponses: ES_FIELDS.map((field, index) => ({ libelle: field, reponse: esAnswers[index] || 'Non' })),
        risqueDeclare: declaredRisk,
        pges,
      },
      pieces,
    };
  }

  async function saveDraft(reachedStep: number, options?: { silent?: boolean }): Promise<boolean> {
    if (!candidature?.documentId) return false;
    setSaving(true);

    const input: SaveStepInput = {
      documentId: candidature.documentId,
      titreProjet: projectTitle.trim() || undefined,
      donneesProjet: buildDonnees(reachedStep),
      organisation: orgNom.trim()
        ? {
            nom: orgNom.trim(),
            contact: contact.trim(),
            telephone: telephone.trim() || undefined,
            statutJuridiqueId: statutJuridiqueId || null,
            provinceId: operatorProvinceId || null,
            communeId: operatorCommuneId || null,
            filierePrincipaleId: filiereId || null,
          }
        : undefined,
      phone: telephone.trim() && telephone.trim() !== (session.phone || '') ? telephone.trim() : undefined,
    };

    const result = await saveCandidatureStepAction(input);
    setSaving(false);

    if (!result.ok) {
      showToast(result.error || "L'enregistrement a échoué. Réessayez.");
      return false;
    }

    setLastSavedAt(new Intl.DateTimeFormat('fr-FR', { timeStyle: 'short' }).format(new Date()));
    if (!options?.silent) showToast('Brouillon enregistré.');
    return true;
  }

  async function goNext() {
    // Eligibilite §5 : BLOQUANTE (3.1.2) — ici comme au serveur.
    if (step === 1 && !allEligibilityChecked) {
      showToast('Confirmez toutes les conditions d’éligibilité pour continuer.');
      return;
    }

    if (step === 4) {
      await handleSubmit();
      return;
    }

    const nextStep = step + 1;
    setMaxStepReached((current) => Math.max(current, nextStep));
    const ok = await saveDraft(nextStep, { silent: true });
    if (!ok) return;
    setStep(nextStep);
  }

  async function goBack() {
    await saveDraft(Math.max(step, maxStepReached), { silent: true });
    setStep((current) => Math.max(1, current - 1));
  }

  async function saveAndExit() {
    const ok = await saveDraft(Math.max(step, maxStepReached));
    if (ok) router.push('/mes-candidatures');
  }

  async function handleSubmit() {
    if (!candidature?.documentId) return;

    // §5 bloquant : declarations + contrepartie >= 20 % (verifie aussi cote serveur).
    if (!allEligibilityChecked) {
      showToast('Les déclarations d’éligibilité (§5) doivent toutes être confirmées.');
      return;
    }
    if (budgetValue <= 0 || counterpartValue > budgetValue || counterpartRate < 20) {
      showToast('La contrepartie doit représenter au moins 20 % du budget du projet (§5).');
      return;
    }

    // Garde-fou MOU (3.1.8) : on avertit sur l'incomplétude Annexe 11, on ne bloque pas.
    if (missingLabels.length > 0) {
      const proceed = window.confirm(
        `Pièces obligatoires manquantes :\n— ${missingLabels.join('\n— ')}\n\nVous pouvez soumettre malgré tout, mais l’UGP pourra réclamer ces pièces pendant la vérification. Soumettre quand même ?`,
      );
      if (!proceed) return;
    }

    setSubmitting(true);
    const savedOk = await saveDraft(4, { silent: true });
    if (!savedOk) {
      setSubmitting(false);
      return;
    }

    const result = await submitCandidatureAction(candidature.documentId);
    setSubmitting(false);

    if (!result.ok) {
      showToast(result.error || 'La soumission a échoué.');
      return;
    }

    setSubmitInfo({ numeroDossier: result.numeroDossier, dateDepot: result.dateDepot, pdfUrl: result.pdfUrl });
    setStep(5);
  }

  async function handleUpload(target: string, file: File | null) {
    if (!file) return;
    setUploadingId(target);

    const formData = new FormData();
    formData.append('file', file);
    const uploaded = await uploadPieceAction(formData);
    setUploadingId('');

    if (!uploaded) {
      showToast('Le dépôt du fichier a échoué. Réessayez.');
      return;
    }

    if (target === 'pges') {
      setPges({ fileId: uploaded.id, nomFichier: uploaded.name });
    } else {
      setPieces((current) =>
        current.map((piece) =>
          piece.id === target ? { ...piece, depose: true, fileId: uploaded.id, nomFichier: uploaded.name } : piece,
        ),
      );
    }

    showToast(`« ${uploaded.name} » déposé.`);
  }

  function handleCopy() {
    const numero = submitInfo.numeroDossier || candidature?.numeroDossier || '';
    if (numero) void navigator.clipboard?.writeText(numero);
    showToast('Numéro de dossier copié.');
  }

  const operatorCommunes = operatorProvince?.communes || [];
  const siteCommunes = siteProvince?.communes || [];
  const displayNumero = submitInfo.numeroDossier || candidature?.numeroDossier || '';

  if (!candidature) {
    return (
      <div className="operator-page">
        <p className="operator-auth-error">Brouillon introuvable. Repartez de <Link href="/mes-candidatures">Mes candidatures</Link>.</p>
      </div>
    );
  }

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
                {/* Rattachement AAP auto-defini (3.1.1) : affiche, pas choisi. */}
                <input type="text" value={resolvedCall?.nom || 'Aucun appel ouvert'} readOnly disabled />
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
                <span>pré-rempli depuis votre compte, modifiable — met à jour votre profil organisation</span>
              </div>

              <div className="operator-form-grid">
                <div className="operator-form-field">
                  <label>Raison sociale</label>
                  <input type="text" value={orgNom} onChange={(event) => setOrgNom(event.target.value)} />
                </div>
                <div className="operator-form-field">
                  <label>Statut juridique</label>
                  <select value={statutJuridiqueId} onChange={(event) => setStatutJuridiqueId(event.target.value)}>
                    <option value="">Sélectionner…</option>
                    {statutJuridiques.map((status) => (
                      <option key={status.documentId} value={status.documentId}>{status.libelle}</option>
                    ))}
                  </select>
                </div>
                <div className="operator-form-field">
                  <label>NIF</label>
                  <input type="text" value={nif} onChange={(event) => setNif(event.target.value)} placeholder="4001234567" />
                </div>
                <div className="operator-form-field">
                  <label>RC / enregistrement</label>
                  <input type="text" value={rc} onChange={(event) => setRc(event.target.value)} placeholder="RC/BJM/2023/1024" />
                </div>
                <div className="operator-form-field">
                  <label>Représentant légal</label>
                  <input type="text" value={contact} onChange={(event) => setContact(event.target.value)} />
                </div>
                <div className="operator-form-field">
                  <label>Province</label>
                  <select
                    value={operatorProvinceId}
                    onChange={(event) => { setOperatorProvinceId(event.target.value); setOperatorCommuneId(''); }}
                  >
                    <option value="">Sélectionner une province…</option>
                    {provinces.map((province) => (
                      <option key={province.documentId} value={province.documentId}>{province.nom}</option>
                    ))}
                  </select>
                </div>
                <div className="operator-form-field">
                  <label>Commune</label>
                  <select
                    value={operatorCommuneId}
                    onChange={(event) => setOperatorCommuneId(event.target.value)}
                    disabled={!operatorProvinceId}
                  >
                    <option value="">{operatorProvinceId ? 'Sélectionner une commune…' : 'Choisir une province d’abord'}</option>
                    {operatorCommunes.map((commune) => (
                      <option key={commune.documentId} value={commune.documentId}>{commune.nom}</option>
                    ))}
                  </select>
                </div>
                <div className="operator-form-field">
                  <label>Email de contact</label>
                  <input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="nom@operateur.bi" />
                </div>
                <div className="operator-form-field">
                  <label>Téléphone <span className="operator-form-subtle">· pour l’accusé SMS</span></label>
                  <input type="tel" value={telephone} onChange={(event) => setTelephone(event.target.value)} placeholder="+257 …" />
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
                  <select value={filiereId} onChange={(event) => setFiliereId(event.target.value)}>
                    <option value="">Sélectionner…</option>
                    {filieres.map((chain) => (
                      <option key={chain.documentId} value={chain.documentId}>{chain.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="operator-form-field">
                <label>Type d’infrastructure à réaliser</label>
                <p className="operator-form-subtle">Décrivez librement, avec vos mots, l’infrastructure que vous souhaitez mettre en œuvre.</p>
                {infraExemples.length > 0 ? (
                  <button type="button" className="operator-form-inline-link" onClick={() => setShowExamples((current) => !current)}>
                    Voir quelques exemples
                  </button>
                ) : null}
                {showExamples ? (
                  <div className="operator-form-examples">
                    <ul>
                      {infraExemples.map((example) => <li key={example}>{example}</li>)}
                    </ul>
                  </div>
                ) : null}
                <textarea
                  rows={4}
                  value={typeInfrastructure}
                  onChange={(event) => setTypeInfrastructure(event.target.value)}
                  placeholder="Ex. : unité de séchage solaire de mangues d’une capacité de 2 t/jour…"
                />
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
                        value={sameSite ? operatorProvinceId : siteProvinceId}
                        onChange={(event) => {
                          if (sameSite) return;
                          setSiteProvinceId(event.target.value);
                          setSiteCommuneId('');
                        }}
                        disabled={sameSite}
                      >
                        <option value="">Sélectionner une province…</option>
                        {provinces.map((province) => (
                          <option key={province.documentId} value={province.documentId}>{province.nom}</option>
                        ))}
                      </select>
                    </div>
                    <div className="operator-form-field">
                      <label>Commune</label>
                      <select
                        value={displayedSiteCommuneId}
                        onChange={(event) => !sameSite && setSiteCommuneId(event.target.value)}
                        disabled={sameSite || !siteProvince}
                      >
                        <option value="">{siteProvince ? 'Sélectionner une commune…' : 'Choisir une province d’abord'}</option>
                        {siteCommunes.map((commune) => (
                          <option key={commune.documentId} value={commune.documentId}>{commune.nom}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="operator-form-grid">
                <div className="operator-form-field">
                  <label>Statut du site</label>
                  <select value={statutSite} onChange={(event) => setStatutSite(event.target.value)}>
                    <option value="">Sélectionner…</option>
                    {SITE_STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
                <div className="operator-form-field">
                  <label>Usage collectif ou partagé</label>
                  <select value={usageCollectif} onChange={(event) => setUsageCollectif(event.target.value)}>
                    <option>Oui</option>
                    <option>Non</option>
                  </select>
                </div>
                <div className="operator-form-field">
                  <label>MPME / acteurs desservis</label>
                  <input type="number" min="0" value={mpmeDesservies} onChange={(event) => setMpmeDesservies(event.target.value)} />
                </div>
                <div className="operator-form-field">
                  <label>Niveau de maturité</label>
                  <select value={maturite} onChange={(event) => setMaturite(event.target.value)}>
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
                  <select value={typeContrepartie} onChange={(event) => setTypeContrepartie(event.target.value)}>
                    <option value="">Sélectionner…</option>
                    {typeContreparties.map((type) => <option key={type.documentId}>{type.libelle}</option>)}
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
                <textarea rows={2} value={modeleEconomique} onChange={(event) => setModeleEconomique(event.target.value)} placeholder="Revenus, coûts, viabilité, exploitation et maintenance…" />
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
                  <input type="number" min="0" value={jobs} onChange={(event) => setJobs(event.target.value)} />
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
                  <label className={`operator-upload-btn${pges?.fileId ? ' is-done' : ''}`}>
                    {uploadingId === 'pges' ? 'Envoi…' : pges?.fileId ? `✓ ${pges.nomFichier || 'Déposé'}` : 'Choisir un fichier'}
                    <input
                      type="file"
                      hidden
                      accept=".pdf,image/*"
                      onChange={(event) => void handleUpload('pges', event.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              ) : null}

              <div className="operator-form-section-title">Pièces justificatives</div>
              {pieces.length === 0 ? (
                <p className="operator-auth-error">La liste des pièces (Annexe 9) n’est pas disponible — référentiel « type de pièce » vide dans le CMS.</p>
              ) : null}
              {groupedPieces.map((group) => (
                <details key={group.key} className="operator-piece-group" open>
                  <summary>{group.label}</summary>
                  {group.items.map((piece) => (
                    <div key={piece.id} className="operator-piece-row">
                      <span className="operator-piece-name">
                        {piece.libelle}
                        <span className={statusBadgeClass(piece.exigence)}>{statusBadgeLabel(piece.exigence)}</span>
                      </span>
                      <label className={`operator-upload-btn${piece.depose ? ' is-done' : ''}`}>
                        {uploadingId === piece.id ? 'Envoi…' : piece.depose ? `✓ ${piece.nomFichier || 'Déposé'}` : 'Choisir un fichier'}
                        <input
                          type="file"
                          hidden
                          accept=".pdf,image/*"
                          onChange={(event) => void handleUpload(piece.id, event.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                  ))}
                </details>
              ))}

              <div className="operator-form-complete-box">
                <div className="operator-form-complete-head">
                  <b>Complétude du dossier</b>
                  <span>{depositedRequired} / {requiredTotal} obligatoires</span>
                </div>
                <div className="operator-form-complete-bar">
                  <i style={{ width: `${completenessRate}%` }} />
                </div>
                <p className="operator-form-subtle">
                  {missingLabels.length > 0
                    ? `Manquantes : ${missingLabels.join(', ')}`
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
                  <span>{displayNumero}</span>
                </div>
                <button type="button" className="operator-secondary-btn inline" onClick={handleCopy}>Copier</button>
              </div>

              <p className="operator-form-confirm-label">Accusé de réception envoyé</p>
              <div className="operator-form-ack-row">Email — {session.email} <span>✓ envoyé</span></div>
              <div className="operator-form-ack-row">SMS — {telephone || session.phone || 'non renseigné'} <span>{telephone || session.phone ? '✓ envoyé' : '—'}</span></div>
              {submitInfo.dateDepot ? (
                <p className="operator-form-subtle">Inscrit au registre des dépôts le {formatDateTime(submitInfo.dateDepot)}.</p>
              ) : null}

              {submitInfo.pdfUrl ? (
                <a href={submitInfo.pdfUrl} target="_blank" rel="noopener" className="operator-primary-btn operator-form-block-btn">
                  Télécharger le PDF de ma candidature
                </a>
              ) : null}
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
            <span className="operator-form-autosave">
              {saving ? 'Enregistrement…' : lastSavedAt ? `Enregistré à ${lastSavedAt}` : 'Sauvegarde à chaque étape'}
            </span>
            {step > 1 && step < 5 ? (
              <button type="button" className="operator-secondary-btn inline" onClick={() => void goBack()} disabled={saving || submitting}>
                ← Retour
              </button>
            ) : null}
            {step < 5 ? (
              <button type="button" className="operator-secondary-btn inline" onClick={() => void saveAndExit()} disabled={saving || submitting}>
                Enregistrer et reprendre plus tard
              </button>
            ) : null}
          </div>

          {step < 5 ? (
            <button type="button" className="operator-primary-btn inline" onClick={() => void goNext()} disabled={saving || submitting}>
              {submitting ? 'Soumission…' : step === 4 ? 'Soumettre le dossier' : 'Continuer →'}
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
