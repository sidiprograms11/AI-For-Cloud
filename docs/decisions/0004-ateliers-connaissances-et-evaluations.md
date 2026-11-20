# 0004 — Ateliers de connaissances et d’évaluation

## Demande et périmètre

Le 17 novembre 2026, l’équipe demande de rendre les cinq rubriques de la console utilisables et d’ajouter une section Cloud pour fournir des contenus et guider les réponses de Kora. Le présent lot ajoute des fiches de connaissances sourcées, des critères, des consignes, des exemples attendus, des configurations figées, des expériences, des retours et des évaluations humaines. Ces contenus sont enregistrés dans Supabase et ne sont pas des données fictives préremplies.

## Connaissances, consignes et entraînement

Ces opérations restent distinctes : préparer un corpus pour une recherche documentaire ; modifier des consignes de réponse ; fournir des exemples de référence ; évaluer les résultats ; entraîner les paramètres d’un modèle. Aucun modèle LLM ni embeddings n’est encore retenu dans le dépôt. Le lot fournit donc une recherche lexicale réelle dans les contenus et un test **explicitement simulé** de préparation du contexte, sans appeler de service IA payant. Le fine-tuning et tout entraînement automatique sur des conversations restent exclus de ce lot.

Les contenus importés restent des données non fiables. Leurs instructions éventuelles ne deviennent jamais des consignes système. Les contributions saisies par l’équipe portent leur fournisseur, leur provenance, leur URL éventuelle et leur date de vérification. Les sources ne sont pas automatiquement téléchargées par le serveur. L’import de texte UTF-8 (.txt/.md) est proposé ; les PDF doivent fournir un extrait textuel pour entrer dans la recherche de ce lot.

## Stockage et cycle de travail

Une table de préparation `workspace_items` contient les contributions typées. Elle n’expose pas les données directement aux navigateurs : RLS et révocation des privilèges restent en place ; le RPC `workspace_api` vérifie le JWT et le rôle interne pour chaque action. Les versions de travail sont contrôlées par révision pour éviter les écrasements simultanés.

Une configuration candidate copie les consignes et sources sélectionnées dans un instantané immuable. Modifier ensuite une fiche ne modifie ni cette configuration ni un résultat enregistré. Les configurations candidates peuvent être testées en simulation. Relecture distincte et droit de publication restent nécessaires pour activer une configuration. Le retour à une version publiée précédente conserve la trace de l’action. Avec le compte partagé actuel, l’auto-relecture demeure impossible.

Les tables `sources` et `chunks` du socle sont réservées au futur corpus validé et vectorisé. La préparation éditoriale de ce lot n’écrit pas silencieusement dans ce corpus et ne prétend pas effectuer son indexation vectorielle. Les expériences utilisent leur propre instantané autorisé, jamais les conversations privées des utilisateurs.

## Cinq rubriques

1. **Cloud & besoins** : bibliothèque de fiches, critères et parcours de cas existant.
2. **IA & consignes** : consignes, exemples de référence, préparation de configuration et laboratoire de recherche/simulation.
3. **Backend & versions** : configurations candidates/actives, exécutions et journal d’actions.
4. **Interface & restitution** : lecture des résultats avec le même composant que le laboratoire, export Markdown et retours d’interface.
5. **Qualité & livraison** : évaluations humaines des expériences, contrôles documentés et cycle de validation des configurations.

GitHub reste la référence pour le code et les pull requests. La console ne remplace pas l’éditeur de code ni le dépôt. Les listes vides n’affichent aucun faux résultat de test, coût, score ou source.

## Déploiement et vérification

Le projet distant autorisé reste **IA FOR CLOUD** (`qxgingqrkzzqccsluntb`). Ajouter une nouvelle migration, l’exécuter et la tester sur la pile locale avant l’application distante. Inspecter l’historique et le plan à blanc, appliquer uniquement cette migration, déployer `console-api`, puis publier le frontend existant avec Sites. Ne pas réinitialiser la base distante ni changer de plan.

Vérifier les refus d’accès, les tailles et types de données, l’enregistrement/relecture après rechargement, les conflits de révision, la recherche, l’immuabilité des instantanés, la séparation auteur/relecteur, l’activation/retour arrière et la conservation des sources dans un résultat. Les tests IA réels nécessiteront un choix explicite de fournisseur, une clé serveur et des limites de consommation.

Référence : [recherche textuelle PostgreSQL dans Supabase](https://supabase.com/docs/guides/database/full-text-search).
