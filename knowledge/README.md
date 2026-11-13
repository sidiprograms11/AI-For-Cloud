# Base de connaissances

## Rôle prévu

Organiser les connaissances documentaires nécessaires à la comparaison de services AWS, Microsoft Azure et Google Cloud, ainsi que les mécanismes pour retrouver et citer les informations pertinentes.

## Entrées et sorties prévues

- **Entrées** : documents et métadonnées de sources validées, avec provenance et informations utiles à leur actualisation.
- **Sorties** : passages pertinents accompagnés de leurs références, destinés à alimenter la comparaison et les explications.

## État et travail restant

Aucun corpus ni moteur de recherche n’est fourni. Le socle cible stocke les sources, leurs extraits et les embeddings dans PostgreSQL avec pgvector ; la migration crée les tables et un champ vectoriel sans dimension fixée. Le modèle d’embeddings, les sources, les droits d’utilisation, l’actualisation, l’index et les mesures de qualité restent à choisir et à développer.
