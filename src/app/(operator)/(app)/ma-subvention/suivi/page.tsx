import { requireSubvention, frDate } from '@/lib/portal-subvention-ui';
import { deposerRapportAction, deposerMesureAction } from '../../../actions';

export default async function SuiviPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const deposited = Array.isArray(params.depose) ? params.depose[0] : params.depose;
  const subvention = await requireSubvention('suivi');
  const jalons = (subvention.jalons || []).slice().sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
  const rapports = (subvention.rapports || []).slice().sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
  const mesure = (subvention.mesuresCorrectives || []).find((m) => m.statut === 'en_cours');

  return (
    <div className="operator-page">
      <h1 className="operator-page-title-row">
        Suivi du projet
        <span className="operator-statuschip chip-benef">Bénéficiaire</span>
      </h1>
      <p className="operator-page-intro">L’avancement de votre projet et les rapports à transmettre.</p>
      {deposited ? <p className="operator-auth-note">Document déposé.</p> : null}

      <div className="operator-block-title">Avancement (calendrier contractuel)</div>
      <section className="operator-card">
        <div className="operator-timeline">
          {jalons.map((j) => {
            const done = Boolean(j.dateReelle);
            const current = !done && jalons.filter((x) => x.dateReelle).length === jalons.indexOf(j);
            return (
              <div key={j.documentId} className={`operator-tl-step${done ? ' done' : ''}${current ? ' current' : ''}`}>
                <span className="operator-tl-bead" />
                <div className="operator-tl-label">{j.etape?.libelle || 'Étape'}</div>
                <div className="operator-tl-meta">{j.dateReelle ? frDate(j.dateReelle) : j.datePrevue ? `prévu ${frDate(j.datePrevue)}` : 'à venir'}</div>
              </div>
            );
          })}
        </div>
      </section>

      {mesure ? (
        <section className="operator-card operator-amber-card">
          <div className="operator-block-title amber">⚠ Mesure corrective en cours</div>
          <p>{mesure.description} {mesure.echeance ? <><strong>À régulariser avant le {frDate(mesure.echeance)}</strong>.</> : null}</p>
          <form action={deposerMesureAction} className="operator-actionbox">
            <input type="hidden" name="documentId" value={mesure.documentId} />
            <label className="operator-action-drop">
              Déposez ici votre pièce de régularisation
              <input type="file" name="fichier" accept=".pdf,image/*" required />
            </label>
            <button type="submit" className="operator-amber-btn">Envoyer la régularisation</button>
          </form>
        </section>
      ) : null}

      <div className="operator-block-title">Mes rapports à transmettre</div>
      <section className="operator-card">
        {rapports.length === 0 ? <p className="operator-muted">Aucun rapport requis.</p> : rapports.map((r) => (
          <div key={r.documentId} className="operator-rap-row">
            <div className="operator-rap-main">
              <span className="operator-rap-name">{r.type?.libelle || 'Rapport'}{r.periodeLibelle ? ` — ${r.periodeLibelle}` : ''}</span>
              <span className="operator-rap-meta">{r.echeance ? `échéance ${frDate(r.echeance)}` : 'à la clôture'}</span>
            </div>
            <div className="operator-rap-action">
              {r.statut === 'transmis' ? (
                <span className="operator-tag tag-ok">Transmis{r.dateTransmission ? ` le ${frDate(r.dateTransmission)}` : ''}</span>
              ) : r.statut === 'echu' ? (
                <form action={deposerRapportAction} className="operator-rap-deposit">
                  <span className="operator-tag tag-due">Échu</span>
                  <input type="hidden" name="documentId" value={r.documentId} />
                  <input type="file" name="fichier" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" required className="operator-rap-file" />
                  <button type="submit" className="operator-upload-btn">Déposer</button>
                </form>
              ) : (
                <span className="operator-tag tag-fut">À venir</span>
              )}
            </div>
          </div>
        ))}
        <p className="operator-field-note">ℹ L’absence de transmission des rapports requis peut entraîner la suspension des paiements (Art. 12).</p>
      </section>
    </div>
  );
}
