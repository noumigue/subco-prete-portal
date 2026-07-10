import { requireSubvention, bif, frDate } from '@/lib/portal-subvention-ui';
import { deposerConditionAction } from '../../../actions';

export default async function PreparationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const deposited = Array.isArray(params.depose) ? params.depose[0] : params.depose;
  const subvention = await requireSubvention('preparation');
  const conditions = (subvention.conditionsPrealables || []).slice().sort((a, b) => (a.ordre || 0) - (b.ordre || 0));

  return (
    <div className="operator-page">
      <h1 className="operator-page-title-row">
        Ma subvention
        <span className="operator-statuschip chip-prep">Sélectionné — convention en préparation</span>
      </h1>
      <p className="operator-page-intro">
        Félicitations — votre projet a été retenu. Avant la signature de la convention, les conditions ci-dessous doivent être satisfaites.
      </p>
      {deposited ? <p className="operator-auth-note">Votre justificatif a été déposé.</p> : null}

      <div className="operator-block-title">Conditions préalables à la signature</div>
      <section className="operator-card">
        {conditions.length === 0 ? <p className="operator-muted">Aucune condition enregistrée.</p> : conditions.map((c) => (
          <div key={c.documentId} className="operator-cond-row">
            <span className={`operator-cond-state ${c.statut === 'validee' ? 'st-ok' : c.statut === 'action_requise' ? 'st-act' : 'st-wait'}`}>
              {c.statut === 'validee' ? '✓' : c.statut === 'action_requise' ? '!' : '○'}
            </span>
            <div className="operator-cond-body">
              <div className="operator-cond-title">{c.libelle}</div>
              <div className="operator-cond-meta">
                {c.statut === 'validee'
                  ? `Validé le ${frDate(c.dateValidation)}`
                  : c.statut === 'action_requise'
                    ? 'Une action de votre part est attendue'
                    : 'En cours d’examen par l’UGP'}
              </div>
              {c.statut === 'action_requise' && !c.fichierDepose ? (
                <form action={deposerConditionAction} className="operator-actionbox">
                  <p>Déposez votre justificatif {c.echeance ? <><strong>avant le {frDate(c.echeance)}</strong></> : null}.</p>
                  <input type="hidden" name="documentId" value={c.documentId} />
                  <label className="operator-action-drop">
                    Déposez ici votre justificatif (PDF ou image)
                    <input type="file" name="fichier" accept=".pdf,image/*" required />
                  </label>
                  <button type="submit" className="operator-amber-btn">Envoyer le justificatif</button>
                </form>
              ) : null}
              {c.statut === 'action_requise' && c.fichierDepose ? (
                <div className="operator-cond-meta">Justificatif déposé — en attente de validation par l’UGP.</div>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      <section className="operator-card operator-callout">
        ℹ La signature de la convention interviendra une fois toutes les conditions levées. Vous serez notifié par e-mail et SMS.
        Votre statut deviendra alors <strong>bénéficiaire</strong>.
      </section>

      <p className="operator-annot">
        <strong>Vue unique pré-signature.</strong> Les trois sous-sections renvoient ici tant que la convention n’est pas signée.
        Le rôle reste <strong>candidat</strong> ; il passe à <strong>bénéficiaire</strong> à la signature (§8.13).
        L’ACD (Attestation de Conformité préalable au Décaissement) est établie par l’UGP — aucune action de votre part.
      </p>
    </div>
  );
}
