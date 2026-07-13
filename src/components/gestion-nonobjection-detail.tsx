'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { GestionNoDetail, GestionNoSynthese } from '@/lib/portal-types';
import { NoStatutPill } from '@/components/gestion-nonobjection-registre';
import { portalMediaUrl } from '@/lib/portal-media';
import {
  majSyntheseNonObjectionAction,
  joindrePieceNonObjectionAction,
  genererNonObjectionAction,
  transmettreNonObjectionAction,
  accordNonObjectionAction,
  observationsNonObjectionAction,
  reversionNonObjectionAction,
  uploadFileAction,
  getGestionNonObjectionPaquetClient,
} from '@/app/(gestion)/actions';

const ACCEPT_DOCS = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.heic,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*';
const SYNTH_LIGNES: [keyof GestionNoSynthese, string][] = [
  ['recus', 'Dossiers reçus'],
  ['complets', 'Dossiers complets'],
  ['eligibles', 'Dossiers éligibles'],
  ['evalues', 'Dossiers évalués'],
  ['recommandes', 'Projets recommandés'],
];

function fmtDate(v: string | null) {
  if (!v) return '—';
  const d = v.slice(0, 10).split('-');
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : v;
}

async function upload(file: File | undefined): Promise<{ id: number; name: string } | null> {
  if (!file) return null;
  const fd = new FormData(); fd.append('fichier', file);
  try {
    return await uploadFileAction(fd);
  } catch {
    // Action serveur injoignable (déploiement en cours, page périmée, réseau) :
    // retourner null plutôt que de laisser le spinner bloqué.
    return null;
  }
}

export function GestionNonObjectionDetail({ detail, canWrite }: { detail: GestionNoDetail; canWrite: boolean }) {
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const [synth, setSynth] = useState<GestionNoSynthese>(detail.synthese);
  const [lieu, setLieu] = useState('Bujumbura');
  const [dateSig, setDateSig] = useState('');
  const [signataire, setSignataire] = useState('Coordonnateur / Coordonnatrice PRETE');
  const [ajust, setAjust] = useState('');
  const [obsTxt, setObsTxt] = useState('');

  const notify = (m: string) => { setToast(m); window.setTimeout(() => setToast(null), 3400); };
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

  const prep = detail.statut === 'en_preparation';
  const dis = !canWrite || !prep || busy;

  const exporterPaquet = async () => {
    const p = await getGestionNonObjectionPaquetClient(detail.documentId);
    if (!p.files.length) { notify('Aucune pièce à exporter.'); return; }
    p.files.forEach((f) => window.open(portalMediaUrl(f.url) || '#', '_blank', 'noopener'));
    notify(`Paquet : ${p.files.length} pièce(s) ouverte(s) dans un onglet chacune.`);
  };

  return (
    <div className="gx">
      <Link className="gx-back" href="/gestion/non-objection">← Registre</Link>
      <h1 className="gx-page-title">
        {detail.objet} <span className="gx-vtag" style={{ fontSize: 12 }}>version {detail.version}</span> <NoStatutPill statut={detail.statut} />
      </h1>
      <p className="gx-page-sub">
        Cas {detail.type?.code || '—'}) {detail.type?.libelle || ''} · préparée par l&apos;UGP (appui Cabinet si nécessaire) · Projet P177688.
      </p>

      {detail.statut === 'accordee' ? (
        <div className="gx-accbanner">
          ✓ Non-objection accordée le {fmtDate(detail.dateAccord)}{detail.document?.url ? <> — <a href={portalMediaUrl(detail.document.url) || '#'} target="_blank" rel="noreferrer">document joint ⤓</a></> : null}.
          {' '}<b>La publication des décisions{detail.reference && detail.reference !== '—' ? ` de la ${detail.reference}` : ''} est débloquée</b> (contrat 2b : « accordée » = unique déblocage).
        </div>
      ) : null}

      {detail.statut === 'observations' ? (
        <div className="gx-obsbox">
          <h4>✎ Observations de la Banque mondiale{detail.dateObservations ? ` (reçues le ${fmtDate(detail.dateObservations)})` : ''}</h4>
          <div style={{ fontSize: 13 }}>{detail.observations || '—'}</div>
          {canWrite ? (
            <>
              <label className="gx-label" style={{ marginTop: 10 }}>Ajustements apportés (documentés)</label>
              <textarea rows={2} value={ajust} onChange={(e) => setAjust(e.target.value)} placeholder="Décrivez les ajustements (conditions renforcées, correction du tableau des scores…)" />
              <div className="gx-actions">
                <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={busy || !ajust.trim()}
                  onClick={() => run(() => reversionNonObjectionAction(detail.documentId, ajust.trim()), `Version ${detail.version + 1} créée — régénérez la demande après ajustements`)}>
                  Créer la version {detail.version + 1} (re-soumission)
                </button>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--muted-warm)', margin: '8px 0 0' }}>
                Les ajustements majeurs (décisions du Comité) se traitent humainement — la plateforme trace. L&apos;historique des versions est conservé.
              </p>
            </>
          ) : null}
        </div>
      ) : null}

      {detail.selection ? (
        <>
          {/* 1 · Synthèse chiffrée */}
          <div className="gx-card">
            <div className="gx-block-title">1 · Synthèse chiffrée <span className="gx-autotag">calculée depuis les données — ajustable</span></div>
            <table className="gx-stbl">
              <tbody>
                {SYNTH_LIGNES.map(([k, l]) => (
                  <tr key={k}>
                    <td>{l}</td>
                    <td>
                      <input type="number" min={0} value={synth[k]} disabled={dis}
                        onChange={(e) => setSynth({ ...synth, [k]: Math.max(0, parseInt(e.target.value, 10) || 0) })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {canWrite && prep ? (
              <div className="gx-actions">
                <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy}
                  onClick={() => run(async () => {
                    const r = await majSyntheseNonObjectionAction(detail.documentId, { recalculer: true });
                    return r;
                  }, 'Synthèse recalculée depuis les données')}>
                  ↻ Recalculer
                </button>
                <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy}
                  onClick={() => run(() => majSyntheseNonObjectionAction(detail.documentId, { valeurs: synth }), 'Synthèse enregistrée')}>
                  Enregistrer les valeurs
                </button>
              </div>
            ) : null}
          </div>

          {/* 2 · Paquet de pièces */}
          <div className="gx-card">
            <div className="gx-block-title">2 · Paquet de pièces (Annexe 14)</div>
            <div className="gx-plist">
              <PieceAuto label="📄 Rapport d’évaluation (PDF)" media={detail.pieces.rapport} fallback="produit au 2b" />
              <PieceAuto label="📄 PV du Comité de sélection (signé)" media={detail.pieces.pvSigne} fallback="produit au 2b" />
              <div className="gx-pi"><span className="gx-pn">📄 Liste des projets recommandés</span><span className="gx-okp">✓ auto — générée</span></div>
              <div className="gx-pi"><span className="gx-pn">📄 Tableau des scores</span><span className="gx-okp">✓ auto — généré</span></div>
              <div className="gx-pi"><span className="gx-pn">📄 Synthèse des vérifications d’éligibilité</span><span className="gx-okp">✓ auto — générée (verdicts Annexe 5)</span></div>
              <PieceManuelle documentId={detail.documentId} slot="es" label="📄 Note de conformité E&S" media={detail.pieces.es} required disabled={dis} canWrite={canWrite && prep} run={run} notify={notify} />
              <PieceManuelle documentId={detail.documentId} slot="fiduciaire" label="📄 Note fiduciaire (si applicable)" media={detail.pieces.fiduciaire} disabled={dis} canWrite={canWrite && prep} run={run} notify={notify} />
            </div>
          </div>

          {/* 3 · Génération */}
          <div className="gx-card">
            <div className="gx-block-title">3 · Demande de non-objection (Annexe 14)</div>
            <div className="gx-grid3">
              <div><label className="gx-label">Fait à</label><input type="text" value={lieu} onChange={(e) => setLieu(e.target.value)} disabled={dis} /></div>
              <div><label className="gx-label">Le</label><input type="date" value={dateSig} onChange={(e) => setDateSig(e.target.value)} disabled={dis} /></div>
              <div><label className="gx-label">Signataire</label><input type="text" value={signataire} onChange={(e) => setSignataire(e.target.value)} disabled={dis} /></div>
            </div>
            {detail.demandePdf?.url ? (
              <div className="gx-genline">
                📄 <b>{detail.demandePdf.name || 'Demande générée'}</b> — générée
                <a className="gx-btn gx-btn-ghost gx-btn-sm" style={{ marginLeft: 'auto' }} href={portalMediaUrl(detail.demandePdf.url) || '#'} target="_blank" rel="noreferrer">⤓ Aperçu</a>
              </div>
            ) : null}
            {canWrite && prep ? (
              <div className="gx-actions">
                <button type="button" className={`gx-btn gx-btn-sm ${detail.demandePdf?.url ? 'gx-btn-ghost' : 'gx-btn-primary'}`} disabled={busy || !detail.pieces.es}
                  onClick={() => run(() => genererNonObjectionAction(detail.documentId, { lieu, date: fmtDate(dateSig || null) === '—' ? '' : `${dateSig}`, signataire }), 'Demande Annexe 14 générée (PDF)')}>
                  {detail.demandePdf?.url ? 'Régénérer' : 'Générer la demande (PDF)'}
                </button>
                {!detail.pieces.es ? <span style={{ fontSize: 12.5, color: 'var(--amber-tx, #8a6d1f)', alignSelf: 'center' }}>Joignez d’abord la note E&S</span> : null}
              </div>
            ) : null}
          </div>

          {/* 4 · Transmission */}
          <div className="gx-card">
            <div className="gx-block-title">4 · Transmission (hors plateforme — canaux officiels)</div>
            <div className="gx-actions" style={{ marginTop: 0 }}>
              <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy || !detail.demandePdf?.url} onClick={exporterPaquet}>⤓ Exporter le paquet</button>
              {canWrite && prep ? (
                <button type="button" className="gx-btn gx-btn-gold gx-btn-sm" disabled={busy || !detail.demandePdf?.url}
                  onClick={() => run(() => transmettreNonObjectionAction(detail.documentId), 'Marquée transmise — en attente de la réponse BM')}>
                  Marquer « transmise » (date)
                </button>
              ) : null}
              {detail.dateTransmission ? <span style={{ fontSize: 13, color: 'var(--muted-warm)', alignSelf: 'center' }}>Transmise le {fmtDate(detail.dateTransmission)}</span> : null}
            </div>
          </div>

          {/* 5 · Réponse BM */}
          {detail.statut === 'transmise' && canWrite ? (
            <ReponseBM documentId={detail.documentId} obsTxt={obsTxt} setObsTxt={setObsTxt} busy={busy} run={run} notify={notify} />
          ) : null}
        </>
      ) : (
        /* Autre cas (non outillé) */
        <>
          <div className="gx-card">
            <div className="gx-block-title">Demande &amp; suivi</div>
            <div className="gx-plist">
              <div className="gx-pi">
                <span className="gx-pn">📄 Demande rédigée (jointe)</span>
                {detail.demandeRedigee?.url ? <a className="gx-okp" href={portalMediaUrl(detail.demandeRedigee.url) || '#'} target="_blank" rel="noreferrer">✓ {detail.demandeRedigee.name || 'demande.pdf'}</a> : <span className="gx-manp">à joindre</span>}
              </div>
            </div>
            <div className="gx-actions">
              <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy || !(detail.demandePdf?.url || detail.demandeRedigee?.url)} onClick={exporterPaquet}>⤓ Exporter le paquet</button>
              {canWrite && prep ? (
                <button type="button" className="gx-btn gx-btn-gold gx-btn-sm" disabled={busy || !detail.demandeRedigee?.url}
                  onClick={() => run(() => transmettreNonObjectionAction(detail.documentId), 'Marquée transmise')}>Marquer « transmise »</button>
              ) : null}
              {detail.dateTransmission ? <span style={{ fontSize: 13, color: 'var(--muted-warm)', alignSelf: 'center' }}>Transmise le {fmtDate(detail.dateTransmission)}</span> : null}
            </div>
          </div>
          {detail.statut === 'transmise' && canWrite ? (
            <ReponseBM documentId={detail.documentId} obsTxt={obsTxt} setObsTxt={setObsTxt} busy={busy} run={run} notify={notify} />
          ) : null}
        </>
      )}

      {/* Historique des versions */}
      {detail.versions.length ? (
        <div className="gx-card">
          <div className="gx-block-title">Historique des versions</div>
          <div className="gx-hist">
            {detail.versions.map((v) => (
              <div className="gx-hrow" key={v.version}>
                <span className="gx-vtag">v{v.version}</span>
                <span>transmise {fmtDate(v.dateTransmission)}</span>
                {v.observations ? <span style={{ color: 'var(--gx-red-tx, #9a5546)' }}>observations : {v.observations}</span> : null}
                <span>ajustements : {v.ajustements || '—'}</span>
                {v.demandePdf?.url ? <a href={portalMediaUrl(v.demandePdf.url) || '#'} target="_blank" rel="noreferrer">⤓ PDF</a> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="gx-annot">
        <b>I2</b> — lettre Annexe 14 pré-générée (synthèse chiffrée automatique, documents transmis listés) ; pièces plateforme
        auto-rattachées + slots manuels (note E&S requise, note fiduciaire). <b>I3</b> — observations → ajustements documentés →
        <b> version n+1</b>, historique conservé ; « accordée » reste l&apos;unique déblocage de la publication (contrat 2b intact).
        <b> I4</b> — transmission hors plateforme ; la plateforme génère le paquet et trace (dates, réponse, document).
      </p>

      {toast ? <div className="gx-toast show">{toast}</div> : null}
    </div>
  );
}

function PieceAuto({ label, media, fallback }: { label: string; media: { url?: string; name?: string } | null; fallback: string }) {
  return (
    <div className="gx-pi">
      <span className="gx-pn">{label}</span>
      {media?.url ? <a className="gx-okp" href={portalMediaUrl(media.url) || '#'} target="_blank" rel="noreferrer">✓ auto ⤓</a> : <span className="gx-okp">✓ auto — {fallback}</span>}
    </div>
  );
}

function PieceManuelle({ documentId, slot, label, media, required, disabled, canWrite, run, notify }: {
  documentId: string; slot: 'es' | 'fiduciaire'; label: string; media: { url?: string; name?: string } | null;
  required?: boolean; disabled: boolean; canWrite: boolean;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => void; notify: (m: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const up = await upload(file);
    setUploading(false);
    if (!up) { notify('Échec du téléversement.'); return; }
    run(() => joindrePieceNonObjectionAction(documentId, slot, up.id), `${slot === 'es' ? 'Note E&S' : 'Note fiduciaire'} jointe`);
  };
  return (
    <div className="gx-pi">
      <span className="gx-pn">{label}</span>
      {media?.url ? (
        <a className="gx-okp" href={portalMediaUrl(media.url) || '#'} target="_blank" rel="noreferrer">✓ jointe ⤓</a>
      ) : (
        <>
          {required ? <span className="gx-manp">à joindre</span> : null}
          {canWrite ? (
            <label className="gx-btn gx-btn-ghost gx-btn-sm" style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1 }}>
              📎 {uploading ? 'Téléversement…' : 'Joindre'}
              <input type="file" accept={ACCEPT_DOCS} hidden disabled={disabled} onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          ) : null}
        </>
      )}
    </div>
  );
}

function ReponseBM({ documentId, obsTxt, setObsTxt, busy, run, notify }: {
  documentId: string; obsTxt: string; setObsTxt: (v: string) => void; busy: boolean;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => void; notify: (m: string) => void;
}) {
  const [mode, setMode] = useState<'none' | 'obs'>('none');
  const [uploading, setUploading] = useState(false);
  const onAccord = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const up = await upload(file);
    setUploading(false);
    if (!up) { notify('Échec du téléversement.'); return; }
    run(() => accordNonObjectionAction(documentId, up.id), 'Accord enregistré — publication débloquée (contrat 2b)');
  };
  return (
    <div className="gx-card">
      <div className="gx-block-title">5 · Réponse de la Banque mondiale</div>
      <div className="gx-actions" style={{ marginTop: 0 }}>
        <label className="gx-btn gx-btn-primary gx-btn-sm" style={{ cursor: 'pointer' }}>
          📎 {uploading ? 'Téléversement…' : 'Enregistrer l’accord (date + document)'}
          <input type="file" accept={ACCEPT_DOCS} hidden onChange={(e) => onAccord(e.target.files?.[0])} />
        </label>
        <button type="button" className="gx-btn gx-btn-danger gx-btn-sm" disabled={busy} onClick={() => setMode(mode === 'obs' ? 'none' : 'obs')}>
          Enregistrer des observations
        </button>
      </div>
      {mode === 'obs' ? (
        <div style={{ marginTop: 10 }}>
          <textarea rows={2} value={obsTxt} onChange={(e) => setObsTxt(e.target.value)} placeholder="Observations de la Banque mondiale (8.11)…" />
          <div className="gx-actions">
            <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={busy || !obsTxt.trim()}
              onClick={() => run(() => observationsNonObjectionAction(documentId, obsTxt.trim()), 'Observations enregistrées — circuit d’ajustement ouvert (8.11)')}>
              Enregistrer les observations
            </button>
          </div>
        </div>
      ) : null}
      <p style={{ fontSize: 11.5, color: 'var(--muted-warm)', margin: '10px 0 0' }}>
        « Accordée » débloque la publication (pont 2b, inchangé). « Observations » ouvre le circuit d&apos;ajustement et de re-soumission versionnée (8.11).
      </p>
    </div>
  );
}
