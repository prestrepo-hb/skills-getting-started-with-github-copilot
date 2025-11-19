from fastapi.testclient import TestClient
import copy
import pytest

from src.app import app, activities


# keep a snapshot of the initial activities so tests can reset
INITIAL_ACTIVITIES = copy.deepcopy(activities)


@pytest.fixture(autouse=True)
def restore_activities():
    # Reset the in-memory activities before each test
    activities.clear()
    activities.update(copy.deepcopy(INITIAL_ACTIVITIES))
    yield


@pytest.fixture()
def client():
    return TestClient(app)


def test_get_activities(client):
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_reflect(client):
    activity = "Chess Club"
    email = "test_student@mergington.edu"

    # sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    body = resp.json()
    assert "Signed up" in body.get("message", "")

    # check activity contains the new participant
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert email in data[activity]["participants"]


def test_double_signup_fails(client):
    activity = "Chess Club"
    email = "dup_student@mergington.edu"

    resp1 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp1.status_code == 200

    resp2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp2.status_code == 400


def test_unregister_and_reflect(client):
    activity = "Chess Club"
    email = "remove_student@mergington.edu"

    # ensure it's present by signing up
    r1 = client.post(f"/activities/{activity}/signup?email={email}")
    assert r1.status_code == 200

    # unregister
    r2 = client.delete(f"/activities/{activity}/participants?email={email}")
    assert r2.status_code == 200
    assert "Unregistered" in r2.json().get("message", "")

    # ensure it's removed
    r3 = client.get("/activities")
    assert r3.status_code == 200
    assert email not in r3.json()[activity]["participants"]


def test_unregister_nonexistent_returns_404(client):
    activity = "Chess Club"
    email = "not_a_member@mergington.edu"
    r = client.delete(f"/activities/{activity}/participants?email={email}")
    assert r.status_code == 404
