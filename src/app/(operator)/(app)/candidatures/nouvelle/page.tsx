import Link from 'next/link';
import { createDraftAction } from '../../../actions';
import { getPortalOpenCalls, getPortalOrganisation, getPortalTypePieces } from '@/lib/portal-api';

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, organisation, openCalls, typePieces] = await Promise.all([
    searchParams,
    getPortalOrganisation(),
    getPortalOpenCalls(),
    getPortalTypePieces(),
  ]);
  const openCall = openCalls[0];

  return (
    <div className="operator-page operator-interstitial-page">
      <section className="operator-card operator-card-large">
        <p className="operator-kicker">Nouvelle candidature</p>
        <h1>Avant de commencer</h1>
        {error ? (
          <p className="operator-flash operator-flash-error" role="alert">
            La création n’a pas pu démarrer : {error === 'creation' ? 'une erreur est survenue.' : error}
          </p>
        ) : null}
        <p className="operator-page-intro">
          {organisation
            ? 'Votre profil organisation est déjà connu. Vérifiez les informations au démarrage du formulaire.'
            : 'Votre première candidature consolidera aussi votre profil organisation, lu ensuite dans tout le portail.'}
        </p>
        <div className="operator-checklist">
          <p>Appel rattaché automatiquement : <strong>{openCall?.nom || 'Aucun appel ouvert'}</strong></p>
          <p>Pièces de l&apos;Annexe 9 : <Link href="/faq-documents#pieces">consulter la liste préparatoire</Link></p>
          <p>Le formulaire Module 3 s&apos;ouvrira ensuite dans le dossier brouillon avec ses 4 étapes de saisie et de dépôt.</p>
        </div>
        <div className="operator-doc-strip">
          {typePieces.slice(0, 4).map((item) => (
            <span key={item.documentId}>{item.libelle}</span>
          ))}
        </div>
        <form action={createDraftAction}>
          <button type="submit" className="operator-primary-btn inline" disabled={!openCall}>Commencer</button>
        </form>
      </section>
    </div>
  );
}
