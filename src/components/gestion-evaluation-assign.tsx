'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { GestionEvaluateurSlot, GestionEvaluationAssign as AssignData } from '@/lib/portal-types';
import { annulerFicheSigneeAction, assignerEvaluateurAction, libererPlaceEvaluateurAction, renvoyerFicheEvaluateurAction, renvoyerVersEligibiliteAction } from '@/app/(gestion)/actions';

function FicheEtat({ slot }: { slot: GestionEvaluateurSlot }) {
  if (!slot?.evaluateurId) return <span className="gx-pill gx-pill-comp">Non assigné</span>;
  if (slot.ficheStatut === 'soumise') return <span className="gx-pill gx-pill-ok">✓ Fiche soumise</span>;
  return <span className="gx-pill gx-pill-val">À remplir</span>;
}

export function GestionEvaluationAssign({ data, role }: { data: AssignData; role?: 'instructeur' | 'ugp' }) {
  const router = useRouter();
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Renvoi a l'eligibilite : dossier decouvert non eligible apres coup (UGP seule).
  // Liberer une place : possible tant que la fiche n'est pas signee.
  const [liberOpen, setLiberOpen] = useState<number | null>(null);
  const [motifLiber, setMotifLiber] = useState('');
  // Annulation d'une fiche signee : la fiche est conservee pour l'audit, la place se libere.
  const [annulOpen, setAnnulOpen] = useState<number | null>(null);
  const [motifAnnul, setMotifAnnul] = useState('');
  // Renvoi d'une fiche signee a SON evaluateur, rang par rang : l'UGP peut renvoyer a l'un,
  // a l'autre, ou aux deux, avec un motif propre a chacun.
  const [renvOpen, setRenvOpen] = useState<number | null>(null);
  const [motifRenv, setMotifRenv] = useState('');
  const [renvoiOpen, setRenvoiOpen] = useState(false);
  const [motifRenvoi, setMotifRenvoi] = useState('');
  const [busy, setBusy] = useState(false);

  async function renvoyer() {
    setBusy(true); setError(null);
    const r = await renvoyerVersEligibiliteAction({ documentId: data.documentId, motif: motifRenvoi.trim() });
    setBusy(false);
    if (r.ok) router.push(`/gestion/dossiers/${data.documentId}/eligibilite`);
    else setError(r.error || 'Renvoi refusé.');
  }

  async function assign(rang: number, evaluateurId: number) {
    if (!evaluateurId) return;
    setPending(rang); setError(null);
    const r = await assignerEvaluateurAction({ documentId: data.documentId, evaluateurId, rang });
    setPending(null);
    if (r.ok) router.refresh();
    else setError(r.error || 'Assignation refusée.');
  }

  async function renvoyerFiche(rang: number) {
    setBusy(true); setError(null);
    const r = await renvoyerFicheEvaluateurAction({ documentId: data.documentId, rang, motif: motifRenv.trim() });
    setBusy(false);
    if (r.ok) { setRenvOpen(null); setMotifRenv(''); router.refresh(); }
    else setError(r.error || 'Renvoi refusé.');
  }

  async function annuler(rang: number) {
    setBusy(true); setError(null);
    const r = await annulerFicheSigneeAction({ documentId: data.documentId, rang, motif: motifAnnul.trim() });
    setBusy(false);
    if (r.ok) { setAnnulOpen(null); setMotifAnnul(''); router.refresh(); }
    else setError(r.error || 'Annulation refusée.');
  }

  async function liberer(rang: number) {
    setBusy(true); setError(null);
    const r = await libererPlaceEvaluateurAction({ documentId: data.documentId, rang, motif: motifLiber.trim() });
    setBusy(false);
    if (r.ok) { setLiberOpen(null); setMotifLiber(''); router.refresh(); }
    else setError(r.error || 'Libération refusée.');
  }

  // Rendu d'un bloc evaluateur. Appele comme une FONCTION, surtout pas comme un composant
  // (<Slot />) : un composant declare dans le rendu est recree a chaque frappe, React demonte
  // alors tout le bloc — le champ de motif perdait le focus apres chaque caractere (signale
  // le 02/10). Meme correction que sur la fiche de scoring le 22/09.
  function slotEvaluateur(rang: number, slot: GestionEvaluateurSlot) {
    const signee = slot?.ficheStatut === 'soumise';
    // Fiche ouverte (brouillon ou signée) : la place appartient à son titulaire.
    const locked = !!slot?.ficheStatut;
    return (
      <div className="gx-card" key={rang}>
        <div className="gx-block-title">Évaluateur {rang}</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            defaultValue={slot?.evaluateurId ?? ''}
            disabled={locked || pending === rang}
            onChange={(e) => assign(rang, Number(e.target.value))}
            style={{ maxWidth: 320 }}
          >
            <option value="">— Choisir un évaluateur —</option>
            {data.evaluateurs.map((ev) => <option key={ev.id} value={ev.id}>{ev.nom}</option>)}
          </select>
          <FicheEtat slot={slot} />
          {signee ? <span style={{ fontSize: 12, color: 'var(--muted-warm)' }}>Fiche signée — la notation est acquise.</span> : null}
          {slot?.renvoyee ? <span className="gx-pill gx-pill-comp" style={{ fontSize: 11 }}>↩ renvoyée pour correction</span> : null}
          {locked && !signee ? <span style={{ fontSize: 12, color: 'var(--muted-warm)' }}>Fiche commencée — la place est verrouillée.</span> : null}
        </div>
        {signee ? (
          renvOpen === rang ? (
            <div className="gx-subform" style={{ marginLeft: 0, marginTop: 10 }}>
              <label>Renvoyer cette fiche à {slot?.nom || 'son évaluateur'}</label>
              <p style={{ fontSize: 12.5, color: 'var(--muted-warm)', margin: '0 0 8px' }}>
                La fiche repasse en brouillon <b>avec ses notes et ses commentaires</b> : l&apos;évaluateur corrige et signe à nouveau,
                sans rien ressaisir. Il lira votre motif dans sa fiche. La consolidation se referme jusqu&apos;à sa nouvelle signature
                {data.consolidationStatut === 'figee' ? <>, et <b>la consolidation figée est annulée</b></> : null}.
              </p>
              <textarea rows={2} value={motifRenv} onChange={(e) => setMotifRenv(e.target.value)} placeholder="Ex. : la note du critère A4 ne correspond pas à votre commentaire ; précisez ou ajustez." />
              <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={busy || !motifRenv.trim()} onClick={() => renvoyerFiche(rang)}>{busy ? 'Renvoi…' : 'Confirmer le renvoi'}</button>
                <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy} onClick={() => setRenvOpen(null)}>Annuler</button>
              </div>
            </div>
          ) : annulOpen === rang ? (
            <div className="gx-subform" style={{ marginLeft: 0, marginTop: 10 }}>
              <label style={{ color: 'var(--gx-red-tx)' }}>Annuler cette fiche signée</label>
              <p style={{ fontSize: 12.5, color: 'var(--muted-warm)', margin: '0 0 8px' }}>
                À réserver aux cas graves : conflit d&apos;intérêts découvert après coup, fiche viciée, départ de l&apos;évaluateur.
                La fiche est <b>conservée</b> et marquée annulée (pièce d&apos;audit) ; la place se libère et un nouvel évaluateur repart d&apos;une fiche vierge.
                Les harmonisations déjà saisies sont effacées{data.consolidationStatut === 'figee' ? <>, et <b>la consolidation figée est annulée</b> : total et bande disparaissent</> : null}.
              </p>
              <textarea rows={2} value={motifAnnul} onChange={(e) => setMotifAnnul(e.target.value)} placeholder="Motif de l'annulation (obligatoire) — inscrit au journal." />
              <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={busy || !motifAnnul.trim()} onClick={() => annuler(rang)}>{busy ? 'Annulation…' : 'Confirmer l\u2019annulation'}</button>
                <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy} onClick={() => setAnnulOpen(null)}>Renoncer</button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" onClick={() => { setRenvOpen(rang); setMotifRenv(''); }}>Renvoyer la fiche à son évaluateur…</button>
              <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" onClick={() => { setAnnulOpen(rang); setMotifAnnul(''); }}>Annuler la fiche signée…</button>
            </div>
          )
        ) : null}
        {locked && !signee ? (
          liberOpen === rang ? (
            <div className="gx-subform" style={{ marginLeft: 0, marginTop: 10 }}>
              <label>Motif de la libération <span style={{ fontWeight: 400, color: 'var(--muted-warm)' }}>(obligatoire — inscrit au journal ; le brouillon sera supprimé)</span></label>
              <textarea rows={2} value={motifLiber} onChange={(e) => setMotifLiber(e.target.value)} placeholder="Ex. : évaluateur absent, ne pourra pas rendre sa fiche." />
              <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={busy || !motifLiber.trim()} onClick={() => liberer(rang)}>{busy ? 'Libération…' : 'Confirmer la libération'}</button>
                <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy} onClick={() => setLiberOpen(null)}>Annuler</button>
              </div>
            </div>
          ) : (
            <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" style={{ marginTop: 10 }} onClick={() => { setLiberOpen(rang); setMotifLiber(''); }}>Libérer la place…</button>
          )
        ) : null}
      </div>
    );
  }

  return (
    <>
      <Link className="gx-back" href="/gestion/dossiers">← File des dossiers</Link>
      <h1 className="gx-page-title">Évaluation — {data.organisation?.nom} <span className="gx-num" style={{ fontSize: 13, color: 'var(--muted-warm)' }}>{data.numeroDossier}</span></h1>
      <p className="gx-page-sub">Assignation de la double notation (§6.3) — {data.organisation?.filiere}.</p>
      {error ? <div className="gx-flash err">{error}</div> : null}

      {slotEvaluateur(1, data.evaluateur1)}
      {slotEvaluateur(2, data.evaluateur2)}
      {data.evaluateur3?.evaluateurId ? slotEvaluateur(3, data.evaluateur3) : null}

      {data.consolidationPrete ? (
        <div className="gx-card">
          <div className="gx-block-title">Consolidation</div>
          <p style={{ fontSize: 13.5, margin: '0 0 12px' }}>
            Les deux fiches sont soumises — l&apos;indépendance (E3) est levée.
            {data.consolidationStatut === 'figee' ? ' Consolidation figée.' : ' Prête à consolider.'}
          </p>
          <Link className="gx-btn gx-btn-primary gx-btn-sm" href={`/gestion/dossiers/${data.documentId}/consolidation`}>
            {data.consolidationStatut === 'figee' ? 'Consulter la consolidation' : 'Consolider les notes'}
          </Link>
        </div>
      ) : (
        <div className="gx-card">
          <div className="gx-block-title">Consolidation</div>
          <p style={{ fontSize: 13.5, color: 'var(--muted-warm)', margin: 0 }}>En attente de la soumission des deux fiches (E3 : aucune visibilité croisée avant la double soumission).</p>
        </div>
      )}

      {role === 'ugp' ? (
        <div className="gx-card">
          <div className="gx-block-title">Renvoyer à l&apos;éligibilité</div>
          <p style={{ fontSize: 13.5, color: 'var(--muted-warm)', margin: '0 0 10px' }}>
            Pour un dossier découvert <b>non éligible</b> après son passage en évaluation. Les constats d&apos;éligibilité sont conservés et gelés ;
            les fiches de scoring, brouillons ou signées, sont conservées mais ignorées. À l&apos;éligibilité, la seule issue sera la non-éligibilité, motivée.
            Le candidat n&apos;est pas notifié par ce renvoi.
          </p>
          {renvoiOpen ? (
            <>
              <textarea rows={2} placeholder="Motif du renvoi (obligatoire) : ce qui rend ce dossier non éligible…" value={motifRenvoi} onChange={(e) => setMotifRenvoi(e.target.value)} />
              <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={busy || !motifRenvoi.trim()} onClick={renvoyer}>{busy ? 'Renvoi…' : 'Confirmer le renvoi'}</button>
                <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy} onClick={() => setRenvoiOpen(false)}>Annuler</button>
              </div>
            </>
          ) : (
            <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" onClick={() => setRenvoiOpen(true)}>Renvoyer à l&apos;éligibilité…</button>
          )}
        </div>
      ) : null}

      <p className="gx-annot">
        <b>E2 — assignation par l&apos;UGP.</b> Évaluateur 1 &amp; 2 parmi les experts (comptes internes). L&apos;évaluateur déclare l&apos;absence de conflit d&apos;intérêts
        (§5.8.1) à l&apos;ouverture de sa fiche ; une récusation revient ici pour réassignation. Le 3ᵉ évaluateur se désigne depuis la consolidation, en cas d&apos;écart.
        <br /><b>Place verrouillée</b> dès que l&apos;évaluateur ouvre sa fiche : pour en changer, il se récuse, ou l&apos;UGP libère la place avec un motif.
        Une fiche <b>signée</b> ne se libère pas : elle s&apos;annule, motif à l&apos;appui — elle reste au dossier comme pièce d&apos;audit, la consolidation figée est défaite et les harmonisations effacées.
      </p>
    </>
  );
}
