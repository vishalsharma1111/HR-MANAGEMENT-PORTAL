CREDENTIALS_MAP = {
    "admin@enterprisehrms.com": "Vishal@123",
    "vishu.soam@enterprisehrms.com": "Vishu@123",
    "yash.sharma@enterprisehrms.com": "Yash@123",
    "aman@enterprisehrms.com": "Aman@123",
    "vishal.maurya@enterprisehrms.com": "Vishal@123",
    "vishal.bhardwaj@enterprisehrms.com": "Vishal@123",
    "rachel.green@enterprisehrms.com": "Rachel@123",
    "vishnu@enterprisehrms.com": "Vishnu@123",
    "yash.bhardwaj@enterprisehrms.com": "Yash@123",
    "rohini@enterprisehrms.com": "Rohini@123",
}

def get_auth_token(client, email):
    password = CREDENTIALS_MAP.get(email, "Vishal@123")
    login_resp = client.post("/api/auth/login", json={
        "email": email,
        "password": password
    })
    return login_resp.json()["access_token"]

def test_list_employees_admin(client):
    token = get_auth_token(client, "admin@enterprisehrms.com")
    resp = client.get("/api/employees?page=1&page_size=10", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 10
    assert len(data["items"]) >= 10

def test_department_manager_access_isolation(client):
    # Yash Sharma is Engineering Department Manager
    eng_token = get_auth_token(client, "yash.sharma@enterprisehrms.com")
    resp = client.get("/api/employees", headers={"Authorization": f"Bearer {eng_token}"})
    assert resp.status_code == 200
    data = resp.json()
    # All listed employees must belong to Software Engineering
    for item in data["items"]:
        assert item["department_name"] == "Software Engineering"

def test_employee_self_isolation(client):
    # Aman is regular employee
    aman_token = get_auth_token(client, "aman@enterprisehrms.com")
    resp = client.get("/api/employees", headers={"Authorization": f"Bearer {aman_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["email"] == "aman@enterprisehrms.com"

def test_create_employee_duplicate_email(client):
    admin_token = get_auth_token(client, "admin@enterprisehrms.com")
    resp = client.post(
        "/api/employees",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "first_name": "Duplicate",
            "last_name": "Test",
            "email": "aman@enterprisehrms.com", # already exists
            "department_id": 3
        }
    )
    assert resp.status_code == 400
    assert "already exists" in resp.json()["detail"]

def test_create_and_lifecycle_workflow(client):
    hr_token = get_auth_token(client, "vishu.soam@enterprisehrms.com")
    resp = client.post(
        "/api/employees",
        headers={"Authorization": f"Bearer {hr_token}"},
        json={
            "first_name": "Katherine",
            "last_name": "Johnson",
            "email": "katherine.johnson@enterprisehrms.com",
            "department_id": 3,
            "employment_type": "Full-Time",
            "status": "Active"
        }
    )
    assert resp.status_code == 201
    created_emp = resp.json()
    assert created_emp["employee_id"].startswith("EMP-")
    assert created_emp["email"] == "katherine.johnson@enterprisehrms.com"

    # Verify initial lifecycle event was recorded
    assert len(created_emp["lifecycle_events"]) > 0
    assert created_emp["lifecycle_events"][0]["event_type"] == "JOINED"

def test_org_chart_endpoint(client):
    token = get_auth_token(client, "admin@enterprisehrms.com")
    resp = client.get("/api/employees/organization/org-chart", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    chart = resp.json()
    assert len(chart) > 0
    # Top leadership should have children (direct reports)
    assert any(len(node["children"]) > 0 for node in chart)
