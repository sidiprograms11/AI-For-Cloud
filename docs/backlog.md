# Backlog initial

Les tâches restent sans dates, durées ni affectations nominatives. L’équipe les priorisera et précisera leurs critères d’acceptation.

## Premier lot implémenté et vérifié sur pile locale

- Kora : conversation de démonstration locale au navigateur, avec visuels de marque et limites visibles.
- Console : accès par Supabase Auth et rôle serveur ; cinq espaces dont un parcours de cas d’entreprise.
- Cas : création, modification du brouillon, test simulé, relecture distincte, publication atomique et retour à une version précédente.
- Vérifications effectuées : migration locale rejouée, essais Data API avec comptes distincts, contrôle 401/403 et parcours intégré. Voir [la procédure](console-locale.md). La revue du rendu dans un navigateur reste à faire.

## Brique 1 — Besoins et comparaison

- Formaliser les champs du besoin et les questions de clarification ; tester les cas incomplets.
- Définir les contraintes bloquantes, préférences et compromis vérifiables.
- Alimenter un catalogue AWS/Azure/Google Cloud uniquement à partir de sources validées.
- Remplacer le résultat simulé par une comparaison explicite testable, sans chiffrage inventé.

## Brique 2 — IA et connaissances

- Inventorier les sources autorisées, leur provenance, date et version ; définir la validation humaine.
- Construire l’ingestion RAG et mesurer la recherche avant de choisir embeddings et index.
- Versionner prompts et jeux de questions de référence séparément des sources.
- Évaluer les modèles candidats et décider des coûts et droits avant tout appel réel ; le fine-tuning reste ouvert.

## Brique 3 — Backend et recommandations

- Stabiliser les contrats besoin, comparaison et dossier entre Kora et la console.
- Ajouter quotas atomiques, idempotence, validation de sorties et traçabilité source/configuration/résultat.
- Construire le backend de conversation et les adaptateurs réels seulement après choix documentés.
- Étendre le cycle brouillon → test → relecture → publication aux critères et configurations après validation du premier exemple.

## Brique 4 — Interface et restitution

- Brancher Kora sur le backend avec Auth, historique privé, chargement, erreurs et clarification.
- Réutiliser les formats de réponse dans Kora et la console pour les prévisualisations.
- Ajouter dossier sourcé, alternatives, hypothèses et export privé après validation du contrat.

## Brique 5 — Qualité, sécurité et livraison

- Automatiser les essais RLS, rôles, migrations, API et parcours à deux comptes.
- Mesurer fidélité aux sources, contraintes métier, erreurs et régressions sur des scénarios de référence.
- Définir conservation, suppression, sauvegarde, restauration et suivi réel de consommation IA.
- Préparer une procédure de déploiement sécurisée de l’API et des données ; décider des droits de publication et de l’hébergement.

## Jalons proposés

- **Mois 1–2** : valider le premier lot local, les contrats et le corpus initial.
- **Mois 3** : viser un MVP intégré avec besoin, comparaison sourcée, recommandation justifiée et contrôle d’accès.
- **Mois 4–5** : consolider la qualité, la sécurité, les exports et la livraison.

Ces jalons sont des propositions de planification à confirmer par l’équipe, pas des décisions d’architecture ni des affectations.

## Socle déjà préparé

- Créer le shell React/TypeScript/Vite et le client API/Supabase initial.
- Créer l’API FastAPI modulaire et le contrôle de santé.
- Créer un adaptateur IA simulé qui signale qu’il ne fournit pas de recommandation réelle.
- Créer la configuration Supabase locale, le schéma initial, les politiques RLS et pgvector.

## Sécurité et configuration à finaliser

- Aligner collectivement les versions et générer les lockfiles.
- Implémenter la vérification des jetons Supabase et les clients de données par requête.
- Écrire des tests RLS avec deux utilisateurs et des essais d’accès Storage.
- Définir les tests du contrôle de santé et du mode simulé.
- Définir et implémenter les quotas, les réservations atomiques et le rapprochement des coûts.
- Fixer la politique de conservation et de suppression.

## Fonctionnalités à développer

- Formaliser le besoin, signaler les champs manquants et permettre à l’utilisateur de corriger des versions successives.
- Sélectionner les sources officielles des trois fournisseurs, importer et versionner le corpus.
- Choisir le modèle d’embeddings, mesurer la recherche puis définir l’index pgvector.
- Concevoir et évaluer les règles explicites de comparaison cloud.
- Sélectionner et intégrer un fournisseur LLM derrière l’adaptateur, avec validation de format et preuves.
- Générer un dossier sourcé avec alternatives, hypothèses, recommandations de sécurité, coûts et limites.
- Développer les routes métier, l’authentification de l’interface, le chat et l’export privé.
- Définir une procédure reproductible de restauration et choisir l’hébergement de l’application.
