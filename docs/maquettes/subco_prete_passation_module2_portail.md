# SUBCO-PRETE — Passation de contexte
## Pour lancer : Module 2 (compte) + coquille du Portail opérateur

> À coller / joindre au début de la nouvelle conversation (même Projet).
> Objectif de la nouvelle phase : construire le **conteneur** qui accueille le formulaire de candidature (Module 3 déjà fait) — c.-à-d. le **compte candidat/opérateur (Module 2)** et l'**espace sécurisé de l'opérateur (Portail CANDIDAT)**, afin d'avoir où brancher le formulaire et d'implémenter le flow complet : création compte → candidature → brouillon → accusé mail/SMS → suivi de dossier.

---

## 1. Le projet en une prise

- **SUBCO-PRETE** : mécanisme de subventions de contrepartie (matching grant) financé Banque mondiale, projet **PRETE Nyunganira**, Burundi. Cible : opérateurs d'infrastructures productives (MPME, coopératives, associations, ONG, fournisseurs de services numériques).
- **5 filières prioritaires + projets transversaux** (formulation figée — jamais « 6 chaînes de valeur ») : Fruits tropicaux, Volaille, Pisciculture, Lait, Industrie minière ; + Projet transversal.
- **Stack** : implémentation via **CODEX**, contenu via **Strapi**, front **Next.js (App Router, ISR)**. Site : **subco-prete.bi**.
- **Hiérarchie documentaire** : le **Manuel de gestion des subventions fait foi** partout où il diverge de l'Offre technique CODEX. Annexes clés : 9 (pièces du dossier), 11 (check-list complétude), 5 (éligibilité), 10 (pré-identification), 12 (screening E&S) ; grille d'évaluation §6.
- **Méthode de travail attendue** : en français ; architecture validée **avant** artefacts ; wireframe étape par étape → feedback → HTML → prompt CODEX ; proposer des options comparatives avant de trancher ; challenger toute contrainte non fondée dans les docs.

---

## 2. État d'avancement

- **Module 1 (portail public)** : livré (accueil, éligibilité, candidater, bandes, FAQ, articles Infra Productive).
- **Module 3 (formulaire de candidature)** : **conçu et livré** en HTML autonome fonctionnel — `subco_prete_module3_parcours.html` (à joindre au nouveau chat). 4 étapes + confirmation. C'est la « feuille » qui doit maintenant s'accrocher à l'« arbre » (le portail).
- **À construire** : **Module 2** (compte), **Portail opérateur** (coquille), puis **Module 4** (suivi de dossier). Restent ensuite Modules 5 (back-office instruction), 6 (S&E), 7 (admin), et le **module Référentiels**.

---

## 3. Module 3 — périmètre et décisions verrouillées (le formulaire à brancher)

- **Périmètre** : Module 3 = **dossier complet d'appel à propositions** (PAS l'AMI léger). L'AMI n'est pas une porte obligatoire ; le Manuel fait foi.
- **Parcours en 4 étapes + confirmation** :
  1. **Cadrage & éligibilité** — rattachement AAP (cohorte) ; porte d'éligibilité §5 (auto-déclarations **bloquantes**, dont contrepartie ≥ 20 % et conflit d'intérêt) ; identité opérateur (dont **téléphone** pour le SMS ; province→commune).
  2. **Le projet** — titre libre ; chaîne de valeur ; **type d'infrastructure = texte libre + (i) exemples à la demande** (aucune liste imposée) ; localisation du site (cascade + « Identique au siège ») ; statut du site ; usage collectif ; maturité ; **note conceptuelle courte (max 600 car., compteur décompté)**.
  3. **Économie & impact** — budget / contrepartie (numériques formatés, **contrôle ≥ 20 % en direct**, pas de stepper) ; type de contrepartie ; modèle éco en bref ; **chiffres d'inclusion** (MPME, femmes, jeunes, réfugiés, emplois) → **bonus inclusion estimé** (indicatif).
  4. **Pièces & soumission** — **screening E&S léger obligatoire → révèle l'upload PGES si risque** ; **pièces de l'Annexe 9 une par slot** en accordéons (Administratif / Financier / Technique), statuts obligatoire / si applicable / si disponible ; **complétude auto (Annexe 11) en vue candidat**.
  - **Confirmation** : numéro `PRETE-AP-C1-2026-000xx`, accusé **email + SMS**, registre des dépôts (§8.5), bouton PDF, sortie unique « Retour à mon compte ».
- **Retiré / abandonné** : le « Formulaire de candidature » (pièce n°2 Annexe 9) **n'est ni uploadé ni auto-généré** — la saisie en tient lieu ; ligne « plafond subvention » retirée du récap ; champ « calendrier financier » retiré ; tracker « prochaines étapes » retiré de la confirmation ; CTA « suivi » prématuré retiré.
- **Doctrine UX** : saisie légère / lourdeur dans les pièces jointes ; sobriété (public rural, faible capacité numérique) ; distinction nette **à saisir vs à déposer** ; brouillon & reprise partout ; écran de synthèse ; langage simple.
- **Défauts encore ouverts (à réévaluer)** : bonus inclusion visible ou non au candidat ; modèle de financement à 2 sources (subvention + contrepartie = budget) ; soumission en garde-fou **mou** (avertit au lieu de bloquer).

---

## 4. Décisions Module 2 déjà actées

- **Compte léger** : inscription minimale (email + mot de passe + identité de base). Pas de long profil avant de candidater.
- **Profil opérateur/siège consolidé à la première candidature** : les données de l'étape 1 du formulaire alimentent le profil du compte.
- **« Identique au siège » (étape 2 du formulaire)** lit ce **profil consolidé** comme source de vérité.
- **Garde-fou référentiel** : au pré-remplissage, une province de l'**ancien découpage** est remappée vers les **5 provinces actuelles** (ne jamais réinjecter une valeur périmée).
- **Auth pilote** : email + mot de passe, vérification d'email, réinitialisation. **Pas d'OTP SMS.** Le SMS est réservé aux accusés/notifications → **la passerelle SMS (Econet / Lumitel via agrégateur) est LA dépendance d'infra à confirmer**.

---

## 5. Portail opérateur — proposition à valider en ouverture

- **Recommandation : un seul portail évolutif** (même login). Après sélection + convention, le **CANDIDAT devient BÉNÉFICIAIRE** et de nouvelles sections s'ouvrent (Convention, Jalons, Décaissements). Un opérateur = un compte = un lieu dont le contenu change avec le statut.
- **Menu proposé** :
  - Tableau de bord (statut compte, AAP ouverts, raccourci « Nouvelle candidature »)
  - Mon organisation (profil opérateur / siège consolidé)
  - **Mes candidatures** ← *point de branchement du Module 3* : brouillons (Reprendre, **PDF brouillon filigrané « brouillon — non soumis », sans numéro**) + dossiers soumis (numéro, statut, **PDF permanent**, suivi)
  - Notifications (historique email/SMS)
  - Aide & documents
  - *(post-conversion)* Convention, Jalons, Décaissements
- **Où vit le flow** : création compte → **Module 2** ; formulaire → **Module 3** branché sur « Nouvelle candidature » ; brouillons/PDF → « Mes candidatures » ; accusé mail/SMS + numéro → service de notification à la soumission ; suivi → **Module 4** (une ligne/dossier, statut qui évolue : complétude → éligibilité → évaluation…).

---

## 6. Ordre de construction proposé pour la nouvelle phase

1. Valider l'architecture du portail (menu ci-dessus + frontière CANDIDAT → BÉNÉFICIAIRE : portail unique évolutif vs deux espaces).
2. **Wireframe de la coquille du portail** (layout authentifié + menu + tableau de bord) — le conteneur qui répond à « où brancher le formulaire ».
3. **Module 2** : inscription légère + connexion.
4. **« Mes candidatures »** : brouillons / soumis / PDF.
5. **Brancher le Module 3 existant** sur « Nouvelle candidature ».
6. **Suivi de dossier (Module 4 léger)** : timeline de statut, alimentée par les notifications.

---

## 7. Design system (relevé sur le site actuel)

- **Vert pin profond** `#155446` (bandeaux en dégradé `#17564a → #0e3d34`, texte blanc) — titres, en-têtes.
- **Émeraude** `#2e9d63` — actions primaires.
- **Fond crème** `#f1eee5`.
- **Sage** `#d6e4d4` (tuiles `#dcecdd`, bordure `#c4dcc6`) — accents / tuiles en exergue.
- Sobriété, responsive mobile, focus clavier visible, `prefers-reduced-motion` respecté. Le brief impose la sobriété (opérateurs ruraux).

---

## 8. Module Référentiels (principe transverse — rien en dur)

Toutes les listes de valeurs vivent dans une **config centralisée (module Référentiels / Strapi)**, éditable sans redéploiement. Périmètre : AAP par cohorte, statut juridique, **5 filières + transversal**, **5 provinces**, **42 communes (à valider UGP)**, statut du site, niveau de maturité, types de contrepartie, plafonds par cohorte, **18 types de pièces (Annexe 9)**, contenu d'aide (ex. exemples d'infrastructure).

---

## 9. Rappels factuels à ne pas rater

- **Réforme territoriale Burundi (effective juin 2025)** : **5 provinces** (Buhumuza, Bujumbura, Burunga, Butanyerera, Gitega) / **42 communes** — PAS les 18 provinces. Répartition : Buhumuza 7 · Bujumbura 11 · Burunga 7 · Butanyerera 8 · Gitega 9. **Noms de communes à confirmer auprès de l'UGP / du décret** (sources publiques divergentes ; décret officiel = PDF scanné non exploitable).
- Manuel > Offre technique. « 5 filières prioritaires + projets transversaux ». AMI ≠ gate obligatoire.

---

## 10. À joindre au nouveau chat

- Ce brief (`.md`).
- `subco_prete_module3_parcours.html` (le formulaire livré, à re-téléverser).
- La capture de la page d'accueil (référence palette), si tu l'as encore.

## Message d'ouverture suggéré

> « On lance la phase Module 2 + Portail opérateur. Voici le brief de passation et le formulaire déjà livré. Commençons par valider l'architecture du portail (portail unique évolutif CANDIDAT→BÉNÉFICIAIRE + menu proposé), puis wireframe de la coquille (layout authentifié + tableau de bord). »
