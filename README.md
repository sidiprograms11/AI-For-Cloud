# AI for Cloud

AI for Cloud est un projet de fin d’études mené par cinq élèves ingénieurs de dernière année à l’Efrei, en spécialisation CSIG (cybersécurité, systèmes d’information et gouvernance). L’objectif est de concevoir un prototype d’assistant intelligent qui aide les entreprises, notamment les PME, à formaliser leurs besoins et à prendre des décisions cloud compréhensibles et vérifiables.

## Problème et objectifs

Choisir des services cloud suppose de considérer ensemble les usages, les contraintes techniques et organisationnelles, les coûts, les données, la sécurité et les compétences disponibles. L’assistant devra structurer ces informations, rendre visibles les inconnues, comparer des solutions pertinentes chez AWS, Microsoft Azure et Google Cloud, puis expliquer une proposition d’architecture et ses compromis.

Le système devra s’appuyer sur des critères explicites et des sources vérifiables. Une réponse de modèle de langage ne constitue pas une preuve. Aucun fournisseur n’est considéré comme meilleur par défaut. Le choix du modèle d’IA, du cloud recommandé à une entreprise et de l’hébergement de notre propre application sont trois décisions distinctes.

## Parcours cible

1. L’entreprise décrit son contexte et son projet par questionnaire ou texte libre.
2. L’assistant repère les informations manquantes et demande des précisions.
3. L’utilisateur consulte et corrige la synthèse de son besoin.
4. Le système compare les options pertinentes des trois fournisseurs.
5. L’assistant présente une architecture expliquée, ses hypothèses, ses risques et ses alternatives.
6. L’utilisateur consulte et peut exporter un dossier technique.

Ce parcours est un objectif à développer ; aucune de ces fonctionnalités n’est encore implémentée dans cette initialisation.

## État initial

Le dépôt contient la documentation de cadrage et des espaces réservés pour les futurs composants. Les technologies, le modèle, le corpus documentaire, les critères de comparaison et l’hébergement restent à étudier et à décider. Python/FastAPI, React, PostgreSQL et une approche RAG sont des pistes, pas des choix validés. Aucun déploiement ni service cloud n’est configuré.

## Structure du dépôt

```text
.
├── AGENTS.md
├── CONTRIBUTING.md
├── .env.example
├── docs/                 # Cadrage, périmètre, architecture, recherche et backlog
│   └── decisions/        # Décisions techniques à documenter
├── frontend/             # Espace prévu pour l’interface Web
├── backend/              # Espace prévu pour l’API et l’orchestration
├── knowledge/            # Espace prévu pour le corpus et la recherche documentaire
├── tests/                # Espace prévu pour les vérifications automatisées
└── infra/                # Espace prévu pour la configuration de déploiement
```

Les rôles prévus sont décrits dans les README de chaque dossier. Ils ne signalent pas que les composants existent déjà.

## Prochaines étapes

- Valider le périmètre du prototype et les critères d’acceptation.
- Étudier et documenter les choix techniques ouverts dans `docs/research.md` et `docs/decisions/`.
- Découper le backlog en tâches vérifiables, sans affectation nominative à ce stade.
- Une fois les décisions nécessaires prises, implémenter progressivement le parcours et ajouter les vérifications adaptées.

Voir `docs/project-overview.md` pour le contexte détaillé, `docs/scope.md` pour le périmètre et `CONTRIBUTING.md` pour les règles de contribution.
