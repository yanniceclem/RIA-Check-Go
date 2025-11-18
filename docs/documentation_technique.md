# Documentation technique — RIA Check & Go (Prototype)

## Objectif
Ce document décrit une proposition d'architecture et un modèle de données simplifié pour l'application RIA Check & Go, conforme au cahier des charges fourni.

## Architecture proposée
- Frontend : Application web SPA légère (HTML/CSS/JS). Pour production : React ou Vue.
- Backend : API REST en Node.js (Express) ou Go pour la fiabilité et la performance.
- Base de données : PostgreSQL pour données structurées (SIA, utilisateurs, audits). Option de stockage d'objets (S3) pour pièces jointes.
- Authentification : OAuth2 / OpenID Connect + MFA pour comptes entreprise.
- Infrastructure : Déploiement conteneurisé (Docker) sur Kubernetes ou plateforme PaaS.

## Technologie (exemples)
- Frontend : React + TypeScript, TailwindCSS
- Backend : Go (Gin) ou Node.js (Express/TypeScript)
- DB : PostgreSQL + Redis (caching)
- Stockage : MinIO ou AWS S3

## Modèle de données simplifié

Entities principales :

- Company (id, name, siret, contact_email)
- SystemAI (id, company_id, name, description, domain, created_at)
- Dataset (id, system_id, type [train/val/test], description, bias_report)
- Audit (id, system_id, auditor_id, date, score, report_url)
- RiskProfile (system_id, level, computed_at, reasons JSON)

Exemple JSON pour `RiskProfile.reasons` :
{
  "reasons": ["Usage recrutement","Données sensibles"]
}

## Fonctionnalités clés (implémentation technique)
- Questionnaire dynamique : stocker question templates et règles d'inférence côté backend pour maintenir conformité.
- Génération Documentation Technique : composer PDF depuis templates (ex. : wkhtmltopdf ou WeasyPrint / jsPDF côté client pour prototype).
- Journalisation/Traçabilité : utiliser ELK stack (Elasticsearch / Logstash / Kibana) ou Grafana Loki.

## Tests & validation
- Tests unitaires (frontend + backend).
- Tests d'intégration pour parcours complet (création SIA → audit → déclaration).
- Scénarios réglementaires : jeux de données synthétiques pour vérifier détection de biais.

## Sécurité & RGPD
- Chiffrement des données sensibles au repos et en transit.
- Minimisation des données collectées et durée de conservation paramétrable.
- Processus de consentement et droit d'accès/modification.

## Livrables
- Application web fonctionnelle (prototype ici).
- Documentation technique complète (ce fichier et annexes).
- Maquettes et wireframes (fichier `docs/mockups.html`).
- Jeu de tests et exemples de cas (à ajouter en phase suivante).
