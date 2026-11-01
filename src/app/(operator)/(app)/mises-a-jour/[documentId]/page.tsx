import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDemandeMaj } from '@/lib/portal-api';
import { DemandeMajForm } from '@/components/demande-maj-form';

function dateFr(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function DemandeMajPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const demande = await getDemandeMaj(documentId);
  if (!demande) notFound();

  const enRetard = demande.echeance ? new Date(demande.echeance).getTime() < Date.now() : false;

  return (
    <section className="operator-card">
      <Link href="/mises-a-jour" className="operator-back-link">
        ← Toutes les mises à jour
      </Link>

      <h1 className="operator-block-title">{demande.type?.libelle || 'Mise à jour demandée'}</h1>
      <p className="operator-candidature-num">
        Dossier {demande.candidature?.numeroDossier} — {demande.candidature?.titreProjet}
      </p>

      {demande.texteDemande ? <p>{demande.texteDemande}</p> : null}

      <p className={enRetard ? 'operator-auth-error' : 'operator-field-note'}>
        {enRetard
          ? `L’échéance du ${dateFr(demande.echeance)} est passée.`
          : `À répondre avant le ${dateFr(demande.echeance)}.`}
      </p>

      <DemandeMajForm demande={demande} />
    </section>
  );
}
