// Echeances en jours ouvres — meme regle qu'au CMS (utils/maturation.js), ou elle fait foi.
// Elle vit ici pour que l'ecran puisse PROPOSER une date par defaut ; c'est le CMS qui la
// pose. La date se calcule cote serveur et descend en props : calculee dans le navigateur,
// elle differerait du rendu serveur des que l'un des deux franchit minuit, et React
// signalerait une discordance d'hydratation.

/** Date a J + n jours OUVRES, au format AAAA-MM-JJ. */
export function jourOuvre(n: number, depuis = new Date()) {
  const d = new Date(depuis.getTime());
  let restants = Math.max(1, n);
  while (restants > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const jour = d.getUTCDay();
    if (jour !== 0 && jour !== 6) restants -= 1;
  }
  return d.toISOString().slice(0, 10);
}
