# Travailler dans les cinq espaces de la console

Ouvrir [la console Kora](https://ai-kora.cloud/#/console) et utiliser le compte autorisé. Les contributions enregistrées dans Supabase sont partagées entre les sessions de l’équipe. Les formulaires exigent un clic sur **Enregistrer le brouillon** ; fermer une fenêtre sans enregistrer ne sauvegarde pas ses changements. Le bouton **Actualiser** récupère le travail des autres sessions.

## Cloud & besoins : constituer les connaissances

Dans **Bibliothèque CLOUD**, choisir **Ajouter une fiche cloud**. Saisir un titre, le cloud concerné (AWS, Azure, Google Cloud ou plusieurs), la provenance et le texte utile. Le sujet et la date de vérification sont déclarés par l’équipe. Une référence annoncée comme documentation officielle exige une URL. L’application conserve cette référence sans télécharger ni vérifier automatiquement la page.

On peut coller du texte ou importer un fichier UTF-8 `.txt` ou `.md` de 100 Kio maximum. Une fiche accepte de 5 à 60 000 caractères ; répartir les documents longs en plusieurs fiches. Pour un PDF, copier les passages pertinents en indiquant leur référence : ce lot n’extrait pas les PDF automatiquement. Ne pas importer de secrets ni de conversations privées.

Les filtres permettent de sélectionner un cloud. **Chercher dans les contenus** lance une recherche textuelle PostgreSQL dans les titres et textes, avec des extraits. Une fiche enregistrée reste un brouillon à relire ; l’application ne certifie pas son contenu. Les éventuelles instructions contenues dans les documents sont des données, pas des consignes pour Kora.

**Lire / modifier** rouvre une fiche et son historique de sauvegardes. Une sauvegarde crée une nouvelle révision ; un conflit avec une modification plus récente est refusé. Un responsable de publication peut archiver une fiche. L’archive quitte la recherche courante, mais les configurations qui en avaient conservé une copie restent consultables.

Dans **Critères & contraintes**, documenter les contraintes bloquantes, préférences et compromis. Ces fiches préparent les règles : aucun moteur de comparaison ne les applique encore automatiquement. **Cas d’entreprise** conserve le parcours existant de besoin, contraintes et versions de cas, avec test simulé et relecture distincte.

## IA & consignes : préparer le comportement attendu

Dans **Consignes de réponse**, enregistrer ce que Kora devra demander, expliquer et justifier : rôle, style, traitement des inconnues, références exigées et limites. Dans **Questions & réponses attendues**, enregistrer une question et la réponse de référence rédigée par l’équipe. Ces contenus ne modifient pas les paramètres d’un modèle.

Dans **Laboratoire** :

1. Choisir **Configuration candidate**, donner un nom, sélectionner une consigne enregistrée et de 1 à 20 fiches Cloud.
2. Enregistrer : la configuration copie les contenus et leurs révisions. Une modification ultérieure des fiches ne change pas cet instantané.
3. Sélectionner la configuration, saisir une question ou partir d’un exemple enregistré, puis lancer une expérience simulée.
4. Lire les passages réellement retrouvés, les consignes retenues et les limites. Si aucun passage ne correspond aux mots-clés, aucun résultat n’est inventé.

La recherche lexicale est réelle. La génération reste **simulée** : aucun LLM, embeddings ou fine-tuning n’est utilisé. L’expérience enregistre sa question, sa configuration et ses passages. La durée affichée est celle du traitement SQL ; aucun token ou coût IA n’est calculé. La réponse de référence aide une comparaison humaine, sans score automatique.

## Backend & versions : suivre les configurations

**Configurations** affiche les versions candidates et la configuration interne active. Ouvrir une configuration pour lire ses consignes et ses sources figées. **Exécutions** retrouve les expériences enregistrées. **Journal d’activité** conserve les actions réalisées dans les ateliers.

Cette rubrique prépare le travail du backend ; elle n’est pas un éditeur ni un déploiement de code. GitHub reste la référence pour le code et les pull requests. Avec un compte partagé, le journal identifie ce compte commun sans distinguer les personnes.

## Interface & restitution : lire et commenter les résultats

**Prévisualisation & export** permet d’ouvrir une expérience et de télécharger sa restitution en Markdown. Le laboratoire et la prévisualisation utilisent le même composant : passages, références, révisions, consignes et limites restent visibles.

**Retours d’interface** enregistre un retour et son état déclaré : ouvert, en cours ou résolu. Ces états sont renseignés par l’équipe ; ils ne prouvent pas qu’une correction a été testée.

## Qualité & livraison : évaluer et relire

**Évaluations humaines** permet de choisir une expérience, de donner deux notes de 1 à 5 (utilité et ancrage dans les sources) et d’expliquer l’appréciation. Les notes sont saisies, jamais fabriquées par la simulation. **Contrôles & preuves** conserve les vérifications de l’équipe, une référence éventuelle et un état déclaré (non exécuté, réussi ou échoué).

Dans **Validation & livraison**, une configuration testée peut être validée par un autre compte autorisé si les révisions sélectionnées de ses sources et consignes ont été relues et restent courantes. Un `publisher` peut ensuite l’activer ; un retour vers une version précédemment publiée conserve la trace de l’action. Modifier un brouillon ne remplace jamais la configuration active.

Le compte qui a créé ou modifié une contribution ne peut pas la relire lui-même. Le créateur d’une configuration ne peut pas la valider. **Avec le compte partagé actuel, la préparation et les tests restent disponibles, mais l’auto-validation reste bloquée.** Des comptes individuels autorisés seront nécessaires pour ce travail à deux. Aucune activation interne ne branche automatiquement le dialogue public sur un modèle.

## Limites de ce lot

- 500 contributions au total, archives comprises ; 100 expériences par configuration.
- La vue d’ensemble affiche les 50 dernières configurations, 100 expériences, 200 évaluations et 100 actions ; l’éditeur expose les 20 dernières sauvegardes d’une fiche.
- Les fiches préparent le corpus. Elles n’alimentent pas automatiquement les tables du futur RAG vectoriel.
- Le choix d’un modèle, les appels IA réels, les budgets et l’entraînement restent ouverts. Le dialogue public Kora reste une démonstration dans le navigateur.

Pour développer ou vérifier ces parcours : [pile locale](console-locale.md), [tests](../tests/README.md), [décision de périmètre](decisions/0004-ateliers-connaissances-et-evaluations.md) et [procédure de déploiement](deploiement-console-supabase.md).
