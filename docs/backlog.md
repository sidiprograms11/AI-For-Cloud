# Backlog du prototype

Les tâches restent sans dates, durées ni affectations nominatives. L’équipe les priorisera et précisera leurs critères d’acceptation.

## Parcours implémentés et vérifiés sur pile locale

- Kora : conversation de démonstration locale au navigateur, avec visuels de marque et limites visibles.
- Console : accès par Supabase Auth et rôle serveur ; cinq espaces et leurs outils persistants.
- Cas : création, modification du brouillon, test simulé, relecture distincte, publication atomique et retour à une version précédente.
- Ateliers : fiches Cloud et provenance, critères, consignes, exemples attendus, configurations figées, recherche lexicale, expériences explicitement simulées, restitution Markdown, retours, évaluations humaines et contrôles.
- Configuration interne : relecture distincte, activation et retour arrière ; l’activation ne branche pas le dialogue public.
- Vérifications du 20 novembre 2026 : compilation, 7 tests Python, 10 tests Edge, parcours PostgreSQL/RLS avec comptes distincts et parcours Chrome sur ordinateur et mobile. Voir [les tests reproductibles](../tests/README.md).

## Brique 1 — Besoins et comparaison

- Formaliser les champs du besoin et les questions de clarification ; tester les cas incomplets.
- Définir les contraintes bloquantes, préférences et compromis vérifiables.
- Alimenter un catalogue AWS/Azure/Google Cloud uniquement à partir de sources validées.
- Remplacer le résultat simulé par une comparaison explicite testable, sans chiffrage inventé.

## Brique 2 — IA et connaissances

- Alimenter la bibliothèque avec des sources autorisées et vérifiées par l’équipe ; préciser leurs droits de réutilisation et leur actualisation.
- Construire l’ingestion RAG et mesurer la recherche avant de choisir embeddings et index.
- Élargir le jeu de référence et mesurer les écarts sur les configurations figées ; les outils de saisie et d’évaluation humaine existent.
- Évaluer les modèles candidats et décider des coûts et droits avant tout appel réel ; le fine-tuning reste ouvert.

## Brique 3 — Backend et recommandations

- Stabiliser les contrats besoin, comparaison et dossier entre Kora et la console.
- Ajouter quotas atomiques, idempotence, validation de sorties et traçabilité source/configuration/résultat.
- Construire le backend de conversation et les adaptateurs réels seulement après choix documentés.
- Faire exécuter les critères validés par le moteur métier ; les configurations de sources et consignes possèdent déjà leur cycle de validation.

## Brique 4 — Interface et restitution

- Brancher Kora sur le backend avec Auth, historique privé, chargement, erreurs et clarification.
- Raccorder la future réponse réelle de Kora au contrat de restitution ; le laboratoire et la prévisualisation de console partagent déjà leur composant.
- Ajouter dossier sourcé, alternatives, hypothèses et export privé après validation du contrat.

## Brique 5 — Qualité, sécurité et livraison

- Intégrer les essais locaux existants au workflow CI et étendre les contrôles aux futures conversations et fichiers privés.
- Mesurer fidélité aux sources, contraintes métier, erreurs et régressions sur des scénarios de référence.
- Définir conservation, suppression, sauvegarde, restauration et suivi réel de consommation IA.
- Décider des comptes individuels pour la relecture et de l’hébergement du futur moteur IA ; la procédure de déploiement de la console Supabase est documentée.

## Jalons proposés

- **Mois 1–2** : valider le premier lot local, les contrats et le corpus initial.
- **Mois 3** : viser un MVP intégré avec besoin, comparaison sourcée, recommandation justifiée et contrôle d’accès.
- **Mois 4–5** : consolider la qualité, la sécurité, les exports et la livraison.

Ces jalons sont des propositions de planification à confirmer par l’équipe, pas des décisions d’architecture ni des affectations.
