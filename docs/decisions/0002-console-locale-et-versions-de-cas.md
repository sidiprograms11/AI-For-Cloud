# 0002 — Console locale et versions de cas

## État

Retenu pour le **premier lot local**. Le déploiement d’une console fonctionnelle, l’hébergement de FastAPI et l’emploi du projet Supabase distant restent des décisions ouvertes.

## Contexte

Le dépôt possédait une seule maquette React, un contrôle de santé FastAPI et un schéma Supabase local. L’équipe veut distinguer le dialogue Kora des travaux internes, en protégeant les données et en montrant un exemple limité de brouillon, test, relecture et publication.

## Choix

- Conserver une seule application React et utiliser `/#/console` pour l’interface interne. Ce routage reste compatible avec la publication statique ; il n’accorde aucun droit.
- Contrôler toutes les opérations internes dans FastAPI : vérification du jeton par Supabase Auth, lecture d’un rôle interne puis appel aux données avec la clé privilégiée **uniquement côté serveur**.
- Ne donner aucun accès Data API direct aux tables internes pour `anon` et `authenticated`. Le rôle est attribué localement hors application, après création des comptes Auth.
- Versionner uniquement les **cas d’entreprise** dans ce premier exemple. Le brouillon et la version active sont des lignes distinctes. Un test simulé est lié à une révision du brouillon.
- Rendre la création initiale, la création d’un nouveau brouillon et la bascule de version active transactionnelles dans PostgreSQL. La relecture doit être réalisée par une personne différente du créateur de la version.
- Laisser Kora public en démonstration sans transmission de message. La console fonctionnelle reste locale tant que l’API et les données n’ont pas de procédure d’hébergement validée.

## Conséquences et limites

La route de la console peut être visible dans le code public ; la protection réside dans l’API et la base. Le rôle `publisher` peut également relire, mais pas sa propre version. Les opérations intermédiaires de test et de relecture enregistrent leur trace séparément ; une garantie transactionnelle complète de ces étapes reste à ajouter si elles deviennent critiques. Le test simulé ne classe aucun fournisseur et ne produit aucun coût.

La migration, les refus Data API et le parcours de cas ont été vérifiés sur Supabase local avec des comptes distincts. Avant une mise en ligne fonctionnelle, définir les quotas réels, compléter les tests de sécurité et décider de l’hébergement du backend. Voir [la procédure locale](../console-locale.md).
