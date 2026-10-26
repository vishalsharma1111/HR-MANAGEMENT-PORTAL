CREDENTIALS_MAP = {
    "admin@enterprisehrms.com": "Vishal@123",
    "rachel.green@enterprisehrms.com": "Rachel@123",
}

def get_auth_token(client, email):
    password = CREDENTIALS_MAP.get(email, "Vishal@123")
    login_resp = client.post("/api/auth/login", json={
        "email": email,
        "password": password
    })
    return login_resp.json()["access_token"]

def test_onboarding_summary_and_update(client):
    admin_token = get_auth_token(client, "admin@enterprisehrms.com")
    resp = client.get("/api/onboarding/summary", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    summary = resp.json()
    assert summary["total_tasks"] > 0
    assert "completion_rate" in summary

    # List tasks
    tasks_resp = client.get("/api/onboarding", headers={"Authorization": f"Bearer {admin_token}"})
    assert tasks_resp.status_code == 200
    tasks = tasks_resp.json()
    assert len(tasks) > 0
    target_task = tasks[0]

    # Toggle task completion
    update_resp = client.put(
        f"/api/onboarding/tasks/{target_task['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"is_completed": True}
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["is_completed"] is True

def test_asset_inventory_management(client):
    it_token = get_auth_token(client, "rachel.green@enterprisehrms.com")
    # List assets
    resp = client.get("/api/assets", headers={"Authorization": f"Bearer {it_token}"})
    assert resp.status_code == 200
    assets = resp.json()
    assert len(assets) > 0

    # Create new asset
    create_resp = client.post(
        "/api/assets",
        headers={"Authorization": f"Bearer {it_token}"},
        json={
            "name": "Apple Studio Display 27\"",
            "category": "MONITOR",
            "serial_number": "SN-STUDIO-88910",
            "status": "AVAILABLE"
        }
    )
    assert create_resp.status_code == 201
    created_asset = create_resp.json()
    assert created_asset["name"] == "Apple Studio Display 27\""
    assert created_asset["asset_tag"].startswith("AST-")

def test_dashboard_metrics(client):
    admin_token = get_auth_token(client, "admin@enterprisehrms.com")
    resp = client.get("/api/dashboard/metrics", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_employees"] > 0
    assert len(data["department_distribution"]) > 0
    assert len(data["recent_activity"]) > 0
    assert len(data["announcements"]) > 0

def test_audit_logs_retrieval(client):
    admin_token = get_auth_token(client, "admin@enterprisehrms.com")
    resp = client.get("/api/audit", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    logs = resp.json()
    assert len(logs) > 0
    assert "action" in logs[0]
    assert "entity_type" in logs[0]
