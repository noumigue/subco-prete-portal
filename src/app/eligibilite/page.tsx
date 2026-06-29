'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type AnswerValue = string | string[];
type Answers = Record<string, AnswerValue>;

type EligibilityResult = {
  status: 'eligible' | 'reserve' | 'rejected';
  title: string;
  description: string;
  positives: string[];
  warnings: string[];
  blockers: string[];
};

const REQUIRED_QUESTIONS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'];

const ELIGIBLE_STATUTS = ['societe', 'cooperative', 'association', 'numerique'];
const ELIGIBLE_REGIONS = ['ngozi', 'kayanza', 'muyinga', 'gitega', 'ruyigi'];
const ELIGIBLE_FILIERES = ['fruits', 'volaille', 'pisciculture', 'lait', 'mines', 'transversal'];

function asArray(value: AnswerValue | undefined): string[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function labelFor(questionId: string) {
  return {
    q1: 'statut juridique',
    q2: 'enregistrement légal',
    q3: 'conformité fiscale',
    q4: 'contentieux',
    q5: 'cofinancement',
    q6: 'filière',
    q7: 'région',
    q8: 'usage collectif',
    q9: 'site',
  }[questionId];
}

function resultFromAnswers(answers: Answers): EligibilityResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const positives: string[] = [];

  if (!ELIGIBLE_STATUTS.includes((answers['q1'] as string) || '')) {
    blockers.push('Statut juridique non conforme au programme');
  } else {
    positives.push('Statut juridique conforme');
  }

  if (answers['q2'] === 'non') {
    blockers.push('Organisation non enregistrée légalement au Burundi');
  } else if (answers['q2'] === 'encours') {
    warnings.push('Enregistrement légal en cours — à finaliser avant soumission');
  } else {
    positives.push('Enregistrement légal valide (NIF + RC)');
  }

  if (answers['q3'] === 'non') {
    blockers.push('Non-conformité fiscale déclarée');
  } else if (answers['q3'] === 'nesaispas') {
    warnings.push('Conformité fiscale à vérifier avant soumission');
  } else {
    positives.push('Conformité fiscale confirmée');
  }

  if (answers['q4'] === 'oui') {
    blockers.push('Contentieux majeur en cours — incompatible avec le programme');
  } else {
    positives.push('Absence de contentieux majeur');
  }

  if (answers['q5'] === 'non') {
    blockers.push('Incapacité à mobiliser 20% de contrepartie');
  } else if (answers['q5'] === 'aevaluer') {
    warnings.push('Capacité de cofinancement (>=20%) à confirmer');
  } else {
    positives.push('Capacité de cofinancement >= 20% confirmée');
  }

  const filieres = asArray(answers['q6']);
  const hasEligibleFiliere = filieres.some((item) => ELIGIBLE_FILIERES.includes(item));
  if (!hasEligibleFiliere) {
    blockers.push('Aucune filière prioritaire sélectionnée');
  } else {
    positives.push('Filière(s) éligible(s) ciblée(s)');
  }

  const regions = asArray(answers['q7']);
  const hasEligibleRegion = regions.some((item) => ELIGIBLE_REGIONS.includes(item));
  const hasAutreOnly = regions.length > 0 && regions.every((item) => item === 'autre');
  if (regions.length === 0 || hasAutreOnly || !hasEligibleRegion) {
    blockers.push('Région d\'intervention hors zone du programme (Ngozi, Kayanza, Muyinga, Gitega, Ruyigi)');
  } else {
    positives.push('Région(s) d\'intervention éligible(s)');
  }

  if (answers['q8'] === 'non') {
    blockers.push('Infrastructure à usage exclusivement privé — programme réservé aux usages collectifs');
  } else if (answers['q8'] === 'enpartie') {
    warnings.push('Usage collectif partiel — à préciser et renforcer dans le dossier');
  } else {
    positives.push('Infrastructure à usage collectif ou partagé');
  }

  if (answers['q9'] === 'non') {
    warnings.push('Site non encore disponible — point à régulariser avant instruction');
  } else if (answers['q9'] === 'encours') {
    warnings.push('Site en cours de sécurisation — acceptable à ce stade');
  } else {
    positives.push('Site disponible ou sécurisé');
  }

  const inclusion = asArray(answers['q10']);
  if (inclusion.length > 0 && !inclusion.includes('aucun')) {
    positives.push('Objectifs d\'inclusion sociale identifiés (+points de notation)');
  }

  if (blockers.length > 0) {
    return {
      status: 'rejected',
      title: 'Votre projet n\'est pas éligible',
      description:
        blockers.length === 1
          ? 'Une condition rédhibitoire n\'est pas remplie. Le dossier sera rejeté à la présélection sans passer à l\'évaluation technique.'
          : `${blockers.length} conditions rédhibitoires ne sont pas remplies. Le dossier sera rejeté à la présélection.`,
      positives,
      warnings,
      blockers,
    };
  }

  if (warnings.length > 0) {
    return {
      status: 'reserve',
      title: 'Éligible sous réserve',
      description:
        'Votre profil correspond globalement aux critères du programme. Certains points nécessitent une clarification avant ou pendant l\'instruction du dossier.',
      positives,
      warnings,
      blockers,
    };
  }

  return {
    status: 'eligible',
    title: 'Votre projet semble éligible',
    description:
      'Toutes vos réponses correspondent aux critères du programme SUBCO-PRETE. Vous pouvez créer votre compte et déposer un dossier de candidature.',
    positives,
    warnings,
    blockers,
  };
}

export default function EligibilityPage() {
  const [answers, setAnswers] = useState<Answers>({});
  const [missing, setMissing] = useState<string[]>([]);
  const [result, setResult] = useState<EligibilityResult | null>(null);

  const sectionProgress = {
    identity: ['q1', 'q2', 'q3', 'q4', 'q5'].every((q) => Boolean(answers[q]) && !(Array.isArray(answers[q]) && answers[q].length === 0)),
    project: ['q6', 'q7', 'q8', 'q9'].every((q) => Boolean(answers[q]) && !(Array.isArray(answers[q]) && answers[q].length === 0)),
  };

  const allAnswers = useMemo(() => ({
    ...answers,
    ...Object.fromEntries(
      Object.entries(answers).map(([key, value]) => [key, Array.isArray(value) && value.length === 0 ? undefined : value])
    ),
  }) as Answers, [answers]);

  const missingRequired = useMemo(
    () => REQUIRED_QUESTIONS.filter((q) => !allAnswers[q] || (Array.isArray(allAnswers[q]) && allAnswers[q].length === 0)),
    [allAnswers]
  );

  const completionText = useMemo(() => {
    if (!missingRequired.length) {
      return '';
    }

    return missingRequired.map((q) => labelFor(q)).filter(Boolean).join(', ');
  }, [missingRequired]);

  const updateRadio = (questionId: string, value: string) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    setResult(null);
    setMissing([]);
  };

  const updateCheck = (questionId: string, value: string) => {
    setAnswers((current) => {
      const previous = asArray(current[questionId]);
      const next = new Set(previous);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return { ...current, [questionId]: [...next] };
    });
    setResult(null);
    setMissing([]);
  };

  const evaluate = () => {
    setMissing(missingRequired);
    if (missingRequired.length > 0) {
      return;
    }
    setResult(resultFromAnswers(allAnswers));
    setTimeout(() => {
      document.getElementById('eligibility-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const reset = () => {
    setAnswers({});
    setResult(null);
    setMissing([]);
  };

  return (
    <main className="min-h-screen">
      <section className="section section-band">
        <div className="container">
          <p className="eyebrow">Test d&apos;éligibilité</p>
          <h1>Vérifiez si votre projet est éligible</h1>
          <p className="hero-vision" style={{ maxWidth: '70ch' }}>
            Répondez aux 10 questions ci-dessous pour obtenir un résultat immédiat. Aucun compte requis — vos réponses ne sont pas enregistrées.
          </p>
        </div>
      </section>

      <section className="section section-band">
        <div className="container">
          <p className="meta">Progression</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.45rem', maxWidth: '640px' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '999px', background: sectionProgress.identity ? 'var(--brand)' : 'var(--line)' }} />
              <span>1 — Votre organisation</span>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '999px',
                  background: sectionProgress.project ? 'var(--brand)' : 'var(--line)',
                }}
              />
              <span>2 — Votre projet</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-band">
        <div className="container">
          <div className="form-grid" style={{ gap: '1.4rem' }}>
            <fieldset className="form-section">
              <h2 className="subsection-title">Votre organisation</h2>

              <div className="field">
                <span>Statut juridique de votre organisation *</span>
                {[['societe', 'Société (SARL, SA, coopérative d\'investissement… )'], ['cooperative', 'Coopérative agricole ou de services'], ['association', 'Association professionnelle ou ONG à vocation économique'], ['numerique', 'Fournisseur de services numériques ou plateforme e-commerce'], ['autre', 'Autre']].map(([value, label]) => (
                  <label key={value} style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="q1"
                      checked={answers['q1'] === value}
                      onChange={() => updateRadio('q1', value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <div className="field">
                <span>Votre organisation est-elle légalement enregistrée au Burundi ? * </span>
                <span className="form-note">NIF et RC valides requis.</span>
                {[
                  ['oui', 'Oui'],
                  ['non', 'Non'],
                  ['encours', 'En cours d\'enregistrement'],
                ].map(([value, label]) => (
                  <label key={value} style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="q2"
                      checked={answers['q2'] === value}
                      onChange={() => updateRadio('q2', value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <div className="field">
                <span>Votre organisation est-elle en règle vis-à-vis de ses obligations fiscales ? *</span>
                {[
                  ['oui', 'Oui'],
                  ['non', 'Non'],
                  ['nesaispas', "Je ne sais pas"],
                ].map(([value, label]) => (
                  <label key={value} style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="q3"
                      checked={answers['q3'] === value}
                      onChange={() => updateRadio('q3', value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <div className="field">
                <span>Votre organisation est-elle engagée dans un contentieux majeur en cours ? * </span>
                <span className="form-note">Un contentieux pouvant compromettre la mise en œuvre bloque la candidature.</span>
                {[
                  ['oui', 'Oui'],
                  ['non', 'Non'],
                ].map(([value, label]) => (
                  <label key={value} style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="q4"
                      checked={answers['q4'] === value}
                      onChange={() => updateRadio('q4', value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <div className="field">
                <span>Pouvez-vous mobiliser au minimum 20% du coût total du projet en contrepartie ? *</span>
                <span className="form-note">La contrepartie peut être numéraire, nature, équipements ou travaux préparatoires.</span>
                {[
                  ['oui', 'Oui'],
                  ['non', 'Non'],
                  ['aevaluer', 'À évaluer'],
                ].map(([value, label]) => (
                  <label key={value} style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="q5"
                      checked={answers['q5'] === value}
                      onChange={() => updateRadio('q5', value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="form-section">
              <h2 className="subsection-title">Votre projet</h2>

              <div className="field">
                <span>Dans quelle(s) filière(s) s&apos;inscrit votre projet ? *</span>
                <span className="form-note">Plusieurs sélections possibles pour un projet transversal.</span>
                {[
                  ['fruits', 'Fruits tropicaux'],
                  ['volaille', 'Volaille'],
                  ['pisciculture', 'Pisciculture'],
                  ['lait', 'Lait'],
                  ['mines', 'Mines'],
                  ['transversal', 'Projet transversal (plusieurs filières)'],
                ].map(([value, label]) => (
                  <label key={value} style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={asArray(answers['q6']).includes(value)}
                      onChange={() => updateCheck('q6', value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <div className="field">
                <span>Région(s) d&apos;intervention de votre projet ? * </span>
                {[
                  ['ngozi', 'Ngozi'],
                  ['kayanza', 'Kayanza'],
                  ['muyinga', 'Muyinga'],
                  ['gitega', 'Gitega'],
                  ['ruyigi', 'Ruyigi'],
                  ['autre', 'Autre région'],
                ].map(([value, label]) => (
                  <label key={value} style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={asArray(answers['q7']).includes(value)}
                      onChange={() => updateCheck('q7', value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <div className="field">
                <span>Votre infrastructure bénéficiera-t-elle à plusieurs MPME ? *</span>
                {[
                  ['oui', 'Oui'],
                  ['non', 'Non'],
                  ['enpartie', 'En partie'],
                ].map(([value, label]) => (
                  <label key={value} style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="q8"
                      checked={answers['q8'] === value}
                      onChange={() => updateRadio('q8', value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <div className="field">
                <span>Disposez-vous d&apos;un site disponible ou sécurisé ? *</span>
                {[
                  ['oui', 'Oui'],
                  ['non', 'Non'],
                  ['encours', 'En cours'],
                ].map(([value, label]) => (
                  <label key={value} style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="q9"
                      checked={answers['q9'] === value}
                      onChange={() => updateRadio('q9', value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <div className="field">
                <span>Votre projet intègre-t-il des objectifs d&apos;inclusion sociale ?</span>
                {[
                  ['femmes', 'Emplois ou services pour des femmes'],
                  ['refugies', 'Bénéficiaires réfugiés ou rapatriés'],
                  ['jeunes', 'Emplois pour des jeunes'],
                  ['aucun', 'Aucun objectif d&apos;inclusion spécifique'],
                ].map(([value, label]) => (
                  <label key={value} style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={asArray(answers['q10']).includes(value)}
                      onChange={() => updateCheck('q10', value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="form-actions" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--line)' }}>
            <p className="form-note">Réponses manquantes : {completionText || 'Aucune'}.</p>
            <button className="btn primary" onClick={evaluate}>
              Voir mon résultat →
            </button>
          </div>

          {missing.length > 0 && !result && <p className="submission-message">Répondez à toutes les questions obligatoires avant d&apos;obtenir votre résultat.</p>}
        </div>
      </section>

      {result ? (
        <section id="eligibility-result" className="section section-band">
          <div className="container">
            <article className="result-card">
              <h2>{result.title}</h2>
              <p>{result.description}</p>

              <div style={{ display: 'grid', gap: '0.45rem', marginBottom: '1rem' }}>
                {result.positives.map((line) => (
                  <p key={line}>• {line}</p>
                ))}
                {result.warnings.map((line) => (
                  <p key={line}>• {line}</p>
                ))}
                {result.blockers.map((line) => (
                  <p key={line}>• {line}</p>
                ))}
              </div>

              <div className="result-ctas" style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
                {result.status === 'eligible' && (
                  <Link href="/candidature/deposer" className="btn primary">
                    Créer mon compte et candidater →
                  </Link>
                )}

                {result.status === 'reserve' && (
                  <>
                    <button className="btn secondary" onClick={reset}>
                      Refaire le test
                    </button>
                    <Link href="/candidature" className="btn">
                      Modifier mes réponses
                    </Link>
                  </>
                )}

                {result.status === 'rejected' && (
                  <>
                    <button className="btn secondary" onClick={reset}>
                      Refaire le test
                    </button>
                    <Link href="/candidature/guide-eligibilite" className="btn">
                      Voir les critères complets
                    </Link>
                  </>
                )}
              </div>
            </article>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="container">
          <button className="btn secondary" onClick={reset}>
            ← Recommencer le test
          </button>
        </div>
      </section>
    </main>
  );
}
