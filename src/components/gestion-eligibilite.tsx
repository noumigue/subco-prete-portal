'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import type { GestionContradiction, GestionDossierDetail, PortalDonneesProjet } from '@/lib/portal-types';
import { portalMediaUrl } from '@/lib/portal-media';
import {
  proposerEligibiliteAction,
  renvoyerEligibiliteAction,
  uploadNotificationSigneeAction,
  validerEligibiliteAction,
  verifierEligibiliteAction,
} from '@/app/(gestion)/actions';
import { GestionJournal } from '@/components/gestion-journal';

type Etat = 'conforme' | 'non_conforme';
type Verdict = 'eligible' | 'rejet' | '';

// Blocs de la grille validee par l'UGP le 18/09/2026 (version reduite de l'Annexe 5).
const GROUPES: { cle: 'candidat' | 'infrastructure'; titre: string }[] = [
  { cle: 'candidat', titre: 'Éligibilité du candidat' },
  { cle: 'infrastructure', titre: "Éligibilité de l'infrastructure" },
];

export function GestionEligibilite({
  dossier,
  role,
  currentUserId,
}: {
  dossier: GestionDossierDetail;
  role: 'instructeur' | 'ugp';
  currentUserId: number | null;
}) {
  const router = useRouter();
  const instr = dossier.instructionEligibilite;
  const criteres = dossier.referentiels.criteres;

  const validationMode = role === 'ugp' && instr?.workflow === 'propose';
  const proposedWaiting = role !== 'ugp' && instr?.workflow === 'propose';
  // Meme regle qu'a la completude : hors instructeur en charge (et UGP), consultation seule.
  const lectureSeule = role !== 'ugp' && dossier.prisEnChargePar?.id !== currentUserId;
  const editable = !lectureSeule && !validationMode && !proposedWaiting && dossier.statut?.phase === 'eligibilite';

  const [etats, setEtats] = useState<Record<string, { etat: Etat; justification?: string }>>(() => {
    const init = { ...((instr?.verdictsCriteres as Record<string, { etat: Etat; justification?: string }>) || {}) };
    // Criteres acquis d'office (« Dossier complet ») : toujours conformes, le serveur les force aussi.
    for (const c of criteres) if (c.acquis) init[c.id] = { etat: 'conforme', justification: 'Acquis : complétude validée' };
    return init;
  });

  // Pieces deposees par le candidat (et complements recus), pour verifier les criteres sans
  // repasser par l'ecran de completude.
  const piecesDossier = useMemo(() => {
    const deposees = (dossier.donneesProjet as PortalDonneesProjet | null)?.pieces || [];
    const fichiers = dossier.piecesFichiers || {};
    const libelle = Object.fromEntries(dossier.referentiels.typePieces.map((p) => [p.id, p.libelle]));
    const ordre = dossier.referentiels.typePieces.map((p) => p.id);
    return deposees
      .filter((d) => d.depose && d.fileId)
      .map((d) => ({
        id: d.id,
        libelle: libelle[d.id] || d.nomFichier || 'Pièce déposée',
        nom: fichiers[String(d.fileId)]?.nom || d.nomFichier || 'Fichier',
        url: fichiers[String(d.fileId)]?.url || null,
      }))
      .sort((a, b) => ordre.indexOf(a.id) - ordre.indexOf(b.id));
  }, [dossier.donneesProjet, dossier.piecesFichiers, dossier.referentiels.typePieces]);
  const complementsRecus = (dossier.complements || []).filter((c) => c.statut === 'fourni' && c.fichierUrl);
  const [verdict, setVerdict] = useState<Verdict>(instr?.verdictGlobal || '');
  const [motif, setMotif] = useState(instr?.motifRejet || '');
  const [observations, setObservations] = useState(instr?.observationsUgp || '');
  const [alerte, setAlerte] = useState<GestionContradiction[] | null>(null);
  const contradictions = dossier.contradictionsEligibilite || [];
  const [renvoiOpen, setRenvoiOpen] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const nbNonConforme = Object.values(etats).filter((v) => v?.etat === 'non_conforme').length;

  function setCrit(id: string, etat: Etat) { setAlerte(null); setEtats((p) => ({ ...p, [id]: { etat, justification: p[id]?.justification } })); }
  function setJust(id: string, justification: string) { setAlerte(null); setEtats((p) => ({ ...p, [id]: { etat: p[id]?.etat || 'non_conforme', justification } })); }

  async function onPropose() {
    setError(null);
    // Garde client (C4) : justification obligatoire si non conforme (le serveur revérifie).
    for (const [id, v] of Object.entries(etats)) {
      if (v?.etat === 'non_conforme' && !String(v?.justification || '').trim()) {
        const c = criteres.find((x) => x.id === id);
        setError(`Justification requise pour : ${c?.libelle || 'critère non conforme'}.`);
        return;
      }
    }
    if (!observations.trim()) {
      setError("Les observations à l'attention de l'UGP sont obligatoires (écrivez « RAS » s'il n'y a rien à signaler).");
      return;
    }
    // Verification « a blanc » par le serveur avant d'envoyer (voir la completude).
    setPending(true);
    const check = await verifierEligibiliteAction({
      documentId: dossier.documentId,
      verdictsCriteres: constatsSaisis(),
      verdictGlobal: verdict as 'eligible' | 'rejet',
    });
    if (!check.ok) {
      setPending(false);
      setError(check.error || 'Vérification impossible.');
      return;
    }
    if (check.contradictions.length) {
      setPending(false);
      setAlerte(check.contradictions);
      return;
    }
    await proposer();
  }

  function constatsSaisis() {
    const payload: Record<string, { etat: string; justification?: string }> = {};
    for (const [id, v] of Object.entries(etats)) if (v?.etat) payload[id] = { etat: v.etat, justification: v.justification };
    return payload;
  }

  async function proposer() {
    setError(null);
    setAlerte(null);
    setPending(true);
    const result = await proposerEligibiliteAction({
      documentId: dossier.documentId,
      verdictsCriteres: constatsSaisis(),
      verdictGlobal: verdict as 'eligible' | 'rejet',
      ...(verdict === 'rejet' ? { motifRejet: motif } : {}),
      observationsUgp: observations,
    });
    setPending(false);
    if (result.ok) router.push('/gestion/dossiers?propose=1');
    else setError(result.error || 'Action refusée.');
  }

  async function onValider() {
    setError(null);
    setPending(true);
    let fileId: number | undefined;
    const file = fileRef.current?.files?.[0];
    if (instr?.verdictGlobal === 'rejet' && file) {
      const fd = new FormData();
      fd.append('fichier', file);
      const uploaded = await uploadNotificationSigneeAction(fd);
      fileId = uploaded?.id;
    }
    const result = await validerEligibiliteAction({ documentId: dossier.documentId, notificationDecisionFileId: fileId });
    setPending(false);
    if (result.ok) router.push('/gestion/dossiers?valide=1');
    else setError(result.error || 'Validation refusée.');
  }

  async function onRenvoyer() {
    setError(null);
    setPending(true);
    const result = await renvoyerEligibiliteAction({ documentId: dossier.documentId, commentaire });
    setPending(false);
    if (result.ok) router.push('/gestion/dossiers?renvoye=1');
    else setError(result.error || 'Renvoi refusé.');
  }

  return (
    <>
      <Link className="gx-back" href="/gestion/dossiers">← File des dossiers</Link>
      <div className="gx-dhead">
        <div>
          <h1>{dossier.organisation?.nom} <span className="gx-num" style={{ fontSize: 13 }}>{dossier.numeroDossier}</span></h1>
          <div className="gx-sub">
            Étape : analyse d&apos;éligibilité (8.7) · grille validée par l&apos;UGP (Annexe 5)
            {dossier.pdfPermanentUrl ? (
              <> · <a className="gx-back" style={{ margin: 0 }} href={portalMediaUrl(dossier.pdfPermanentUrl) || '#'} target="_blank" rel="noopener">Consulter le dossier ↗</a></>
            ) : null}
          </div>
        </div>
      </div>

      {error ? <div className="gx-flash err">{error}</div> : null}
      {lectureSeule ? (
        <div className="gx-validation-banner">
          👁 <b>Consultation seule.</b>{' '}
          {dossier.prisEnChargePar ? <>Dossier pris en charge par {dossier.prisEnChargePar.nom} : lui seul peut l&apos;instruire.</> : <>Ce dossier n&apos;est pas pris en charge par vous.</>}
        </div>
      ) : null}
      {proposedWaiting && !lectureSeule ? <div className="gx-validation-banner">⏳ <b>En attente de validation UGP.</b></div> : null}
      {instr?.workflow === 'renvoye' && instr.commentaireRenvoi ? <div className="gx-validation-banner">↩︎ <b>Renvoyé par l&apos;UGP.</b> {instr.commentaireRenvoi}</div> : null}
      {instr?.workflow === 'propose' && contradictions.length ? (
        <div className="gx-flash err">
          ⚖ <b>À arbitrer.</b> Le verdict proposé contredit les constats de l&apos;instructeur :
          <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
            {contradictions.map((c, i) => <li key={i}>{c.message}</li>)}
          </ul>
          Lisez les observations de l&apos;instructeur ci-dessous avant de valider.
        </div>
      ) : null}
      {validationMode ? <div className="gx-validation-banner">⚖️ <b>Mode validation UGP.</b> Verdict proposé par {instr?.proposePar || dossier.prisEnChargePar?.nom}.</div> : null}

      <div className="gx-card">
        <div className="gx-block-title">Pièces du dossier<span className="gx-tot">{piecesDossier.length} déposée(s){complementsRecus.length ? ` · ${complementsRecus.length} complément(s) reçu(s)` : ''}</span></div>
        {piecesDossier.length || complementsRecus.length ? (
          <>
            {piecesDossier.map((p) => (
              <div className="gx-cpl-row" key={p.id}>
                <span className="gx-cpl-piece">{p.libelle}</span>
                {p.url ? (
                  <a className="gx-btn gx-btn-ghost gx-btn-sm" href={portalMediaUrl(p.url) || '#'} target="_blank" rel="noopener noreferrer" title={`Ouvrir « ${p.nom} »`}>⤓ {p.nom}</a>
                ) : <span className="gx-cpl-wait">Fichier indisponible</span>}
              </div>
            ))}
            {complementsRecus.map((c) => (
              <div className="gx-cpl-row" key={c.documentId}>
                <span className="gx-pill gx-pill-ok">{c.origine === 'candidat' ? 'Ajoutée par le candidat' : 'Complément reçu'}</span>
                <span className="gx-cpl-piece">{c.pieceDemandee}</span>
                <a className="gx-btn gx-btn-ghost gx-btn-sm" href={portalMediaUrl(c.fichierUrl) || '#'} target="_blank" rel="noopener noreferrer">⤓ Pièce déposée</a>
              </div>
            ))}
          </>
        ) : <span style={{ fontSize: 12.5, color: 'var(--muted-warm)' }}>Aucune pièce déposée.</span>}
      </div>

      <div className="gx-card">
        <div className="gx-block-title">Critères d&apos;éligibilité<span className="gx-tot">Grille validée par l&apos;UGP le 18/09/2026 — Annexe 5</span></div>
        {GROUPES.map((g) => {
          const liste = criteres.filter((c) => (c.groupe || 'candidat') === g.cle);
          if (!liste.length) return null;
          return (
            <div key={g.cle}>
              <div className="gx-grp-title">{g.titre}</div>
              {liste.map((c, i) => {
                const st = etats[c.id]?.etat;
                const disabled = !editable || Boolean(c.acquis);
                return (
                  <div className="gx-crow" key={c.id}>
                    <div className="gx-cname">{i + 1}. {c.libelle}{c.refManuel ? <span className="gx-ref"> · {c.refManuel}</span> : null}</div>
                    {c.acquis ? (
                      <span className="gx-pill gx-pill-ok" title="La complétude a déjà été validée par l'UGP">✔ Acquis — complétude validée</span>
                    ) : (
                      <span className="gx-biseg">
                        <button type="button" className={st === 'conforme' ? 'c' : ''} disabled={disabled} onClick={() => setCrit(c.id, 'conforme')}>Conforme</button>
                        <button type="button" className={st === 'non_conforme' ? 'n' : ''} disabled={disabled} onClick={() => setCrit(c.id, 'non_conforme')}>Non conforme</button>
                      </span>
                    )}
                    {!c.acquis && st === 'non_conforme' ? (
                      <div className={`gx-pnote${!disabled && !(etats[c.id]?.justification || '').trim() ? ' req' : ''}`}><input type="text" placeholder="Justification (obligatoire)…" value={etats[c.id]?.justification || ''} disabled={disabled} onChange={(e) => setJust(c.id, e.target.value)} /></div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
        <p className="gx-m7-hint">Capacité financière, capacité de gestion, conflit d&apos;intérêt, faisabilité technique, viabilité économique et conformité E&amp;S
          sont examinés lors de l&apos;évaluation technique, pas à cette étape.</p>
      </div>

      {editable ? (
        <div className="gx-card gx-verdict">
          <div className="gx-block-title">Verdict proposé</div>
          <label className={`gx-vopt${verdict === 'eligible' ? ' on' : ''}`}>
            <input type="radio" name="ve" checked={verdict === 'eligible'} onChange={() => { setVerdict('eligible'); setAlerte(null); }} />
            <span><b>Éligible</b> — le dossier passe à l&apos;évaluation technique et financière.</span>
          </label>
          <label className={`gx-vopt${verdict === 'rejet' ? ' on' : ''}`}>
            <input type="radio" name="ve" checked={verdict === 'rejet'} onChange={() => { setVerdict('rejet'); setAlerte(null); }} />
            <span><b>Rejet motivé</b>{nbNonConforme ? ` — ${nbNonConforme} critère(s) non conforme(s)` : ''}.</span>
          </label>
          {verdict === 'rejet' ? (
            <div className="gx-subform"><label>Motif officiel (synthèse)</label><textarea rows={2} placeholder="Motif communiqué au candidat…" value={motif} onChange={(e) => setMotif(e.target.value)} /></div>
          ) : null}
          <div className="gx-subform" style={{ marginLeft: 0, marginTop: 12 }}>
            <label>Observations à l&apos;attention de l&apos;UGP <span style={{ fontWeight: 400, color: 'var(--muted-warm)' }}>(obligatoire — écrivez « RAS » s&apos;il n&apos;y a rien à signaler — non transmises au candidat)</span></label>
            <textarea rows={3} placeholder="Motivez votre choix : critère limite, réserves, éléments qui compensent, points à arbitrer… ou « RAS »." value={observations} onChange={(e) => { setObservations(e.target.value); setAlerte(null); }} />
          </div>
          {alerte ? (
            <div className="gx-flash err" style={{ marginTop: 12 }}>
              ⚖ <b>Votre verdict contredit vos constats.</b>
              <ul style={{ margin: '6px 0 6px 18px', padding: 0 }}>
                {alerte.map((c, i) => <li key={i}>{c.message}</li>)}
              </ul>
              Ce dossier sera signalé à l&apos;UGP comme <b>à arbitrer</b>. Votre observation doit expliquer ce choix.
              <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={pending} onClick={() => setAlerte(null)}>Revenir au dossier</button>
                <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={pending} onClick={proposer}>{pending ? 'Envoi…' : 'Proposer quand même'}</button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              <button type="button" className="gx-btn gx-btn-primary" disabled={!verdict || pending || !observations.trim()} onClick={onPropose}>{pending ? 'Vérification…' : 'Proposer à la validation UGP'}</button>
            </div>
          )}
        </div>
      ) : null}

      {(validationMode || proposedWaiting) && instr ? (
        <div className="gx-card">
          <div className="gx-block-title">Verdict proposé par l&apos;instructeur</div>
          <div className="gx-recap">
            <b>{instr.verdictGlobal === 'eligible' ? 'Éligible — passage à l’évaluation' : 'Rejet motivé'}</b>
            {instr.verdictGlobal === 'rejet' ? <><br />Motif : {instr.motifRejet || '—'}</> : null}
          </div>
          {instr.observationsUgp ? (
            <div className="gx-recap" style={{ marginTop: 10 }}>
              <b>Observations de l&apos;instructeur à l&apos;attention de l&apos;UGP</b>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{instr.observationsUgp}</div>
            </div>
          ) : null}
          {validationMode ? (
            <>
              {instr.verdictGlobal === 'rejet' ? (
                <div style={{ marginTop: 12 }}><label>Notification de décision signée (optionnel)</label><input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.heic,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*" /></div>
              ) : null}
              <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="gx-btn gx-btn-primary" disabled={pending} onClick={onValider}>{pending ? 'Validation…' : 'Valider & notifier'}</button>
                <button type="button" className="gx-btn gx-btn-ghost" disabled={pending} onClick={() => setRenvoiOpen((v) => !v)}>Renvoyer à l&apos;instructeur</button>
              </div>
              {renvoiOpen ? (
                <div className="gx-subform" style={{ marginLeft: 0 }}>
                  <label>Commentaire de renvoi <span style={{ fontWeight: 400, color: 'var(--muted-warm)' }}>(obligatoire — conservé au journal du dossier)</span></label>
                  <textarea rows={2} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Ce qui doit être revu…" />
                  <div style={{ marginTop: 8 }}><button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={pending || !commentaire.trim()} onClick={onRenvoyer}>Confirmer le renvoi</button></div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      <GestionJournal journal={dossier.journal} />

      <p className="gx-annot">
        <b>C4.</b> Verdict <b>binaire par critère</b> (justification obligatoire si non conforme) + verdict global éligible / rejet motivé.
        Pas de boucle de compléments à ce stade (elle vit à la complétude). « Éligible » validé → phase évaluation (grille §6, phase 2 du back-office).
      </p>
    </>
  );
}
