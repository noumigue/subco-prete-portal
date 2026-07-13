'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { GestionAssistanceOperateur, GestionAssistanceRattachements } from '@/lib/portal-types';
import { creerAssistanceOperateurAction, rattachementsOperateurAction } from '@/app/(gestion)/actions';

// H4 — sollicitation téléphonique : la demande apparaît dans l'espace de l'opérateur
// (origine: ugp), qui peut y répondre en ligne. Rattachement optionnel.
export function GestionAssistanceNouvelle({
  operateurs,
  categories,
}: {
  operateurs: GestionAssistanceOperateur[];
  categories: { documentId: string; code: string; libelle: string }[];
}) {
  const router = useRouter();
  const [operateurId, setOperateurId] = useState<number | ''>('');
  const [rattachements, setRattachements] = useState<GestionAssistanceRattachements>({ candidatures: [], subventions: [] });
  const [concerne, setConcerne] = useState('');
  const [objet, setObjet] = useState('');
  const [categorie, setCategorie] = useState('');
  const [corps, setCorps] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const onOperateur = (value: string) => {
    const id = value ? Number(value) : '';
    setOperateurId(id);
    setConcerne('');
    setRattachements({ candidatures: [], subventions: [] });
    if (id !== '' && Number.isInteger(id)) {
      startTransition(async () => {
        try {
          setRattachements(await rattachementsOperateurAction(id));
        } catch {
          setRattachements({ candidatures: [], subventions: [] });
        }
      });
    }
  };

  const submit = () => {
    if (operateurId === '' || !objet.trim() || !corps.trim()) {
      setError('Opérateur, objet et message sont requis.');
      return;
    }
    setError(null);
    setBusy(true);
    startTransition(async () => {
      const [kind, docId] = concerne ? concerne.split(':') : ['', ''];
      const r = await creerAssistanceOperateurAction({
        operateurId: operateurId as number,
        objet: objet.trim(),
        corps: corps.trim(),
        categorie: categorie || undefined,
        concerneCandidature: kind === 'candidature' ? docId : undefined,
        concerneSubvention: kind === 'subvention' ? docId : undefined,
      });
      setBusy(false);
      if (r.ok) {
        router.push('/gestion/assistance');
      } else {
        setError(r.error || 'La création a échoué.');
      }
    });
  };

  return (
    <div className="gx">
      <Link className="gx-back" href="/gestion/assistance">← Assistance</Link>
      <h1 className="gx-page-title">Nouvelle demande au nom d&apos;un opérateur</h1>
      <p className="gx-page-sub">
        Pour une sollicitation reçue par téléphone : la demande apparaîtra dans l&apos;espace de l&apos;opérateur, qui pourra y répondre en ligne.
      </p>

      {error ? <div className="gx-flash err">{error}</div> : null}

      <div className="gx-card">
        <label>Opérateur concerné</label>
        <select value={operateurId} onChange={(e) => onOperateur(e.target.value)}>
          <option value="">— Choisir un opérateur —</option>
          {operateurs.map((o) => (
            <option key={o.id} value={o.id}>{o.nom} ({o.email})</option>
          ))}
        </select>

        <label>Objet</label>
        <input type="text" placeholder="Résumé de la demande…" value={objet} onChange={(e) => setObjet(e.target.value)} />

        <label>Catégorie</label>
        <select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
          <option value="">— Choisir —</option>
          {categories.map((c) => (
            <option key={c.documentId} value={c.documentId}>{c.libelle}</option>
          ))}
        </select>

        <label>Concerne <span style={{ fontWeight: 400, color: 'var(--muted-warm)', fontSize: 12.5 }}>— rattachement optionnel</span></label>
        <select value={concerne} onChange={(e) => setConcerne(e.target.value)} disabled={operateurId === ''}>
          <option value="">Question générale</option>
          {rattachements.candidatures.map((c) => (
            <option key={c.documentId} value={`candidature:${c.documentId}`}>
              Dossier {c.numeroDossier || '(brouillon)'} — {c.titreProjet}
            </option>
          ))}
          {rattachements.subventions.map((s) => (
            <option key={s.documentId} value={`subvention:${s.documentId}`}>
              Subvention {s.numeroConvention || `(${s.statut})`}
            </option>
          ))}
        </select>

        <label>Message <span style={{ fontWeight: 400, color: 'var(--muted-warm)', fontSize: 12.5 }}>— reformulez la demande de l&apos;opérateur</span></label>
        <textarea rows={4} placeholder="Ce que l’opérateur a exprimé…" value={corps} onChange={(e) => setCorps(e.target.value)} />

        <div className="gx-actions" style={{ marginTop: 18, alignItems: 'center' }}>
          <button type="button" className="gx-btn gx-btn-primary" disabled={busy} onClick={submit}>
            {busy ? 'Création…' : 'Créer la demande'}
          </button>
          <span style={{ fontSize: 12.5, color: 'var(--muted-warm)' }}>
            L&apos;opérateur est notifié (e-mail/SMS) et retrouve la demande dans son espace.
          </span>
        </div>
      </div>

      <p className="gx-annot">
        <b>H4 — origine : équipe.</b> Trace les sollicitations téléphoniques dans le même canal. La demande est prise en
        charge par son créateur ; l&apos;opérateur peut répondre en ligne comme pour n&apos;importe quelle demande.
      </p>
    </div>
  );
}
