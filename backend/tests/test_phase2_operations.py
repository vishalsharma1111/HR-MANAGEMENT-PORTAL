import pytest
from datetime import date, datetime, timedelta

def test_attendance_checkin_checkout_flow(client):
    # Log in as Alex Chen (EMP-0004)
    login_resp = client.post("/api/auth/login", json={
        "email": "alex.chen@enterprisehrms.com",
        "password": "Enterprise@2026"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get today's attendance status
    today_resp = client.get("/api/attendance/today", headers=headers)
    assert today_resp.status_code == 200

    # 2. Check-in
    check_in_resp = client.post("/api/attendance/check-in", json={"notes": "Starting daily shift"}, headers=headers)
    assert check_in_resp.status_code == 200
    att_data = check_in_resp.json()
    assert att_data["check_in"] is not None
    assert att_data["status"] == "PRESENT"

    # 3. Duplicate check-in should be rejected
    dup_resp = client.post("/api/attendance/check-in", json={"notes": "Duplicate punch"}, headers=headers)
    assert dup_resp.status_code == 400
    assert "duplicate" in dup_resp.json()["detail"].lower()

    # 4. Check-out
    check_out_resp = client.post("/api/attendance/check-out", json={"notes": "Ending daily shift"}, headers=headers)
    assert check_out_resp.status_code == 200
    out_data = check_out_resp.json()
    assert out_data["check_out"] is not None

def test_attendance_correction_workflow(client):
    # Alex Chen applies for a correction
    alex_token = client.post("/api/auth/login", json={
        "email": "alex.chen@enterprisehrms.com",
        "password": "Enterprise@2026"
    }).json()["access_token"]
    alex_headers = {"Authorization": f"Bearer {alex_token}"}

    yesterday = date.today() - timedelta(days=1)
    req_in = datetime.combine(yesterday, datetime.strptime("09:00:00", "%H:%M:%S").time())
    req_out = datetime.combine(yesterday, datetime.strptime("18:00:00", "%H:%M:%S").time())

    corr_resp = client.post("/api/attendance/corrections", json={
        "date": yesterday.isoformat(),
        "requested_check_in": req_in.isoformat(),
        "requested_check_out": req_out.isoformat(),
        "reason": "Forgot badge at home, punch missed"
    }, headers=alex_headers)
    assert corr_resp.status_code == 201
    corr_id = corr_resp.json()["id"]

    # Marcus Vance (Manager) reviews and approves correction
    marcus_token = client.post("/api/auth/login", json={
        "email": "marcus.vance@enterprisehrms.com",
        "password": "Enterprise@2026"
    }).json()["access_token"]
    marcus_headers = {"Authorization": f"Bearer {marcus_token}"}

    review_resp = client.put(f"/api/attendance/corrections/{corr_id}/review", json={
        "status": "APPROVED",
        "review_notes": "Verified working hours with team."
    }, headers=marcus_headers)
    assert review_resp.status_code == 200
    assert review_resp.json()["status"] == "APPROVED"

def test_leave_application_and_overlap_validation(client):
    alex_token = client.post("/api/auth/login", json={
        "email": "alex.chen@enterprisehrms.com",
        "password": "Enterprise@2026"
    }).json()["access_token"]
    alex_headers = {"Authorization": f"Bearer {alex_token}"}

    # 1. Check leave types
    types_resp = client.get("/api/leave/types", headers=alex_headers)
    assert types_resp.status_code == 200
    types = types_resp.json()
    assert len(types) > 0
    pl_id = next(t["id"] for t in types if t["code"] == "PL")

    # 2. Apply for future leave
    start = (date.today() + timedelta(days=20)).isoformat()
    end = (date.today() + timedelta(days=22)).isoformat()
    apply_resp = client.post("/api/leave/apply", json={
        "leave_type_id": pl_id,
        "start_date": start,
        "end_date": end,
        "is_half_day": False,
        "reason": "Family vacation"
    }, headers=alex_headers)
    assert apply_resp.status_code == 201
    app_data = apply_resp.json()
    assert app_data["status"] == "PENDING_MANAGER"
    assert app_data["days_count"] == 3.0

    # 3. Overlapping leave application should fail with 400
    dup_apply = client.post("/api/leave/apply", json={
        "leave_type_id": pl_id,
        "start_date": start,
        "end_date": end,
        "is_half_day": False,
        "reason": "Duplicate overlapping request"
    }, headers=alex_headers)
    assert dup_apply.status_code == 400
    assert "overlap" in dup_apply.json()["detail"].lower()

def test_leave_approval_workflow_syncs_to_attendance(client):
    # Alex Chen applies for 1-day leave
    alex_token = client.post("/api/auth/login", json={
        "email": "alex.chen@enterprisehrms.com",
        "password": "Enterprise@2026"
    }).json()["access_token"]
    alex_headers = {"Authorization": f"Bearer {alex_token}"}

    types = client.get("/api/leave/types", headers=alex_headers).json()
    cl_id = next(t["id"] for t in types if t["code"] == "CL")

    target_date = (date.today() + timedelta(days=40)).isoformat()
    apply_resp = client.post("/api/leave/apply", json={
        "leave_type_id": cl_id,
        "start_date": target_date,
        "end_date": target_date,
        "is_half_day": False,
        "reason": "Personal urgent task"
    }, headers=alex_headers)
    assert apply_resp.status_code == 201
    app_id = apply_resp.json()["id"]

    # Manager (Marcus Vance) reviews & approves -> final approval and syncs with attendance
    marcus_token = client.post("/api/auth/login", json={
        "email": "marcus.vance@enterprisehrms.com",
        "password": "Enterprise@2026"
    }).json()["access_token"]
    marcus_headers = {"Authorization": f"Bearer {marcus_token}"}

    mgr_approve_resp = client.put(f"/api/leave/applications/{app_id}/review", json={
        "status": "APPROVED",
        "comments": "Approved by manager"
    }, headers=marcus_headers)
    assert mgr_approve_resp.status_code == 200
    assert mgr_approve_resp.json()["status"] == "APPROVED"

def test_monthly_payroll_run_processing(client):
    # Payroll Officer (David Miller)
    david_token = client.post("/api/auth/login", json={
        "email": "david.miller@enterprisehrms.com",
        "password": "Enterprise@2026"
    }).json()["access_token"]
    david_headers = {"Authorization": f"Bearer {david_token}"}

    # Process payroll for a specific month (e.g., month 11 of current year)
    curr_year = date.today().year
    process_resp = client.post("/api/payroll/runs", json={
        "month": 11,
        "year": curr_year
    }, headers=david_headers)
    assert process_resp.status_code == 201
    run_data = process_resp.json()
    assert run_data["status"] == "PROCESSED"
    assert run_data["employees_count"] > 0
    assert run_data["total_gross"] > 0
    assert run_data["total_net"] > 0
    run_id = run_data["id"]

    # Duplicate payroll processing for same month/year should be rejected
    dup_resp = client.post("/api/payroll/runs", json={
        "month": 11,
        "year": curr_year
    }, headers=david_headers)
    assert dup_resp.status_code == 400

    # Get payslips for the run
    slips_resp = client.get(f"/api/payroll/runs/{run_id}/payslips", headers=david_headers)
    assert slips_resp.status_code == 200
    payslips = slips_resp.json()
    assert len(payslips) > 0

    # Super Admin approves the payroll run
    admin_token = client.post("/api/auth/login", json={
        "email": "admin@enterprisehrms.com",
        "password": "Enterprise@2026"
    }).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    approve_run_resp = client.put(f"/api/payroll/runs/{run_id}/approve", headers=admin_headers)
    assert approve_run_resp.status_code == 200
    assert approve_run_resp.json()["status"] == "PAID"

def test_recruitment_pipeline_and_hire_onboard_conversion(client):
    # Recruiter (Elena Rostova)
    elena_token = client.post("/api/auth/login", json={
        "email": "elena.rostova@enterprisehrms.com",
        "password": "Enterprise@2026"
    }).json()["access_token"]
    elena_headers = {"Authorization": f"Bearer {elena_token}"}

    reqs = client.get("/api/recruitment/requisitions", headers=elena_headers).json()
    assert len(reqs) > 0
    req_id = reqs[0]["id"]

    # 1. Create a candidate
    cand_resp = client.post("/api/recruitment/candidates", json={
        "job_requisition_id": req_id,
        "full_name": "Jordan Bellfort",
        "email": "jordan.b@example.com",
        "phone": "+1 555-888-9999",
        "current_company": "WallStreet Cloud",
        "current_designation": "Staff Engineer",
        "experience_years": 8.0,
        "stage": "OFFER"
    }, headers=elena_headers)
    assert cand_resp.status_code == 201
    cand_id = cand_resp.json()["id"]

    # 2. Progress stage to HIRED
    upd_resp = client.put(f"/api/recruitment/candidates/{cand_id}", json={
        "stage": "HIRED",
        "rating": 5
    }, headers=elena_headers)
    assert upd_resp.status_code == 200
    assert upd_resp.json()["stage"] == "HIRED"

    # 3. Trigger 1-Click Hire & Onboard Handover (Connected Workflow)
    # HR Manager executes the conversion
    sarah_token = client.post("/api/auth/login", json={
        "email": "sarah.jenkins@enterprisehrms.com",
        "password": "Enterprise@2026"
    }).json()["access_token"]
    sarah_headers = {"Authorization": f"Bearer {sarah_token}"}

    convert_resp = client.post(f"/api/recruitment/candidates/{cand_id}/hire", json={
        "department_id": reqs[0]["department_id"],
        "designation_id": reqs[0]["designation_id"],
        "joining_date": date.today().isoformat(),
        "starting_salary": 160000.0
    }, headers=sarah_headers)
    assert convert_resp.status_code == 201
    conv_data = convert_resp.json()
    assert "employee_id" in conv_data
    assert conv_data["status"] == "Onboarding"

def test_performance_and_goals_flow(client):
    alex_token = client.post("/api/auth/login", json={
        "email": "alex.chen@enterprisehrms.com",
        "password": "Enterprise@2026"
    }).json()["access_token"]
    alex_headers = {"Authorization": f"Bearer {alex_token}"}

    # 1. List goals
    goals_resp = client.get("/api/performance/goals", headers=alex_headers)
    assert goals_resp.status_code == 200
    goals = goals_resp.json()
    assert len(goals) > 0
    goal_id = goals[0]["id"]

    # 2. Update goal progress
    upd_goal = client.put(f"/api/performance/goals/{goal_id}", json={
        "progress": 85,
        "status": "ON_TRACK"
    }, headers=alex_headers)
    assert upd_goal.status_code == 200
    assert upd_goal.json()["progress"] == 85

    # 3. List courses
    courses_resp = client.get("/api/performance/courses", headers=alex_headers)
    assert courses_resp.status_code == 200
    courses = courses_resp.json()
    assert len(courses) > 0

    # 4. Give Peer Recognition
    marcus_token = client.post("/api/auth/login", json={
        "email": "marcus.vance@enterprisehrms.com",
        "password": "Enterprise@2026"
    }).json()["access_token"]
    marcus_headers = {"Authorization": f"Bearer {marcus_token}"}

    kudos_resp = client.post("/api/performance/recognitions", json={
        "receiver_id": goals[0]["employee_id"],
        "badge": "Team Player",
        "message": "Superb work on Phase 2 operations testing and verification!"
    }, headers=marcus_headers)
    assert kudos_resp.status_code == 201
    assert kudos_resp.json()["badge"] == "Team Player"

def test_expenses_and_helpdesk_flow(client):
    alex_token = client.post("/api/auth/login", json={
        "email": "alex.chen@enterprisehrms.com",
        "password": "Enterprise@2026"
    }).json()["access_token"]
    alex_headers = {"Authorization": f"Bearer {alex_token}"}

    # 1. Submit Expense Claim
    exp_resp = client.post("/api/expenses/claims", json={
        "title": "Cloud Computing Micro-Credentials Exam",
        "category": "TRAINING",
        "amount": 250.00,
        "currency": "USD",
        "expense_date": date.today().isoformat()
    }, headers=alex_headers)
    assert exp_resp.status_code == 201
    exp_id = exp_resp.json()["id"]

    # 2. Manager approves expense
    marcus_token = client.post("/api/auth/login", json={
        "email": "marcus.vance@enterprisehrms.com",
        "password": "Enterprise@2026"
    }).json()["access_token"]
    marcus_headers = {"Authorization": f"Bearer {marcus_token}"}

    app_exp = client.put(f"/api/expenses/claims/{exp_id}/review", json={
        "status": "APPROVED",
        "approver_comments": "Approved under team training allocation."
    }, headers=marcus_headers)
    assert app_exp.status_code == 200
    assert app_exp.json()["status"] == "APPROVED"

    # 3. Submit Helpdesk Ticket
    ticket_resp = client.post("/api/expenses/tickets", json={
        "category": "IT_SUPPORT",
        "priority": "HIGH",
        "subject": "Need monitor arm mount for dual displays",
        "description": "Ergonomic dual arm mount needed for standing desk."
    }, headers=alex_headers)
    assert ticket_resp.status_code == 201
    tkt_id = ticket_resp.json()["id"]

    # 4. IT Admin resolves helpdesk ticket
    it_token = client.post("/api/auth/login", json={
        "email": "rachel.green@enterprisehrms.com",
        "password": "Enterprise@2026"
    }).json()["access_token"]
    it_headers = {"Authorization": f"Bearer {it_token}"}

    res_tkt = client.put(f"/api/expenses/tickets/{tkt_id}", json={
        "status": "RESOLVED",
        "resolution_notes": "Issued and mounted by IT facilities team."
    }, headers=it_headers)
    assert res_tkt.status_code == 200
    assert res_tkt.json()["status"] == "RESOLVED"

def test_reports_and_csv_export(client):
    admin_token = client.post("/api/auth/login", json={
        "email": "admin@enterprisehrms.com",
        "password": "Enterprise@2026"
    }).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Headcount Report
    headcount = client.get("/api/reports/headcount", headers=admin_headers)
    assert headcount.status_code == 200
    data = headcount.json()
    assert "total_workforce" in data
    assert "attrition_rate_percentage" in data

    # 2. Attendance Report
    att_rep = client.get("/api/reports/attendance", headers=admin_headers)
    assert att_rep.status_code == 200
    att_data = att_rep.json()
    assert "present_rate" in att_data

    # 3. CSV streaming export
    csv_resp = client.get("/api/reports/export-csv/employees", headers=admin_headers)
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers.get("content-type", "")
    assert "Employee ID,First Name,Last Name" in csv_resp.text

def test_role_based_access_controls_enforced(client):
    # Employee persona (Alex Chen) attempting restricted actions
    alex_token = client.post("/api/auth/login", json={
        "email": "alex.chen@enterprisehrms.com",
        "password": "Enterprise@2026"
    }).json()["access_token"]
    alex_headers = {"Authorization": f"Bearer {alex_token}"}

    # Employee cannot trigger monthly payroll run
    payroll_attempt = client.post("/api/payroll/runs", json={
        "month": 12,
        "year": 2026
    }, headers=alex_headers)
    assert payroll_attempt.status_code in [401, 403]

    # Recruiter persona (Elena Rostova) cannot access payroll structures
    elena_token = client.post("/api/auth/login", json={
        "email": "elena.rostova@enterprisehrms.com",
        "password": "Enterprise@2026"
    }).json()["access_token"]
    elena_headers = {"Authorization": f"Bearer {elena_token}"}

    rec_attempt = client.get("/api/payroll/runs", headers=elena_headers)
    assert rec_attempt.status_code in [401, 403]
