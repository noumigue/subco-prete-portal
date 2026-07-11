'use client';

import type { GestionAppel } from '@/lib/portal-types';
import { cloreAppelAction, ouvrirAppelAction } from '@/app/(gestion)/actions';

const frDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : null);

function describeAppel(a: GestionAppel) {
  if (a.statut === 'ouvert') {
    return [a.ouvertLe ? `ouvert le ${frDate(a.ouvertLe)}` : null, a.clotureLe ? `clôture ${frDate(a.clotureLe)}` : null].filter(Boolean).join(' · ');
  }
  if (a.statut === 'ferme') return a.clotureLe ? `clôturé le ${frDate(a.clotureLe)}` : 'clôturé';
  return a.ouvertLe ? `ouverture prévisionnelle le ${frDate(a.ouvertLe)}` : 'ouverture prévisionnelle à venir';
}

function Statut({ statut }: { statut?: string }) {
  if (statut === 'ouvert') return <span className="gx-pill gx-pill-ok">● Ouvert</span>;
  if (statut === 'ferme') return <span className="gx-pill gx-pill-rej">Fermé</span>;
  return <span className="gx-pill gx-pill-comp">À venir</span>;
}

export function GestionAppels({ appels, isUgp, flash }: { appels: GestionAppel[]; isUgp: boolean; flash: string | null }) {
  return (
    <>
      <h1 className="gx-page-title">Appels à propositions</h1>
      <p className="gx-page-sub">Pilotage des appels — le statut « ouvert » gouverne le portail candidat.</p>
      {flash ? <div className="gx-flash">{flash}</div> : null}

      {appels.map((a) => (
        <div className="gx-arow" key={a.documentId}>
          <div className="gx-main">
            <div className="gx-an">{a.nom}</div>
            <div className="gx-ad">{describeAppel(a)}</div>
          </div>
          <Statut statut={a.statut} />
          {isUgp && a.statut === 'ouvert' ? (
            <form action={cloreAppelAction} onSubmit={(e) => { if (!confirm("Clore cet appel ? Le CTA « + Nouvelle candidature » disparaîtra côté portail.")) e.preventDefault(); }}>
              <input type="hidden" name="documentId" value={a.documentId} />
              <button type="submit" className="gx-btn gx-btn-danger gx-btn-sm">Clore l&apos;appel</button>
            </form>
          ) : null}
          {isUgp && a.statut === 'a_venir' ? (
            <form action={ouvrirAppelAction} onSubmit={(e) => { if (!confirm("Ouvrir cet appel ? Le CTA « + Nouvelle candidature » apparaîtra côté portail.")) e.preventDefault(); }}>
              <input type="hidden" name="documentId" value={a.documentId} />
              <button type="submit" className="gx-btn gx-btn-primary gx-btn-sm">Ouvrir l&apos;appel</button>
            </form>
          ) : null}
        </div>
      ))}

      <p className="gx-annot">
        <b>Écran minimal du socle.</b> Ouvrir/clore un appel sans passer par l&apos;admin Strapi. Seul <code>ouvert</code> déclenche le CTA candidat ;
        « à venir » = bandeau d&apos;information. L&apos;action déclenche la revalidation du cache portail. La création/édition détaillée d&apos;un appel reste dans le CMS.
      </p>
    </>
  );
}
