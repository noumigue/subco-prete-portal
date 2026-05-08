'use client';

import { FormEvent, useState } from 'react';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1338';

export default function CandidaturePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      fullName: String(fd.get('fullName') || ''),
      email: String(fd.get('email') || ''),
      phone: String(fd.get('phone') || ''),
      organization: String(fd.get('organization') || ''),
      valueChain: String(fd.get('valueChain') || ''),
      projectTitle: String(fd.get('projectTitle') || ''),
      projectSummary: String(fd.get('projectSummary') || ''),
      submittedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${STRAPI_URL}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const out = await res.json();
      const ref = out?.data?.reference || out?.data?.id;
      setMessage(`Candidature soumise avec succès. Référence: ${ref}`);
      form.reset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setMessage(`Erreur de soumission: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1>Déposer une candidature</h1>
        <p style={{ color: 'var(--ink-soft)' }}>
          Renseignez ce formulaire pour soumettre votre dossier à un appel en cours.
        </p>

        <form onSubmit={onSubmit} className="card" style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          <input name="fullName" required placeholder="Nom complet" className="input" />
          <input name="email" type="email" required placeholder="Email" className="input" />
          <input name="phone" placeholder="Téléphone" className="input" />
          <input name="organization" required placeholder="Organisation" className="input" />

          <select name="valueChain" required className="input">
            <option value="">Chaîne de valeur</option>
            <option value="fruits">Fruits</option>
            <option value="volaille">Volaille</option>
            <option value="lait">Lait</option>
            <option value="pisciculture">Pisciculture</option>
            <option value="mines">Mines</option>
          </select>

          <input name="projectTitle" required placeholder="Titre du projet" className="input" />
          <textarea
            name="projectSummary"
            required
            placeholder="Résumé du projet"
            className="input"
            rows={6}
          />

          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Soumission...' : 'Soumettre ma candidature'}
          </button>
        </form>

        {message && <p style={{ marginTop: 12 }}>{message}</p>}
      </div>
    </main>
  );
}
