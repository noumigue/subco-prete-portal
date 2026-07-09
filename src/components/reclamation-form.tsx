'use client';

import { useState } from 'react';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1338';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo par fichier

const TYPES = [
  { value: 'complaint', label: 'Réclamation / plainte (processus, équité, conduite)' },
  { value: 'recourse', label: 'Recours — contester une décision' },
  { value: 'eas_hs', label: 'Signalement E&S ou VBG/EAS-HS (confidentiel)' },
];

export function ReclamationForm() {
  const [type, setType] = useState('complaint');
  const [anonymous, setAnonymous] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [ref, setRef] = useState('');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [ticket, setTicket] = useState('');

  function handleFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (selected.length === 0) return;

    const combined = [...files, ...selected];
    const tooBig = combined.find((f) => f.size > MAX_FILE_SIZE);
    if (tooBig) {
      setState('error');
      setMessage(`Chaque pièce doit faire moins de 10 Mo — « ${tooBig.name} » dépasse cette limite.`);
      return;
    }
    if (combined.length > MAX_FILES) {
      setState('error');
      setMessage(`Vous pouvez joindre au maximum ${MAX_FILES} pièces.`);
      return;
    }
    setFiles(combined);
    if (state === 'error') {
      setState('idle');
      setMessage('');
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!subject.trim() || !details.trim()) {
      setState('error');
      setMessage('Veuillez renseigner l’objet et la description.');
      return;
    }
    if (!anonymous && (!fullName.trim() || !email.trim())) {
      setState('error');
      setMessage('Indiquez un nom et un e-mail, ou cochez « signalement anonyme ».');
      return;
    }

    setState('submitting');
    setMessage('');

    try {
      let attachmentIds: number[] = [];
      if (files.length > 0) {
        const uploadForm = new FormData();
        files.forEach((file) => uploadForm.append('files', file));
        const uploadRes = await fetch(`${STRAPI_URL}/api/upload`, {
          method: 'POST',
          body: uploadForm,
        });
        if (!uploadRes.ok) {
          setState('error');
          setMessage("L’envoi des pièces jointes a échoué. Réessayez, ou envoyez sans pièce jointe.");
          return;
        }
        const uploaded = await uploadRes.json().catch(() => []);
        attachmentIds = (Array.isArray(uploaded) ? uploaded : [])
          .map((file: { id?: number }) => file?.id)
          .filter((id): id is number => typeof id === 'number');
      }

      const response = await fetch(`${STRAPI_URL}/api/complaint-recourses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            fullName: anonymous ? 'Anonyme' : fullName.trim(),
            email: anonymous ? 'anonyme@non-communique.local' : email.trim(),
            type,
            relatedSubmissionRef: ref.trim() || null,
            subject: subject.trim(),
            details: details.trim(),
            supportingDocuments: attachmentIds,
            status: 'received',
          },
        }),
      });

      if (response.ok) {
        const body = await response.json().catch(() => null);
        setTicket(body?.data?.documentId || '');
        setState('success');
        return;
      }
      setState('error');
      setMessage("L’envoi a échoué. Réessayez, ou écrivez à subco@prete.bi.");
    } catch {
      setState('error');
      setMessage("Impossible d’envoyer pour le moment. Réessayez plus tard.");
    }
  }

  if (state === 'success') {
    return (
      <div className="reclamation-success">
        <h2>✓ Votre message a été reçu</h2>
        <p>Il sera instruit par l’UGP de manière confidentielle.</p>
        {ticket ? (
          <p>
            Référence de suivi : <strong className="reclamation-ticket">{ticket}</strong>
            <br />
            Conservez-la pour toute correspondance ultérieure.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form className="reclamation-form" onSubmit={handleSubmit}>
      <label className="reclamation-field">
        <span>Nature de la demande</span>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>

      <label className="reclamation-check">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
        <span>Signalement anonyme — ne pas transmettre mon identité</span>
      </label>

      {!anonymous ? (
        <div className="reclamation-grid">
          <label className="reclamation-field">
            <span>Nom complet</span>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Prénom et nom" />
          </label>
          <label className="reclamation-field">
            <span>Adresse e-mail</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nom@exemple.bi" />
          </label>
        </div>
      ) : (
        <p className="reclamation-hint">
          Aucune coordonnée ne sera enregistrée. N’indiquez pas d’information permettant de vous identifier dans les champs
          ci-dessous si vous souhaitez rester anonyme.
        </p>
      )}

      <label className="reclamation-field">
        <span>N° de dossier concerné <em>(si applicable)</em></span>
        <input type="text" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="PRETE-AP-C1-2026-…" />
      </label>

      <label className="reclamation-field">
        <span>Objet</span>
        <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Résumé en une ligne" required />
      </label>

      <label className="reclamation-field">
        <span>Description</span>
        <textarea rows={5} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Décrivez les faits, dates et personnes concernées." required />
      </label>

      <div className="reclamation-field">
        <span>Pièces jointes <em>(facultatif — {MAX_FILES} maximum, 10 Mo par fichier)</em></span>
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          onChange={handleFilesChange}
        />
        {files.length > 0 ? (
          <ul className="reclamation-files">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`}>
                <span className="reclamation-file-name">{file.name}</span>
                <button
                  type="button"
                  className="reclamation-file-remove"
                  onClick={() => removeFile(index)}
                  aria-label={`Retirer ${file.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {state === 'error' ? <p className="reclamation-error">{message}</p> : null}

      <button type="submit" className="btn primary" disabled={state === 'submitting'}>
        {state === 'submitting' ? 'Envoi…' : 'Envoyer'}
      </button>
    </form>
  );
}
