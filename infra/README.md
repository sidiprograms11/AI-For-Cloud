# Infrastructure et déploiement

## Rôle prévu

Décrire et, lorsque les choix seront validés, configurer les environnements nécessaires à l’exécution et à la démonstration du prototype.

## Entrées et sorties prévues

- **Entrées** : décisions d’architecture, exigences de sécurité et de confidentialité, contraintes de démonstration et paramètres d’environnement.
- **Sorties** : configuration reproductible et documentée pour les environnements retenus.

## État et travail restant

La configuration Supabase locale est définie dans `supabase/config.toml`. Aucune infrastructure d’hébergement de l’application n’est configurée et aucune ressource cloud n’a été provisionnée. Le fournisseur d’hébergement, les environnements partagés, le réseau, les secrets, la supervision et le déploiement restent à étudier. Le cloud d’hébergement du projet est indépendant des clouds comparés pour les entreprises.
