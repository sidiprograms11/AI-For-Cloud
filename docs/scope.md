# Périmètre

Ce document distingue les objectifs fonctionnels du prototype de ce qui reste à étudier ou n’est pas prévu dans le socle initial.

## Objectifs fonctionnels

Le prototype visé devra permettre de recueillir le type d’application et ses usages, la charge, les volumes et la sensibilité des données, les contraintes de localisation, le budget et son unité, les objectifs de disponibilité et de restauration, l’environnement existant, les compétences internes et les préférences de l’entreprise.

Le parcours cible comprend la formalisation du besoin, la clarification des inconnues, la validation du résumé par l’utilisateur, la comparaison d’options pertinentes chez AWS, Microsoft Azure et Google Cloud, la proposition expliquée d’une architecture et la restitution d’un dossier technique exportable. Ces capacités restent à construire.

Le dossier cible doit présenter une synthèse du besoin, le fournisseur recommandé et ses raisons, les alternatives et compromis, les composants et services envisagés, les hypothèses de dimensionnement, les recommandations de sécurité, une estimation ou méthode de coût, les sources, les limites et les points à confirmer.

## Qualités attendues

- Recommandations compréhensibles, justifiées, traçables et vérifiables.
- Critères de comparaison explicites et appliqués sans préférence systématique pour un fournisseur.
- Hypothèses, incertitudes et données manquantes clairement visibles.
- Données et contraintes de confidentialité traitées dans les choix d’architecture et de modèle.

## Hors socle initial ou conditionnel

- L’entraînement complet d’un modèle n’est pas prévu dans le socle initial.
- Le fine-tuning ne sera envisagé que si un besoin mesurable le justifie.
- Aucun déploiement automatique de l’architecture recommandée chez un client n’est défini à ce stade.
- Le socle React/TypeScript/Vite, Python/FastAPI et Supabase/PostgreSQL avec Auth, Storage et pgvector est retenu pour le démarrage.
- Le modèle LLM, le modèle d’embeddings, leur dimension, les versions exactes, les budgets, la conservation des données et l’hébergeur applicatif restent à décider.
- Les coûts ne doivent pas être présentés comme des devis garantis ; les méthodes, hypothèses et sources restent à établir.

## Critères de cadrage à préciser

L’équipe devra préciser les scénarios de démonstration, le niveau de détail attendu pour les architectures, les critères de comparaison, les règles de validation des sources, les limites de la collecte de données et les critères d’acceptation du prototype.
