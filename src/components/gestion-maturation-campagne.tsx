'use client';

import { useState, useTransition } from 'react';
import type { GestionTypeDemandeMaj, SimulationCampagne } from '@/lib/gestion-api';
import { lancerCampagneMajAction, simulerCampagneMajAction } from '@/app/(gestion)/actions';

// Lancement d'une campagne de demandes.
//
// La simulation precede toujours le lancement — meme deroule que les campagnes d'e-mail :
// on voit combien de dossiers seraient servis, lesquels le sont deja, et a quelle
// echeance, avant que le premier courriel ne parte.
//
// Les dossiers se collent par NUMERO, un par ligne : c'est ce que l'equipe a sous la main,
// pas des identifiants de document. Le CMS resout « 00127 » comme « PRETE-AP-C1-2026-00127 ».

export function GestionMaturationCampagne({ types }: { types: GestionTypeDemandeMaj[] }) {
  const [ouvert, setOuvert] = useState(false);
  const [typeDocumentId, setType] = useState(types[0]?.documentId || '');
  const [campagne, setCampagne] = useState('');
  const [dossiers, setDossiers] = useState('');
  const [joursOuvres, setJours] = useState<number>(types[0]?.delaiJoursDefaut || 5);
  const [echeance, setEcheance] = useState('');
  const [simulation, setSimulation] = useState<SimulationCampagne | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, startTransition] = useTransition();

  const liste = dossiers.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);

  // Un bouton grise n'explique rien. On nomme ce qui manque, dans l'ordre ou l'ecran le demande.
  const manquant: string[] = [];
  if (!typeDocumentId) manquant.push('le type de demande');
  if (!campagne.trim()) manquant.push('la clé de campagne');
  if (liste.length === 0) manquant.push('au moins un dossier');
  const pretASimuler = manquant.length === 0;

  function simuler() {
    setErreur(null); setMessage(null);
    startTransition(async () => {
      try {
        const r = await simulerCampagneMajAction({ typeDocumentId, candidatures: liste, campagne, joursOuvres });
        if (r.ok && r.simulation) setSimulation(r.simulation);
        else { setSimulation(null); setErreur(r.error || 'La simulation a échoué.'); }
      } catch (e) {
        // Sans ce filet, une action serveur qui leve ne produit RIEN a l'ecran : ni resultat,
        // ni message. L'operateur clique et croit l'ecran casse.
        setSimulation(null);
        setErreur(`La simulation n’a pas abouti : ${e instanceof Error ? e.message : 'erreur inattendue'}.`);
      }
    });
  }

  function lancer() {
    setErreur(null); setMessage(null);
    startTransition(async () => {
      try {
        const r = await lancerCampagneMajAction({
          typeDocumentId, candidatures: liste, campagne, joursOuvres,
          ...(echeance ? { echeance: new Date(`${echeance}T21:59:00Z`).toISOString() } : {}),
        });
        if (r.ok) {
          setMessage(`${r.creees} demande(s) créée(s)${r.ignorees?.length ? ` · ${r.ignorees.length} déjà servi(s)` : ''}.`);
          setSimulation(null);
        } else setErreur(r.error || 'Le lancement a échoué.');
      } catch (e) {
        setErreur(`Le lancement n’a pas abouti : ${e instanceof Error ? e.message : 'erreur inattendue'}.`);
      }
    });
  }

  if (!ouvert) {
    return (
      <button type="button" className="gx-btn gx-btn-ghost" onClick={() => setOuvert(true)}>
        Nouvelle campagne
      </button>
    );
  }

  return (
    <article className="gx-card">
      <h2 className="gx-block-title">Nouvelle campagne</h2>

      <label htmlFor="mat-type">Type de demande</label>
      <select id="mat-type" value={typeDocumentId} onChange={(e) => setType(e.target.value)}>
        {types.map((t) => (
          <option key={t.documentId} value={t.documentId}>{t.libelle}</option>
        ))}
      </select>

      <label htmlFor="mat-cle">Clé de campagne</label>
      <input
        id="mat-cle"
        type="text"
        value={campagne}
        placeholder="matur-lot1"
        onChange={(e) => setCampagne(e.target.value)}
      />
      <p className="gx-meta">
        Elle dédoublonne : relancer la même clé ne sert que les dossiers qui n’ont pas encore reçu.
      </p>

      <label htmlFor="mat-dossiers">Dossiers — un numéro par ligne</label>
      <textarea
        id="mat-dossiers"
        rows={5}
        value={dossiers}
        placeholder={'00127\n00043\n00183'}
        onChange={(e) => setDossiers(e.target.value)}
      />
      <p className="gx-meta">{liste.length} dossier(s) saisi(s).</p>

      <label htmlFor="mat-echeance">Échéance — à poser depuis la date du Comité</label>
      <input id="mat-echeance" type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} />
      <p className="gx-meta">
        Laissée vide, l’échéance tombe à {joursOuvres} jours ouvrés.{' '}
        <input
          type="number"
          min={1}
          max={30}
          value={joursOuvres}
          onChange={(e) => setJours(Number(e.target.value))}
          style={{ width: 70, display: 'inline-block' }}
        />
      </p>

      {simulation ? (
        <div className="gx-mat-simulation">
          <strong>Simulation — rien n’est encore parti.</strong>
          <ul className="gx-plist">
            <li>{simulation.vises} dossier(s) visé(s), dont <strong>{simulation.aCreer}</strong> à servir</li>
            {simulation.dejaServis.length > 0 ? <li>Déjà servis : {simulation.dejaServis.join(', ')}</li> : null}
            {simulation.demandeEnCours?.length > 0 ? (
              <li className="gx-mat-erreur">
                Demande déjà en cours, ces dossiers seront écartés : {simulation.demandeEnCours.join(', ')}
              </li>
            ) : null}
            {simulation.introuvables?.length > 0 ? (
              <li className="gx-mat-erreur">Introuvables : {simulation.introuvables.join(', ')}</li>
            ) : null}
            <li>Échéance : {new Date(simulation.echeance).toLocaleDateString('fr-FR')}</li>
            <li>Pièces demandées : {simulation.pieces.join(', ') || 'aucune'}</li>
            <li>Montants ouverts : {simulation.montantsOuverts ? 'oui' : 'non'}</li>
          </ul>
        </div>
      ) : null}

      {erreur ? <p className="gx-mat-erreur">{erreur}</p> : null}
      {message ? <p className="gx-meta"><strong>{message}</strong></p> : null}

      {!pretASimuler ? (
        <p className="gx-meta">
          Pour simuler, il manque encore <strong>{manquant.join(' et ')}</strong>.
        </p>
      ) : null}

      <div className="gx-actions">
        <button type="button" className="gx-btn gx-btn-ghost" disabled={enCours || !pretASimuler} onClick={simuler}>
          {enCours ? 'Simulation en cours…' : 'Simuler'}
        </button>
        <button
          type="button"
          className="gx-btn gx-btn-primary"
          disabled={enCours || !simulation || simulation.aCreer === 0}
          onClick={lancer}
        >
          Lancer la campagne
        </button>
        <button type="button" className="gx-btn gx-btn-ghost" onClick={() => setOuvert(false)}>
          Fermer
        </button>
      </div>
      <p className="gx-meta">
        Le lancement n’est possible qu’après une simulation : c’est elle qui dit ce qui partira.
        {simulation ? '' : ' Tant qu’elle n’a pas répondu, le bouton de lancement reste inactif.'}
      </p>
    </article>
  );
}
