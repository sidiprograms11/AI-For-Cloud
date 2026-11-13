# Présentation du projet

## Contexte

AI for Cloud est un projet de fin d’études réalisé par cinq élèves ingénieurs de dernière année à l’Efrei, en spécialisation CSIG : cybersécurité, systèmes d’information et gouvernance. Le produit conversationnel s’appelle Kora. Le projet doit aboutir à un prototype d’assistant intelligent qui accompagne les entreprises, en particulier les PME, dans leurs choix de technologies et d’architectures cloud.

## Problème

Une entreprise ne possède pas toujours l’expertise nécessaire pour arbitrer entre les services d’hébergement, de stockage, de base de données, de réseau, de contrôle des accès, de sauvegarde et de disponibilité. Ces choix dépendent des usages, des volumes et de la sensibilité des données, de la localisation, du budget, des contraintes opérationnelles, des exigences de sécurité et des compétences de l’équipe.

L’assistant doit rendre ces décisions plus accessibles en expliquant ses recommandations, les alternatives et leurs compromis. Il doit structurer la collecte du besoin, la comparaison, la recherche documentaire et la vérification ; transmettre simplement une question à un LLM ne répond pas à l’objectif.

## Objectifs

- Comprendre et formaliser le contexte et les contraintes de l’entreprise.
- Repérer les informations manquantes, poser des questions et rendre les hypothèses visibles.
- Comparer des solutions pertinentes chez AWS, Microsoft Azure et Google Cloud (GCP désigne Google Cloud).
- Proposer une architecture adaptée et expliquer ses composants et compromis.
- Présenter des recommandations de sécurité, les hypothèses de coûts, des sources et les limites à confirmer.
- Permettre la consultation et l’export d’un dossier technique, une fois cette fonctionnalité développée.

## Principes

- Aucun fournisseur n’est systématiquement favorisé.
- Les services disponibles, coûts et affirmations techniques sont à vérifier avec des sources ; une réponse du LLM seule n’est pas une preuve.
- Les informations inconnues restent visibles ; elles entraînent une demande de précision ou une hypothèse explicitement formulée.
- Le choix du LLM, du cloud recommandé à l’entreprise et de l’hébergement de notre application sont indépendants.
- Une architecture simple et modulaire est privilégiée ; le socle retenu figure ci-dessous.

## Socle technique

Le socle de développement est React, TypeScript et Vite pour le frontend ; Python et FastAPI pour un backend modulaire unique ; Supabase et PostgreSQL pour les données, avec Supabase Auth, Storage et pgvector. Les fournisseurs de génération et d’embeddings sont remplaçables. Le dépôt commun est GitHub et l’équipe utilise Antigravity comme environnement d’assistance. Le détail et l’état du scaffold figurent dans `docs/architecture.md`.

Le modèle LLM, le modèle d’embeddings et sa dimension, les versions exactes, les quotas, la politique de conservation et le fournisseur d’hébergement restent à choisir.

## État du projet

Le dépôt comprend un shell React, une API FastAPI avec contrôle de santé, un adaptateur IA simulé et une migration PostgreSQL avec RLS et pgvector. L’authentification complète, le questionnaire, le dialogue, la comparaison, le corpus/RAG, la génération de recommandations et l’export restent à développer. Aucun service LLM réel ni hébergement applicatif n’est configuré.
