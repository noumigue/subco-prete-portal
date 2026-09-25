'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { GestionBaremeCritere, GestionFicheDetail } from '@/lib/portal-types';
import { portalMediaUrl } from '@/lib/portal-media';
import { GestionPiecesDossier } from '@/components/gestion-pieces-dossier';
import { GestionPiecesAssistance } from '@/components/gestion-pieces-assistance';
import { declarerCoiAction, enregistrerFicheAction, recuserAction, soumettreFicheAction } from '@/app/(gestion)/actions';

type Notes = Record<string, { note: string; commentaire: string }>;
type Bonus = Record<string, string>;

function bandeFor(total: number, bandes: { min: number; label: string }[]) {
  const sorted = [...bandes].sort((a, b) => b.min - a.min);
  for (const b of sorted) if (total >= b.min) return b.label;
  return sorted[sorted.length - 1]?.label || '';
}
// Sous le seuil hors bonus, la bande basse s'impose quel que soit le bonus.
function bandeSelonRegle(totalHorsBonus: number, totalFinal: number, bandes: { min: number; label: string }[]) {
  if (totalHorsBonus < 60) return [...bandes].sort((a, b) => a.min - b.min)[0]?.label || 'Non retenu';
  return bandeFor(totalFinal, bandes);
}
// Regle de classement (Coordination, 25/09) : sous 60 hors bonus, le projet est non retenu et
// le bonus est ignore ; a partir de 60, la bande se lit sur le total bonus inclus.
function bandClasse(totalHorsBonus: number, totalFinal: number) {
  if (totalHorsBonus < 60) return 'gx-band-d';
  if (totalFinal >= 80) return 'gx-band-a';
  if (totalFinal >= 70) return 'gx-band-b';
  return 'gx-band-c';
}


export function GestionFiche({ detail }: { detail: GestionFicheDetail }) {
  const router = useRouter();
  const { bareme, parametres } = detail;
  const notesCriteres = useMemo(() => [...bareme.blocA.filter((c) => c.type === 'note'), ...bareme.blocB], [bareme]);

  const retire = !!detail.retire;
  const readonly = detail.fiche?.statut === 'soumise' || retire;
  const coiNeeded = !readonly && !detail.fiche?.coiDeclare;
  // Dossier renvoye a l'eligibilite : la fiche reste consultable, rien n'est modifiable.

  const [notes, setNotes] = useState<Notes>(() => {
    const init: Notes = {};
    for (const [code, v] of Object.entries(detail.fiche?.notes || {})) init[code] = { note: String(v.note ?? ''), commentaire: v.commentaire || '' };
    return init;
  });
  const [bonus, setBonus] = useState<Bonus>(() => {
    const init: Bonus = {};
    for (const [code, v] of Object.entries(detail.fiche?.bonus || {})) init[code] = String(v ?? '');
    return init;
  });
  const [esConforme, setEsConforme] = useState<boolean | null>(detail.fiche?.esConforme ?? null);
  const [forcesTxt, setForcesTxt] = useState((detail.fiche?.forces || []).join('\n'));
  const [faiblessesTxt, setFaiblessesTxt] = useState((detail.fiche?.faiblesses || []).join('\n'));
  const lignes = (t: string) => t.split('\n').map((l) => l.trim()).filter(Boolean);
  const [sign, setSign] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coiChecked, setCoiChecked] = useState(false);

  const sumBloc = (list: GestionBaremeCritere[]) => list.reduce((s, c) => s + (Number(notes[c.code]?.note) || 0), 0);
  const totA = sumBloc(bareme.blocA.filter((c) => c.type === 'note'));
  const totB = sumBloc(bareme.blocB);
  const totBonus = Math.min(10, bareme.bonus.reduce((s, c) => s + (Number(bonus[c.code]) || 0), 0));
  const base = totA + totB;
  const final = Math.min(100, base) + totBonus;

  // Porte E&S differee (decision UGP 21/09) : pas de verdict E&S a l'evaluation.
  const porteDifferee = !!parametres.porteEsDifferee;
  const esKo = !porteDifferee && esConforme === false;
  const notationComplete = notesCriteres.every((c) => {
    const n = notes[c.code]?.note;
    return n !== undefined && n !== '' && (notes[c.code]?.commentaire || '').trim() !== '';
  });
  // 6.3.3 : au moins une force et une faiblesse, matière du rapport d'évaluation.
  const analyseComplete = lignes(forcesTxt).length > 0 && lignes(faiblessesTxt).length > 0;
  const canSubmit = (porteDifferee || esConforme !== null) && (esKo || (notationComplete && analyseComplete && sign));

  function payload() {
    const outNotes: Record<string, { note: number; commentaire: string }> = {};
    for (const c of notesCriteres) {
      const v = notes[c.code];
      if (v?.note !== undefined && v.note !== '') outNotes[c.code] = { note: Number(v.note), commentaire: v.commentaire || '' };
    }
    const outBonus: Record<string, number> = {};
    for (const c of bareme.bonus) if (bonus[c.code] !== undefined && bonus[c.code] !== '') outBonus[c.code] = Number(bonus[c.code]);
    return { esConforme: porteDifferee ? null : esConforme, notes: outNotes, bonus: outBonus, forces: lignes(forcesTxt), faiblesses: lignes(faiblessesTxt) };
  }

  async function onConfirmCoi() {
    setPending(true); setError(null);
    const r = await declarerCoiAction(detail.documentId);
    setPending(false);
    if (r.ok) router.refresh();
    else setError(r.error || 'Action refusée.');
  }
  async function onRecuser() {
    setPending(true); setError(null);
    const r = await recuserAction(detail.documentId);
    setPending(false);
    if (r.ok) router.push('/gestion/evaluations?recuse=1');
    else setError(r.error || 'Action refusée.');
  }
  async function onSaveDraft() {
    setPending(true); setError(null);
    const r = await enregistrerFicheAction(detail.documentId, payload());
    setPending(false);
    setError(r.ok ? null : (r.error || 'Enregistrement refusé.'));
    if (r.ok) router.refresh();
  }
  async function onSubmit() {
    setPending(true); setError(null);
    const r = await soumettreFicheAction(detail.documentId, payload());
    setPending(false);
    if (r.ok) router.push('/gestion/evaluations?soumis=1');
    else setError(r.error || 'Soumission refusée.');
  }

  const setNote = (code: string, note: string) => setNotes((p) => ({ ...p, [code]: { note, commentaire: p[code]?.commentaire || '' } }));
  const setCmt = (code: string, commentaire: string) => setNotes((p) => ({ ...p, [code]: { note: p[code]?.note || '', commentaire } }));

  // Rendu d'une ligne de critere. Appele comme une FONCTION, surtout pas comme un composant
  // (<CritLine />) : un composant declare dans le rendu est recree a chaque frappe, React
  // demonte alors toutes les lignes — le champ perdait le focus apres un caractere et la page
  // sautait en haut du bloc (signale le 22/09).
  function critLine(c: GestionBaremeCritere) {
    const val = notes[c.code]?.note ?? '';
    const cmt = notes[c.code]?.commentaire ?? '';
    const need = val !== '' && cmt.trim() === '';
    return (
      <div className="gx-crit" key={c.code}>
        <div className="gx-ch">
          <div><div className="gx-cn">{c.code}. {c.libelle}</div><div className="gx-cd">{c.description}</div></div>
          <div className="gx-noteinput">
            <input type="number" min={0} max={c.points} step={1} value={val} disabled={readonly}
              onChange={(e) => setNote(c.code, e.target.value === '' ? '' : String(Math.max(0, Math.min(c.points, Number(e.target.value)))))} />
            <span className="gx-max">/ {c.points}</span>
          </div>
        </div>
        <div className={`gx-cmt${need ? ' req' : ''}`}>
          <div className="gx-cmt-lbl">Commentaire {need ? <b>— obligatoire dès qu&apos;une note est saisie</b> : '(justification)'}</div>
          <textarea rows={2} value={cmt} disabled={readonly} placeholder="Justifiez votre note…" onChange={(e) => setCmt(c.code, e.target.value)} />
        </div>
      </div>
    );
  }

  return (
    <>
      <Link className="gx-back" href="/gestion/evaluations">← Mes évaluations</Link>
      <div className="gx-dhead">
        <h1>Fiche de scoring — {detail.organisation?.nom} <span className="gx-num" style={{ fontSize: 13 }}>{detail.numeroDossier}</span></h1>
        <div className="gx-sub">
          Évaluateur {detail.rang} · grille Annexe 6
          {detail.pdfPermanentUrl ? <> · <a className="gx-back" style={{ margin: 0 }} href={portalMediaUrl(detail.pdfPermanentUrl) || '#'} target="_blank" rel="noopener">Consulter le formulaire (PDF) ↗</a></> : null}
        </div>
      </div>

      {error ? <div className="gx-flash err">{error}</div> : null}

      {/* Pieces du dossier : transmises par le serveur seulement apres la declaration d'absence de conflit d'interets. */}
      {!coiNeeded ? <GestionPiecesDossier donnees={detail.piecesDossier} /> : null}
      {!coiNeeded ? (
        <GestionPiecesAssistance documentId={detail.documentId} pieces={detail.piecesAssistance || []} />
      ) : null}

      {coiNeeded ? (
        <>
          <div className="gx-coi">
            <h3>⚠ Déclaration d&apos;absence de conflit d&apos;intérêts (§5.8.1)</h3>
            <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 'auto', marginTop: 3 }} checked={coiChecked} onChange={(e) => setCoiChecked(e.target.checked)} />
              Je déclare n&apos;avoir aucun lien d&apos;intérêt avec ce candidat ni son projet, et m&apos;engage à une évaluation impartiale. À défaut, je dois me récuser.
            </label>
            <div style={{ marginTop: 11, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={!coiChecked || pending} onClick={onConfirmCoi}>Confirmer</button>
              <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={pending} onClick={onRecuser}>Me récuser</button>
            </div>
          </div>
          <p className="gx-annot">La fiche s&apos;ouvre après la déclaration. La récusation renvoie le dossier à l&apos;UGP pour réassignation (E2).</p>
        </>
      ) : (
        <>
          {/* Porte E&S */}
          {porteDifferee ? (
            <div className="gx-es">
              <div className="gx-esh">Conformité environnementale et sociale (A6) : non évaluée à ce stade</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted-warm)' }}>Décision UGP : la conformité E&amp;S sera vérifiée avant le comité. Notez le projet sur les blocs A et B.</div>
            </div>
          ) : (
          <div className={`gx-es${esKo ? ' ko' : ''}`}>
            <div className="gx-esh">Porte préalable — Conformité environnementale et sociale (A6, éliminatoire · §6.2.1)</div>
            {detail.bareme.porteEs?.description ? <div className="gx-cd" style={{ marginBottom: 6 }}>À vérifier : {detail.bareme.porteEs.description}</div> : null}
            <div style={{ fontSize: 12.5, color: 'var(--muted-warm)', marginBottom: 9 }}>La conformité E&S est une condition préalable, non un critère noté. Un projet non conforme est écarté avant notation.</div>
            {detail.arbitrageEs === 'conforme' ? (
              <div className="gx-flash" style={{ marginBottom: 9 }}>L&apos;UGP a arbitré la porte E&S : <b>projet conforme</b>. Merci de le noter critère par critère.{detail.arbitrageEsMotif ? <> Motif : « {detail.arbitrageEsMotif} »</> : null}</div>
            ) : null}
            <span className="gx-biseg">
              <button type="button" className={esConforme === true ? 'c' : ''} disabled={readonly} onClick={() => setEsConforme(true)}>Conforme → admis à la notation</button>
              <button type="button" className={esConforme === false ? 'n' : ''} disabled={readonly || detail.arbitrageEs === 'conforme'} onClick={() => setEsConforme(false)}>Non conforme → écarté</button>
            </span>
            {esKo ? <div style={{ marginTop: 10, fontWeight: 600, color: 'var(--gx-red-tx)' }}>Projet écarté du processus de sélection. La notation ne s&apos;applique pas.</div> : null}
          </div>
          )}

          {!esKo ? (
            <>
              <div className="gx-card"><div className="gx-block-title">Bloc A — Infrastructure <span className="gx-tot">Total A : {totA} / 60</span></div>
                {bareme.blocA.filter((c) => c.type === 'note').map((c) => critLine(c))}</div>
              <div className="gx-card"><div className="gx-block-title">Bloc B — Candidat <span className="gx-tot">Total B : {totB} / 40</span></div>
                {bareme.blocB.map((c) => critLine(c))}</div>
              <div className="gx-card"><div className="gx-block-title">Forces et faiblesses du dossier</div>
                <p style={{ fontSize: 12.5, color: 'var(--muted-warm)', margin: '0 0 10px' }}>Une idée par ligne. Au moins une force et une faiblesse : elles alimentent le rapport d&apos;évaluation (Manuel §6.3.3).</p>
                <div className="gx-inline2">
                  <div>
                    <div className="gx-cmt-lbl">Forces</div>
                    <textarea rows={4} value={forcesTxt} disabled={readonly} placeholder="Ex. : débouchés confirmés par des contrats" onChange={(e) => setForcesTxt(e.target.value)} />
                  </div>
                  <div>
                    <div className="gx-cmt-lbl">Faiblesses</div>
                    <textarea rows={4} value={faiblessesTxt} disabled={readonly} placeholder="Ex. : titre d'occupation du site non fourni" onChange={(e) => setFaiblessesTxt(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="gx-card"><div className="gx-block-title">Bonus d&apos;inclusion (plafond +10) <span className="gx-tot">Bonus : {totBonus} / 10</span></div>
                {bareme.bonus.map((c) => (
                  <div className="gx-crit" key={c.code}>
                    <div className="gx-ch">
                      <div><div className="gx-cn">{c.libelle}</div><div className="gx-cd">{c.description}</div></div>
                      <div className="gx-noteinput">
                        <input type="number" min={0} max={c.points} step={1} value={bonus[c.code] ?? ''} disabled={readonly}
                          onChange={(e) => setBonus((p) => ({ ...p, [c.code]: e.target.value === '' ? '' : String(Math.max(0, Math.min(c.points, Number(e.target.value)))) }))} />
                        <span className="gx-max">/ {c.points}</span>
                      </div>
                    </div>
                  </div>
                ))}</div>

              <div className="gx-totbar">
                <span>Total hors bonus <span className="gx-big">{base}</span>/100</span>
                <span>+ bonus <b>{totBonus}</b></span>
                <span>= Total final <span className="gx-big">{final}</span>/100</span>
                <span className={`gx-band ${bandClasse(base, final)}`}>{bandeSelonRegle(base, final, parametres.bandes)}</span>
                <span style={{ fontSize: 12, color: 'var(--muted-warm)' }}>Sous 60 hors bonus, le bonus ne rattrape rien ; au-delà, la bande se lit bonus inclus.</span>
              </div>
            </>
          ) : null}

          {readonly ? (
            <div className="gx-signbox">✓ Fiche soumise et signée{detail.fiche?.signeLe ? ` le ${new Date(detail.fiche.signeLe).toLocaleDateString('fr-FR')}` : ''} — validation nominative horodatée. En lecture seule.</div>
          ) : (
            <div className="gx-signbox">
              {!esKo ? (
                <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: 'auto', marginTop: 3 }} checked={sign} onChange={(e) => setSign(e.target.checked)} />
                  Je certifie l&apos;exactitude de mes appréciations et je signe cette fiche de scoring.
                </label>
              ) : null}
              <div style={{ marginTop: 11, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {!esKo ? <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={pending} onClick={onSaveDraft}>Enregistrer le brouillon</button> : null}
                <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={!canSubmit || pending} onClick={onSubmit}>
                  {esKo ? 'Soumettre (projet écarté E&S)' : (pending ? 'Envoi…' : 'Soumettre & signer')}
                </button>
              </div>
            </div>
          )}

          <p className="gx-annot">
            <b>Fiche Annexe 6.</b> Notes bornées au barème (référentiel E1) ; <b>commentaire obligatoire dès qu&apos;une note est saisie</b> (6.3.1) ;
            totaux et bande 6.2.1.1 calculés en direct ; « Soumettre &amp; signer » = validation nominative horodatée. E&S = porte éliminatoire avant notation.
            Vous ne verrez jamais la fiche de l&apos;autre évaluateur avant double soumission (E3).
          </p>
        </>
      )}
    </>
  );
}
