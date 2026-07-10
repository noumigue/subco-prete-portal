'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { PortalDemandeDecaissement, PortalModalite, PortalSubvention } from '@/lib/portal-types';
import { portalMediaUrl } from '@/lib/portal-media';
import { justifyAdvanceAction, saveDemandeAction, uploadPieceAction } from '@/app/(operator)/actions';

function bif(value?: string | number | null): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return '—';
  return `${new Intl.NumberFormat('fr-FR').format(n)} BIF`;
}
function formatAmount(value: string) {
  const digits = value.replace(/[^0-9]/g, '');
  return digits ? new Intl.NumberFormat('fr-FR').format(Number(digits)) : '';
}

const FLOW = [
  { code: 'soumise', label: 'Soumise' },
  { code: 'avis_technique', label: 'Avis technique (Cabinet)' },
  { code: 'avis_fiduciaire', label: 'Avis fiduciaire (UGP)' },
  { code: 'payee', label: 'Paiement' },
];

// Badge de statut affiche sur CHAQUE demande (2.4).
const STATUT_PILL: Record<string, { label: string; cls: string }> = {
  brouillon: { label: 'Brouillon', cls: 'tag-fut' },
  soumise: { label: 'En instruction', cls: 'tag-due' },
  avis_technique: { label: 'En instruction', cls: 'tag-due' },
  avis_fiduciaire: { label: 'En instruction', cls: 'tag-due' },
  complements_requis: { label: 'Compléments requis', cls: 'tag-due' },
  payee: { label: 'Payée', cls: 'tag-ok' },
  rejetee: { label: 'Rejetée', cls: 'tag-no' },
};

// Repli si le referentiel n'expose pas piecesJustification (sinon liste CMS de la modalite avance).
const DEFAULT_JUSTIF_PIECES = [
  'Rapport technique d’avancement',
  'État des dépenses réalisées',
  'Factures et preuves de paiement',
  'PV ou attestations de réception',
];

type Props = {
  subvention: PortalSubvention;
  modalites: PortalModalite[];
  canNew: boolean;
  blockMessage: string;
  planUrl: string | null;
};

export function OperatorDecaissements({ subvention, modalites, canNew, blockMessage, planUrl }: Props) {
  const router = useRouter();
  const demandes = useMemo(
    () => (subvention.demandes || []).slice().sort((a, b) => (b.numero || 0) - (a.numero || 0)),
    [subvention.demandes],
  );
  const total = Number(subvention.montantSubvention) || 0;
  const decaisse = Number(subvention.montantDecaisse) || 0;
  const restant = Math.max(0, total - decaisse);

  const [formOpen, setFormOpen] = useState(false);
  const [modaliteId, setModaliteId] = useState(modalites[0]?.documentId || '');
  const [montant, setMontant] = useState('');
  const [objet, setObjet] = useState('');
  const [pieceFiles, setPieceFiles] = useState<Record<number, { id: number; name: string }>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  // Justification (V3)
  const [justifFiles, setJustifFiles] = useState<{ id: number; name: string }[]>([]);
  const [justifBusy, setJustifBusy] = useState(false);

  const modalite = modalites.find((m) => m.documentId === modaliteId) || null;
  const pieceSlots = modalite?.piecesRequises || [];
  const toJustify = demandes.find((d) => d.aJustifier && (d.justificationStatut === 'attendue' || d.justificationStatut === 'soumise'));

  async function uploadInto(setter: (id: number, name: string) => void, file: File | null, slotIndex?: number) {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const up = await uploadPieceAction(fd);
    if (up) setter(up.id, up.name);
  }

  async function submitDemande(submit: boolean) {
    setBusy(true);
    setMessage(null);
    const result = await saveDemandeAction({
      subvention: subvention.documentId,
      modalite: modaliteId,
      montant: Number(montant.replace(/[^0-9]/g, '')) || 0,
      objet,
      pieceFileIds: Object.values(pieceFiles).map((f) => f.id),
      submit,
    });
    setBusy(false);
    if (!result.ok) {
      setMessage({ kind: 'error', text: result.error || 'Échec.' });
      return;
    }
    router.refresh();
    setFormOpen(false);
    setMontant('');
    setObjet('');
    setPieceFiles({});
  }

  async function submitJustification(documentId: string) {
    setJustifBusy(true);
    const result = await justifyAdvanceAction({ documentId, fileIds: justifFiles.map((f) => f.id) });
    setJustifBusy(false);
    if (result.ok) {
      setJustifFiles([]);
      router.refresh();
    }
  }

  function flowFor(demande: PortalDemandeDecaissement) {
    const code = demande.statut?.code;
    const idx = FLOW.findIndex((s) => s.code === code);
    const payee = code === 'payee';
    return (
      <div className="operator-flow">
        {FLOW.map((step, i) => (
          <span key={step.code} className={`operator-fstep${payee || i < idx ? ' ok' : ''}${i === idx && !payee ? ' cur' : ''}`}>
            {step.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="operator-page">
      <h1 className="operator-page-title-row">
        Décaissements
        <span className="operator-statuschip chip-benef">Bénéficiaire</span>
      </h1>
      <p className="operator-page-intro">Le solde de votre subvention et vos demandes de décaissement.</p>

      <div className="operator-block-title">Solde de la subvention</div>
      <section className="operator-card">
        <div className="operator-solde">
          <div className="operator-sd"><span className="operator-sl">Subvention totale</span><span className="operator-sv">{bif(total)}</span></div>
          <div className="operator-sd"><span className="operator-sl">Déjà décaissé</span><span className="operator-sv">{bif(decaisse)}</span></div>
          <div className="operator-sd"><span className="operator-sl">Restant</span><span className="operator-sv">{bif(restant)}</span></div>
        </div>
        {planUrl ? (
          <div className="operator-solde-plan">
            <a href={planUrl} target="_blank" rel="noopener" className="operator-secondary-btn operator-btn-sm">⤓ Plan de décaissement (annexe E)</a>
          </div>
        ) : null}
      </section>

      <div className="operator-block-title">Mes demandes</div>
      <section className="operator-card">
        {demandes.length === 0 ? <p className="operator-muted">Aucune demande pour le moment.</p> : demandes.map((d) => {
          const justified = d.aJustifier && d.justificationStatut === 'validee';
          const code = d.statut?.code;
          return (
            <div key={d.documentId} className="operator-dem">
              <div className="operator-dem-head">
                <span className="operator-dem-num">Demande N°{String(d.numero || 0).padStart(2, '0')}</span>
                <span className="operator-dem-meta">{d.modalite?.libelle || 'Modalité'} · {bif(d.montant)}</span>
                {code && STATUT_PILL[code] ? (
                  <span className={`operator-tag ${STATUT_PILL[code].cls}`}>{STATUT_PILL[code].label}</span>
                ) : null}
                {justified ? <span className="operator-tag tag-ok">✓ Justifiée</span> : null}
              </div>
              {code && code !== 'brouillon' && code !== 'payee' && code !== 'rejetee' ? flowFor(d) : null}
              {['soumise', 'avis_technique', 'avis_fiduciaire'].includes(code || '') ? (
                <p className="operator-field-note">Délai indicatif de traitement : 5 à 10 jours ouvrables.</p>
              ) : null}
              {code === 'rejetee' && d.motifRejet ? (
                <p className="operator-motif-box"><span className="operator-motif-label">Motif</span>{d.motifRejet}</p>
              ) : null}

              {d.aJustifier && d.justificationStatut && d.justificationStatut !== 'validee' ? (
                <div className="operator-justif">
                  <p><strong>Justification de l’avance requise</strong> avant toute nouvelle demande. Pièces attendues :</p>
                  <ul>
                    {(d.modalite?.piecesJustification?.length ? d.modalite.piecesJustification : DEFAULT_JUSTIF_PIECES).map((piece) => (
                      <li key={piece}>{piece}</li>
                    ))}
                  </ul>
                  {d.justificationStatut === 'soumise' ? (
                    <p className="operator-auth-note">Justification transmise — en cours de validation par l’UGP.</p>
                  ) : (
                    <>
                      <label className="operator-action-drop">
                        Déposez ici vos pièces de justification
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          multiple
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            for (const f of files) {
                              const fd = new FormData();
                              fd.append('file', f);
                              const up = await uploadPieceAction(fd);
                              if (up) setJustifFiles((cur) => [...cur, up]);
                            }
                          }}
                        />
                      </label>
                      {justifFiles.length ? <p className="operator-field-note">{justifFiles.length} pièce(s) prête(s).</p> : null}
                      <button
                        type="button"
                        className="operator-amber-btn"
                        disabled={justifBusy || justifFiles.length === 0}
                        onClick={() => void submitJustification(d.documentId)}
                      >
                        {justifBusy ? 'Envoi…' : 'Soumettre la justification'}
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}

        {canNew ? (
          !formOpen ? (
            <div className="operator-dem-new">
              <button type="button" className="operator-primary-btn inline" onClick={() => setFormOpen(true)}>+ Nouvelle demande de décaissement</button>
            </div>
          ) : null
        ) : (
          <div className="operator-blockmsg">🔒 <strong>Nouvelle demande indisponible :</strong> {blockMessage}</div>
        )}

        {formOpen && canNew ? (
          <div className="operator-demform">
            <div className="operator-block-title">Nouvelle demande de décaissement</div>

            <label className="operator-form-label">Identification <span className="operator-form-subtle">— pré-remplie depuis votre convention</span></label>
            <div className="operator-ro">
              <div><span>Convention</span><span>{subvention.numeroConvention}</span></div>
              <div><span>Subvention totale</span><span>{bif(total)}</span></div>
              <div><span>Déjà décaissé</span><span>{bif(decaisse)}</span></div>
              <div><span>Restant</span><span>{bif(restant)}</span></div>
            </div>

            <label className="operator-form-label">Modalité de décaissement</label>
            <div className="operator-radios">
              {modalites.map((m) => (
                <label key={m.documentId} className={`operator-radio${modaliteId === m.documentId ? ' is-on' : ''}`}>
                  <input type="radio" name="modalite" checked={modaliteId === m.documentId} onChange={() => { setModaliteId(m.documentId); setPieceFiles({}); }} />
                  {m.libelle}
                </label>
              ))}
            </div>

            <label className="operator-form-label">Montant demandé (BIF)</label>
            <input type="text" inputMode="numeric" value={montant} onChange={(e) => setMontant(formatAmount(e.target.value))} placeholder="Ex. 12 400 000" className="operator-demform-input" />

            <label className="operator-form-label">Objet de la demande</label>
            <textarea rows={3} value={objet} onChange={(e) => setObjet(e.target.value)} placeholder="Décrivez la dépense ou le jalon…" className="operator-demform-input" />

            <label className="operator-form-label">Pièces jointes <span className="operator-form-subtle">— selon la modalité choisie</span></label>
            <div className="operator-pieces">
              {pieceSlots.map((piece, index) => (
                <div key={`${piece}-${index}`} className="operator-piece-slot">
                  <span>{piece}</span>
                  <label className={`operator-upload-btn${pieceFiles[index] ? ' is-done' : ''}`}>
                    {pieceFiles[index] ? `✓ ${pieceFiles[index].name}` : 'Joindre'}
                    <input type="file" hidden accept=".pdf,image/*" onChange={(e) => void uploadInto((id, name) => setPieceFiles((cur) => ({ ...cur, [index]: { id, name } })), e.target.files?.[0] || null)} />
                  </label>
                </div>
              ))}
            </div>
            <p className="operator-acd-note">ℹ L’ACD est requise pour tout paiement — elle est établie côté UGP et jointe à l’instruction de votre demande.</p>

            {message ? <p className={message.kind === 'ok' ? 'operator-auth-note' : 'operator-auth-error'}>{message.text}</p> : null}

            <div className="operator-form-actions">
              <button type="button" className="operator-secondary-btn inline" onClick={() => setFormOpen(false)} disabled={busy}>Annuler</button>
              <button type="button" className="operator-secondary-btn inline" onClick={() => void submitDemande(false)} disabled={busy}>Enregistrer le brouillon</button>
              <button type="button" className="operator-primary-btn inline" onClick={() => void submitDemande(true)} disabled={busy}>{busy ? '…' : 'Soumettre la demande'}</button>
            </div>
          </div>
        ) : null}
      </section>

      <p className="operator-annot">
        <strong>Fiche Annexe 16 numérisée.</strong> Identification pré-remplie · 4 modalités (référentiel) · pièces selon la modalité ·
        circuit avis technique (Cabinet) → avis fiduciaire (UGP) → paiement. Blocage 11.4 rendu visible : l’état « à justifier »
        verrouille toute nouvelle demande.
      </p>
    </div>
  );
}
