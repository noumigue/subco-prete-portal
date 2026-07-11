'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { GestionDossierRow } from '@/lib/portal-types';
import { priseEnChargeAction, reassignerAction } from '@/app/(gestion)/actions';

type Tab = 'recu' | 'completude' | 'eligibilite' | 'evaluation' | 'clos';

const TABS: [Tab, string][] = [
  ['recu', 'Reçus'],
  ['completude', 'Complétude'],
  ['eligibilite', 'Éligibilité'],
  ['evaluation', 'Évaluation'],
  ['clos', 'Clos'],
];

function tabOf(d: GestionDossierRow): Tab {
  const g = d.statut?.groupe;
  if (g === 'non_retenu' || g === 'selectionne') return 'clos';
  const p = d.statut?.phase;
  if (p === 'completude') return 'completude';
  if (p === 'eligibilite') return 'eligibilite';
  if (p === 'evaluation') return 'evaluation';
  return 'recu';
}

function Pill({ d }: { d: GestionDossierRow }) {
  if (tabOf(d) === 'clos') return <span className="gx-pill gx-pill-rej">{d.statutClos || 'Clos'}</span>;
  if (d.enValidation) return <span className="gx-pill gx-pill-val">⏳ À valider (UGP)</span>;
  if (d.complementEnCours) return <span className="gx-pill gx-pill-comp">Compléments demandés</span>;
  return null;
}

export function GestionFile({
  dossiers,
  role,
  flash,
  flashError,
}: {
  dossiers: GestionDossierRow[];
  role: 'instructeur' | 'ugp';
  flash: string | null;
  flashError: string | null;
}) {
  const [tab, setTab] = useState<Tab>('completude');
  const [onlyMine, setOnlyMine] = useState(false);

  const counts: Record<Tab, number> = { recu: 0, completude: 0, eligibilite: 0, evaluation: 0, clos: 0 };
  dossiers.forEach((d) => { counts[tabOf(d)] += 1; });

  let items = dossiers.filter((d) => tabOf(d) === tab);
  if (role === 'ugp' && onlyMine) items = items.filter((d) => d.enValidation);

  return (
    <>
      <h1 className="gx-page-title">File des dossiers</h1>
      <p className="gx-page-sub">Instruction des candidatures — appel : Cohorte 1.</p>
      {flash ? <div className="gx-flash">{flash}</div> : null}
      {flashError ? <div className="gx-flash err">{flashError}</div> : null}

      <div className="gx-filters">
        <span>Appel</span>
        <select defaultValue="C1"><option value="C1">Cohorte 1</option><option value="all">Tous</option></select>
        {role === 'ugp' ? (
          <label className="gx-chk">
            <input type="checkbox" style={{ width: 'auto' }} checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
            En attente de ma validation
          </label>
        ) : null}
      </div>

      <div className="gx-tabs">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" className={`gx-tab${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>
            {label} <span className="gx-n">{counts[k]}</span>
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="gx-empty">Aucun dossier à cette étape.</div>
      ) : (
        items.map((d) => {
          const phase = tabOf(d);
          const instructionPath = phase === 'eligibilite' ? 'eligibilite' : 'completude';
          const canInstruire = phase === 'completude' || phase === 'eligibilite';
          return (
            <div className="gx-drow" key={d.documentId}>
              <div className="gx-main">
                <div className="gx-num">{d.numeroDossier}</div>
                <div className="gx-who">{d.organisation?.nom}</div>
                <div className="gx-meta">
                  {d.organisation?.filiere ? <span>{d.organisation.filiere}</span> : null}
                  {d.dateDepot ? <span>déposé le {new Date(d.dateDepot).toLocaleDateString('fr-FR')}</span> : null}
                  {d.prisEnChargePar ? <span>pris en charge : <b>{d.prisEnChargePar.nom}</b></span> : null}
                </div>
              </div>
              <Pill d={d} />
              <div className="gx-actions">
                {phase === 'recu' && role === 'instructeur' ? (
                  <form action={priseEnChargeAction}>
                    <input type="hidden" name="documentId" value={d.documentId} />
                    <button type="submit" className="gx-btn gx-btn-primary gx-btn-sm">Prendre en charge</button>
                  </form>
                ) : null}
                {phase === 'recu' && role === 'ugp' ? <span className="gx-pill gx-pill-comp">Non pris en charge</span> : null}

                {canInstruire && !d.prisEnChargePar && role === 'instructeur' ? (
                  <form action={priseEnChargeAction}>
                    <input type="hidden" name="documentId" value={d.documentId} />
                    <button type="submit" className="gx-btn gx-btn-primary gx-btn-sm">Prendre en charge</button>
                  </form>
                ) : null}
                {canInstruire && (d.prisEnChargePar || role === 'ugp') ? (
                  <>
                    {role === 'ugp' && d.prisEnChargePar ? (
                      <form action={reassignerAction}>
                        <input type="hidden" name="documentId" value={d.documentId} />
                        <button type="submit" className="gx-btn gx-btn-ghost gx-btn-sm" title="Réassigner">↺</button>
                      </form>
                    ) : null}
                    <Link
                      className={`gx-btn gx-btn-sm ${d.enValidation && role === 'ugp' ? 'gx-btn-gold' : 'gx-btn-ghost'}`}
                      href={`/gestion/dossiers/${d.documentId}/${instructionPath}`}
                    >
                      {d.enValidation && role === 'ugp' ? 'Examiner & valider' : 'Instruire'}
                    </Link>
                  </>
                ) : null}

                {phase === 'evaluation' ? <span className="gx-pill gx-pill-comp">Évaluation · phase 2</span> : null}
                {phase === 'clos' ? (
                  <Link className="gx-btn gx-btn-ghost gx-btn-sm" href={`/gestion/dossiers/${d.documentId}/completude`}>Consulter</Link>
                ) : null}
              </div>
            </div>
          );
        })
      )}

      <p className="gx-annot">
        <b>C1 — pool + prise en charge nominative</b> (réassignation UGP via ↺). Les onglets suivent les étapes 8.5→8.10 ;
        « Évaluation » et « Comité » arrivent en phase 2. La vue UGP ajoute le filtre « en attente de ma validation »
        (§4.2 : le Cabinet instruit, l&apos;UGP valide).
      </p>
    </>
  );
}
