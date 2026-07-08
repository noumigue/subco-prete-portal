# Prompt CODEX — Scaffold du Portail opérateur SUBCO-PRETE
### Squelette *runnable* · un seul prompt, trois parties (Strapi → Next.js → critères d'acceptation)

> À coller dans CODEX. Objectif : un **squelette qui tourne** — l'auth fonctionne (porte dure), la coquille rend, le tableau de bord lit l'état, « Mes candidatures » et le suivi lisent Strapi via seed. Le formulaire (Module 3) reste un **point de montage vide**. Le back-office (Modules 5–7) est **hors périmètre**.
>
> **Sources de vérité** — comportement & visuel : les maquettes HTML déjà livrées (`subco_prete_module2_coquille.html`, `subco_prete_module2_auth.html`, `subco_prete_module3_jonction.html`, `subco_prete_mes_candidatures.html`, `subco_prete_module4_suivi.html`). Contrats de données & décisions : `subco_prete_fiche_contrats.md` (sections 1–9). En cas de divergence documentaire projet, le **Manuel de gestion des subventions fait foi**.

---

## 0. Contexte & doctrine (à respecter partout)

- **Projet** : mécanisme de subventions de contrepartie (matching grant), Banque mondiale / PRETE Nyunganira, Burundi. Cible : opérateurs d'infrastructures productives (MPME, coopératives, associations, ONG).
- **Stack** : **Strapi** (CMS + Users & Permissions) ; **Next.js (App Router)** ; **ISR + revalidation par webhook** pour le contenu ; helpers de fetch typés.
- **Rien en dur** : toutes les listes de valeurs viennent de **REFERENTIELS** (content-types Strapi), éditables sans redéploiement.
- **Sobriété** : public rural, faible littératie numérique. Responsive mobile, focus clavier visible, `prefers-reduced-motion` respecté, langage simple, français.
- **Palette (design system)** : vert pin `#155446` (dégradé bandeaux `#17564a → #0e3d34`), émeraude `#2e9d63` (actions), fond crème `#f1eee5`, sage `#d6e4d4` / tuiles `#dcecdd` bordure `#c4dcc6`. Réutiliser le CSS des maquettes.

---

## 1. Périmètre

**Le scaffold produit** : content-types Strapi (référentiels + transactionnels) + rôles/permissions + seed de démo ; auth Next.js branchée sur Users & Permissions (porte dure) ; coquille (barre latérale / header / footer) ; tableau de bord piloté par l'état ; pages « Mes candidatures » et « Suivi de dossier » branchées sur Strapi ; page « Nouvelle candidature » = interstitiel + **point de montage Module 3**.

**Le scaffold EXCLUT** (ne pas construire) : le formulaire Module 3 (déjà livré, monté plus tard) ; le back-office et la **porte de login interne** (Modules 5–7) ; le **contenu réel** des référentiels (18 pièces, 42 communes, textes d'aide — édités dans le CMS après) ; les valeurs « à confirmer » (délai de complétude, notification de décision signée) — on provisionne la **forme** (énum, slot, relation), jamais la valeur.

---

# Partie A — Strapi (schéma + permissions + seed)

> Deux natures de données, différenciées par les permissions :
> **Référentiels / contenu** = lecture publique, servis en **ISR**. **Transactionnel** = privé, propre à l'opérateur, **jamais mis en cache** (dynamique), filtré par propriétaire.

## A.1 — Content-types RÉFÉRENTIELS (lecture publique)

| Content-type | Champs | Notes |
|---|---|---|
| `appel` (AAP / cohorte) | `nom` (string), `codeCohorte` (string, ex. `C1`), `ouvertLe` (date), `clotureLe` (date), `statut` (enum: `ouvert` \| `ferme` \| `a_venir`) | Le tableau de bord et la jonction lisent l'appel `ouvert`. |
| `filiere` | `nom`, `slug`, `transversal` (bool) | 5 filières + transversal. `transversal:true` = carte distincte. |
| `province` | `nom`, `code` | Découpage **post-réforme 2025 : 5 provinces**. |
| `commune` | `nom`, `province` (relation → province) | **42 communes** (noms à valider UGP — seed partiel). |
| `statutJuridique` | `libelle`, `ordre` | Référentiel simple. |
| `typeContrepartie` | `libelle`, `ordre` | Référentiel simple. |
| `typePiece` (Annexe 9) | `libelle`, `groupe` (enum: `administratif` \| `financier` \| `technique`), `exigence` (enum: `obligatoire` \| `si_applicable` \| `si_disponible`), `ordre` | **18 types** (seed partiel). Sert « FAQ & documents » et le futur Module 3. |
| `statutCandidature` | `code` (uid, ex. `en_instruction`), `libelleCandidat` (string), `groupe` (enum regroupé: `brouillon` \| `en_instruction` \| `selectionne` \| `non_retenu`), `phase` (enum fin: `recu` \| `completude` \| `eligibilite` \| `evaluation` \| `decision`), `ordre` | **L'énum de statut n'est pas en dur** (§3). `groupe` = libellés regroupés côté opérateur (M2) ; `phase` = détail fin réservé au suivi M4. |
| `contenuAide` | `cle` (uid), `titre`, `corps` (rich text) | Textes d'aide (ex. exemples d'infrastructure). |

> **Machine à états** : les *transitions* autorisées entre statuts sont de la **logique applicative** (à câbler plus tard, côté instruction/back-office). Le scaffold se contente de **lire** le statut courant d'une candidature. Documenter l'ordre canonique : `brouillon → soumis → recu → completude → eligibilite → evaluation → decision(selectionne|non_retenu)`.

## A.2 — Content-types TRANSACTIONNELS (privés, dynamiques, filtrés par propriétaire)

| Content-type | Champs | Notes |
|---|---|---|
| `organisation` | `owner` (relation → user U&P, 1–1), `nom`, `statutJuridique` (rel), `filierePrincipale` (rel → filiere, optionnel), `province` (rel), `commune` (rel), `adresse`, `telephone`, `contact` (optionnel) | **1 par compte.** Consolidée **progressivement** (J1) ; **source de vérité** (J2, lue par « Identique au siège » du futur Module 3). |
| `candidature` | `owner` (rel → user), `appel` (rel), `organisation` (rel), `titreProjet`, `statut` (rel → statutCandidature), `numeroDossier` (string, **null jusqu'à soumission**), `dateDepot` (datetime, null tant que brouillon), `donneesProjet` (JSON, **placeholder** — rempli par le futur Module 3), `pdfPermanent` (media, **instantané figé** à la soumission), `notificationDecision` (media, **slot provisionné** — N3, à confirmer) | N par compte, **1 vivante** à la fois (règle multi-candidatures). |
| `complement` | `candidature` (rel), `pieceDemandee` (string), `echeance` (date), `statut` (enum: `demande` \| `fourni`), `fichier` (media) | **N2-A.** Dépôt en **AJOUT** — ne modifie jamais `pdfPermanent`. Délai/échéance = placeholder (Annexe 11, à confirmer). |
| `notification` | `owner` (rel → user), `candidature` (rel, optionnel), `canal` (enum: `email` \| `sms` \| `both`), `sujet`, `corps`, `envoyeLe` (datetime), `lu` (bool) | Journal e-mail/SMS. Rattachée au dossier (suivi M4) **et** agrégée dans « Notifications » global. |

Numérotation : `numeroDossier` au format `PRETE-AP-{codeCohorte}-{annee}-{séquence:5}` (ex. `PRETE-AP-C1-2026-00042`), attribué **uniquement à la soumission**.

## A.3 — Users & Permissions (rôles, propriété, porte dure)

- **Rôles** : provisionner l'énum complète `candidat | beneficiaire | instructeur | ugp | comite | banque` (§1). **Ne construire que `candidat`** (permissions + parcours). `beneficiaire` = même compte, statut élevé après sélection + convention (déverrouille « Ma subvention »). Rôles internes : **provisionnés, non construits** (permissions/UI back-office = hors périmètre).
- **Auto-inscription** → rôle **`candidat` uniquement**.
- **Propriété (ownership)** : un `candidat` ne lit/écrit **que ses propres** `organisation`, `candidature`, `complement`, `notification` (policies/filtres par `owner`). Les référentiels : **lecture publique**.
- **D2 — porte dure** : activer la **confirmation d'e-mail** de Users & Permissions. Compte `confirmed:false` à l'inscription ; **connexion et accès bloqués** tant que non confirmé. Réinitialisation de mot de passe activée. **Pas d'OTP SMS.** Le SMS est réservé aux accusés/notifications (passerelle Econet/Lumitel via agrégateur = dépendance d'infra externe, **stub** ici).

## A.4 — Seed de démonstration (placeholders, PAS le contenu réel)

- 1 `appel` **ouvert** (Cohorte 1, clôture future).
- Les **5 filières** (+ transversal), les **5 provinces**, **quelques communes** par province, une poignée de `statutJuridique` / `typeContrepartie`, **quelques `typePiece`** couvrant les 3 groupes, et les entrées `statutCandidature` de l'ordre canonique.
- **1 utilisateur `candidat` de démo confirmé**, avec `organisation` consolidée + **candidatures dans plusieurs états** (1 brouillon, 1 soumise/en instruction, 1 non retenue) + `notification`s associées, pour que « Mes candidatures » et le suivi M4 **rendent avec des données**.

---

# Partie B — Next.js (App Router)

## B.1 — Structure & garde par rôle
- **Route groups** : `(public)` (accueil, éligibilité, candidater, FAQ — déjà existants pour le Module 1) et **`(app)`** (authentifié).
- Le layout `(app)` **garde l'accès** : session valide requise ; redirection vers `/connexion` sinon. Résolution des sections par **`role`** (pas un booléen « connecté »).

## B.2 — Auth (branchée sur Users & Permissions — porte dure D2)
Pages, calquées sur `subco_prete_module2_auth.html` : `/inscription`, `/verifier-email` (**mur bloquant**, renvoi du lien avec compte à rebours), `/connexion` (gère le cas **non confirmé** → message + renvoi du lien, **pas d'entrée**), `/mot-de-passe-oublie` (message **neutre anti-énumération**, D4), `/reinitialiser`. Atterrissage de vérification → « compte actif » → `/tableau-de-bord`.
- Inscription = **set minimal** { nom d'organisation, e-mail, mot de passe } (D3). **Pas de téléphone** (capté à la 1re candidature, D1).
- **Session (§2)** : `{ userId, orgName, email, emailVerified, phone?, role }`. Stocker le JWT Strapi en **cookie httpOnly** ; exposer une session serveur au layout `(app)`.

## B.3 — Coquille (layout authentifié)
Calquée sur `subco_prete_module2_coquille.html` : **barre latérale gauche** (tiroir sur mobile), header (logo, « Besoin d'aide ? » permanent, cloche 🔔 + badge non-lus, chip **nom d'organisation**), footer sobre.
- Menu : Tableau de bord · Mon organisation · Mes candidatures · **Ma subvention** (présente, **verrouillée** grisée+cadenas tant que `role !== beneficiaire`, sous-onglets Convention/Jalons/Décaissements ouverts après conversion) · Notifications · FAQ & documents · Assistance. **« Mon compte » en pied fixe** (auth : e-mail/mdp/téléphone).
- Salutation **par `orgName`**.

## B.4 — Tableau de bord piloté par l'état (§7)
Résout le CTA « + Nouvelle candidature » selon l'état (règle **multi-candidatures** : une seule vivante ; réapparaît après non-sélection sur **tous** les appels + **nouvel** appel ouvert) :

| État | CTA | Destination |
|---|---|---|
| Aucune candidature, appel ouvert | + Nouvelle candidature | `/candidatures/nouvelle` (Avant de commencer) |
| Brouillon en cours | Reprendre | point de montage Module 3, dernière étape |
| Soumise / en instruction | Suivre mon dossier | `/candidatures/[id]/suivi` |
| Non-sélection sur tous + nouvel appel | + Nouvelle candidature | `/candidatures/nouvelle` |
| Non-sélection + aucun appel | *(pas de CTA)* | bandeau « prochain appel à venir » |

## B.5 — Mes candidatures (`subco_prete_mes_candidatures.html`)
Sections **En cours** (0–1) / **Historique** (0..N). Ligne = titre · cohorte · **statut regroupé (M2, via `statutCandidature.groupe`)** · date · actions selon statut (brouillon : Reprendre / PDF filigrané / **Supprimer** ; en instruction : Voir le suivi / PDF permanent ; sélectionné : Voir le suivi / PDF ; non retenu : PDF). `numeroDossier` affiché **à partir de soumis**. Suppression réservée au brouillon, **confirmation simple** (M1). CTA conditionnel (mêmes règles que B.4). État vide tourné vers l'action.

## B.6 — Suivi de dossier (`subco_prete_module4_suivi.html`) — `/candidatures/[id]/suivi`
**Page dédiée** (M3). **Timeline verticale** à 5 phases (`statutCandidature.phase`). **Cloisonnement N1** : phases uniquement, **jamais** notes/classement/délibération (§6). **Complément N2-A** : si un `complement` `demande` existe → bloc « Action requise » (pièce + échéance + **dépôt en ajout**, jamais réécriture de `pdfPermanent`). **Journal** des `notification` du dossier. Terminaux : **sélectionné** (encart + notification signée + « Accéder à Ma subvention », déverrouille l'entilement) / **non retenu** (motif court + **notification de décision signée** — slot N3, à confirmer). PDF permanent toujours accessible.

## B.7 — Nouvelle candidature (`subco_prete_module3_jonction.html`) — `/candidatures/nouvelle`
Interstitiel **plein écran** « Avant de commencer », **2 variantes** (première : annonce la création du profil + ligne « informations d'organisation » ; ultérieure : profil déjà connu, à vérifier). Ligne « pièces de l'Annexe 9 » = **lien réel** vers « FAQ & documents ». « Commencer » **crée un `candidature` brouillon** rattaché au compte + à l'appel ouvert, puis redirige vers le **point de montage Module 3** :
```
// TODO(Module 3) : monter ici le formulaire de candidature déjà livré
// (parcours 4 étapes + confirmation). Le scaffold s'arrête au montage.
```
**Garde-fou appel auto-défini** : un seul appel ouvert → rattachement AAP **affiché, non choisi** (choix seulement si plusieurs appels ouverts).

## B.8 — Couche de données
- **Helpers de fetch typés** vers Strapi (types partagés dérivés des content-types A.1/A.2).
- **Référentiels** : rendu **ISR** + **revalidation par webhook** Strapi (contenu éditable sans redéploiement).
- **Transactionnel** : rendu **dynamique** (`no-store`), filtré par `owner` côté serveur.
- **Garde-fou référentiel provinces** : au pré-remplissage, une province de l'**ancien découpage** est **remappée** vers les **5 provinces actuelles** ; ne jamais réinjecter une valeur périmée.
- **Immutabilité** : une modif du profil `organisation` (J2) alimente le pré-remplissage futur et « Mon organisation », mais **ne réécrit jamais** un dossier déjà soumis (`pdfPermanent` = instantané figé).

---

# Partie C — Critères d'acceptation

1. `npm run develop` (Strapi) et `next dev` démarrent sans erreur ; le seed crée l'appel ouvert, les référentiels partiels et l'utilisateur `candidat` de démo.
2. **Porte dure** : un compte fraîchement inscrit **ne peut pas** se connecter ni accéder à `(app)` tant que l'e-mail n'est pas confirmé ; l'écran de vérification propose le renvoi du lien.
3. Après confirmation, la connexion mène au tableau de bord ; la session expose `orgName` et `role`.
4. Le **header salue par nom d'organisation** ; « Ma subvention » est **verrouillée** pour un `candidat` et **déverrouillée** pour un `beneficiaire`.
5. Le **CTA du tableau de bord se résout** correctement pour les 5 états (B.4), règle multi-candidatures incluse (aucun bouton mort quand aucun appel n'est ouvert).
6. « Mes candidatures » affiche **En cours / Historique** avec **libellés regroupés** ; les actions varient par statut ; `numeroDossier` n'apparaît qu'à partir de soumis.
7. La **suppression d'un brouillon** demande une **confirmation simple** et n'est possible que sur un brouillon.
8. Le **suivi M4** affiche la timeline à 5 phases **sans** note ni délibération ; le bloc **complément** apparaît si un `complement` `demande` existe et son dépôt **n'altère pas** `pdfPermanent`.
9. Les variantes **sélectionné / non retenu** affichent le résultat, le motif court et le **slot de notification signée**.
10. Un `candidat` ne peut **lire/écrire que ses propres** enregistrements (test d'isolation par propriétaire).
11. **Aucune liste de valeurs n'est codée en dur** : filières, provinces, communes, statuts, pièces viennent de Strapi ; l'édition dans le CMS se reflète (référentiels en **ISR + revalidation**).
12. « + Nouvelle candidature » crée un **brouillon** rattaché au compte + à l'appel, puis atteint le **point de montage Module 3** (stub `TODO`).
13. Responsive mobile (tiroir latéral), focus clavier visible, `prefers-reduced-motion` respecté, français, palette du design system.
14. **Hors périmètre respecté** : ni formulaire Module 3, ni back-office, ni porte de login interne ne sont construits ; les rôles internes existent dans l'énum mais sans permissions/UI.

---

## Annexe — Fichiers de référence
- **Comportement & visuel** : `subco_prete_module2_coquille.html`, `subco_prete_module2_auth.html`, `subco_prete_module3_jonction.html`, `subco_prete_mes_candidatures.html`, `subco_prete_module4_suivi.html`.
- **Contrats & décisions** : `subco_prete_fiche_contrats.md` (sections 1–9).
- **Points « à confirmer »** (provisionner la forme, pas la valeur) : délai/allers-retours de complétude (Annexe 11) ; notification de décision signée (N3) ; liste des 18 pièces (Annexe 9) ; noms des 42 communes (UGP).
