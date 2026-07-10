import Link from 'next/link';
import {
  getPortalCandidatures,
  getPortalCategoriesAssistance,
  getPortalSubvention,
} from '@/lib/portal-api';
import { createDemandeAssistanceAction } from '../../../actions';

export default async function NewAssistancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const preCandidature = Array.isArray(params.candidature) ? params.candidature[0] : params.candidature;
  const preSubvention = Array.isArray(params.subvention) ? params.subvention[0] : params.subvention;

  const [categories, candidatures, subvention] = await Promise.all([
    getPortalCategoriesAssistance(),
    getPortalCandidatures(),
    getPortalSubvention(),
  ]);

  // « Concerne » : Question générale + dossiers de l'opérateur + sa subvention (A3).
  const concerneOptions = [
    { value: '', label: 'Question générale' },
    ...candidatures
      .filter((c) => c.numeroDossier)
      .map((c) => ({ value: `candidature:${c.documentId}`, label: `Dossier ${c.numeroDossier}` })),
    ...(subvention ? [{ value: `subvention:${subvention.documentId}`, label: `Subvention ${subvention.numeroConvention || ''}` }] : []),
  ];
  const preselected = preCandidature ? `candidature:${preCandidature}` : preSubvention ? `subvention:${preSubvention}` : '';

  return (
    <div className="operator-page">
      <Link href="/assistance" className="operator-back-link">← Mes demandes</Link>
      <h1>Nouvelle demande d&apos;assistance</h1>
      <p className="operator-page-intro">Décrivez votre difficulté : l&apos;équipe du projet vous répondra.</p>

      <div className="operator-faq-line">
        💡 La réponse est peut-être déjà dans la <Link href="/faq-documents">FAQ →</Link>
      </div>
      {error ? <p className="operator-auth-error">{error === 'champs' ? 'Objet et message sont requis.' : error}</p> : null}

      <section className="operator-card">
        <form action={createDemandeAssistanceAction}>
          <div className="operator-form-field">
            <label>Objet <span className="operator-form-subtle">— en une phrase</span></label>
            <input type="text" name="objet" required placeholder="Ex. Je n’arrive pas à joindre une pièce" />
          </div>

          <div className="operator-form-field">
            <label>Catégorie</label>
            <select name="categorie" defaultValue="">
              <option value="">Sélectionner…</option>
              {categories.map((c) => (
                <option key={c.documentId} value={c.documentId}>{c.libelle}</option>
              ))}
            </select>
          </div>

          <div className="operator-form-field">
            <label>Concerne <span className="operator-form-subtle">— pré-rempli si vous venez d’une page précise</span></label>
            <select name="concerne" defaultValue={preselected}>
              {concerneOptions.map((o) => (
                <option key={o.value || 'general'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="operator-form-field">
            <label>Votre message</label>
            <textarea name="corps" rows={4} required placeholder="Décrivez ce qui se passe…" />
          </div>

          <div className="operator-form-field">
            <label>Pièce jointe <span className="operator-form-subtle">— optionnelle (photo, capture d’écran…)</span></label>
            <input type="file" name="piece" accept=".pdf,image/*" />
          </div>

          <div className="operator-form-actions">
            <button type="submit" className="operator-primary-btn inline">Envoyer la demande</button>
            <span className="operator-field-note">L&apos;équipe vous répondra dans les meilleurs délais — vous serez notifié par e-mail et SMS.</span>
          </div>
        </form>
      </section>
    </div>
  );
}
