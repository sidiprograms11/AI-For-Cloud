"""Provisionne seulement le compte autorisé. Clés reçues par stdin, jamais affichées."""

import json
import secrets
import sys

from supabase import create_client

config = json.load(sys.stdin)
if config['url'] != 'https://qxgingqrkzzqccsluntb.supabase.co':
    raise SystemExit('Projet non autorisé.')
email = 'sidi.gano@efrei.net'
client = create_client(config['url'], config['secret'])
try:
    found = None
    for page in range(1, 11):
        users = client.auth.admin.list_users(page=page, per_page=100)
        found = next((user for user in users if user.email and user.email.lower() == email), None)
        if found or len(users) < 100:
            break
    if not found:
        found = client.auth.admin.create_user({
            'email': email, 'password': secrets.token_urlsafe(40), 'email_confirm': False,
        }).user
        print('Compte demandé créé ; connexion par lien e-mail nécessaire.')
    else:
        print('Compte existant conservé ; mot de passe inchangé.')
    client.table('internal_members').upsert({'user_id': str(found.id), 'role': 'publisher'}).execute()
    print('Rôle interne de publication attribué au seul compte demandé.')
finally:
    client.auth.close()
    client.postgrest.session.close()
