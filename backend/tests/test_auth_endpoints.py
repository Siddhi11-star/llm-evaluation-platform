import asyncio
import sys
from pathlib import Path
from typing import Any

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from bson import ObjectId

from app.main import app
from app.api.deps import get_db
from app.core.security import get_password_hash


class MockAsyncCollection:
    def __init__(self):
        self.docs: dict[str, dict[str, Any]] = {}

    async def find_one(self, filter_query: dict[str, Any]):
        for doc in self.docs.values():
            match = True
            for k, v in filter_query.items():
                if k == "_id":
                    if doc.get("_id") != v:
                        match = False
                        break
                elif doc.get(k) != v:
                    match = False
                    break
            if match:
                return dict(doc)
        return None

    async def insert_one(self, doc: dict[str, Any]):
        doc_copy = dict(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = ObjectId()
        self.docs[str(doc_copy["_id"])] = doc_copy

        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id

        return InsertResult(doc_copy["_id"])

    async def update_one(self, filter_query: dict[str, Any], update_query: dict[str, Any]):
        for doc_id, doc in self.docs.items():
            match = True
            for k, v in filter_query.items():
                if k == "_id":
                    if doc.get("_id") != v:
                        match = False
                        break
                elif doc.get(k) != v:
                    match = False
                    break
            if match:
                if "$set" in update_query:
                    doc.update(update_query["$set"])
                break


class MockAsyncDatabase:
    def __init__(self):
        self.collections: dict[str, MockAsyncCollection] = {}

    def __getitem__(self, name: str) -> MockAsyncCollection:
        if name not in self.collections:
            self.collections[name] = MockAsyncCollection()
        return self.collections[name]

    async def command(self, cmd: str, *args, **kwargs):
        if cmd == "ping":
            return {"ok": 1}
        return {}


def test_auth_and_onboarding_flow():
    mock_db = MockAsyncDatabase()
    app.dependency_overrides[get_db] = lambda: mock_db

    client = TestClient(app)

    # 1. Test Health Check
    health_res = client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["project"] == "JudgeAI Evaluation Platform"

    # 2. Test Signup
    signup_payload = {
        "email": "alice@judgeai.eval",
        "password": "Password123!",
        "full_name": "Alice Evaluator",
        "organization_name": "Antigravity AI Lab",
        "role": "AI Safety Engineer",
    }
    signup_res = client.post("/api/v1/auth/signup", json=signup_payload)
    assert signup_res.status_code == 201, signup_res.text
    signup_data = signup_res.json()
    assert "access_token" in signup_data
    assert signup_data["user"]["email"] == "alice@judgeai.eval"
    assert signup_data["user"]["onboarding_step"] == "welcome"
    assert signup_data["user"]["is_onboarded"] is False
    token = signup_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Test duplicate signup
    dup_res = client.post("/api/v1/auth/signup", json=signup_payload)
    assert dup_res.status_code == 400

    # 4. Test Login
    login_payload = {
        "email": "alice@judgeai.eval",
        "password": "Password123!",
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 5. Test Invalid Login
    invalid_login = client.post("/api/v1/auth/login", json={"email": "alice@judgeai.eval", "password": "WrongPassword"})
    assert invalid_login.status_code == 401

    # 6. Test /users/me
    me_res = client.get("/api/v1/users/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "alice@judgeai.eval"

    # 7. Test /users/me/onboarding update
    onboarding_payload = {
        "step": "models",
        "use_case": "summarization_eval",
        "preferred_models": ["qwen3:14b", "llama-3.3-70b-versatile"],
        "default_provider": "groq",
        "completed_step": "use_case",
    }
    onboard_res = client.patch("/api/v1/users/me/onboarding", json=onboarding_payload, headers=headers)
    assert onboard_res.status_code == 200
    onboard_data = onboard_res.json()
    assert onboard_data["onboarding_step"] == "models"
    assert onboard_data["onboarding_data"]["use_case"] == "summarization_eval"
    assert "qwen3:14b" in onboard_data["onboarding_data"]["preferred_models"]
    assert "use_case" in onboard_data["onboarding_data"]["completed_steps"]

    # 8. Complete onboarding
    complete_payload = {
        "step": "completed",
        "is_onboarded": True,
        "completed_step": "models",
    }
    complete_res = client.patch("/api/v1/users/me/onboarding", json=complete_payload, headers=headers)
    assert complete_res.status_code == 200
    complete_data = complete_res.json()
    assert complete_data["is_onboarded"] is True
    assert complete_data["onboarding_step"] == "completed"

    print("✓ Full Auth & Onboarding Flow (Signup -> Login -> Me -> Onboarding Steps -> Completed) PASSED! 🎉")

    app.dependency_overrides.clear()


if __name__ == "__main__":
    test_auth_and_onboarding_flow()
