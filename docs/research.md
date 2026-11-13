# Recherches et décisions ouvertes

Le socle applicatif est défini dans `docs/architecture.md`. Les sujets ci-dessous restent à instruire ; aucune valeur arbitraire n’a été ajoutée au scaffold.

## Modèles et intégration IA

- Comparer des fournisseurs et modèles LLM sur les mêmes cas, contraintes de confidentialité, formats de sortie, coûts et conditions d’utilisation.
- Sélectionner un modèle d’embeddings ; fixer sa version, sa dimension et la procédure de réindexation.
- Mesurer la qualité, la stabilité, les citations, les réponses insuffisamment étayées et les limites de chaque modèle.
- Évaluer le fine-tuning uniquement si un besoin mesurable le justifie.

## Corpus et comparaison

- Sélectionner les documentations officielles et les familles de services étudiées chez AWS, Azure et Google Cloud.
- Définir l’actualisation, les empreintes, les statuts de vérification et les règles de retrait d’une source.
- Mesurer la recherche lexicale et vectorielle sur des questions et passages attendus ; choisir l’index selon la taille et les résultats observés.
- Formaliser les contraintes bloquantes, préférences, critères et compromis sans préférence fournisseur.
- Définir les sources, régions, hypothèses et limites des méthodes d’estimation de coûts.

## Sécurité et exploitation

- Implémenter et tester la vérification JWT Supabase, les droits par ressource et les accès par requête.
- Évaluer les parcours RLS avec deux comptes et les accès temporaires aux fichiers privés.
- Définir les quotas, réservations atomiques, devises, périodes et règles de rapprochement.
- Fixer les règles de conservation/suppression et les données qui peuvent être envoyées aux services IA.
- Choisir les versions exactes des outils et produire des lockfiles communs.
- Choisir l’hébergeur et les environnements selon budget, crédits, résidence des données et besoins de démonstration.

## Méthode

Privilégier les documentations officielles et dater les informations consultées dans les comptes rendus de recherche. Décrire le contexte, les options, les critères, les résultats, les limites et la décision proposée. Consigner les décisions dans `docs/decisions/`.
