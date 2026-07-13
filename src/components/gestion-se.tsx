'use client';

import { Fragment, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type {
  GestionSeTableauDeBord, GestionSeIndicateur, GestionSeDepouillement, GestionSeRapport, GestionSeCohorte, GestionSeDepouillementValeurs,
} from '@/lib/portal-types';
import { portalMediaUrl } from '@/lib/portal-media';
import {
  seDepouillementProposerAction, seDepouillementValiderAction, seDepouillementRenvoyerAction, seGenererRapportAction,
} from '@/app/(gestion)/actions';

type Tab = 'tdb' | 'ind' | 'dep' | 'rap';
const TABS: [Tab, string][] = [['tdb', 'Tableau de bord'], ['ind', 'Indicateurs'], ['dep', 'Dépouillement des rapports'], ['rap', 'Rapports de synthèse']];

function money(n: number) { return `${(n || 0).toLocaleString('fr-FR')} $`; }
function dlv(x: number | null) { return x != null ? `${String(x).replace('.', ',')} j` : 'n/d'; }

export function GestionSe({
  role, cohortes, cohorte, tab: initialTab, tableauDeBord, indicateurs, depouillements, rapports,
}: {
  role: 'ugp' | 'cabinet';
  cohortes: GestionSeCohorte[];
  cohorte: string;
  tab: string;
  tableauDeBord: GestionSeTableauDeBord | null;
  indicateurs: GestionSeIndicateur[];
  depouillements: GestionSeDepouillement[];
  rapports: GestionSeRapport[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>((['tdb', 'ind', 'dep', 'rap'].includes(initialTab) ? initialTab : 'tdb') as Tab);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const notify = (m: string) => { setToast(m); window.setTimeout(() => setToast(null), 3400); };
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => {
    setBusy(true);
    startTransition(async () => {
      let r: { ok: boolean; error?: string };
      try { r = await fn(); } catch { r = { ok: false, error: 'Connexion interrompue — rechargez la page.' }; }
      setBusy(false);
      notify(r.ok ? okMsg : (r.error || 'L’action a échoué.'));
    });
  };
  const setCohorte = (v: string) => router.push(`/gestion/se?tab=${tab}&cohorte=${encodeURIComponent(v)}`);

  return (
    <div className="gx">
      <h1 className="gx-page-title">Suivi-évaluation</h1>
      <p className="gx-page-sub">
        Pilotage du mécanisme (§14) — la plateforme est la source ; le Cabinet collecte et analyse, l&apos;UGP valide et transmet,
        la Banque mondiale revoit (14.6).
      </p>

      <div className="gx-subtabs">
        {TABS.map(([k, l]) => (
          <button key={k} type="button" className={`gx-subtab${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'tdb' ? <TableauDeBord data={tableauDeBord} cohortes={cohortes} cohorte={cohorte} setCohorte={setCohorte} /> : null}
      {tab === 'ind' ? <Indicateurs rows={indicateurs} cohortes={cohortes} cohorte={cohorte} setCohorte={setCohorte} /> : null}
      {tab === 'dep' ? <Depouillement rows={depouillements} role={role} busy={busy} run={run} /> : null}
      {tab === 'rap' ? <Rapports rows={rapports} role={role} cohortes={cohortes} cohorte={cohorte} busy={busy} run={run} /> : null}

      {toast ? <div className="gx-toast show">{toast}</div> : null}
    </div>
  );
}

function CohorteFilter({ cohortes, cohorte, setCohorte }: { cohortes: GestionSeCohorte[]; cohorte: string; setCohorte: (v: string) => void }) {
  return (
    <div className="gx-se-filters">
      <span>Cohorte</span>
      <select value={cohorte} onChange={(e) => setCohorte(e.target.value)} style={{ width: 'auto' }}>
        {cohortes.map((c) => <option key={c.documentId} value={c.documentId}>{c.label}</option>)}
      </select>
    </div>
  );
}

function TableauDeBord({ data, cohortes, cohorte, setCohorte }: { data: GestionSeTableauDeBord | null; cohortes: GestionSeCohorte[]; cohorte: string; setCohorte: (v: string) => void }) {
  if (!data) return <div className="gx-empty">Données indisponibles.</div>;
  const max = data.entonnoir[0]?.v || 1;
  return (
    <>
      <CohorteFilter cohortes={cohortes} cohorte={cohorte} setCohorte={setCohorte} />

      <div className="gx-card">
        <div className="gx-block-title">Entonnoir de l&apos;appel à propositions <span className="gx-se-r">calculé en direct</span></div>
        <div className="gx-fun">
          {data.entonnoir.map((e) => (
            <div className="gx-frow" key={e.label}>
              <span className="gx-fl">{e.label}</span>
              <span className="gx-fbar"><span style={{ width: `${Math.round((e.v / max) * 100)}%` }} /></span>
              <span className="gx-fv">{e.v}</span>
              <span className="gx-fp">{Math.round((e.v / max) * 100)} %</span>
            </div>
          ))}
        </div>
      </div>

      <div className="gx-card">
        <div className="gx-block-title">Exécution financière</div>
        <div className="gx-tiles">
          <div className="gx-tile"><div className="gx-tl">Engagé (conventions)</div><div className="gx-tv">{money(data.execution.engage)}</div><div className="gx-ts">subventions signées</div></div>
          <div className="gx-tile"><div className="gx-tl">Décaissé</div><div className="gx-tv">{money(data.execution.decaisse)}</div><div className="gx-ts">{data.execution.engage ? Math.round((data.execution.decaisse / data.execution.engage) * 100) : 0} % de l&apos;engagé</div></div>
          <div className="gx-tile"><div className="gx-tl">Justifié</div><div className="gx-tv">{money(data.execution.justifie)}</div><div className="gx-ts">avances validées (11.4)</div></div>
        </div>
      </div>

      <div className="gx-card">
        <div className="gx-block-title">Délais moyens par étape <span className="gx-se-r">calculés du journal des actes (8.1.1)</span></div>
        <div className="gx-dlgrid">
          {[['Complétude', data.delais.completude], ['Éligibilité', data.delais.eligibilite], ['Évaluation', data.delais.evaluation], ['Paiement', data.delais.paiement]].map(([n, v]) => (
            <div className="gx-dl" key={n as string}><div className="gx-dv">{dlv(v as number | null)}</div><div className="gx-dl-n">{n as string}</div></div>
          ))}
        </div>
      </div>

      <div className="gx-card">
        <div className="gx-block-title">⚠ Alertes opérationnelles <span className="gx-se-r">{data.alertes.length} en cours</span></div>
        {data.alertes.length === 0 ? (
          <div style={{ fontSize: 13.5, color: 'var(--muted-warm)' }}>Aucune alerte en cours.</div>
        ) : (
          data.alertes.map((a, i) => (
            <div className="gx-alr" key={i}>
              <span className="gx-ai">{a.icon}</span>
              <span className="gx-at"><span className="gx-al-n">{a.titre}</span><span className="gx-am">{a.detail}</span></span>
              <Link className="gx-btn gx-btn-ghost gx-btn-sm" href={a.lien}>Ouvrir</Link>
            </div>
          ))
        )}
      </div>

      <p className="gx-annot">
        <b>K2</b> — tableau de bord de pilotage (14.7) : entonnoir, exécution, <b>délais calculés du journal</b> et
        <b> alertes</b> (compléments échus, avances non justifiées 11.4, rapports échus, mesures ouvertes, jalons dépassés).
      </p>
    </>
  );
}

function Indicateurs({ rows, cohortes, cohorte, setCohorte }: { rows: GestionSeIndicateur[]; cohortes: GestionSeCohorte[]; cohorte: string; setCohorte: (v: string) => void }) {
  const exportCsv = () => {
    const head = ['Indicateur', 'Famille', 'Mode', 'Valeur', 'Cible'];
    const lines = rows.map((r) => [r.libelle, r.familleLibelle, r.mode, r.valeur, r.cible].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','));
    const csv = [head.join(','), ...lines].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'indicateurs-se.csv'; a.click();
    URL.revokeObjectURL(url);
  };
  // Regroupement par famille en conservant l'ordre.
  const familles: { libelle: string; rows: GestionSeIndicateur[] }[] = [];
  for (const r of rows) {
    let f = familles.find((x) => x.libelle === r.familleLibelle);
    if (!f) { f = { libelle: r.familleLibelle, rows: [] }; familles.push(f); }
    f.rows.push(r);
  }
  return (
    <>
      <CohorteFilter cohortes={cohortes} cohorte={cohorte} setCohorte={setCohorte} />
      <div className="gx-card">
        <div className="gx-tbl-wrap">
          <table className="gx-itbl">
            <thead><tr><th>Indicateur</th><th>Mode</th><th style={{ textAlign: 'right' }}>Valeur</th><th style={{ textAlign: 'right' }}>Cible</th><th style={{ textAlign: 'right' }}>Écart</th></tr></thead>
            <tbody>
              {familles.map((f) => (
                <Fragment key={f.libelle}>
                  <tr><td colSpan={5} className="gx-fam">{f.libelle}</td></tr>
                  {f.rows.map((r) => (
                    <tr key={r.code}>
                      <td>{r.libelle}</td>
                      <td><span className={`gx-mtag ${r.mode}`}>{r.mode === 'calcule' ? 'calculé' : 'saisi'}</span></td>
                      <td className="gx-n">{r.valeur}</td>
                      <td className="gx-c">{r.cible}</td>
                      <td className="gx-c">{r.ecart === 'ok' ? <span className="gx-ecart-ok">✓</span> : r.ecart === 'ko' ? <span className="gx-ecart-ko">▼</span> : '—'}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="gx-actions"><button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" onClick={exportCsv}>⤓ Export CSV</button></div>
      </div>
      <p className="gx-annot">
        <b>K3</b> — chaque indicateur vit en <b>référentiel</b> (famille 14.3, mode <b>calculé</b>/<b>saisi</b>, cible éditable au CMS).
        Les « calculés » sortent des données de la plateforme ; les « saisis » viennent du dépouillement validé (K1) ou de sources externes (plaintes = MGP, K5).
      </p>
    </>
  );
}

const CHAMPS: [keyof GestionSeDepouillementValeurs, string][] = [
  ['empT', 'Emplois créés (total)'], ['empF', 'dont femmes'], ['empJ', 'dont jeunes'], ['empR', 'dont réfugiés'],
  ['benef', 'Bénéficiaires touchés'], ['inv', 'Investissements réalisés ($)'], ['incidents', 'Incidents E&S (nb)'],
];

function StatutPill({ statut }: { statut: GestionSeDepouillement['statut'] }) {
  if (statut === 'valide') return <span className="gx-pill gx-pill-ok">✓ Validé — intégré aux indicateurs</span>;
  if (statut === 'propose') return <span className="gx-pill gx-pill-comp">Proposé — à valider (UGP)</span>;
  return <span className="gx-pill gx-pill-val">À dépouiller</span>;
}

function DepRow({ d, role, busy, run }: { d: GestionSeDepouillement; role: 'ugp' | 'cabinet'; busy: boolean; run: (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => void }) {
  const [v, setV] = useState<GestionSeDepouillementValeurs>(d.valeurs);
  const editable = role === 'cabinet' && d.statut === 'a_depouiller';
  const validating = role === 'ugp' && d.statut === 'propose';
  const readonly = !editable;
  return (
    <div className="gx-drow2">
      <div className="gx-drow2-top">
        <span className="gx-dn2">{d.titre}</span>
        <span className="gx-dm2">{d.convention || ''}{d.dateTransmission ? ` · reçu le ${d.dateTransmission.slice(0, 10).split('-').reverse().join('/')}` : ''}{d.saisiPar ? ` · dépouillé par ${d.saisiPar}` : ''}</span>
        <StatutPill statut={d.statut} />
        {d.fichierUrl ? <a className="gx-btn gx-btn-ghost gx-btn-sm" href={portalMediaUrl(d.fichierUrl) || '#'} target="_blank" rel="noreferrer">⤓ Rapport</a> : null}
      </div>

      {d.statut !== 'a_depouiller' || editable ? (
        <div className="gx-dgrid">
          {CHAMPS.map(([k, label]) => (
            <div key={k}><label className="gx-label">{label}</label>
              <input type="number" min={0} value={v[k]} disabled={readonly} onChange={(e) => setV({ ...v, [k]: Math.max(0, parseInt(e.target.value, 10) || 0) })} />
            </div>
          ))}
          <div className="gx-wide"><label className="gx-label">Note (incidents, difficultés, mesures)</label>
            <textarea rows={2} value={v.note} disabled={readonly} onChange={(e) => setV({ ...v, note: e.target.value })} />
          </div>
        </div>
      ) : null}

      {editable ? (
        <div className="gx-actions">
          <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={busy}
            onClick={() => run(() => seDepouillementProposerAction(d.documentId, v as unknown as Record<string, unknown>), 'Dépouillement proposé à la validation UGP')}>
            Proposer à la validation UGP
          </button>
        </div>
      ) : null}
      {validating ? (
        <div className="gx-actions">
          <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={busy}
            onClick={() => run(() => seDepouillementValiderAction(d.documentId), 'Validé — les valeurs alimentent les indicateurs')}>
            Valider — intégrer aux indicateurs
          </button>
          <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy}
            onClick={() => run(() => seDepouillementRenvoyerAction(d.documentId), 'Renvoyé au Cabinet')}>
            Renvoyer au Cabinet
          </button>
        </div>
      ) : null}
      {role === 'ugp' && d.statut === 'a_depouiller' ? (
        <div style={{ fontSize: 12.5, color: 'var(--muted-warm)', marginTop: 8 }}>En attente du dépouillement par le Cabinet.</div>
      ) : null}
    </div>
  );
}

function Depouillement({ rows, role, busy, run }: { rows: GestionSeDepouillement[]; role: 'ugp' | 'cabinet'; busy: boolean; run: (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => void }) {
  return (
    <>
      <p style={{ fontSize: 13, color: 'var(--muted-warm)', margin: '-6px 0 14px' }}>
        Grille structurée saisie à réception de chaque rapport bénéficiaire — <b>le Cabinet saisit, l&apos;UGP valide</b> (14.6).
        Seules les valeurs <b>validées</b> alimentent les indicateurs.
      </p>
      {rows.length === 0 ? <div className="gx-empty">Aucun rapport transmis à dépouiller.</div> : rows.map((d) => <DepRow key={d.documentId} d={d} role={role} busy={busy} run={run} />)}
      <p className="gx-annot">
        <b>K1</b> — la grille comble le trou entre les indicateurs exigés (emplois, bénéficiaires, incidents — 14.6) et les
        rapports PDF non structurés. Circuit proposer → valider ; traçable (14.11).
      </p>
    </>
  );
}

function Rapports({ rows, role, cohortes, cohorte, busy, run }: { rows: GestionSeRapport[]; role: 'ugp' | 'cabinet'; cohortes: GestionSeCohorte[]; cohorte: string; busy: boolean; run: (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => void }) {
  const [periode, setPeriode] = useState('T3 2026 (trimestriel)');
  const [coh, setCoh] = useState(cohorte);
  const cohorteLabel = cohortes.find((c) => c.documentId === coh)?.label || 'Toutes les cohortes';
  return (
    <>
      <div className="gx-card">
        <div className="gx-block-title">Générer un rapport de synthèse</div>
        <div className="gx-grid2">
          <div>
            <label className="gx-label">Période</label>
            <select value={periode} onChange={(e) => setPeriode(e.target.value)}>
              <option>Septembre 2026 (mensuel)</option>
              <option>T3 2026 (trimestriel)</option>
              <option>S2 2026 (semestriel)</option>
              <option>Année 2026 (annuel)</option>
            </select>
          </div>
          <div>
            <label className="gx-label">Cohorte</label>
            <select value={coh} onChange={(e) => setCoh(e.target.value)}>
              {cohortes.map((c) => <option key={c.documentId} value={c.documentId}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--muted-warm)', margin: '10px 0 0' }}>
          Contenu : tableau de bord (entonnoir, exécution, délais, alertes) + indicateurs des 5 familles avec écarts.
          Cadences 14.5 : technique mensuel · financier trimestriel (IFR) · impact semestriel · global annuel.
        </p>
        <div className="gx-actions">
          {role === 'ugp' ? (
            <button type="button" className="gx-btn gx-btn-primary" disabled={busy}
              onClick={() => run(() => seGenererRapportAction({ periode: periode.split(' (')[0], cohorteLabel, cohorte: coh }), 'Rapport de synthèse généré (PDF) — archivé')}>
              Générer le rapport (PDF)
            </button>
          ) : (
            <span style={{ fontSize: 12.5, color: 'var(--muted-warm)', alignSelf: 'center' }}>Génération réservée à l&apos;UGP (validation &amp; transmission — 14.6).</span>
          )}
        </div>
      </div>

      <div className="gx-card">
        <div className="gx-block-title">Rapports générés</div>
        {rows.length === 0 ? (
          <span style={{ fontSize: 13, color: 'var(--muted-warm)' }}>Aucun rapport généré pour l&apos;instant.</span>
        ) : (
          rows.map((r) => (
            <div className="gx-genline" key={r.documentId}>
              📄 <b>{r.periode}</b>
              {r.generePar ? <span style={{ color: 'var(--muted-warm)', fontSize: 12.5 }}>· {r.generePar}</span> : null}
              {r.pdf?.url ? <a className="gx-btn gx-btn-ghost gx-btn-sm" style={{ marginLeft: 'auto' }} href={portalMediaUrl(r.pdf.url) || '#'} target="_blank" rel="noreferrer">⤓ Aperçu</a> : null}
            </div>
          ))
        )}
        <p style={{ fontSize: 12, color: 'var(--muted-warm)', margin: '12px 0 0' }}>
          Transmission à la Banque mondiale <b>hors plateforme</b> (canaux officiels). La plateforme génère et archive.
        </p>
      </div>

      <p className="gx-annot">
        <b>K4</b> — rapport pré-généré à la demande. <b>K5</b> — le MGP (§13) reste hors plateforme ; ses canaux sont affichés
        côté opérateur dans « FAQ &amp; documents » (contenu CMS), et l&apos;indicateur « plaintes » est saisi (source externe).
      </p>
    </>
  );
}
