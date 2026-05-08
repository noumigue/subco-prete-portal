'use client';

import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1338';

const steps = [
  'Promoteur',
  'Structure',
  'Activités',
  'Exploitation',
  'Partenaires',
  'Projet',
  'Pièces',
];

const valueChains = [
  { value: 'fruits', label: 'Fruits tropicaux' },
  { value: 'volaille', label: 'Volaille' },
  { value: 'lait', label: 'Lait' },
  { value: 'pisciculture', label: 'Pisciculture et aquaculture' },
  { value: 'mines', label: 'Industrie minière' },
];

const operatingYears = ['2023', '2024', '2025'];
const targetYears = ['2024', '2025', '2026'];
const draftStorageKey = 'prete-candidature-draft-v1';

type DraftValues = Record<string, string>;

function value(values: DraftValues, name: string) {
  return String(values[name] || '').trim();
}

function numberValue(values: DraftValues, name: string) {
  const raw = value(values, name).replace(/\s/g, '');
  return raw ? Number(raw) : null;
}

function bigIntegerValue(values: DraftValues, name: string) {
  const raw = value(values, name).replace(/\s/g, '');
  return raw || null;
}

function rows(values: DraftValues, prefix: string, fields: string[]) {
  return fields.map((field) => ({
    label: field,
    values: Object.fromEntries(
      (prefix === 'operating' ? operatingYears : targetYears).map((year) => [
        year,
        value(values, `${prefix}.${field}.${year}`),
      ]),
    ),
  }));
}

function currentFormValues(form: HTMLFormElement) {
  const data = new FormData(form);
  const values: DraftValues = {};

  for (const [key, entry] of data.entries()) {
    if (entry instanceof File) continue;
    values[key] = String(entry);
  }

  return values;
}

const requiredFields = [
  { name: 'fullName', label: 'Nom du promoteur', step: 0 },
  { name: 'email', label: 'Email', step: 0 },
  { name: 'organization', label: 'Raison sociale', step: 1 },
  { name: 'valueChain', label: 'Chaîne de valeur', step: 1 },
  { name: 'productsOffer', label: "Description des activités et de l'offre de produits", step: 2 },
  { name: 'projectTitle', label: 'Titre du projet', step: 5 },
  { name: 'projectSummary', label: 'Résumé du projet', step: 5 },
  { name: 'infrastructureDescription', label: "Description de l'infrastructure productive", step: 5 },
];

export default function CandidaturePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [draftValues, setDraftValues] = useState<DraftValues>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const progress = useMemo(() => Math.round(((currentStep + 1) / steps.length) * 100), [currentStep]);

  useEffect(() => {
    const saved = window.localStorage.getItem(draftStorageKey);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        setDraftValues(parsed);
        setMessage('Brouillon local restauré.');
      }
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    }
  }, []);

  function rememberField(e: ChangeEvent<HTMLFormElement>) {
    const field = e.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) {
      return;
    }
    if (!field.name || field.type === 'file') return;
    setDraftValues((values) => ({ ...values, [field.name]: field.value }));
  }

  function saveDraft(form: HTMLFormElement | null) {
    const nextValues = { ...draftValues, ...(form ? currentFormValues(form) : {}) };
    setDraftValues(nextValues);
    window.localStorage.setItem(draftStorageKey, JSON.stringify(nextValues));
    setMessage('Brouillon enregistré sur cet appareil.');
  }

  function clearDraft(form: HTMLFormElement | null) {
    window.localStorage.removeItem(draftStorageKey);
    setDraftValues({});
    form?.reset();
    setCurrentStep(0);
    setMessage('Brouillon local effacé.');
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const form = e.currentTarget;
    const fd = new FormData(form);
    const allValues = { ...draftValues, ...currentFormValues(form) };
    const documents = fd.getAll('applicationDocuments').filter((file) => file instanceof File && file.size > 0);
    const missingField = requiredFields.find((field) => !value(allValues, field.name));

    if (missingField) {
      setCurrentStep(missingField.step);
      setMessage(`Champ obligatoire manquant : ${missingField.label}.`);
      setLoading(false);
      return;
    }

    const payload = {
      fullName: value(allValues, 'fullName'),
      email: value(allValues, 'email'),
      phone: value(allValues, 'phone'),
      age: numberValue(allValues, 'age'),
      gender: value(allValues, 'gender') || 'non_precise',
      address: value(allValues, 'address'),
      location: value(allValues, 'location'),
      organization: value(allValues, 'organization'),
      commercialName: value(allValues, 'commercialName'),
      organizationType: value(allValues, 'organizationType'),
      creationDate: value(allValues, 'creationDate') || null,
      yearsOfActivity: numberValue(allValues, 'yearsOfActivity'),
      valueChain: value(allValues, 'valueChain'),
      umbrellaOrganizations: value(allValues, 'umbrellaOrganizations'),
      financialAccountStatus: value(allValues, 'financialAccountStatus'),
      projectTitle: value(allValues, 'projectTitle'),
      projectSummary: value(allValues, 'projectSummary'),
      requestedSupportEstimate: bigIntegerValue(allValues, 'requestedSupportEstimate'),
      ownContributionEstimate: bigIntegerValue(allValues, 'ownContributionEstimate'),
      creditInterest: value(allValues, 'creditInterest') === 'oui',
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      promoterProfile: {
        fullName: value(allValues, 'fullName'),
        gender: value(allValues, 'gender'),
        age: numberValue(allValues, 'age'),
        address: value(allValues, 'address'),
        phone: value(allValues, 'phone'),
        email: value(allValues, 'email'),
        location: value(allValues, 'location'),
      },
      organizationProfile: {
        legalName: value(allValues, 'organization'),
        commercialName: value(allValues, 'commercialName'),
        organizationType: value(allValues, 'organizationType'),
        creationDate: value(allValues, 'creationDate'),
        valueChain: value(allValues, 'valueChain'),
        umbrellaOrganizations: value(allValues, 'umbrellaOrganizations'),
        yearsOfActivity: numberValue(allValues, 'yearsOfActivity'),
        financialAccountStatus: value(allValues, 'financialAccountStatus'),
      },
      activities: {
        productsOffer: value(allValues, 'productsOffer'),
        productionAssets: value(allValues, 'productionAssets'),
        servedMarkets: value(allValues, 'servedMarkets'),
      },
      strengthsWeaknesses: {
        strengths: [value(allValues, 'strength1'), value(allValues, 'strength2'), value(allValues, 'strength3')].filter(Boolean),
        weaknesses: [value(allValues, 'weakness1'), value(allValues, 'weakness2'), value(allValues, 'weakness3')].filter(Boolean),
      },
      operatingData: rows(allValues, 'operating', [
        'volumeVente',
        'chiffreAffaires',
        'employesPermanents',
        'employesFemmes',
        'employesJeunes',
        'employesTemporaires',
      ]),
      partners: {
        partnerList: value(allValues, 'partnerList'),
      },
      investmentProject: {
        infrastructureDescription: value(allValues, 'infrastructureDescription'),
        innovation: value(allValues, 'innovation'),
        motivationAndPreteLink: value(allValues, 'motivationAndPreteLink'),
        expectationsAndNeeds: value(allValues, 'expectationsAndNeeds'),
        investmentPlan12Months: value(allValues, 'investmentPlan12Months'),
        requestedSupportEstimate: bigIntegerValue(allValues, 'requestedSupportEstimate'),
        ownContributionEstimate: bigIntegerValue(allValues, 'ownContributionEstimate'),
      },
      targetObjectives: rows(allValues, 'target', [
        'volumeVente',
        'chiffreAffaires',
        'emploisPermanentsCrees',
        'emploisTemporairesCrees',
      ]),
      risksAndEnvironment: {
        risks: [value(allValues, 'risk1'), value(allValues, 'risk2'), value(allValues, 'risk3')].filter(Boolean),
        mitigationMeasures: value(allValues, 'mitigationMeasures'),
        environmentActions: value(allValues, 'environmentActions'),
        creditInterest: value(allValues, 'creditInterest'),
        creditJustification: value(allValues, 'creditJustification'),
      },
    };

    try {
      const res = await fetch(`${STRAPI_URL}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const out = await res.json();
      const applicationId = out?.data?.id;
      const ref = out?.data?.reference || applicationId || out?.data?.documentId;
      let uploadWarning = '';

      if (documents.length > 0 && applicationId) {
        const uploadBody = new FormData();
        uploadBody.append('ref', 'api::application.application');
        uploadBody.append('refId', String(applicationId));
        uploadBody.append('field', 'applicationDocuments');

        for (const file of documents) {
          uploadBody.append('files', file);
        }

        const uploadRes = await fetch(`${STRAPI_URL}/api/upload`, {
          method: 'POST',
          body: uploadBody,
        });

        if (!uploadRes.ok) {
          const txt = await uploadRes.text();
          uploadWarning = ` Les pièces n'ont pas été attachées: ${txt || `HTTP ${uploadRes.status}`}`;
        }
      }

      setMessage(`Candidature soumise avec succès. Référence: ${ref}.${uploadWarning}`);
      window.localStorage.removeItem(draftStorageKey);
      setDraftValues({});
      form.reset();
      setCurrentStep(0);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setMessage(`Erreur de soumission: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  function nextStep() {
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  }

  function previousStep() {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  return (
    <main className="section">
      <div className="container candidature-container">
        <div className="candidature-heading">
          <div>
            <p className="form-kicker">Annexe 1 - demande de subvention</p>
            <h1>Déposer une candidature</h1>
            <p>
              Renseignez le dossier officiel PRETE. Les informations seront transmises au CMS avec les pièces jointes.
            </p>
          </div>
          <div className="progress-box">
            <strong>{progress}%</strong>
            <span>Complétion du parcours</span>
          </div>
        </div>

        <form onSubmit={onSubmit} onChange={rememberField} className="application-shell">
          <aside className="steps-panel" aria-label="Etapes du formulaire">
            {steps.map((step, index) => (
              <button
                key={step}
                type="button"
                className={`step-button ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'done' : ''}`}
                onClick={() => setCurrentStep(index)}
              >
                <span>{index + 1}</span>
                {step}
              </button>
            ))}
          </aside>

          <section className="form-panel">
            {currentStep === 0 && (
              <FormSection title="Présentation du promoteur">
                <div className="form-grid two">
                  <Field name="fullName" label="Nom du promoteur" defaultValue={draftValues.fullName || ''} required />
                  <Select name="gender" label="Sexe" options={[
                    ['non_precise', 'Non précisé'],
                    ['femme', 'Femme'],
                    ['homme', 'Homme'],
                    ['autre', 'Autre'],
                  ]} defaultValue={draftValues.gender || 'non_precise'} />
                  <Field name="age" label="Age" type="number" min="0" defaultValue={draftValues.age || ''} />
                  <Field name="phone" label="Téléphone" defaultValue={draftValues.phone || ''} />
                  <Field name="email" label="Email" type="email" defaultValue={draftValues.email || ''} required />
                  <Field name="location" label="Localisation" defaultValue={draftValues.location || ''} />
                </div>
                <TextArea name="address" label="Adresse complète" rows={3} defaultValue={draftValues.address || ''} />
              </FormSection>
            )}

            {currentStep === 1 && (
              <FormSection title="Présentation de la structure">
                <div className="form-grid two">
                  <Field name="organization" label="Raison sociale" defaultValue={draftValues.organization || ''} required />
                  <Field name="commercialName" label="Nom commercial" defaultValue={draftValues.commercialName || ''} />
                  <Field name="organizationType" label="Type de société / organisation" defaultValue={draftValues.organizationType || ''} />
                  <Field name="creationDate" label="Date de création" type="date" defaultValue={draftValues.creationDate || ''} />
                  <Field name="yearsOfActivity" label="Nombre d'années d'activités" type="number" min="0" defaultValue={draftValues.yearsOfActivity || ''} />
                  <label className="field">
                    <span>Chaîne de valeur</span>
                    <select name="valueChain" required className="input" defaultValue={draftValues.valueChain || ''}>
                      <option value="">Sélectionner</option>
                      {valueChains.map((chain) => (
                        <option key={chain.value} value={chain.value}>{chain.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <TextArea name="umbrellaOrganizations" label="Organisations faitières d'appartenance" rows={3} defaultValue={draftValues.umbrellaOrganizations || ''} />
                <TextArea name="financialAccountStatus" label="Compte financier, historique de partenariat et difficultés de paiement" rows={4} defaultValue={draftValues.financialAccountStatus || ''} />
              </FormSection>
            )}

            {currentStep === 2 && (
              <FormSection title="Activités de la structure">
                <TextArea name="productsOffer" label="Description des activités et de l'offre de produits" rows={5} defaultValue={draftValues.productsOffer || ''} required />
                <TextArea name="productionAssets" label="Actifs de production" rows={4} defaultValue={draftValues.productionAssets || ''} />
                <TextArea name="servedMarkets" label="Marchés desservis" rows={4} defaultValue={draftValues.servedMarkets || ''} />
                <div className="form-grid two">
                  {[1, 2, 3].map((item) => <Field key={`s${item}`} name={`strength${item}`} label={`Force ${item}`} defaultValue={draftValues[`strength${item}`] || ''} />)}
                  {[1, 2, 3].map((item) => <Field key={`w${item}`} name={`weakness${item}`} label={`Faiblesse / défi ${item}`} defaultValue={draftValues[`weakness${item}`] || ''} />)}
                </div>
              </FormSection>
            )}

            {currentStep === 3 && (
              <FormSection title="Données d'exploitation">
                <DataTable
                  prefix="operating"
                  years={operatingYears}
                  rows={[
                    ['volumeVente', 'Volume de vente par produit'],
                    ['chiffreAffaires', "Chiffre d'affaires moyen en FCFA"],
                    ['employesPermanents', "Nombre total d'employés permanents"],
                    ['employesFemmes', "Nombre d'employés permanents femmes"],
                    ['employesJeunes', "Nombre d'employés permanents jeunes"],
                    ['employesTemporaires', "Nombre d'employés temporaires"],
                  ]}
                  values={draftValues}
                />
              </FormSection>
            )}

            {currentStep === 4 && (
              <FormSection title="Partenaires clés">
                <TextArea
                  name="partnerList"
                  label="Partenaires passés et actuels, appuis reçus, montants et dates"
                  rows={7}
                  defaultValue={draftValues.partnerList || ''}
                />
              </FormSection>
            )}

            {currentStep === 5 && (
              <FormSection title="Projet d'investissement">
                <Field name="projectTitle" label="Titre du projet" defaultValue={draftValues.projectTitle || ''} required />
                <TextArea name="projectSummary" label="Résumé du projet" rows={4} defaultValue={draftValues.projectSummary || ''} required />
                <TextArea name="infrastructureDescription" label="Description de l'infrastructure productive" rows={5} defaultValue={draftValues.infrastructureDescription || ''} required />
                <TextArea name="innovation" label="En quoi l'infrastructure est-elle innovante ?" rows={3} defaultValue={draftValues.innovation || ''} />
                <TextArea name="motivationAndPreteLink" label="Motivation de la demande et lien avec les objectifs PRETE" rows={4} defaultValue={draftValues.motivationAndPreteLink || ''} />
                <TextArea name="expectationsAndNeeds" label="Attentes vis-à-vis du PRETE et estimation des besoins" rows={4} defaultValue={draftValues.expectationsAndNeeds || ''} />
                <TextArea name="investmentPlan12Months" label="Plan des investissements sur 12 mois" rows={5} defaultValue={draftValues.investmentPlan12Months || ''} />
                <div className="form-grid two">
                  <Field name="requestedSupportEstimate" label="Estimation de l'appui demandé en FCFA" type="number" min="0" defaultValue={draftValues.requestedSupportEstimate || ''} />
                  <Field name="ownContributionEstimate" label="Apport personnel estimé en FCFA" type="number" min="0" defaultValue={draftValues.ownContributionEstimate || ''} />
                </div>
                <h3 className="subsection-title">Objectifs cibles</h3>
                <DataTable
                  prefix="target"
                  years={targetYears}
                  rows={[
                    ['volumeVente', 'Volume de vente par produit'],
                    ['chiffreAffaires', "Chiffre d'affaires annuel total FCFA"],
                    ['emploisPermanentsCrees', 'Emplois permanents créés'],
                    ['emploisTemporairesCrees', 'Emplois temporaires créés'],
                  ]}
                  values={draftValues}
                />
                <div className="form-grid two">
                  {[1, 2, 3].map((item) => <Field key={`r${item}`} name={`risk${item}`} label={`Risque ${item}`} defaultValue={draftValues[`risk${item}`] || ''} />)}
                </div>
                <TextArea name="mitigationMeasures" label="Mesures d'atténuation des risques" rows={4} defaultValue={draftValues.mitigationMeasures || ''} />
                <TextArea name="environmentActions" label="Actions de préservation de l'environnement" rows={4} defaultValue={draftValues.environmentActions || ''} />
                <label className="field">
                  <span>Intérêt pour un crédit auprès d&apos;une microfinance</span>
                  <select name="creditInterest" className="input" defaultValue={draftValues.creditInterest || 'non'}>
                    <option value="non">Non</option>
                    <option value="oui">Oui</option>
                  </select>
                </label>
                <TextArea name="creditJustification" label="Justification de l'intérêt crédit" rows={3} defaultValue={draftValues.creditJustification || ''} />
              </FormSection>
            )}

            {currentStep === 6 && (
              <FormSection title="Pièces justificatives et soumission">
                <div className="checklist">
                  <span>Factures d&apos;achat ou justificatifs d&apos;actifs de production</span>
                  <span>Factures, bons de commande ou contrats marchés</span>
                  <span>Documents d&apos;existence légale, fiscale ou financière disponibles</span>
                  <span>Tout document utile au projet d&apos;investissement</span>
                </div>
                <label className="field">
                  <span>Pièces jointes</span>
                  <input
                    name="applicationDocuments"
                    type="file"
                    className="input"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                </label>
                <p className="form-note">
                  La taille maximale côté CMS est configurée à 10 Mo par fichier.
                </p>
              </FormSection>
            )}

            <div className="form-actions">
              <button type="button" className="btn secondary" onClick={previousStep} disabled={currentStep === 0}>
                Précédent
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={(event) => saveDraft(event.currentTarget.form)}
              >
                Enregistrer brouillon
              </button>
              <button
                type="button"
                className="btn secondary subtle"
                onClick={(event) => clearDraft(event.currentTarget.form)}
              >
                Effacer brouillon
              </button>
              {currentStep < steps.length - 1 ? (
                <button type="button" className="btn primary" onClick={nextStep}>
                  Suivant
                </button>
              ) : (
                <button className="btn primary" type="submit" disabled={loading}>
                  {loading ? 'Soumission...' : 'Soumettre la candidature'}
                </button>
              )}
            </div>
          </section>
        </form>

        {message && <p className="submission-message">{message}</p>}
      </div>
    </main>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="form-section">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} className="input" />
    </label>
  );
}

function TextArea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea {...props} className="input" />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: Array<[string, string]>;
  defaultValue?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} className="input" defaultValue={defaultValue}>
        {options.map(([value, optionLabel]) => (
          <option key={value} value={value}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function DataTable({
  prefix,
  years,
  rows: dataRows,
  values,
}: {
  prefix: string;
  years: string[];
  rows: Array<[string, string]>;
  values: DraftValues;
}) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Indicateur</th>
            {years.map((year) => <th key={year}>{year}</th>)}
          </tr>
        </thead>
        <tbody>
          {dataRows.map(([key, label]) => (
            <tr key={key}>
              <td>{label}</td>
              {years.map((year) => (
                <td key={`${key}-${year}`}>
                  <input
                    name={`${prefix}.${key}.${year}`}
                    className="input table-input"
                    defaultValue={values[`${prefix}.${key}.${year}`] || ''}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
