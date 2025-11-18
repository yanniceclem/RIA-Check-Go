# Spécifications Fonctionnelles et Techniques — RIA Check & Go

Version: 1.0
Date: 2025-11-18

Résumé
-------
Ce document rassemble les spécifications fonctionnelles (Quoi) et techniques (Comment) pour l'application « RIA Check & Go » décrite dans le cahier des charges.

1. Conception Fonctionnelle (Le "Quoi")
----------------------------------------
1.1. Objectif
- Aider les fournisseurs et déployeurs de Systèmes d'IA (SIA) à évaluer leur niveau de conformité vis‑à‑vis du Règlement sur l'Intelligence Artificielle (RIA) et préparer les livrables réglementaires (Documentation technique, Déclaration de conformité, enregistrement des SIA à haut risque).

1.2. Parcours Utilisateur (UX) — chemins principaux
- Parcours public (QR → Landing) : scan du QR → page d'accueil (pitch) → bouton "Démarrer le diagnostic".
- Parcours diagnostic : formulaire d'entrée (métadonnées SIA) → questionnaire dynamique → page résultat (niveau de risque, motifs, obligations) → options : télécharger rapport PDF, demander devis, démarrer gestion de risque.
- Parcours entreprise authentifiée : accès aux SIA créés, historique des diagnostics, module de gestion des risques (SGR), upload de jeux de données et preuves.

1.3. Fonctionnalités clés
- Questionnaire de classification
  - Questions dynamiques basées sur Annexes II/III et Article 5.
  - Détection immédiate des cas d'"inacceptable" (Article 5) avec message d'arrêt.
  - Pondération des réponses et calcul d'un score (seuils : minimal, limité, élevé, haut).
- Moteur d'analyse
  - Mapping réponse → motifs → articles applicables → obligations (listes de contrôle).
  - Génération de plan d'action synthétique (checklist pour conformité).
- Rapport & Export
  - Rapport synthétique affiché et exportable en PDF (meta, score, motifs, obligations, recommandations).
  - Archivage des rapports côté serveur (pour utilisateurs authentifiés).
- Module SGR (high level)
  - Gestion des risques continue : plans d'action, affectation de tâches, historique des modifications.
- Gouvernance des données
  - Référentiel des jeux de données d'entraînement/validation/test avec champs qualité et rapport de biais.
- Journalisation & Traçabilité
  - Logs d'événements (actions d'audit, modifications SIA, génération rapports) consultables par période.
- Contact / Devis
  - Formulaire de demande de prestation avec possibilité d'attacher documents.

1.4. Arborescence et navigation (haut niveau)
- / (Landing)
- /diagnostic (questionnaire)
- /result/:id (rapport)
- /login /signup
- /dashboard (pour utilisateur authentifié)
- /systèmes/:id (gestion du SIA)
- /docs (documentation et ressources juridiques)

2. Spécifications Fonctionnelles détaillées
----------------------------------------
2.1. Questionnaire
- Structure : série de questions modulaires (type: single-choice, multi-choice, texte, upload preuve).
- Règle : questions codées avec clés, poids, et indicateurs (blocker/interdiction, high-risk-flag).
- Exemple d'items importants :
  - q_adminjustice (usage en justice) → blocker Article 5
  - q_recrutement (recrutement) → weight 2
  - q_biometrics (données biométriques) → weight 3

2.2. Moteur de règles
- Input : réponses du questionnaire + métadonnées SIA.
- Process : appliquer règles (si blocker=true → sortie "Risque inacceptable"), sinon calculer score pondéré.
- Output : {level,score,reasons,obligations,articles}

2.3. Rapports
- Format : PDF + JSON archivage.
- Contenu minimal : métadonnées SIA, date, score, niveau, motifs, obligations, recommandations.

3. Conception Technique (Le "Comment")
-------------------------------------
3.1. Architecture proposée (schéma logique)
- Client (SPA) : React/TypeScript (ou Vue). Prototype initial en HTML/JS.
- API : RESTful (ou GraphQL) — implémentation proposée : Go (Gin) ou Node.js (Express + TypeScript).
- Auth & IAM : OAuth2 / OpenID Connect. Roles: anonymous, user, auditor, admin.
- Stockage : PostgreSQL (principal), S3/MinIO pour assets, Elasticsearch ou Timeseries DB pour logs.
- Orchestration : Docker + Kubernetes (ou PaaS selon budget).

3.2. Endpoints API essentiels (exemples)
- POST /api/v1/diagnostics : créer diagnostic (input questionnaire)
- GET /api/v1/diagnostics/:id : récupérer résultat
- POST /api/v1/systems : créer SIA
- GET /api/v1/systems/:id/audits : lister audits
- POST /api/v1/contact : créer demande de devis

3.3. Modèle de données simplifié (ER simplifié)
- Company {id, name, siret, contact_email}
- User {id, company_id, name, email, role, hashed_password}
- SystemAI {id, company_id, name, description, domain, created_at}
- Diagnostic {id, system_id, created_by, created_at, score, level, payload_json, report_url}
- Dataset {id, system_id, type, description, metadata_json}
- Audit {id, system_id, auditor_id, date, report_url}

3.4. Règles de sécurité & RGPD
- Chiffrement TLS partout.
- Données sensibles chiffrées au repos (PGP/KMS).
- Minimisation des données et durée de rétention configurable.
- Logs d'accès et gestion des consentements pour données personnelles utilisées dans tests.

4. Non Fonctionnel (NFR)
------------------------
- Disponibilité cible: 99.5%.
- Scalabilité horizontale via Kubernetes.
- Performances: réponse API < 300ms p99 pour endpoints critiques.
- Accessibilité: conformer WCAG AA.

5. Tests & Validation
---------------------
- Tests unitaires (frontend et backend).
- Tests d'intégration: parcours complet diagnostic → rapport.
- Scénarios réglementaires: jeux de données synthétiques pour valider détection de biais et interdictions.
- Tests de charge pour l'API.

6. Déploiement & Livraison
---------------------------
- CI: GitHub Actions pour build/test/linters.
- CD: image Docker poussée vers registry et déployée en staging puis prod.

7. Plan d'évolution (phase 2+)
- Externaliser et versionner le référentiel des règles (JSON/YAML) pour permettre mises à jour réglementaires.
- Ajouter module d'upload et d'analyse automatique des jeux de données (détection bias basique).
- Intégrer connecteurs pour registre UE (si API disponible) pour automatiser l'enregistrement des SIA à haut risque.

Annexes
-------
- Références: RIA / AI Act (Annexes II, III, IV, V, VI) — lien à inclure dans la documentation finale.
