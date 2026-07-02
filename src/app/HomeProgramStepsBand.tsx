'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ProgramStep } from '@/lib/strapi-public';

type Props = {
  steps: ProgramStep[];
};

type CohortData = {
  key: string;
  label: string;
  steps: ProgramStep[];
  hasActive: boolean;
  allUpcoming: boolean;
};

function cohortRank(value: string) {
  const match = value.match(/cohorte-(\d+)/);
  return match ? Number(match[1]) : 0;
}

function cohortLabel(value: string) {
  const match = value.match(/cohorte-(\d+)/);
  if (!match) return value;
  return match[1] === '1' ? 'Cohorte 1 — Phase pilote' : `Cohorte ${match[1]}`;
}

function orderSteps(a: ProgramStep, b: ProgramStep) {
  return (a.order || 0) - (b.order || 0);
}

function getVisibleWindow(steps: ProgramStep[]) {
  const activeIndex = steps.findIndex((item) => item.status === 'en-cours');
  if (activeIndex < 0) return steps.slice(0, 5);
  const start = Math.max(0, Math.min(activeIndex - 2, Math.max(steps.length - 5, 0)));
  return steps.slice(start, start + 5);
}

function getProgressPercent(steps: ProgramStep[]) {
  if (steps.length <= 1) return 0;
  const doneCount = steps.filter((item) => item.status === 'termine').length;
  return (doneCount / (steps.length - 1)) * 100;
}

function stepStatusClass(status?: ProgramStep['status']) {
  if (status === 'termine') return 'done';
  if (status === 'en-cours') return 'active';
  return 'upcoming';
}

function stepStatusLabel(status?: ProgramStep['status']) {
  if (status === 'termine') return 'Terminé';
  if (status === 'en-cours') return 'En cours';
  return 'À venir';
}

function StepDot({ status }: { status?: ProgramStep['status'] }) {
  if (status === 'termine') {
    return (
      <span className="program-steps-dot done" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }

  if (status === 'en-cours') {
    return <span className="program-steps-dot active" aria-hidden="true" />;
  }

  return <span className="program-steps-dot upcoming" aria-hidden="true" />;
}

export default function HomeProgramStepsBand({ steps }: Props) {
  const cohorts = useMemo<CohortData[]>(() => {
    const grouped = new Map<string, ProgramStep[]>();

    for (const item of steps) {
      if (!item.cohort) continue;
      const bucket = grouped.get(item.cohort) || [];
      bucket.push(item);
      grouped.set(item.cohort, bucket);
    }

    return [...grouped.entries()]
      .sort((a, b) => cohortRank(a[0]) - cohortRank(b[0]))
      .map(([key, items]) => {
        const sorted = [...items].sort(orderSteps);
        return {
          key,
          label: cohortLabel(key),
          steps: sorted,
          hasActive: sorted.some((item) => item.status === 'en-cours'),
          allUpcoming: sorted.every((item) => item.status === 'a-venir'),
        };
      });
  }, [steps]);

  const defaultCohortKey = useMemo(() => {
    if (!cohorts.length) return null;
    const active = cohorts.find((item) => item.hasActive);
    if (active) return active.key;
    return [...cohorts].sort((a, b) => cohortRank(b.key) - cohortRank(a.key))[0]?.key || cohorts[0].key;
  }, [cohorts]);

  const [activeCohortKey, setActiveCohortKey] = useState<string | null>(defaultCohortKey);
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    setActiveCohortKey(defaultCohortKey);
  }, [defaultCohortKey]);

  const activeCohort = cohorts.find((item) => item.key === activeCohortKey) || cohorts[0] || null;
  const visibleSteps = activeCohort ? getVisibleWindow(activeCohort.steps) : [];
  const progressPercent = activeCohort ? getProgressPercent(activeCohort.steps) : 0;
  const doneCount = activeCohort ? activeCohort.steps.filter((item) => item.status === 'termine').length : 0;

  useEffect(() => {
    setProgressWidth(0);
    const handle = requestAnimationFrame(() => {
      requestAnimationFrame(() => setProgressWidth(progressPercent));
    });
    return () => cancelAnimationFrame(handle);
  }, [progressPercent, activeCohortKey]);

  if (!activeCohort) return null;

  return (
    <section className="section section-band band-program-steps">
      <div className="container">
        <div className="program-steps-shell">
          <div className="program-steps-header">
            <div>
              <p className="program-steps-eyebrow">Calendrier du programme</p>
              <h2 className="program-steps-title">Prochaines étapes</h2>
            </div>
            <div className="program-steps-tabs" role="tablist" aria-label="Choix de cohorte">
              {cohorts.map((cohort) => (
                <button
                  key={cohort.key}
                  type="button"
                  role="tab"
                  aria-selected={cohort.key === activeCohort.key}
                  className={`program-steps-tab${cohort.key === activeCohort.key ? ' is-active' : ''}`}
                  onClick={() => setActiveCohortKey(cohort.key)}
                >
                  <span>{cohort.label}</span>
                  {!cohort.hasActive && cohort.allUpcoming ? <small>bientôt</small> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="program-steps-timeline">
            <div className="program-steps-line" aria-hidden="true" />
            <div className="program-steps-progress" aria-hidden="true" style={{ width: `${progressWidth}%` }} />

            <div className="program-steps-grid">
              {visibleSteps.map((step, index) => {
                const statusClass = stepStatusClass(step.status);
                const showLink = Boolean(step.linkUrl) && step.status !== 'a-venir';

                return (
                  <article
                    key={`${activeCohort.key}-${step.id}`}
                    className={`program-step program-step-${statusClass}${index === 0 || index === visibleSteps.length - 1 ? ' program-step-edge' : ''}`}
                  >
                    <StepDot status={step.status} />
                    <h3 className={`program-step-name ${statusClass}`}>{step.title || 'Étape'}</h3>
                    <p className="program-step-date">{step.displayDate || 'Date à confirmer'}</p>
                    <span className={`program-step-badge ${statusClass}`}>
                      {step.status === 'en-cours' ? <span className="program-step-badge-dot" aria-hidden="true" /> : null}
                      {stepStatusLabel(step.status)}
                    </span>
                    {showLink ? (
                      <Link href={step.linkUrl || '#'} className="program-step-link">
                        {step.linkLabel || 'Voir le détail →'}
                      </Link>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>

          <div className="program-steps-footer">
            <p>{doneCount} / {activeCohort.steps.length} étapes complétées — {activeCohort.label}</p>
            <Link href="/actualites">Voir le calendrier complet →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
