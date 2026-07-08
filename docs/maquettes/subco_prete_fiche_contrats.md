# SUBCO-PRETE — Fiche de contrats (Portail opérateur)
### Document vivant · phase Module 2 + coquille → alimente le prompt scaffold CODEX

> But : figer les **contrats** interdépendants (identité, session, statuts, référentiels) pendant qu'on wireframe, pour que le prompt CODEX du scaffold soit net et sans valeurs inventées ni codées en dur.
> Mise à jour au fil des décisions. Dernière révision : parcours d'auth en cours de wireframe.

---

## 1. Auth & rôles *(acté)*

- **Socle d'identité unique** : un seul backend d'identité (Strapi **Users & Permissions**, ou IdP dédié plus tard). Pas de duplication de la vérif email / réinit mot de passe / session / durcissement sur plusieurs systèmes.
- **Autorisation pilotée par le `role`**, jamais par un simple booléen « connecté ». Le shell lit déjà `role` (verrou « Ma subvention »).
- **`role` ∈ énum ouvert** : `candidat | beneficiaire | instructeur | ugp | comite | banque`.
  - Le **parcours opérateur** ne pose jamais que `candidat` puis `beneficiaire`.
  - Les autres rôles sont **anticipés dans le modèle** mais **pas construits** cette phase.
- **Chemins de création distincts, primitive de login commune** :
  - Auto-inscription (portail public) → **`candidat` uniquement**.
  - Internes (UGP, cabinet/instructeurs, comité, Banque mondiale) → **provisionnés** par admin / seed, rôles élevés. **Porte de login séparée**, route distincte, durcissable indépendamment (MFA, restriction d'accès) — **construite en phase back-office (Modules 5–7)**.
- **Éditeurs de contenu = admins Strapi natifs** (panneau d'admin CMS), **hors auth applicative**. Ne jamais faire instruire des dossiers dans l'admin Strapi.
- ⚠️ **Piège Strapi à ne pas confondre** : *admins Strapi* (édition de contenu) ≠ *Users & Permissions* (identités applicatives exposées au front). Opérateurs **et** internes vivent dans **Users & Permissions**, différenciés par `role`.
- **Portes d'entrée séparées, socle commun** : le portail public ne montre **que** le login opérateur. « Un seul portail évolutif » = décision **opérateur** (candidat→bénéficiaire) ; ne signifie pas opérateur + back-office dans le même espace.

**Hors périmètre de cette phase (explicite)** : écrans de login back-office, UI d'administration des utilisateurs, gestion des rôles, espace comité.

---

## 2. Session *(v0)*

```
Session = {
  userId,
  orgName,        // lu par le shell → salutation « Bonjour, {orgName} »
  email,
  emailVerified,  // bool
  phone?,         // optionnel selon décision D1
  role            // 'candidat' | 'beneficiaire' | (internes plus tard)
}
```
- Le shell lit `orgName` (salutation) et `role` (verrou « Ma subvention »).
- `role` passe à `beneficiaire` **uniquement** après une candidature **sélectionnée + convention signée**.

---

## 3. Statuts de candidature *(v0 — pilotent « Mes candidatures » + la timeline Module 4)*

```
brouillon → soumis → reçu → complétude → éligibilité → évaluation → décision
                                                                        ├─ sélectionné  → (convention) → role = beneficiaire
                                                                        └─ non-sélectionné
```
- **Règle multi-candidatures** *(actée)* : une seule candidature vivante à la fois ; « + Nouvelle candidature » réapparaît **uniquement** après non-sélection sur **tous** les appels précédents **et** ouverture d'un **nouvel** appel (un appel = une candidature max).
- L'énum de statuts vit dans **REFERENTIELS**, jamais en dur.

---

## 4. Référentiels touchés cette phase

- **Énum des statuts de candidature** (ci-dessus).
- **Énum des rôles** (ci-dessus).
- Au niveau **organisation** (donc capté **à la 1re candidature**, pas à l'inscription) : type d'opérateur, filières (5 + transversal), provinces/communes (**garde-fou remap ancien découpage → 5 provinces / 42 communes**).
- L'**auth elle-même** ne touche quasiment aucun référentiel (identité pure).

---

## 5. Décisions coquille déjà actées *(rappel)*

- Layout **A** (barre latérale, tiroir mobile).
- Cloche 🔔 dans le header ; « Besoin d'aide ? » permanent.
- « Ma subvention » **présente mais verrouillée** jusqu'à conversion (doctrine B).
- Sections bénéficiaire **regroupées** sous « Ma subvention » (doctrine B).
- « Mon compte » (auth : email/mdp/téléphone) **en pied fixe** de la barre latérale, séparé de « Mon organisation » (profil métier).
- Assistance : **entrée dédiée** ; libellés **« FAQ & documents »** + **« Assistance »** (jamais « ticket » côté opérateur → « demande d'assistance »).
- Salutation **par nom d'organisation**. Timeline de suivi à 5 étapes (… → **Décision**).

---

## 6. Décisions du parcours d'auth *(tranchées)*

- **D1** — Téléphone capté **à la 1re candidature** (pas à l'inscription), puis remonté dans « Mon compte ». L'écran d'inscription ne le demande pas.
- **D2** — Vérification email = **porte dure** : compte inactif tant que l'email n'est pas vérifié ; aucun accès ni brouillon avant vérification. Un login sur compte non vérifié affiche un message + « renvoyer le lien » au lieu d'entrer. *(Durcissement au périmètre auth, distinct de la doctrine « garde-fou mou » qui reste valable côté soumission.)*
- **D3** — Identité minimale à l'inscription = **{ nom d'organisation, email, mot de passe }**. Nom de contact / responsable capté au **profil organisation** (1re candidature), pas à l'inscription.
- **D4** — Messages neutres **anti-énumération** sur « mot de passe oublié » (message identique que le compte existe ou non).

---

## 7. Jonction Module 3 ↔ portail *(tranchée)*

**Résolution du CTA « + Nouvelle candidature »** (le portail résout un point d'entrée, ne place pas un bouton fixe) :

| État compte / candidature | CTA | Destination |
|---|---|---|
| Aucune, appel ouvert | + Nouvelle candidature | Avant de commencer → Étape 1 (création) |
| Brouillon en cours | Reprendre | Module 3, dernière étape atteinte |
| Soumise / en instruction | Suivre mon dossier | Mes candidatures (timeline M4) |
| Non-sélection sur tous + nouvel appel | + Nouvelle candidature | Avant de commencer → Étape 1 (ultérieure) |
| Non-sélection + aucun appel ouvert | *(pas de CTA)* | Bandeau « prochain appel à venir » |

**Écran « Avant de commencer » (J3)** : interstitiel **plein écran**, jamais une modale. Deux variantes — *première* (annonce la création du profil organisation, inclut la ligne « informations d'organisation ») et *ultérieure* (profil déjà connu, à vérifier). Ligne « pièces de l'Annexe 9 » = **lien réel** vers « FAQ & documents » (liste des 18 pièces gérée dans les Référentiels).

**Routage de consolidation** — l'étape 1 alimente **deux** enregistrements :
- **Profil Organisation** (1/compte) : nom org, statut juridique, siège (province→commune, adresse), téléphone (1re saisie), contact. **J1 progressif** : naît/écrit au fil des sauvegardes. **J2** : toute modif ultérieure met à jour ce **maître** (source de vérité de « Identique au siège »).
- **Candidature** (N/compte, 1 vivante) : rattachement AAP + déclarations §5, puis projet (étapes 2–4).

**Garde-fous actés :**
- **Appel auto-défini** : un seul appel ouvert → le rattachement AAP est affiché, pas choisi (choix uniquement si plusieurs appels ouverts simultanément).
- **Immutabilité des dossiers soumis** : une modif du profil maître (J2) alimente le pré-remplissage futur et « Mon organisation » mais **ne réécrit jamais** un dossier déjà soumis (PDF permanent = instantané figé).

**J4 reporté** : réutiliser un dossier non retenu comme base d'une nouvelle candidature — confort Cohorte 2, hors pilote (le profil organisation se pré-remplit de toute façon).

---

## 8. Mes candidatures *(tranchée)*

Registre personnel de l'opérateur (pendant candidat du registre des dépôts §8.5). Job unique : **retrouver un dossier et agir selon son statut**. Deux sections : **En cours** (0–1 ligne, la candidature vivante) et **Historique** (0..N, dossiers clos). État vide tourné vers l'action, jamais page nue. CTA « + Nouvelle candidature » visible **seulement si aucune candidature vivante** (mêmes règles que le tableau de bord).

**Ligne** = titre projet · cohorte · statut · date · actions. Numéro affiché **à partir de « soumis »**.

**Actions par statut :**
| Statut (libellé regroupé — M2) | Actions |
|---|---|
| ✎ Brouillon | Reprendre · PDF brouillon (filigrané) · **Supprimer** |
| ⏳ En instruction | Voir le suivi · PDF du dossier (permanent, figé) |
| ✓ Sélectionné | Voir le suivi · PDF *(la suite dans « Ma subvention »)* |
| ✗ Non retenu | PDF *(dossier consultable, figé)* |

- **M1** — Suppression réservée au **brouillon**, **confirmation simple** (« définitif »), pas de saisie de sécurité.
- **M2** — **Libellés regroupés** sur la ligne (`Brouillon · En instruction · Sélectionné · Non retenu`) ; la chaîne fine (reçu→complétude→éligibilité→évaluation) est résumée par « En instruction », son détail vit dans le suivi Module 4.
- **M3** — **« Voir le suivi » → page dédiée** (Module 4), pas un dépliage en accordéon.
- **M4** *(défaut)* — tri anti-chronologique ; « En cours » toujours au-dessus de « Historique ».

---

## 9. Suivi de dossier — Module 4 *(tranchée)*

Page dédiée ouverte par « Voir le suivi ». Job : répondre à « où en est mon dossier, ai-je quelque chose à faire ». Seul écran post-dépôt pouvant appeler une **action** de l'opérateur.

- **Timeline verticale** à 5 phases : Reçu → Complétude → Éligibilité → Évaluation → Décision (états fait / en cours / à venir, dates réelles sur le fait, pas d'ETA spéculatif).
- **N1 — cloisonnement** : on montre les **phases**, jamais les notes / classement / délibération (grille §6 = back-office). « Évaluation » visible comme phase, sans détail.
- **N2 — complément (variante A, actée)** : quand l'UGP réclame une pièce pendant la complétude, un bloc « Action requise » apparaît (pièce demandée + **échéance**), avec **dépôt en AJOUT** — n'altère jamais le dossier soumis figé. *Délai exact et nombre d'allers-retours = placeholders, à confirmer Manuel / Annexe 11.*
- **N3 — décision** : résultat + **motif officiel court** (si l'UGP en saisit un, jamais de note chiffrée) + **notification de décision signée/scannée** téléchargeable, jointe par le backend. *Slot provisionné — pas explicitement prescrit par le Manuel, à confirmer UGP.*
- **Variantes terminales** : Sélectionné → encart + « Accéder à Ma subvention » (déverrouille l'entrée du menu) ; Non retenu → motif + notification signée.
- **Journal de notifications du dossier** : e-mail/SMS rattachés à ce dossier (aussi agrégés dans « Notifications » global).
- **N4** *(défauts)* : timeline verticale (tient sur mobile) ; PDF permanent toujours accessible.

---

## 10. État de la phase — prêt pour le scaffold CODEX

Ossature opérateur complète et wireframée : **auth (porte)** → **coquille (conteneur)** → **jonction** → **Module 3 (formulaire, déjà livré)** → **Mes candidatures** → **suivi Module 4**. Prochaine étape : rédaction du **prompt scaffold CODEX** (shell + auth + layout App Router + modèle de données + tableau de bord piloté par l'état), à partir des sections 1–9 de cette fiche.

**Points « à confirmer » à ne pas perdre** : délai/allers-retours de complétude (Annexe 11) ; notification de décision signée (N3) ; liste des 18 pièces Annexe 9 ; noms des 42 communes (UGP).
