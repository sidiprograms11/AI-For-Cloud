"""Contrôles HTTP sans base : les essais RLS restent à faire sur Supabase local."""

import unittest
from types import SimpleNamespace
from unittest.mock import patch
from uuid import UUID

from fastapi.testclient import TestClient
from pydantic import SecretStr

from app.main import app

USER_ID = "11111111-1111-4111-8111-111111111111"
CASE_ID = "22222222-2222-4222-8222-222222222222"
VERSION_ID = "33333333-3333-4333-8333-333333333333"


class FakeQuery:
    def __init__(self, rows: list[dict]):
        self.rows = rows

    def select(self, *_args):
        return self

    def eq(self, *_args):
        return self

    def execute(self):
        return SimpleNamespace(data=self.rows)


class FakeClient:
    def __init__(self, role: str | None):
        self.role = role
        self.auth = self

    def get_user(self, token: str):
        if token != "valid-token":
            raise ValueError("invalid")
        return SimpleNamespace(user=SimpleNamespace(id=UUID(USER_ID)))

    def table(self, name: str):
        if name == "internal_members":
            return FakeQuery([{"role": self.role}] if self.role else [])
        if name == "internal_case_versions":
            return FakeQuery([{"id": VERSION_ID, "case_id": CASE_ID,
                               "state": "in_review", "created_by": USER_ID}])
        return FakeQuery([])


class InternalAccessTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.settings = SimpleNamespace(
            supabase_url="http://127.0.0.1:54321",
            supabase_publishable_key=SecretStr("test-public"),
            supabase_secret_key=SecretStr("test-secret"),
        )

    def call(self, path: str, role: str | None, token: str | None = "valid-token", method="get"):
        headers = {"Authorization": f"Bearer {token}"} if token is not None else {}
        fake = FakeClient(role)
        with patch("app.api.internal.get_settings", return_value=self.settings), patch(
            "app.api.internal.create_client", return_value=fake
        ):
            return getattr(self.client, method)(path, headers=headers)

    def test_health_is_public(self):
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_missing_or_invalid_token_is_rejected(self):
        self.assertEqual(self.call("/api/v1/internal/me", "member", token=None).status_code, 401)
        self.assertEqual(self.call("/api/v1/internal/me", "member", token="bad").status_code, 401)

    def test_auth_user_without_internal_role_is_rejected(self):
        self.assertEqual(self.call("/api/v1/internal/me", None).status_code, 403)

    def test_member_can_read_role_but_cannot_publish(self):
        response = self.call("/api/v1/internal/me", "member")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["role"], "member")
        path = f"/api/v1/internal/cases/{CASE_ID}/versions/{VERSION_ID}/publish"
        self.assertEqual(self.call(path, "member", method="post").status_code, 403)

    def test_reviewer_cannot_review_own_version(self):
        path = f"/api/v1/internal/cases/{CASE_ID}/versions/{VERSION_ID}/approve"
        self.assertEqual(self.call(path, "reviewer", method="post").status_code, 403)


if __name__ == "__main__":
    unittest.main()
