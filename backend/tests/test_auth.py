def test_login_success(client):
    response = client.post("/api/auth/login", json={
        "email": "admin@enterprisehrms.com",
        "password": "Enterprise@2026"
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
        "password": "Enterprise@2026"
    })
    assert response.status_code == 401

def test_get_current_user_me(client):
    login_resp = client.post("/api/auth/login", json={
        "email": "alex.chen@enterprisehrms.com",
        "password": "Enterprise@2026"
    })
    token = login_resp.json()["access_token"]

    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "alex.chen@enterprisehrms.com"
    assert resp.json()["role"] == "Employee"

def test_persona_switch(client):
    resp = client.post("/api/auth/switch-persona/2") # Sarah Jenkins (HR Manager)
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["role"] == "HR Manager"
