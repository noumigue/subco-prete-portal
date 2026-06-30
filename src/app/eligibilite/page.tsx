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

type QuizOption = {
  value: string;
  label: string;
};

type QuizQuestion = {
  id: string;
  text: string;
  required: boolean;
  hint?: string;
  type: 'radio' | 'checkbox';
  layout: '1' | '2' | '3';
  options: QuizOption[];
  note?: string;
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

const QUESTION_GROUPS = [
  {
    id: 'identity',
    title: 'Votre organisation',
    subtitle: 'Statut juridique, conformité et capacité financière',
    questions: [
      {
        id: 'q1',
        text: 'Statut juridique de votre organisation *',
        required: true,
        type: 'radio',
        layout: '1',
        options: [
          { value: 'societe', label: 'Société (SARL, SA, coopérative d’investissement…)' },
          { value: 'cooperative', label: 'Coopérative agricole ou de services' },
          { value: 'association', label: 'Association professionnelle ou ONG à vocation économique' },
          { value: 'numerique', label: 'Fournisseur de services numériques ou plateforme e-commerce' },
          { value: 'autre', label: 'Autre — mon organisation n’entre dans aucune de ces catégories' },
        ],
      },
      {
        id: 'q2',
        text: 'Votre organisation est-elle légalement enregistrée au Burundi ? *',
        required: true,
        hint: 'NIF (Numéro d’identification fiscale) et RC (Registre de commerce) valides requis.',
        type: 'radio',
        layout: '3',
        options: [
          { value: 'oui', label: 'Oui' },
          { value: 'non', label: 'Non' },
          { value: 'encours', label: "En cours d'enregistrement" },
        ],
      },
      {
        id: 'q3',
        text: 'Votre organisation est-elle en règle vis-à-vis de ses obligations fiscales ? *',
        required: true,
        type: 'radio',
        layout: '3',
        options: [
          { value: 'oui', label: 'Oui' },
          { value: 'non', label: 'Non' },
          { value: 'nesaispas', label: "Je ne sais pas" },
        ],
      },
      {
        id: 'q4',
        text: 'Votre organisation est-elle engagée dans un contentieux majeur en cours ? *',
        required: true,
        hint: 'Un contentieux pouvant compromettre la mise en œuvre du projet.',
        type: 'radio',
        layout: '2',
        options: [
          { value: 'oui', label: 'Oui' },
          { value: 'non', label: 'Non' },
        ],
      },
      {
        id: 'q5',
        text: 'Pouvez-vous mobiliser au minimum 20% du coût total du projet en contrepartie ? *',
        required: true,
        hint: 'La contrepartie peut être numéraire, en nature, équipements ou travaux préparatoires.',
        type: 'radio',
        layout: '3',
        options: [
          { value: 'oui', label: 'Oui' },
          { value: 'non', label: 'Non' },
          { value: 'aevaluer', label: 'À évaluer' },
        ],
      },
    ] as QuizQuestion[],
  },
  {
    id: 'project',
    title: 'Votre projet',
    subtitle: 'Filière, région, usage collectif et impact social',
    questions: [
      {
        id: 'q6',
        text: "Dans quelle(s) filière(s) s'inscrit votre projet ? *",
        required: true,
        hint: 'Plusieurs sélections possibles pour un projet transversal couvrant plusieurs filières.',
        type: 'checkbox',
        layout: '2',
        options: [
          { value: 'fruits', label: 'Fruits tropicaux' },
          { value: 'volaille', label: 'Volaille' },
          { value: 'pisciculture', label: 'Pisciculture' },
          { value: 'lait', label: 'Lait' },
          { value: 'mines', label: 'Mines' },
          { value: 'transversal', label: 'Projet transversal (plusieurs filières)' },
        ],
        note: 'transversal',
      },
      {
        id: 'q7',
        text: 'Région(s) d’intervention de votre projet ? *',
        required: true,
        type: 'checkbox',
        layout: '3',
        options: [
          { value: 'ngozi', label: 'Ngozi' },
          { value: 'kayanza', label: 'Kayanza' },
          { value: 'muyinga', label: 'Muyinga' },
          { value: 'gitega', label: 'Gitega' },
          { value: 'ruyigi', label: 'Ruyigi' },
          { value: 'autre', label: 'Autre région' },
        ],
      },
      {
        id: 'q8',
        text: 'Votre infrastructure bénéficiera-t-elle à plusieurs MPME (usage collectif ou partagé) ? *',
        required: true,
        hint: 'Le programme finance en priorité les infrastructures à usage collectif bénéficiant à plusieurs acteurs économiques.',
        type: 'radio',
        layout: '3',
        options: [
          { value: 'oui', label: 'Oui' },
          { value: 'non', label: 'Non' },
          { value: 'enpartie', label: 'En partie' },
        ],
      },
      {
        id: 'q9',
        text: "Disposez-vous d'un site disponible ou sécurisé pour le projet ? *",
        required: true,
        hint: 'Répondre “En cours” ne bloque pas votre candidature — point à clarifier lors de l’instruction.',
        type: 'radio',
        layout: '3',
        options: [
          { value: 'oui', label: 'Oui' },
          { value: 'non', label: 'Non' },
          { value: 'encours', label: 'En cours' },
        ],
      },
      {
        id: 'q10',
        text: 'Votre projet intègre-t-il des objectifs d’inclusion sociale ?',
        required: false,
        hint: 'Ces éléments pèsent dans la grille de sélection. Ne conditionnent pas l’éligibilité.',
        type: 'checkbox',
        layout: '2',
        options: [
          { value: 'femmes', label: 'Emplois ou services pour des femmes' },
          { value: 'refugies', label: 'Bénéficiaires réfugiés ou rapatriés' },
          { value: 'jeunes', label: 'Emplois pour des jeunes' },
          { value: 'aucun', label: 'Aucun objectif d’inclusion spécifique' },
        ],
      },
    ] as QuizQuestion[],
  },
];

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
    blockers.push('Région d’intervention hors zone du programme (Ngozi, Kayanza, Muyinga, Gitega, Ruyigi)');
  } else {
    positives.push('Région(s) d’intervention éligible(s)');
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
    positives.push('Objectifs d’inclusion sociale identifiés (+points de notation)');
  }

  if (blockers.length > 0) {
    return {
      status: 'rejected',
      title: 'Votre projet n’est pas éligible',
      description:
        blockers.length === 1
          ? 'Une condition rédhibitoire n’est pas remplie. Le dossier sera rejeté à la présélection sans passer à l’évaluation technique.'
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
        'Votre profil correspond globalement aux critères du programme. Certains points nécessitent une clarification avant ou pendant l’instruction du dossier.',
      positives,
      warnings,
      blockers,
    };
  }

  return {
    status: 'eligible',
    title: 'Votre projet semble éligible',
    description:
      'Toutes vos réponses correspondent aux critères du programme SUBCO-PRETE. Vous pouvez créer votre compte et déposer une candidature.',
    positives,
    warnings,
    blockers,
  };
}

function isQuestionComplete(answers: Answers, questionId: string) {
  const value = answers[questionId];
  return Boolean(value) && !(Array.isArray(value) && value.length === 0);
}

export default function EligibilityPage() {
  const [answers, setAnswers] = useState<Answers>({});
  const [missing, setMissing] = useState<string[]>([]);
  const [result, setResult] = useState<EligibilityResult | null>(null);

  const identityComplete = ['q1', 'q2', 'q3', 'q4', 'q5'].every((q) => isQuestionComplete(answers, q));
  const projectComplete = ['q6', 'q7', 'q8', 'q9'].every((q) => isQuestionComplete(answers, q));
  const completionRate = Math.min(
    Object.values(answers).reduce((total, value) => {
      if (!value) {
        return total;
      }

      if (Array.isArray(value)) {
        return total + (value.length > 0 ? 1 : 0);
      }

      return total + 1;
    }, 0),
    9
  );

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

  const completionText = useMemo(
    () => (missingRequired.length === 0 ? '' : missingRequired.map((q) => labelFor(q)).filter(Boolean).join(', ')),
    [missingRequired]
  );

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

  const editAnswers = () => {
    setResult(null);
    setMissing([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen">
      <section className="eligibility-page section section-band" style={{ backgroundColor: '#ffffff' }}>
        <div className="container">
          <p className="eyebrow">Test d&apos;éligibilité</p>
          <h1>Vérifiez si votre projet est éligible</h1>
          <p className="hero-vision" style={{ maxWidth: '62ch' }}>
            Répondez aux 10 questions ci-dessous pour obtenir un résultat immédiat. Aucun compte requis — vos réponses ne sont pas
            enregistrées.
          </p>
          <div className="eligibility-meta">
            <span>3 minutes</span>
            <span>Anonyme — aucune donnée enregistrée</span>
            <span>Disponible sur mobile</span>
          </div>
        </div>
      </section>

      <div className="container eligibility-progress-wrap">
        <p className="section-title" style={{ marginBottom: '0.5rem' }}>
          Progression de votre saisie
        </p>
        <div className="progress-track">
          <div className={`progress-seg ${identityComplete ? 'is-active' : ''}`} />
          <div className={`progress-seg ${projectComplete ? 'is-active' : ''}`} />
        </div>
        <div className="progress-labels">
          <span className={identityComplete ? 'is-active' : ''}>1 — Votre organisation</span>
          <span className={projectComplete ? 'is-active' : ''}>2 — Votre projet</span>
        </div>
        <p className="form-note" style={{ marginTop: '0.65rem' }}>
          Avancement : {completionRate}/9 réponses requises
        </p>
      </div>

      <section id="eligibility-form" className="section">
        <div className="container">
          <div className="eligibility-form-grid">
            {QUESTION_GROUPS.map((group, idx) => {
              const groupComplete = group.id === 'identity' ? identityComplete : projectComplete;

              return (
                <article key={group.id} className="quiz-block">
                  <header className="quiz-block-head">
                    <span className={`quiz-block-num ${groupComplete ? 'is-complete' : ''}`}>{idx + 1}</span>
                    <div>
                      <h2>{group.title}</h2>
                      <p>{group.subtitle}</p>
                    </div>
                  </header>

                  <div className="quiz-block-body">
                    {group.questions.map((question) => {
                      const values = asArray(answers[question.id]);
                      const requiredMissing = missing.includes(question.id);

                      return (
                        <fieldset key={question.id} className={`quiz-field ${requiredMissing ? 'has-missing' : ''}`}>
                          <label className="quiz-label">
                            {question.text}
                            {question.required ? <span className="quiz-required"> * </span> : <span className="quiz-optional">optionnel</span>}
                          </label>
                          {question.hint ? <p className="quiz-hint">{question.hint}</p> : null}
                          {question.id === 'q10' ? <p className="quiz-subhint">+10 points de notation</p> : null}
                          <div className={`quiz-options cols-${question.layout}`}>
                            {question.options.map((option) => {
                              const selected = question.type === 'radio'
                                ? answers[question.id] === option.value
                                : values.includes(option.value);
                              return (
                                <label
                                  key={`${question.id}-${option.value}`}
                                  className={`quiz-option ${selected ? 'is-selected' : ''} ${option.value === 'transversal' || option.value === 'autre' ? 'is-flag' : ''}`}
                                >
                                  <input
                                    type={question.type}
                                    name={question.id}
                                    checked={selected}
                                    onChange={() => {
                                      if (question.type === 'radio') {
                                        updateRadio(question.id, option.value);
                                      } else {
                                        updateCheck(question.id, option.value);
                                      }
                                    }}
                                  />
                                  <span className="quiz-mark" />
                                  <span className="quiz-option-label">{option.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </fieldset>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="submit-row">
            <p className="form-note">Réponses requises restantes : {completionText || 'Aucune'}</p>
            <div className="submit-actions">
              <button className="btn secondary" onClick={reset}>
                Recommencer
              </button>
              <button className="btn primary" onClick={evaluate}>
                Voir mon résultat →
              </button>
            </div>
          </div>

          {missing.length > 0 && !result && (
            <div className="missing-alert">
              Répondez à toutes les questions obligatoires avant d&apos;obtenir votre résultat.
            </div>
          )}
        </div>
      </section>

      {result ? (
        <section id="eligibility-result" className="section">
          <div className="container">
              <article className={`result-card ${result.status}`}>
              <h2>{result.title}</h2>
              <p>{result.description}</p>

              <div className="criteria-list">
                <div className="criteria-block">
                  <p className="criteria-title">Points favorables</p>
                  {result.positives.length === 0 ? (
                    <p className="criteria-line positive">Aucun point bloquant, mais les informations restent à confirmer.</p>
                  ) : (
                    result.positives.map((line) => (
                      <p key={line} className="criteria-line positive">
                        <span className="criteria-badge">Validé</span>
                        <span>{line}</span>
                      </p>
                    ))
                  )}
                </div>

                {result.warnings.length > 0 && (
                  <div className="criteria-block">
                    <p className="criteria-title">Points à confirmer</p>
                    {result.warnings.map((line) => (
                      <p key={line} className="criteria-line warning">
                        <span className="criteria-badge">Avertissement</span>
                        <span>{line}</span>
                      </p>
                    ))}
                  </div>
                )}

                {result.blockers.length > 0 && (
                  <div className="criteria-block">
                    <p className="criteria-title">Conditions rédhibitoires</p>
                    {result.blockers.map((line) => (
                      <p key={line} className="criteria-line blocker">
                        <span className="criteria-badge">Bloquant</span>
                        <span>{line}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="result-ctas">
                <button className="btn secondary" onClick={editAnswers}>
                  Modifier mes réponses
                </button>

                {result.status === 'eligible' && (
                  <Link href="/candidature/deposer" className="btn primary">
                    Créer mon compte et candidater →
                  </Link>
                )}
                {result.status === 'reserve' && (
                  <>
                    <Link href="/candidature" className="btn">
                      Contacter le support
                    </Link>
                  </>
                )}
                {result.status === 'rejected' && (
                  <>
                    <Link href="/candidature" className="btn">
                      Voir les critères complets
                    </Link>
                    <button className="btn secondary" onClick={reset}>
                      Refaire le test
                    </button>
                  </>
                )}
              </div>
            </article>
          </div>
        </section>
      ) : null}

      <style jsx>{`
        .eligibility-meta {
          margin-top: 0.85rem;
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          color: #5f5d5a;
          font-size: 0.85rem;
        }

        .eligibility-progress-wrap {
          margin-top: -1px;
          padding: 1.4rem 0 1.2rem;
        }

        .progress-track {
          display: flex;
          gap: 0.5rem;
        }

        .progress-seg {
          flex: 1;
          height: 5px;
          border-radius: 999px;
          background: #dcdad6;
          transition: background-color 0.2s ease;
        }

        .progress-seg.is-active {
          background: #1b5e3b;
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          color: #7a786f;
          font-size: 0.88rem;
        }

        .progress-labels .is-active {
          color: #1b5e3b;
          font-weight: 600;
        }

        .eligibility-form-grid {
          display: grid;
          gap: 1rem;
        }

        .quiz-block {
          background: #fff;
          border: 1px solid #d9d7d3;
          border-radius: 12px;
          overflow: hidden;
        }

        .quiz-block + .quiz-block {
          margin-top: 1rem;
        }

        .quiz-block-head {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #ece9e4;
          background: #f7f6f3;
        }

        .quiz-block-num {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          border: 1px solid #d8d6d2;
          color: #65635f;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          flex: 0 0 auto;
        }

        .quiz-block-num.is-complete {
          background: #1b5e3b;
          color: #fff;
          border-color: #1b5e3b;
        }

        .quiz-block-head h2 {
          margin: 0 0 0.2rem;
          font-size: 1.05rem;
        }

        .quiz-block-head p {
          margin: 0;
          color: #66635d;
          font-size: 0.85rem;
        }

        .quiz-block-body {
          padding: 1rem;
          display: grid;
          gap: 1rem;
        }

        .quiz-field {
          padding: 0.8rem 0;
          border-bottom: 1px dashed #e1ded9;
        }

        .quiz-field:last-child {
          border-bottom: 0;
        }

        .quiz-label {
          display: inline-flex;
          align-items: baseline;
          gap: 0.25rem;
          margin-bottom: 0.45rem;
          font-weight: 500;
        }

        .quiz-required {
          color: #bc1f22;
          font-size: 0.86rem;
        }

        .quiz-optional {
          color: #7a756d;
          font-size: 0.8rem;
          font-weight: 400;
        }

        .quiz-hint {
          margin: 0 0 0.6rem;
          color: #666;
          font-size: 0.85rem;
        }

        .quiz-subhint {
          margin: -0.2rem 0 0.55rem;
          color: #8f6d2b;
          font-size: 0.8rem;
        }

        .quiz-field.has-missing .quiz-label {
          color: #bc1f22;
        }

        .quiz-options {
          display: grid;
          gap: 0.5rem;
        }

        .cols-1 { grid-template-columns: 1fr; }
        .cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

        .quiz-option {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.62rem 0.7rem;
          border: 1px solid #d7d4cf;
          border-radius: 8px;
          background: #fff;
          min-height: 2.55rem;
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }

        .quiz-option:hover {
          border-color: #4b7b3a;
          background: #edf4ec;
        }

        .quiz-option.is-selected {
          border-color: #1b5e3b;
          background: #e7f2eb;
        }

        .quiz-option input {
          appearance: none;
          width: 16px;
          height: 16px;
          border: 1.5px solid #aba7a0;
          border-radius: 4px;
          flex: 0 0 auto;
        }

        .quiz-option input[type='radio'] {
          border-radius: 999px;
        }

        .quiz-option.is-selected input {
          border-color: #1b5e3b;
          background: #1b5e3b;
        }

        .quiz-option.is-selected input[type='radio'] {
          box-shadow: inset 0 0 0 3px #fff;
        }

        .quiz-option.is-selected input[type='checkbox'] {
          position: relative;
          background: #1b5e3b;
          border-color: #1b5e3b;
        }

        .quiz-option.is-selected input[type='checkbox']::before {
          content: '';
          position: relative;
          left: 3px;
          top: 3px;
          width: 6px;
          height: 10px;
          border-right: 2px solid #fff;
          border-bottom: 2px solid #fff;
          transform: rotate(40deg);
          display: inline-block;
        }

        .quiz-option.is-flag {
          border-style: dashed;
        }

        .quiz-mark {
          display: none;
        }

        .quiz-option-label {
          font-size: 0.93rem;
          line-height: 1.35;
        }

        .submit-row {
          background: #fff;
          border: 1px solid #d9d7d3;
          border-radius: 12px;
          padding: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.8rem;
        }

        .submit-actions {
          display: flex;
          gap: 0.6rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .missing-alert {
          margin-top: 0.7rem;
          border: 1px solid #f1c0c0;
          background: #fff5f5;
          color: #9d2528;
          border-radius: 10px;
          padding: 0.55rem 0.75rem;
          font-size: 0.9rem;
        }

        .result-card {
          border-radius: 12px;
          padding: 1.2rem;
          border: 2px solid #dad8d4;
          background: #fff;
        }

        .result-card.eligible {
          border-color: #95c68a;
          background: #ebf7e7;
        }

        .result-card.reserve {
          border-color: #e8c67f;
          background: #fdf3e3;
        }

        .result-card.rejected {
          border-color: #de9b9b;
          background: #ffecec;
        }

        .result-card h2 {
          margin-top: 0;
          margin-bottom: 0.55rem;
        }

        .result-card p {
          margin: 0 0 0.8rem;
        }

        .criteria-list {
          display: grid;
          gap: 0.55rem;
          margin-bottom: 1rem;
        }

        .criteria-block {
          display: grid;
          gap: 0.45rem;
        }

        .criteria-title {
          margin: 0.2rem 0 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: #3d3b38;
        }

        .criteria-line {
          margin: 0;
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
          padding: 0.45rem 0.55rem;
          border-radius: 7px;
          line-height: 1.35;
        }

        .criteria-line .criteria-badge {
          display: inline-flex;
          flex: 0 0 auto;
          padding: 0.08rem 0.42rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .criteria-line.positive {
          background: #f0f7ef;
          border-left: 3px solid #6aa76a;
          color: #2f5f37;
        }

        .criteria-line.positive .criteria-badge {
          background: #b8dfb5;
          color: #2f5f37;
        }

        .criteria-line.warning {
          background: #fdf2df;
          border-left: 3px solid #d89b2c;
          color: #8c6022;
        }

        .criteria-line.warning .criteria-badge {
          background: #f4d39f;
          color: #7d5a1f;
        }

        .criteria-line.blocker {
          background: #faecec;
          border-left: 3px solid #d46f6f;
          color: #9d3131;
        }

        .criteria-line.blocker .criteria-badge {
          background: #f0b8b8;
          color: #9d3131;
        }

        .result-ctas {
          display: flex;
          gap: 0.65rem;
          flex-wrap: wrap;
        }

        @media (max-width: 820px) {
          .cols-3 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .submit-row {
            display: grid;
            align-items: stretch;
          }

          .submit-actions {
            width: 100%;
          }

          .submit-actions button {
            width: 100%;
          }
        }

        @media (max-width: 560px) {
          .cols-2,
          .cols-3 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
