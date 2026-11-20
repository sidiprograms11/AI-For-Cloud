"""Vérification authentifiée du déploiement, sans afficher de session ni créer de cas."""

import json
import sys

import httpx
from supabase import create_client

config = json.load(sys.stdin)
url = config['url']
if url != 'https://qxgingqrkzzqccsluntb.supabase.co':
    raise SystemExit('Projet non autorisé.')
admin = create_client(url, config['secret'])
public = create_client(url, config['public'])
session = None
try:
    link = admin.auth.admin.generate_link({'type': 'magiclink', 'email': 'sidi.gano@efrei.net'})
    session = public.auth.verify_otp({'token_hash': link.properties.hashed_token, 'type': 'email'}).session
    headers = {'apikey': config['public'], 'Authorization': f'Bearer {session.access_token}'}
    with httpx.Client(timeout=20) as client:
        base = f'{url}/functions/v1/console-api/internal'
        response = client.get(f'{base}/me', headers=headers)
        if response.status_code != 200 or response.json().get('role') != 'publisher':
            raise SystemExit(f'Contrôle authentifié échoué : HTTP {response.status_code}')
        print('Session du compte demandé et rôle interne : validés sur l’Edge Function distante.')
        response = client.get(f'{base}/cases', headers=headers)
        if response.status_code != 200:
            raise SystemExit(f'Lecture des cas échouée : HTTP {response.status_code}')
        print('Lecture authentifiée des cas : HTTP 200.')
        response = client.get(f'{base}/workspace', headers=headers)
        if response.status_code != 200:
            raise SystemExit(f'Lecture des ateliers échouée : HTTP {response.status_code}')
        workspace = response.json()
        capabilities = workspace.get('capabilities', {})
        if capabilities.get('lexical_search') is not True or any(
            capabilities.get(name) is not False for name in ('generation', 'embeddings', 'fine_tuning')
        ) or not all(isinstance(workspace.get(name), list) for name in (
            'items', 'releases', 'experiments', 'evaluations', 'events'
        )):
            raise SystemExit('Contrat des ateliers inattendu.')
        print('Lecture authentifiée des ateliers : HTTP 200 ; simulation et recherche lexicale confirmées.')
        for table in ('internal_cases', 'workspace_items', 'workspace_releases', 'workspace_experiments'):
            response = client.get(f'{url}/rest/v1/{table}?select=id', headers=headers)
            if response.status_code not in (401, 403):
                raise SystemExit('Accès direct aux données insuffisamment protégé.')
        print('Lecture directe des tables internes : refusée.')
finally:
    if session is not None:
        public.auth.sign_out({'scope': 'local'})
    public.auth.close()
    public.postgrest.session.close()
    admin.auth.close()
    admin.postgrest.session.close()
