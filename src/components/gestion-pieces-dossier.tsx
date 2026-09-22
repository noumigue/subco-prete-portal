'use client';

import { useState } from 'react';
import type { GestionPiecesDossier as Donnees } from '@/lib/portal-types';
import { portalMediaUrl } from '@/lib/portal-media';

// Bloc « Pieces du dossier » des ecrans d'evaluation (fiche de scoring, consolidation).
// Place EN HAUT de la page, comme a l'eligibilite : sur telephone, les groupes passent les uns
// sous les autres. Repliable, ouvert par defaut.
const GROUPES: { cle: string; titre: string }[] = [
  { cle: 'administratif', titre: 'Administratives' },
  { cle: 'financier', titre: 'Financières' },
  { cle: 'technique', titre: 'Techniques' },
];

export function GestionPiecesDossier({ donnees }: { donnees: Donnees | null | undefined }) {
  const [ouvert, setOuvert] = useState(true);
  if (!donnees) return null;
  const { pieces, autres } = donnees;
  const nbDeposees = pieces.filter((p) => p.depot || p.complement).length;
  const nbComplements = pieces.filter((p) => p.complement).length + autres.length;
  const groupesConnus = new Set(GROUPES.map((g) => g.cle));
  const blocs = [
    ...GROUPES.map((g) => ({ ...g, liste: pieces.filter((p) => p.groupe === g.cle) })),
    { cle: 'autre', titre: 'Autres', liste: pieces.filter((p) => !groupesConnus.has(p.groupe)) },
  ].filter((b) => b.liste.length);

  return (
    <div className="gx-card">
      <div className="gx-block-title">
        Pièces du dossier
        <span className="gx-tot">
          {nbDeposees} déposée(s){nbComplements ? ` · ${nbComplements} complément(s) reçu(s)` : ''}
          {' · '}
          <button type="button" className="gx-pdoss-toggle" onClick={() => setOuvert((v) => !v)} aria-expanded={ouvert}>
            {ouvert ? 'Masquer ▴' : 'Afficher ▾'}
          </button>
        </span>
      </div>
      {ouvert ? (
        <>
          <div className="gx-pdoss-grid">
            {blocs.map((b) => (
              <div key={b.cle}>
                <div className="gx-grp-title">{b.titre}</div>
                {b.liste.map((p) => {
                  const cible = p.complement || p.depot;
                  return (
                    <div className="gx-pdoss-row" key={p.libelle}>
                      <span className="gx-pdoss-lib">
                        {p.libelle}
                        {p.complement ? <span className="gx-pill gx-pill-ok" style={{ marginLeft: 6 }}>complément reçu</span> : null}
                      </span>
                      {cible ? (
                        <a className="gx-pdoss-dl" href={portalMediaUrl(cible.url) || '#'} target="_blank" rel="noopener noreferrer" title={`Ouvrir « ${cible.nom} »`}>⤓ Ouvrir</a>
                      ) : (
                        <span className="gx-pdoss-vide">non fourni</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {autres.length ? (
            <div style={{ marginTop: 10 }}>
              <div className="gx-grp-title">Autres pièces reçues</div>
              {autres.map((a, i) => (
                <div className="gx-pdoss-row" key={`${a.libelle}-${i}`}>
                  <span className="gx-pdoss-lib">{a.libelle}{a.spontanee ? <span className="gx-pill gx-pill-ok" style={{ marginLeft: 6 }}>ajoutée par le candidat</span> : null}</span>
                  <a className="gx-pdoss-dl" href={portalMediaUrl(a.url) || '#'} target="_blank" rel="noopener noreferrer">⤓ Ouvrir</a>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
