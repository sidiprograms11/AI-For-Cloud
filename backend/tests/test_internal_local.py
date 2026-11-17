"""Parcours réel sur Supabase local ; jamais sur un projet hébergé.

Activer avec RUN_LOCAL_SUPABASE_TESTS=1 et les trois variables SUPABASE_URL,
SUPABASE_PUBLISHABLE_KEY et SUPABASE_SECRET_KEY de `supabase status -o env`.
"""

import os
import secrets
import unittest
from uuid import uuid4

import httpx
from fastapi.testclient import TestClient
from supabase import create_client

from app.main import app


@unittest.skipUnless(os.getenv("RUN_LOCAL_SUPABASE_TESTS") == "1", "Pile locale non demandée")
class InternalLocalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        url = os.environ["SUPABASE_URL"]
        if url not in ("http://127.0.0.1:54321", "http://localhost:54321"):
            raise RuntimeError("Ce test ne doit utiliser que Supabase local.")
        cls.admin = create_client(url, os.environ["SUPABASE_SECRET_KEY"])
        cls.users = []
        cls.case_id = None
        cls.client = TestClient(app)
        cls.public_key = os.environ["SUPABASE_PUBLISHABLE_KEY"]
        cls.url = url
        cls.password = secrets.token_urlsafe(24)
        try:
            for role in ("member", "publisher", None):
                email = f"kora-local-{uuid4().hex}@example.test"
                user = cls.admin.auth.admin.create_user(
                    {"email": email, "password": cls.password, "email_confirm": True}
                ).user
                cls.users.append(user)
                if role:
                    cls.admin.table("internal_members").insert(
                        {"user_id": str(user.id), "role": role}
                    ).execute()
            cls.tokens = []
            for user in cls.users:
                public = create_client(url, cls.public_key)
                try:
                    session = public.auth.sign_in_with_password(
                        {"email": user.email, "password": cls.password}
                    ).session
                    cls.tokens.append(session.access_token)
                finally:
                    public.auth.close()
                    public.postgrest.session.close()
        except Exception:
            cls.tearDownClass()
            raise

    @classmethod
    def tearDownClass(cls):
        if getattr(cls, "case_id", None):
            cls.admin.table("internal_cases").delete().eq("id", cls.case_id).execute()
        for user in getattr(cls, "users", []):
            cls.admin.auth.admin.delete_user(str(user.id))
        cls.admin.auth.close()
        cls.admin.postgrest.session.close()
        cls.client.close()
        super().tearDownClass()

    def request(self, method, path, actor=0, json=None):
        return self.client.request(
            method,
            f"/api/v1/internal{path}",
            headers={"Authorization": f"Bearer {self.tokens[actor]}"},
            json=json,
        )

    def test_complete_case_and_version_cycle(self):
        self.assertEqual(self.client.get("/api/v1/internal/me").status_code, 401)
        self.assertEqual(self.request("GET", "/me", actor=2).status_code, 403)
        self.assertEqual(self.request("GET", "/me").json()["role"], "member")

        fields = {
            "title": "Scénario local de vérification",
            "company_context": "Entreprise fictive avec une application métier à héberger.",
            "blocking_constraints": ["Données dans l'Union européenne"],
            "preferences": ["Exploitation simple"],
            "data_region": "Union européenne",
            "budget_context": "À préciser",
        }
        response = self.request("POST", "/cases", json=fields)
        self.assertEqual(response.status_code, 201, response.text)
        case = response.json()
        self.__class__.case_id = case["id"]
        v1 = case["versions"][0]
        self.assertEqual(v1["state"], "draft")
        self.assertEqual(len(self.request("GET", "/cases").json()), 1)

        # Une session Auth normale ne contourne pas les droits Data API internes.
        direct = httpx.get(
            f"{self.url}/rest/v1/internal_cases?select=id",
            headers={"apikey": self.public_key, "Authorization": f"Bearer {self.tokens[0]}"},
            timeout=5,
        )
        if direct.status_code == 200:
            self.assertNotIn(self.case_id, [row["id"] for row in direct.json()])
        else:
            self.assertIn(direct.status_code, (401, 403))

        headers = {
            "apikey": self.public_key,
            "Authorization": f"Bearer {self.tokens[0]}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
        attempted_id = str(uuid4())
        httpx.post(
            f"{self.url}/rest/v1/internal_cases",
            headers=headers,
            json={"id": attempted_id, "created_by": str(self.users[0].id)},
            timeout=5,
        )
        inserted = (
            self.admin.table("internal_cases").select("id").eq("id", attempted_id).execute().data
        )
        self.assertEqual(inserted, [], "Insertion directe dans la console autorisée")

        path = f"/cases/{self.case_id}/versions/{v1['id']}"
        updated = self.request("PATCH", path, json={**fields, "expected_revision": 1})
        self.assertEqual(updated.status_code, 200, updated.text)
        self.assertEqual(updated.json()["revision"], 2)
        result = self.request("POST", f"{path}/tests")
        self.assertEqual(result.status_code, 201, result.text)
        self.assertEqual(result.json()["status"], "simulated")
        self.assertIsNone(result.json()["result"]["provider_comparison"])
        self.assertEqual(self.request("POST", f"{path}/submit-review").status_code, 200)
        self.assertEqual(self.request("POST", f"{path}/approve").status_code, 403)
        self.assertEqual(self.request("POST", f"{path}/approve", actor=1).status_code, 200)
        self.assertEqual(self.request("POST", f"{path}/publish").status_code, 403)
        published = self.request("POST", f"{path}/publish", actor=1)
        self.assertEqual(published.status_code, 200, published.text)
        self.assertEqual(published.json()["active_version_id"], v1["id"])

        httpx.patch(
            f"{self.url}/rest/v1/internal_cases?id=eq.{self.case_id}",
            headers=headers,
            json={"active_version_id": None},
            timeout=5,
        )
        after_patch = (
            self.admin.table("internal_cases")
            .select("active_version_id")
            .eq("id", self.case_id)
            .execute()
            .data[0]
        )
        self.assertEqual(after_patch["active_version_id"], v1["id"])
        httpx.delete(
            f"{self.url}/rest/v1/internal_cases?id=eq.{self.case_id}",
            headers=headers,
            timeout=5,
        )
        still_present = (
            self.admin.table("internal_cases").select("id").eq("id", self.case_id).execute().data
        )
        self.assertEqual(len(still_present), 1, "Suppression directe du cas autorisée")

        created = self.request("POST", f"/cases/{self.case_id}/drafts")
        self.assertEqual(created.status_code, 201, created.text)
        v2 = created.json()
        self.assertEqual(v2["state"], "draft")
        path2 = f"/cases/{self.case_id}/versions/{v2['id']}"
        edited = self.request(
            "PATCH", path2, json={**fields, "title": "Version deux", "expected_revision": 1}
        )
        self.assertEqual(edited.status_code, 200, edited.text)
        before = self.request("GET", f"/cases/{self.case_id}").json()
        self.assertEqual(before["active_version_id"], v1["id"])
        self.assertEqual(
            next(v for v in before["versions"] if v["id"] == v1["id"])["title"], fields["title"]
        )
        self.assertEqual(self.request("POST", f"{path2}/tests").status_code, 201)
        self.assertEqual(self.request("POST", f"{path2}/submit-review").status_code, 200)
        self.assertEqual(self.request("POST", f"{path2}/approve", actor=1).status_code, 200)
        self.assertEqual(
            self.request("POST", f"{path2}/publish", actor=1).json()["active_version_id"], v2["id"]
        )
        rolled_back = self.request("POST", f"{path}/rollback", actor=1)
        self.assertEqual(rolled_back.status_code, 200, rolled_back.text)
        self.assertEqual(rolled_back.json()["active_version_id"], v1["id"])


if __name__ == "__main__":
    unittest.main()
