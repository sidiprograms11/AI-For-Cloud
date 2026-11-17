# 0003 — Console hébergée sur Supabase

## État et demande

Choix retenu pour cette mise en service à la demande de l’équipe le 17 novembre 2026 : héberger le parcours interne sur le projet Supabase existant **IA FOR CLOUD**, référence `qxgingqrkzzqccsluntb`. La demande autorise les opérations distantes de ce déploiement. Le premier compte demandé est `sidi.gano@efrei.net` ; les comptes individuels restent recommandés pour distinguer les auteurs et relecteurs.

## Adaptation du socle

Supabase Edge Functions exécute TypeScript/Deno ; l’API Python/FastAPI n’y est pas directement déployable. Le parcours des cas est donc centralisé dans une fonction PostgreSQL `console_api` protégée, appelée avec le JWT de l’utilisateur. L’Edge Function `console-api` fournit les mêmes routes HTTP que FastAPI. FastAPI reste disponible localement et appelle la même fonction PostgreSQL. Aucun service de calcul supplémentaire ni modèle IA payant n’est ajouté.

Cette adaptation est limitée à la console. Le moteur IA réel et le futur RAG restent à choisir et à développer. Le test simulé ne fournit aucune recommandation cloud.

## Contrôle des accès

Le JWT est vérifié par Supabase Auth et le rôle interne est contrôlé dans PostgreSQL pour chaque opération. `console_api` est une fonction `security definer` à chemin de recherche vide, exposée uniquement à `authenticated`. Elle dérive l’auteur de `auth.uid()` ; le client ne choisit jamais l’auteur ni le rôle. Les tables et les fonctions internes auxiliaires restent inaccessibles directement aux comptes ordinaires. Les mutations, tests, relectures et traces sont transactionnels et sérialisés par cas.

Un compte partagé ne permet pas d’identifier la personne réelle. L’auto-relecture est refusée pour le créateur et le dernier modificateur de la version. La publication exige toujours une relecture par un autre compte autorisé. Cette règle n’est pas retirée pour permettre le partage d’identifiants.

## Publication du frontend

Le site React existant héberge Kora et la console à `/#/console`. `infra/console.public.json` contient seulement l’URL Supabase et sa clé **publishable**. Le build public ne charge jamais le `.env` local. L’API Edge ne nécessite aucune clé privilégiée dans le site ni dans son code. La connexion par mot de passe et par lien e-mail est proposée ; aucune inscription publique ni attribution automatique du rôle interne n’est ajoutée.

## Vérifications

La nouvelle migration a été appliquée localement. Le parcours intégré passe sur FastAPI et sur le runtime Edge Supabase local avec des comptes distincts. Sept tests ciblés vérifient aussi le routage, CORS, les sessions invalides, la propagation des droits et la confidentialité des erreurs de la passerelle. La procédure distante est décrite dans [le guide de déploiement](../deploiement-console-supabase.md).

Références : [runtime Edge Functions](https://supabase.com/docs/guides/functions/quickstart), [authentification et en-têtes](https://supabase.com/docs/guides/functions/auth-headers), [migrations et environnements](https://supabase.com/docs/guides/deployment/managing-environments).
