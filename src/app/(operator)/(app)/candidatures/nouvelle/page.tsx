import Link from 'next/link';
import { createDraftAction } from '../../../actions';
import { getPortalOpenCalls, getPortalOrganisation, getPortalTypePieces } from '@/lib/portal-api';

export default async function NewApplicationPage() {
  const [organisation, openCalls, typePieces] = await Promise.all([
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
        <p className="operator-page-intro">
          {organisation
            ? 'Votre profil organisation est deja connu. Verifiez les informations au demarrage du formulaire.'
            : 'Votre premiere candidature consolidera aussi votre profil organisation, lu ensuite dans tout le portail.'}
        </p>
        <div className="operator-checklist">
          <p>Appel rattache automatiquement : <strong>{openCall?.nom || 'Aucun appel ouvert'}</strong></p>
          <p>Pieces de l&apos;Annexe 9 : <Link href="/faq-documents">consulter la liste preparatoire</Link></p>
          <p>Le formulaire Module 3 s&apos;ouvrira ensuite dans le dossier brouillon avec ses 4 etapes de saisie et de depot.</p>
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
