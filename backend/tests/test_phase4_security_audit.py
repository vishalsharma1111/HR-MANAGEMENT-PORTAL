import pytest
from app.auth.security import create_access_token

def test_unauthenticated_endpoints_rejected(client):
    """Verify protected endpoints reject requests lacking valid credentials with HTTP 401."""
    protected_paths = [
        ("GET", "/api/employees"),
        ("GET", "/api/payroll/runs"),
        ("GET", "/api/leave/applications"),
        ("POST", "/api/leave/apply"),
        ("POST", "/api/ml/predict/attrition"),
        ("POST", "/api/ai/chat"),
        ("GET", "/api/audit"),
    ]
    for method, path in protected_paths:
        if method == "GET":
            res = client.get(path)
        else:
            res = client.post(path, json={})
        assert res.status_code == 401, f"Expected 401 for {method} {path}, got {res.status_code}"

def test_tampered_token_rejected(client):
    """Verify invalid or forged JWT tokens are strictly rejected."""
    tampered_headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature"}
    res = client.get("/api/auth/me", headers=tampered_headers)
    assert res.status_code == 401
    assert "Invalid or expired" in res.json().get("detail", "")

def test_employee_cross_payslip_isolation(client):
    """Verify an employee cannot access another employee's payslip or payroll records."""
    # 1. Login as Aman (Employee ID: 4)
    emp_login = client.post("/api/auth/login", json={
        "email": "aman@enterprisehrms.com",
        "password": "Aman@123"
    })
    emp_token = emp_login.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}

    # 2. Query payslips - Aman should only receive own payslips
    res = client.get("/api/payroll/payslips", headers=emp_headers)
    assert res.status_code == 200
    payslips = res.json()
    assert len(payslips) > 0
    for p in payslips:
        assert p["employee_name"] == "Aman"

    # 3. Attempt to fetch another employee's payslip directly by ID (payslip 1 belongs to admin) -> 403
    forbidden_res = client.get("/api/payroll/payslips/1", headers=emp_headers)
    assert forbidden_res.status_code == 403

def test_recruiter_blocked_from_payroll(client):
    """Verify Recruiter persona is strictly blocked from sensitive payroll structures and runs."""
    recruiter_login = client.post("/api/auth/login", json={
        "email": "vishal.maurya@enterprisehrms.com",
        "password": "Vishal@123"
    })
    rec_token = recruiter_login.json()["access_token"]
    rec_headers = {"Authorization": f"Bearer {rec_token}"}

    res_runs = client.get("/api/payroll/runs", headers=rec_headers)
    assert res_runs.status_code == 403

    res_structures = client.get("/api/payroll/structures", headers=rec_headers)
    assert res_structures.status_code == 403

def test_unauthorized_user_cannot_approve_leave(client):
    """Verify standard employees cannot approve or reject leave applications."""
    emp_login = client.post("/api/auth/login", json={
        "email": "aman@enterprisehrms.com",
        "password": "Aman@123"
    })
    emp_headers = {"Authorization": f"Bearer {emp_login.json()['access_token']}"}

    review_res = client.put("/api/leave/applications/1/review", json={
        "status": "APPROVED",
        "remarks": "Self-approval attempt"
    }, headers=emp_headers)
    assert review_res.status_code == 403

def test_department_manager_access_isolation(client):
    """Verify Department Manager (Yash Sharma) only views employees in Software Engineering."""
    mgr_login = client.post("/api/auth/login", json={
        "email": "yash.sharma@enterprisehrms.com",
        "password": "Yash@123"
    })
    mgr_headers = {"Authorization": f"Bearer {mgr_login.json()['access_token']}"}

    res = client.get("/api/employees", headers=mgr_headers)
    assert res.status_code == 200
    emps = res.json()["items"]
    assert len(emps) > 0
    # All returned employees must belong to Software Engineering
    for emp in emps:
        assert emp["department_name"] == "Software Engineering"

def test_sensitive_credentials_never_exposed(client):
    """Verify hashed passwords or confidential internal tokens are not exposed in serialized responses."""
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@enterprisehrms.com",
        "password": "Vishal@123"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    users_res = client.get("/api/auth/users", headers=admin_headers)
    assert users_res.status_code == 200
    for u in users_res.json():
        assert "hashed_password" not in u
        assert "password" not in u

    emps_res = client.get("/api/employees", headers=admin_headers)
    assert emps_res.status_code == 200
    for e in emps_res.json()["items"]:
        assert "hashed_password" not in e

def test_self_service_forgot_password_flow(client):
    """Verify timing-safe self-service password recovery."""
    # Existing user
    res_valid = client.post("/api/auth/forgot-password", json={
        "email": "vishu.soam@enterprisehrms.com"
    })
    assert res_valid.status_code == 200
    assert "instructions have been dispatched" in res_valid.json()["message"]

    # Non-existing user (enumeration resistance)
    res_unknown = client.post("/api/auth/forgot-password", json={
        "email": "nonexistent.user@randomdomain.org"
    })
    assert res_unknown.status_code == 200
    assert "instructions have been dispatched" in res_unknown.json()["message"]

def test_deactivated_account_blocked(client):
    """Verify deactivated user accounts cannot log in."""
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@enterprisehrms.com",
        "password": "Vishal@123"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    # Deactivate employee user (Vishal Bhardwaj, id=6)
    toggle_res = client.put("/api/auth/users/6/status?is_active=false", headers=admin_headers)
    assert toggle_res.status_code == 200

    # Attempt login as deactivated user -> 403
    deactivated_login = client.post("/api/auth/login", json={
        "email": "vishal.bhardwaj@enterprisehrms.com",
        "password": "Vishal@123"
    })
    assert deactivated_login.status_code == 403
    assert "deactivated" in deactivated_login.json()["detail"].lower()

    # Re-activate user to maintain clean state
    restore_res = client.put("/api/auth/users/6/status?is_active=true", headers=admin_headers)
    assert restore_res.status_code == 200

def test_admin_self_deactivation_blocked(client):
    """Verify administrators cannot accidentally deactivate their own account."""
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@enterprisehrms.com",
        "password": "Vishal@123"
    })
    admin_id = admin_login.json()["user"]["id"]
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    res = client.put(f"/api/auth/users/{admin_id}/status?is_active=false", headers=admin_headers)
    assert res.status_code == 400
    assert "cannot deactivate their own account" in res.json()["detail"]

def test_public_registration_flow(client):
    """Verify public registration creates standard Employee account with token."""
    reg_payload = {
        "full_name": "Test Public User",
        "email": "public.newuser@enterprisehrms.com",
        "password": "PublicSecurePass2026!",
        "department_id": 2
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "public.newuser@enterprisehrms.com"
    assert data["user"]["role"] == "Employee"  # STRICT: never privileged

    # Duplicate registration rejected
    dup_res = client.post("/api/auth/register", json=reg_payload)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

    # Short password rejected
    short_res = client.post("/api/auth/register", json={
        "full_name": "Short Pwd",
        "email": "short.pwd@enterprisehrms.com",
        "password": "123"
    })
    assert short_res.status_code == 400

def test_contact_form_submission(client):
    """Verify public contact form persists inquiry and returns confirmation."""
    contact_payload = {
        "full_name": "Jane Enterprise Visitor",
        "email": "jane.visitor@externalclient.com",
        "subject": "Enterprise Demo Request",
        "message": "We would like to request an interactive demonstration of the HRMS."
    }
    res = client.post("/api/contact", json=contact_payload)
    assert res.status_code == 201
    data = res.json()
    assert data["id"] > 0
    assert data["full_name"] == "Jane Enterprise Visitor"
    assert data["status"] == "NEW"

    # Invalid payload rejection
    bad_res = client.post("/api/contact", json={
        "full_name": "J",
        "email": "invalid-email",
        "subject": "Hi",
        "message": "Too short"
    })
    assert bad_res.status_code in [400, 422]

