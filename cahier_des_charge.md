# RIA-Check-Go

Votre Rôle et Votre Mission
Vous allez vous glisser dans la peau d'une équipe de développeurs/concepteurs au sein d'un Prestataire de Services Informatiques (PSI). Votre mission est de concevoir et de documenter l'application destinée à aider les entreprises à se mettre en conformité avec le Règlement sur l'intelligence Artificielle (RIA).
Cette application est celle vers laquelle renvoie le QR Code de notre campagne marketing.
📱 L'Outil à Développer : "RIA Check & Go" (ou nom de votre choix)
Votre livrable principal ne sera pas le code final, mais la documentation de conception détaillée de l'outil, qui doit couvrir les aspects suivants :
1. Conception Fonctionnelle (Le "Quoi")
Parcours Utilisateur (UX) : Décrire le cheminement de l'utilisateur (entreprise) depuis le scan du QR Code jusqu'à la demande de devis.
Fonctionnalités Clés : Détailler le fonctionnement des étapes principales (ex. : Questionnaire de diagnostic, moteur d'analyse, génération du rapport PDF).
Arborescence : Représenter l'architecture de navigation de l'application.
2. Conception Technique (Le "Comment")
Architecture Proposée : Présenter les technologies (langages, frameworks, bases de données) envisagées pour le développement de l'outil.
Modèle de Données Simplifié : Montrer comment les données de conformité de l'entreprise seraient stockées et traitées.
3. Livrables Visuels
Maquettes (Mockups) : Fournir des maquettes ou des wireframes des trois écrans principaux de l'application (ex. : Écran d'accueil/Diagnostic, Écran de résultat/Score, Écran de contact/Devis).

Cahier des Charges (CdC) : Application de Conformité au Règlement sur l'IA (RIA / AI Act)
1. Introduction et Contexte
1.1. Objectifs de l'Application
Objectif Principal : Développer une plateforme logicielle (Web et/ou Mobile) pour accompagner les fournisseurs et les déployeurs de systèmes d'IA (SIA) dans leur démarche de mise en conformité avec le Règlement sur l'Intelligence Artificielle (RIA / AI Act).

Objectifs Secondaires :

Assurer la traçabilité et la documentation des SIA.

Faciliter l'évaluation et la gestion des risques.

Soutenir la réalisation des évaluations de conformité.

Centraliser les informations de transparence requises par le RIA.

1.2. Périmètre de l'Application
L'application doit couvrir les obligations spécifiques en fonction du niveau de risque du Système d'IA (SIA) : Risque inacceptable, Risque élevé, Risque faible/minimal, et les exigences pour les Modèles d'IA à usage général (GPAI).

2. Exigences Fonctionnelles (EF)
Les exigences fonctionnelles doivent être directement alignées sur les articles clés du RIA.

EF 2.1. Classification du Système d'IA
EF 2.1.1 : Outil d'Aide à la Classification : Le système doit proposer un questionnaire dynamique basé sur l'Annexe II et III du RIA pour déterminer automatiquement le niveau de risque du SIA et les obligations applicables.

EF 2.1.2 : Identification des Interdictions : Alerte immédiate si le SIA entre dans la catégorie de Risque inacceptable (Article 5).

EF 2.2. Gestion des Systèmes d'IA à Haut Risque (Titre III)
EF 2.2.1 : Gestion du Système de Gestion des Risques : Module permettant de documenter, mettre en œuvre et mettre à jour un système de gestion des risques continu, incluant l'identification, l'estimation et l'atténuation des risques.

EF 2.2.2 : Gouvernance et Qualité des Données : Fonctionnalité pour tracer la qualité des jeux de données d'entraînement, de validation et de test (pertinence, représentativité, absence de biais), conformément à l'Article 10.

EF 2.2.3 : Documentation Technique : Génération et archivage de la Documentation Technique (Annexe IV), couvrant la conception, les objectifs, les données, le fonctionnement et la procédure d'évaluation de la conformité.

EF 2.2.4 : Enregistrement : Interface pour préparer et effectuer l'enregistrement du SIA dans le Registre de l'UE pour les SIA à haut risque.

EF 2.3. Transparence et Information (Titre IV)
EF 2.3.1 : Obligations de Transparence : Module pour documenter et vérifier la fourniture des informations de transparence requises (par exemple, pour les systèmes interagissant avec des humains ou générant des contenus).

EF 2.3.2 : Traçabilité et Journalisation : Fonctionnalité pour enregistrer automatiquement les événements (logs) afin d'assurer un niveau de traçabilité adéquat du fonctionnement du SIA (Article 12).

EF 2.4. Évaluation et Déclaration de Conformité
EF 2.4.1 : Auto-Évaluation de Conformité : Module guidé pour l'auto-évaluation interne (Article 19 et Annexe VI) avec des listes de contrôle basées sur les exigences du RIA.

EF 2.4.2 : Déclaration de Conformité UE : Génération du projet de Déclaration de Conformité UE (Annexe V) une fois l'évaluation réussie.

3. Exigences Non Fonctionnelles (ENF)
ENF 3.1. Sécurité et RGPD (Cohérence)
ENF 3.1.1 : Cybersécurité : L'application elle-même doit respecter les normes de sécurité élevées (authentification forte, chiffrement, etc.).

ENF 3.1.2 : Cohérence RGPD : S'assurer que les processus de gouvernance des données du SIA gérés dans l'application sont cohérents et ne contredisent pas le RGPD.

ENF 3.2. Performance et Fiabilité
ENF 3.2.1 : Disponibilité : Taux de disponibilité de l'application supérieur à $99,5\%$.

ENF 3.2.2 : Évolutivité : Architecture conçue pour absorber les futures modifications réglementaires et les exigences supplémentaires.

ENF 3.3. Ergonomie et Accessibilité
ENF 3.3.1 : UX/UI : Interface utilisateur intuitive pour simplifier la navigation dans un cadre réglementaire complexe.

ENF 3.3.2 : Accessibilité : Conformité avec les normes d'accessibilité web (ex. : WCAG).

4. Conformité et Tests de Validation
Cette section est cruciale pour la vérification de la conformité au RIA.

4.1. Stratégie de Vérification de la Conformité du Produit
L'application doit elle-même servir d'outil de vérification, mais elle doit aussi être validée en tant que telle.

Scénarios de Test Réglementaire : Définir des cas de test (jeux de données biaisés, non-traçabilité, manque de clarté des instructions) pour valider que l'application détecte correctement les non-conformités des SIA gérés.

Test de Couverture du RIA : Vérifier que chaque article applicable au périmètre des SIA est couvert par au moins une fonctionnalité et un test de validation.

4.2. Critères de Réussite et Indicateurs
Critère 1 : Auto-Déclaration (AHA) : Le processus d'auto-évaluation de l'application permet de générer une Déclaration de Conformité UE sans erreur.

Critère 2 : Gestion des Risques : L'outil permet de réduire de X% le temps nécessaire à la mise à jour annuelle du système de gestion des risques.

Critère 3 : Traçabilité : Capacité de présenter un journal d'événements (logs) complet et interprétable pour une autorité de surveillance en moins de 10 minutes.

5. Livrables Attendus
Application fonctionnelle (Web et/ou Mobile).

Code source documenté.

Manuel utilisateur et guide de l'utilisateur pour la conformité au RIA.

Dossier de tests (incluant les tests de non-régression et de conformité réglementaire).

Documentation technique complète du système.





Annexes




Alignant les cas d'utilisation (Use Cases) sur les processus

C'est une étape essentielle pour donner vie au Cahier des Charges ! En alignant les cas d'utilisation (Use Cases) sur les processus, on s'assure que l'application de conformité au RIA est opérationnelle et cohérente.

Voici les principaux cas d'utilisation et des processus associés, structurés selon le cycle de vie d'un Système d'IA (SIA) dans le cadre du RIA.

⚙️ Cas d'Utilisation et Processus pour l'Application de Conformité au RIA



Cas d'Utilisation (UC)

Acteur(s) Principal(aux)

Processus Associé

Exigences Clés du RIA Adressées

UC 1 : Évaluation Initiale et Classification du Risque

Fournisseur de SIA

Processus de Tri et de Catégorisation

Article 5 (Risque inacceptable), Annexe III (Haut Risque)

UC 2 : Constitution du Système de Gestion des Risques (SGR)

Fournisseur, Responsable Conformité

Processus Continu de Gestion des Risques

Article 9 (Système de gestion des risques)

UC 3 : Vérification de la Qualité des Données d'Entraînement

Data Scientist, Ingénieur ML

Processus de Gouvernance des Données

Article 10 (Gouvernance des données et des données d'entraînement)

UC 4 : Génération de la Documentation Technique (DT)

Équipe Technique, Responsable Projet

Processus de Documentation et d'Archivage

Article 11, Annexe IV (Documentation technique)

UC 5 : Journalisation et Traçabilité des Logs

Opérateur, Ingénieur MLOps

Processus de Suivi Opérationnel (Logging)

Article 12 (Journalisation)

UC 6 : Réalisation de l'Évaluation de Conformité

Responsable Conformité, Auditeur

Processus d'Audit Interne et d'Auto-Évaluation

Article 17, 19 (Évaluation de la conformité)

UC 7 : Enregistrement du SIA (Haut Risque)

Responsable Conformité

Processus de Déclaration et d'Enregistrement

Article 51 (Enregistrement), Annexe V (Déclaration UE)

UC 8 : Gestion des Incidents et de la Surveillance Post-Mise sur le Marché

Opérateur, Service Client, Responsable Conformité

Processus de Surveillance Post-Marché

Article 61 (Surveillance post-marché)



1. Description Détaillée des Processus Clés
Afin d'assurer la cohérence de l'application, voici une description des trois processus les plus critiques.

A. 🎯 Processus de Tri et de Catégorisation (UC 1)
Ce processus est le point d'entrée de la conformité.

Saisie des Métadonnées : L'utilisateur saisit le nom, la description, l'objectif et le domaine d'application du SIA.

Questionnaire Dynamique : L'application présente une série de questions basées sur l'Article 5 (Risque Inacceptable) et l'Annexe III (Haut Risque).

Exemple de question : "Le système est-il destiné à être utilisé pour évaluer la fiabilité des preuves dans le cadre de l'administration de la justice ?"

Classification Automatique : Le système classe le SIA dans une catégorie de risque (Inacceptable, Élevé, Limité ou Minimal).

Plan d'Action Généré : L'application affiche la liste complète des obligations légales découlant de cette classification (ex. : Si "Haut Risque", obligations des Articles 9 à 21).

B. 🔬 Processus de Gouvernance des Données (UC 3)
Ce processus garantit la conformité à l'Article 10, essentiel pour la fiabilité du SIA.

Enregistrement des Jeux de Données : L'utilisateur déclare les jeux de données utilisés pour l'entraînement, la validation et le test.

Documentation des Paramètres de Qualité : L'utilisateur documente les procédures d'acquisition, de nettoyage et de labellisation.

Vérification de la Représentativité et de la Pertinence : L'application propose des champs structurés pour documenter l'évaluation des biais et des lacunes dans les données, en lien avec l'objectif du SIA.

Exemple : En cas d'utilisation pour le recrutement, documentation de la diversité des échantillons pour éviter la discrimination (cohérence avec la législation anti-discrimination et le RGPD).

Suivi des Mesures d'Atténuation : L'application centralise les actions correctives mises en œuvre suite à l'identification de données de mauvaise qualité ou biaisées.

C. ✅ Processus d'Audit Interne et d'Auto-Évaluation (UC 6)
Ce processus permet de vérifier la conformité finale avant la mise sur le marché.

Lancement de l'Audit : L'utilisateur choisit le SIA à auditer.

Check-list Guidée : L'application déroule une liste de contrôle exhaustive (checklist) couvrant tous les aspects du RIA applicables au niveau de risque du SIA (ex. : Avez-vous mis en place un niveau de robustesse technique suffisant ? Les logs sont-ils conservés pendant une période de six mois ?).

Collecte des Preuves : Pour chaque point de contrôle, l'utilisateur peut joindre des preuves directes (fichiers, liens vers des dépôts, captures d'écran des paramètres de robustesse).

Rapport de Conformité : L'application compile les résultats, met en évidence les non-conformités résiduelles et génère un rapport d'évaluation final qui servira de base pour la Déclaration de Conformité UE (UC 7).

Ces cas d'utilisation et processus forment l'épine dorsale de l'application, assurant que la mise en place du RIA est non seulement documentée mais aussi activement gérée et vérifiée à chaque étape du cycle de vie du Système d'IA.


