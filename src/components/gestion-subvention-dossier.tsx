'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type {
  GestionSubventionDetail,
  GestionSubCondition,
  GestionDemande,
  GestionJalon,
  GestionMesure,
} from '@/lib/portal-types';
import {
  conditionAvisTechniqueAction,
  conditionValiderAction,
  conditionActionRequiseAction,
  signerConventionAction,
  decaissementAvisTechniqueAction,
  decaissementAvisFiduciaireAction,
  validerJustificationAction,
  demanderComplementJustifAction,
  jalonDateReelleAction,
  mesureEmettreAction,
  mesureValiderAction,
  suspendreSubventionAction,
  leverSubventionAction,
  uploadFileAction,
} from '@/app/(gestion)/actions';

type Role = 'ugp' | 'cabinet';
type AvisTech = 'favorable' | 'reserve' | 'defavorable';

// Liste large (mêmes formats que le reste du back-office) : sur Mac, un accept
// limité au seul PDF grise toutes les autres pièces dans le sélecteur de fichiers.
const ACCEPT_DOCS = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.heic,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*';

function fmtMontant(v: string | null) {
  if (!v) return '—';
  try { return Number(BigInt(v)).toLocaleString('fr-FR'); } catch { return v; }
}
function fmtDate(v: string | null) {
  if (!v) return '—';
  const d = v.slice(0, 10).split('-');
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : v;
}

function StatutChip({ statut }: { statut: GestionSubventionDetail['statut'] }) {
  if (statut === 'preparation') return <span className="gx-statuschip gx-sc-prep">Préparation</span>;
  if (statut === 'active') return <span className="gx-statuschip gx-sc-active">Active</span>;
  if (statut === 'suspendue') return <span className="gx-statuschip gx-sc-susp">Suspendue</span>;
  return <span className="gx-statuschip">Close</span>;
}

export function GestionSubventionDossier({ detail, role }: { detail: GestionSubventionDetail; role: Role }) {
  const [subview, setSubview] = useState<'exec' | 'jalons' | 'mesures'>('exec');
  const [toast, setToast] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const notify = (m: string) => { setToast(m); window.setTimeout(() => setToast(null), 3200); };

  // Enveloppe commune : lance l'action serveur, affiche le résultat. revalidatePath rafraîchit les données.
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => {
    setBusy(true);
    startTransition(async () => {
      let r: { ok: boolean; error?: string };
      try {
        r = await fn();
      } catch {
        r = { ok: false, error: 'Connexion interrompue — rechargez la page et réessayez.' };
      }
      setBusy(false);
      notify(r.ok ? okMsg : (r.error || 'L’action a échoué.'));
    });
  };

  const isUgp = role === 'ugp';

  return (
    <div className="gx">
      <Link className="gx-back" href="/gestion/subventions">← Subventions</Link>
      <div className="gx-shead">
        <h1>{detail.op} <StatutChip statut={detail.statut} /></h1>
        <div className="gx-shead-sub">
          {detail.numeroConvention || '— convention en préparation'} · {detail.proj} · subvention {fmtMontant(detail.montantSubvention)} $ / total {fmtMontant(detail.montantTotal)} $
        </div>
      </div>

      {detail.statut === 'preparation' ? (
        <PreparationView detail={detail} isUgp={isUgp} run={run} busy={busy} notify={notify} />
      ) : (
        <>
          <div className="gx-subtabs">
            {([['exec', 'Décaissements'], ['jalons', 'Suivi du projet'], ['mesures', 'Mesures correctives']] as const).map(([k, l]) => (
              <button key={k} type="button" className={`gx-subtab${subview === k ? ' on' : ''}`} onClick={() => setSubview(k)}>{l}</button>
            ))}
          </div>
          {subview === 'exec' && <ExecView detail={detail} isUgp={isUgp} run={run} busy={busy} notify={notify} />}
          {subview === 'jalons' && <JalonsView detail={detail} isUgp={isUgp} run={run} busy={busy} />}
          {subview === 'mesures' && <MesuresView detail={detail} isUgp={isUgp} run={run} busy={busy} />}
        </>
      )}

      {toast ? <div className="gx-toast show">{toast}</div> : null}
    </div>
  );
}

type ViewProps = {
  detail: GestionSubventionDetail;
  isUgp: boolean;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => void;
  busy: boolean;
  notify: (m: string) => void;
};

/* ---------- PRÉPARATION (G1/G2) ---------- */
function CondStateChip({ statut }: { statut: GestionSubCondition['statut'] }) {
  if (statut === 'validee') return <span className="gx-cstate gx-cs-val">✓ Validée</span>;
  if (statut === 'action_requise') return <span className="gx-cstate gx-cs-action">Action requise (bénéficiaire)</span>;
  return <span className="gx-cstate gx-cs-cours">En cours (UGP)</span>;
}

function ConditionRow({ subId, c, isUgp, run, busy }: { subId: string; c: GestionSubCondition; isUgp: boolean; run: ViewProps['run']; busy: boolean }) {
  const [avis, setAvis] = useState<AvisTech | null>((c.avisTechnique as AvisTech) || null);
  const [comm, setComm] = useState('');
  const notValidated = c.statut !== 'validee';

  return (
    <div className="gx-cond">
      <div className="gx-cond-main">
        <div className="gx-cond-n">{c.libelle}</div>
        {c.echeance ? <div className="gx-cond-t">Échéance : {fmtDate(c.echeance)}</div> : null}

        {c.technique ? (
          !isUgp && notValidated ? (
            <div className="gx-avis-tech">
              <b>Avis technique (Cabinet)</b> — {c.avisTechnique ? <>déposé : <b>{c.avisTechnique}</b></> : 'à déposer'}
              <span className="gx-triseg" style={{ marginLeft: 8 }}>
                <button type="button" className={avis === 'favorable' ? 'ok' : ''} onClick={() => setAvis('favorable')}>Favorable</button>
                <button type="button" className={avis === 'reserve' ? 'res' : ''} onClick={() => setAvis('reserve')}>Réserve</button>
                <button type="button" className={avis === 'defavorable' ? 'ko' : ''} onClick={() => setAvis('defavorable')}>Défavorable</button>
              </span>
              <textarea rows={2} className="gx-input" style={{ marginTop: 6 }} placeholder="Commentaire technique…" value={comm} onChange={(e) => setComm(e.target.value)} />
              <div className="gx-actions">
                <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={busy || !avis}
                  onClick={() => avis && run(() => conditionAvisTechniqueAction(subId, c.documentId, avis, comm), 'Avis technique déposé — l’UGP entérine par validation')}>
                  Transmettre l’avis
                </button>
              </div>
            </div>
          ) : c.avisTechnique ? (
            <div className="gx-avis-tech">
              <b>Avis technique (Cabinet)</b> : {c.avisTechnique}
              {notValidated && isUgp ? ' — à entériner par validation' : ''}
              {c.avisTechniqueCommentaire ? <div style={{ marginTop: 4 }}>{c.avisTechniqueCommentaire}</div> : null}
            </div>
          ) : (
            <div className="gx-avis-tech">Condition technique — avis du Cabinet en attente</div>
          )
        ) : null}

        {isUgp && notValidated ? (
          <div className="gx-actions" style={{ marginTop: 6 }}>
            <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={busy}
              onClick={() => run(() => conditionValiderAction(subId, c.documentId), 'Condition validée')}>Valider</button>
            {c.statut !== 'action_requise' ? (
              <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy}
                onClick={() => run(() => conditionActionRequiseAction(subId, c.documentId), 'Action demandée au bénéficiaire')}>
                Demander une action au bénéficiaire
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <CondStateChip statut={c.statut} />
    </div>
  );
}

function PreparationView({ detail, isUgp, run, busy, notify }: ViewProps) {
  const allVal = detail.conditions.length > 0 && detail.conditions.every((c) => c.statut === 'validee');
  const [dateSign, setDateSign] = useState('');
  const [pdf, setPdf] = useState<{ id: number; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const onPdf = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append('fichier', file);
    let up: { id: number; name: string } | null = null;
    try { up = await uploadFileAction(fd); } catch { up = null; }
    setUploading(false);
    if (up) { setPdf(up); notify(`PDF joint : ${up.name}`); } else notify('Échec du téléversement — rechargez la page et réessayez.');
  };

  return (
    <>
      <div className="gx-card">
        <div className="gx-block-title">Conditions préalables à la signature (§8.12)</div>
        {detail.conditions.length === 0 ? (
          <div className="gx-empty">Aucune condition préalable enregistrée.</div>
        ) : (
          detail.conditions.map((c) => (
            <ConditionRow key={c.documentId} subId={detail.documentId} c={c} isUgp={isUgp} run={run} busy={busy} />
          ))
        )}
      </div>

      {isUgp ? (
        <div className={`gx-signbar${allVal ? ' ready' : ''}`}>
          <h3>{allVal ? '✓ Toutes les conditions sont levées — la convention peut être signée' : 'Signature de la convention'}</h3>
          <div style={{ fontSize: 12.5, color: 'var(--muted-warm)' }}>
            L’accompagnement post-sélection est obligatoire avant signature (§8.12). Réserves non levées dans les délais → réexaminer / suspendre / retirer.
          </div>
          {allVal ? (
            <>
              <div className="gx-signform">
                <div>
                  <label className="gx-label">N° de convention</label>
                  <input type="text" className="gx-input" defaultValue={detail.numeroConvention || ''} placeholder="PRETE-CV-…" id="numConv" />
                </div>
                <div>
                  <label className="gx-label">Date de signature</label>
                  <input type="date" className="gx-input" value={dateSign} onChange={(e) => setDateSign(e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="gx-label">Convention signée (PDF)</label>
                  <label className="gx-btn gx-btn-ghost gx-btn-sm" style={{ cursor: 'pointer' }}>
                    📎 {pdf ? pdf.name : (uploading ? 'Téléversement…' : 'Joindre le PDF signé')}
                    <input type="file" accept={ACCEPT_DOCS} hidden onChange={(e) => onPdf(e.target.files?.[0])} />
                  </label>
                </div>
              </div>
              <div className="gx-actions">
                <button type="button" className="gx-btn gx-btn-primary" disabled={busy || uploading}
                  onClick={() => {
                    const num = (document.getElementById('numConv') as HTMLInputElement | null)?.value?.trim() || undefined;
                    run(() => signerConventionAction(detail.documentId, {
                      numeroConvention: num,
                      dateSignature: dateSign || undefined,
                      pdfConventionFileId: pdf?.id,
                    }), 'Convention enregistrée — subvention ACTIVE, le candidat devient bénéficiaire');
                  }}>
                  Enregistrer la convention signée → activer
                </button>
              </div>
            </>
          ) : (
            <div className="gx-actions">
              <button type="button" className="gx-btn gx-btn-primary" disabled>Enregistrer la convention signée</button>
            </div>
          )}
        </div>
      ) : null}

      <p className="gx-annot">
        <b>G1</b> — le Cabinet dépose un <b>avis technique</b> (optionnel, sur les conditions techniques : site, E&S, plan d’affaires) ;
        l’<b>UGP valide</b> chaque condition. <b>G2</b> — signature possible uniquement quand <b>toutes</b> les conditions sont
        validées → subvention active + bascule candidat→bénéficiaire.
      </p>
    </>
  );
}

/* ---------- EXÉCUTION / DÉCAISSEMENTS (G3/G4) ---------- */
const STEPS: [string, string][] = [
  ['soumise', 'Soumise'],
  ['avis_technique', 'Avis technique (Cabinet)'],
  ['avis_fiduciaire', 'Avis fiduciaire (UGP)'],
  ['payee', 'Paiement'],
];
function stepIndex(code: string | null) {
  return { soumise: 0, avis_technique: 1, avis_fiduciaire: 2, payee: 3 }[code || ''] ?? -1;
}

function DemandeRow({ subId, d, isUgp, run, busy, notify }: { subId: string; d: GestionDemande; isUgp: boolean; run: ViewProps['run']; busy: boolean; notify: (m: string) => void }) {
  const [avisTech, setAvisTech] = useState<AvisTech | null>(null);
  const [techComm, setTechComm] = useState('');
  const [fidDecision, setFidDecision] = useState<'approuve' | 'retour' | 'rejete' | null>(null);
  const [fidComm, setFidComm] = useState('');
  const [acd, setAcd] = useState<{ id: number; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const ci = stepIndex(d.statut);
  const rejete = d.statut === 'rejetee';
  const retour = d.statut === 'complements_requis';

  const onAcd = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append('fichier', file);
    let up: { id: number; name: string } | null = null;
    try { up = await uploadFileAction(fd); } catch { up = null; }
    setUploading(false);
    if (up) { setAcd(up); notify(`ACD jointe : ${up.name}`); } else notify('Échec du téléversement — rechargez la page et réessayez.');
  };

  return (
    <div className="gx-decrow">
      <div className="gx-decrow-top">
        <span className="gx-dnum">Demande N°{String(d.numero).padStart(2, '0')}</span>
        <span className="gx-dmeta">{d.modalite || d.objet || 'Décaissement'} · {fmtMontant(d.montant)} $</span>
      </div>

      <div className="gx-circuit">
        {rejete ? (
          <span className="gx-cstep ko">✗ Rejetée</span>
        ) : retour ? (
          <span className="gx-cstep ko">↩ Retournée pour correction</span>
        ) : (
          STEPS.map(([code, label], i) => (
            <span key={code} className={`gx-cstep${i < ci ? ' done' : i === ci ? ' cur' : ''}`}>
              {i < ci ? '✓ ' : ''}{label}
              {i < STEPS.length - 1 ? <span className="gx-carrow"> → </span> : null}
            </span>
          ))
        )}
      </div>

      {d.pieces.length ? (
        <div className="gx-pieces-list">
          Pièces : {d.pieces.map((p, i) => (
            p.url ? <a key={i} className="gx-pc" href={p.url} target="_blank" rel="noreferrer">📎 {p.name || 'pièce'}</a>
              : <span key={i} className="gx-pc">📎 {p.name || 'pièce'}</span>
          ))}
        </div>
      ) : null}

      {/* Avis technique — Cabinet (dès la soumission : l'API accepte soumise + avis_technique) */}
      {d.statut === 'soumise' || d.statut === 'avis_technique' ? (
        !isUgp ? (
          <div className="gx-avis-form">
            <div className="gx-block-title" style={{ marginBottom: 8 }}>Avis technique (Cabinet) — §11.4</div>
            <div className="gx-row3">Avis :
              <span className="gx-triseg">
                <button type="button" className={avisTech === 'favorable' ? 'ok' : ''} onClick={() => setAvisTech('favorable')}>Favorable</button>
                <button type="button" className={avisTech === 'reserve' ? 'res' : ''} onClick={() => setAvisTech('reserve')}>Favorable avec réserve</button>
                <button type="button" className={avisTech === 'defavorable' ? 'ko' : ''} onClick={() => setAvisTech('defavorable')}>Défavorable</button>
              </span>
            </div>
            <textarea rows={2} className="gx-input" placeholder="Commentaire technique…" value={techComm} onChange={(e) => setTechComm(e.target.value)} />
            <div className="gx-actions">
              <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={busy || !avisTech}
                onClick={() => avisTech && run(() => decaissementAvisTechniqueAction(subId, d.documentId, avisTech, techComm), 'Avis technique transmis — au tour du contrôle fiduciaire UGP')}>
                Transmettre l’avis à l’UGP
              </button>
            </div>
          </div>
        ) : (
          <div className="gx-avis-form" style={{ color: 'var(--muted-warm)', fontSize: 13 }}>En attente de l’avis technique du Cabinet avant contrôle fiduciaire.</div>
        )
      ) : null}

      {/* Avis fiduciaire — UGP */}
      {d.statut === 'avis_fiduciaire' && isUgp ? (
        <div className="gx-avis-form">
          <div className="gx-block-title" style={{ marginBottom: 8 }}>Avis fiduciaire (UGP) — contrôle &amp; validation des dépenses</div>
          {d.avisTechniqueCommentaire ? <div className="gx-avis-tech"><b>Avis technique reçu</b> ({d.avisTechnique}) : {d.avisTechniqueCommentaire}</div> : null}
          <div className="gx-acd-note">⚠ ACD (Attestation de Conformité préalable au Décaissement) — <b>établie par l’UGP</b>, jointe à l’instruction. Jamais produite par le bénéficiaire.</div>
          <label className="gx-btn gx-btn-ghost gx-btn-sm" style={{ cursor: 'pointer', marginBottom: 8 }}>
            📎 {acd ? acd.name : (uploading ? 'Téléversement…' : 'Joindre l’ACD (PDF)')}
            <input type="file" accept={ACCEPT_DOCS} hidden onChange={(e) => onAcd(e.target.files?.[0])} />
          </label>
          <div className="gx-row3">Décision :
            <span className="gx-triseg">
              <button type="button" className={fidDecision === 'approuve' ? 'ok' : ''} onClick={() => setFidDecision('approuve')}>Approuver → paiement</button>
              <button type="button" className={fidDecision === 'retour' ? 'res' : ''} onClick={() => setFidDecision('retour')}>Retourner</button>
              <button type="button" className={fidDecision === 'rejete' ? 'ko' : ''} onClick={() => setFidDecision('rejete')}>Rejeter</button>
            </span>
          </div>
          <textarea rows={2} className="gx-input" placeholder="Commentaire / motif (obligatoire si retour ou rejet)…" value={fidComm} onChange={(e) => setFidComm(e.target.value)} />
          <div className="gx-actions">
            <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={busy || uploading || !fidDecision || ((fidDecision === 'retour' || fidDecision === 'rejete') && !fidComm.trim())}
              onClick={() => fidDecision && run(() => decaissementAvisFiduciaireAction(subId, d.documentId, { decision: fidDecision, commentaire: fidComm || undefined, acdFileId: acd?.id }),
                fidDecision === 'approuve' ? 'Décision enregistrée — paiement direct au fournisseur (§8.14)' : 'Décision enregistrée')}>
              Enregistrer la décision
            </button>
          </div>
        </div>
      ) : null}

      {/* Justification d'avance (G4 / 11.4) */}
      {d.aJustifier ? (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--line-warm)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <b style={{ fontSize: 13 }}>Justification de l’avance (11.4)</b>
            {d.justificationStatut === 'validee' ? <span className="gx-pill gx-pill-ok">✓ Justification validée</span>
              : d.justificationStatut === 'soumise' ? <span className="gx-pill gx-pill-just">Justification à vérifier</span>
              : <span className="gx-pill gx-pill-just">Avance à justifier</span>}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted-warm)', margin: '5px 0' }}>
            Aucun nouveau décaissement possible pour ce bénéficiaire tant que cette avance n’est pas entièrement justifiée, vérifiée et validée par l’UGP.
          </div>
          {d.justificationPieces?.length ? (
            <div className="gx-pieces-list">Pièces de justification : {d.justificationPieces.map((p, i) => (
              p.url ? <a key={i} className="gx-pc" href={p.url} target="_blank" rel="noreferrer">📎 {p.name || 'pièce'}</a> : <span key={i} className="gx-pc">📎 {p.name || 'pièce'}</span>
            ))}</div>
          ) : null}
          {isUgp && d.justificationStatut === 'soumise' ? (
            <div className="gx-actions">
              <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={busy}
                onClick={() => run(() => validerJustificationAction(subId, d.documentId), 'Justification validée — le bénéficiaire peut soumettre un nouveau décaissement (11.4)')}>
                Valider la justification → débloquer le prochain décaissement
              </button>
              <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy}
                onClick={() => run(() => demanderComplementJustifAction(subId, d.documentId), 'Complément demandé au bénéficiaire')}>
                Demander un complément
              </button>
            </div>
          ) : null}
          {isUgp && d.justificationStatut === 'attendue' ? (
            <div style={{ fontSize: 12.5, color: 'var(--amber-tx, #8a6d1f)' }}>En attente du dépôt de justification par le bénéficiaire.</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ExecView({ detail, isUgp, run, busy, notify }: ViewProps) {
  return (
    <>
      <div className="gx-card">
        <div className="gx-block-title">
          Demandes de décaissement
          <span style={{ marginLeft: 'auto', fontWeight: 400, color: 'var(--muted-warm)', fontSize: 12 }}>
            décaissé : {fmtMontant(detail.montantDecaisse)} $ / {fmtMontant(detail.montantSubvention)} $
          </span>
        </div>
        {detail.demandes.length === 0 ? (
          <div className="gx-empty">Aucune demande de décaissement.</div>
        ) : (
          detail.demandes.map((d) => (
            <DemandeRow key={d.documentId} subId={detail.documentId} d={d} isUgp={isUgp} run={run} busy={busy} notify={notify} />
          ))
        )}
      </div>

      {isUgp && detail.statut === 'active' ? (
        <div className="gx-actions">
          <button type="button" className="gx-btn gx-btn-danger gx-btn-sm" disabled={busy}
            onClick={() => {
              const motif = window.prompt('Motif de la suspension (§8.15) :')?.trim();
              if (motif) run(() => suspendreSubventionAction(detail.documentId, motif), 'Subvention suspendue — paiements gelés (§8.15)');
            }}>
            Suspendre la subvention (§8.15)
          </button>
        </div>
      ) : null}

      {isUgp && detail.statut === 'suspendue' ? (
        <div className="gx-actions">
          {detail.motifSuspension ? <div className="gx-acd-note" style={{ flexBasis: '100%' }}>Motif de suspension : {detail.motifSuspension}</div> : null}
          <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={busy}
            onClick={() => run(() => leverSubventionAction(detail.documentId), 'Suspension levée — subvention réactivée')}>
            Lever la suspension
          </button>
        </div>
      ) : null}

      <p className="gx-annot">
        <b>G3 — circuit 11.4</b> : Cabinet (avis technique) → UGP (avis fiduciaire) → paiement. <b>G4 — règle 11.4</b> :
        la validation de la justification d’avance par l’UGP débloque le prochain décaissement. L’ACD est établie côté UGP.
      </p>
    </>
  );
}

/* ---------- JALONS (G5) ---------- */
function JalonRow({ subId, j, isUgp, run, busy }: { subId: string; j: GestionJalon; isUgp: boolean; run: ViewProps['run']; busy: boolean }) {
  const [date, setDate] = useState('');
  const done = !!j.dateReelle;
  return (
    <div className="gx-jrow">
      <span className={`gx-jdot ${done ? 'done' : 'todo'}`} />
      <span className="gx-jname">{j.libelle}</span>
      <span className="gx-jdate">prévu : {fmtDate(j.datePrevue)}</span>
      {done ? (
        <span className="gx-jdate">réel : <b>{fmtDate(j.dateReelle)}</b></span>
      ) : isUgp ? (
        <>
          <input type="date" className="gx-input" style={{ width: 'auto' }} value={date} onChange={(e) => setDate(e.target.value)} />
          <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy || !date}
            onClick={() => run(() => jalonDateReelleAction(subId, j.documentId, date), 'Date réelle enregistrée — timeline bénéficiaire mise à jour')}>
            Enregistrer
          </button>
        </>
      ) : (
        <span className="gx-jdate">—</span>
      )}
    </div>
  );
}

function JalonsView({ detail, isUgp, run, busy }: Omit<ViewProps, 'notify'>) {
  return (
    <>
      <div className="gx-card">
        <div className="gx-block-title">Jalons du projet (Art. 5)</div>
        {detail.jalons.length === 0 ? (
          <div className="gx-empty">Aucun jalon enregistré.</div>
        ) : (
          detail.jalons.map((j) => <JalonRow key={j.documentId} subId={detail.documentId} j={j} isUgp={isUgp} run={run} busy={busy} />)
        )}
        {detail.rapports.length ? (
          <p style={{ fontSize: 12, color: 'var(--muted-warm)', marginTop: 10 }}>
            Rapports reçus (Art. 12) : {detail.rapports.map((r, i) => (
              <span key={i} className="gx-pc">📎 {r.type}{r.periode ? ` — ${r.periode}` : ''}{r.dateTransmission ? ` · reçu ${fmtDate(r.dateTransmission)}` : ''}</span>
            ))}
          </p>
        ) : null}
      </div>
      <p className="gx-annot">
        <b>G5</b> — l’UGP saisit les <b>dates réelles</b> des jalons : elles pilotent la timeline « Suivi du projet » côté bénéficiaire.
      </p>
    </>
  );
}

/* ---------- MESURES (G6) ---------- */
function MesureRow({ subId, m, isUgp, run, busy }: { subId: string; m: GestionMesure; isUgp: boolean; run: ViewProps['run']; busy: boolean }) {
  const reg = m.statut === 'regularisee';
  return (
    <div className={`gx-mrow${reg ? ' reg' : ''}`}>
      <div className="gx-mt">{reg ? '✓ ' : ''}{m.description}</div>
      <div className="gx-mm">{m.echeance ? `échéance ${fmtDate(m.echeance)}` : ''}{reg ? ' · régularisée' : ''}</div>
      {isUgp && !reg ? (
        <div className="gx-actions">
          <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={busy}
            onClick={() => run(() => mesureValiderAction(subId, m.documentId), 'Régularisation validée')}>
            Valider la régularisation
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MesuresView({ detail, isUgp, run, busy }: Omit<ViewProps, 'notify'>) {
  const [desc, setDesc] = useState('');
  const [ech, setEch] = useState('');
  return (
    <>
      <div className="gx-card">
        <div className="gx-block-title">Mesures correctives</div>
        {detail.mesures.length === 0 ? (
          <div style={{ color: 'var(--muted-warm)', fontSize: 13.5 }}>Aucune mesure corrective en cours.</div>
        ) : (
          detail.mesures.map((m) => <MesureRow key={m.documentId} subId={detail.documentId} m={m} isUgp={isUgp} run={run} busy={busy} />)
        )}
      </div>

      {isUgp ? (
        <div className="gx-card">
          <div className="gx-block-title">Émettre une mesure corrective (§8.15)</div>
          <label className="gx-label">Description</label>
          <textarea rows={2} className="gx-input" placeholder="Anomalie constatée et correction attendue…" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <div className="gx-signform">
            <div><label className="gx-label">Échéance</label><input type="date" className="gx-input" value={ech} onChange={(e) => setEch(e.target.value)} /></div>
          </div>
          <div className="gx-actions">
            <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={busy || !desc.trim()}
              onClick={() => run(async () => {
                const r = await mesureEmettreAction(detail.documentId, { description: desc.trim(), echeance: ech || undefined });
                if (r.ok) { setDesc(''); setEch(''); }
                return r;
              }, 'Mesure émise — le bénéficiaire voit le bloc « Action requise »')}>
              Émettre la mesure
            </button>
          </div>
        </div>
      ) : null}

      <p className="gx-annot">
        <b>G6</b> — l’UGP émet une mesure (description + échéance) → le bénéficiaire dépose la régularisation → l’UGP valide.
        Suspension possible de la subvention (§8.15).
      </p>
    </>
  );
}
