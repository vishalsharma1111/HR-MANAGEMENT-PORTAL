def test_login_success(client):
    response = client.post("/api/auth/login", json={
        "email": "admin@enterprisehrms.com",
        "password": "Vishal@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@enterprisehrms.com"
    assert data["user"]["role"] == "Super Admin"

def test_login_invalid_password(client):
    response = client.post("/api/auth/login", json={
        "email": "admin@enterprisehrms.com",
        "password": "WrongPassword123!"
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_login_nonexistent_user(client):
    response = client.post("/api/auth/login", json={
        "email": "nonexistent@enterprisehrms.com",
        "password": "Vishal@123"
    })
    assert response.status_code == 401

def test_get_current_user_me(client):
    login_resp = client.post("/api/auth/login", json={
        "email": "aman@enterprisehrms.com",
        "password": "Aman@123"
    })
    token = login_resp.json()["access_token"]

    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "aman@enterprisehrms.com"
    assert resp.json()["role"] == "Employee"

def test_persona_switch_requires_admin(client):
    # Unauthenticated switch attempt must be rejected with 401
    unauth_resp = client.post("/api/auth/switch-persona/2")
    assert unauth_resp.status_code == 401

    # Employee attempt must be rejected with 403
    emp_login = client.post("/api/auth/login", json={
        "email": "aman@enterprisehrms.com",
        "password": "Aman@123"
    })
    emp_token = emp_login.json()["access_token"]
    forbidden_resp = client.post(
        "/api/auth/switch-persona/2",
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert forbidden_resp.status_code == 403

    # Super Admin allowed to switch personas for testing
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@enterprisehrms.com",
        "password": "Vishal@123"
    })
    admin_token = admin_login.json()["access_token"]
    admin_resp = client.post(
        "/api/auth/switch-persona/2",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_resp.status_code == 200
    assert admin_resp.json()["user"]["role"] == "HR Manager"
