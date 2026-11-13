# Backlog initial

Les tâches restent sans dates, durées ni affectations nominatives. L’équipe les priorisera et précisera leurs critères d’acceptation.

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
