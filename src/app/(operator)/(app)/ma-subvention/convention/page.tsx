import { requireSubvention, bif, pct, frDate } from '@/lib/portal-subvention-ui';
import { portalMediaUrl } from '@/lib/portal-media';
import type { PortalDonneesProjet } from '@/lib/portal-types';

export default async function ConventionPage() {
  const subvention = await requireSubvention('convention');
  const projet = ((subvention.candidature?.donneesProjet as PortalDonneesProjet) || {}).projet || {};
  const impact = ((subvention.candidature?.donneesProjet as PortalDonneesProjet) || {}).impact || {};
  const docs = (subvention.documentsContractuels || []).slice().sort((a, b) => (a.lettre || '').localeCompare(b.lettre || ''));
  const pdfUrl = portalMediaUrl(subvention.pdfConvention?.url);
  const avenants = subvention.avenants || [];

  return (
    <div className="operator-page">
      <h1 className="operator-page-title-row">
        Ma convention
        <span className="operator-statuschip chip-benef">Bénéficiaire</span>
      </h1>
      <p className="operator-page-intro">Votre convention de subvention et ses documents contractuels.</p>

      <section className="operator-card operator-callout">
        <div className="operator-cv-head">
          <span className="operator-cv-num">{subvention.numeroConvention || 'Numéro en attente'}</span>
          {subvention.dateSignature ? <span>signée le {frDate(subvention.dateSignature)}</span> : null}
          {pdfUrl ? (
            <a href={pdfUrl} target="_blank" rel="noopener" className="operator-primary-btn operator-btn-sm operator-cv-pdf">⤓ Convention signée (PDF)</a>
          ) : null}
        </div>
      </section>

      <div className="operator-block-title">Le projet</div>
      <section className="operator-card">
        <dl className="operator-kv">
          <div><dt>Intitulé</dt><dd>{subvention.candidature?.titreProjet || '—'}</dd></div>
          <div><dt>Chaîne de valeur</dt><dd>{projet.filiere || '—'}</dd></div>
          <div><dt>Localisation</dt><dd>{[projet.siteCommune, projet.siteProvince].filter(Boolean).join(', ') || '—'}</dd></div>
          <div><dt>Type d’infrastructure</dt><dd>{projet.typeInfrastructure || '—'}</dd></div>
          <div><dt>Bénéficiaires directs</dt><dd>{impact.mpme || projet.mpmeDesservies || '—'}</dd></div>
        </dl>
      </section>

      <div className="operator-block-title">Financement</div>
      <section className="operator-card">
        <dl className="operator-kv">
          <div><dt>Coût total du projet</dt><dd>{bif(subvention.montantTotal)}</dd></div>
          <div><dt>Subvention PRETE</dt><dd>{bif(subvention.montantSubvention)} ({pct(subvention.montantSubvention, subvention.montantTotal)})</dd></div>
          <div><dt>Votre contrepartie</dt><dd>{bif(subvention.montantContrepartie)} ({pct(subvention.montantContrepartie, subvention.montantTotal)})</dd></div>
        </dl>
      </section>

      <div className="operator-block-title">Documents contractuels</div>
      <section className="operator-card">
        <div className="operator-annexes">
          {docs.length === 0 ? <p className="operator-muted">Aucun document.</p> : docs.map((d) => {
            const url = portalMediaUrl(d.fichier?.url);
            return (
              <div key={d.documentId} className="operator-anx">
                <span className="operator-anx-letter">{d.lettre}</span>
                <span className="operator-anx-name">{d.titre}</span>
                {url ? <a href={url} target="_blank" rel="noopener" className="operator-text-link">⤓</a> : <span className="operator-muted">—</span>}
              </div>
            );
          })}
        </div>
        <p className="operator-field-note">Avenants : {avenants.length === 0 ? 'aucun.' : `${avenants.length} avenant(s).`}</p>
      </section>
    </div>
  );
}
