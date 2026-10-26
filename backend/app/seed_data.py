from datetime import date, datetime, timedelta, time
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import (
    User, RoleEnum, Department, Designation, Employee, 
    LifecycleEvent, Document, OnboardingTask, Asset, 
    Announcement, AuditLog,
    Shift, AttendanceRecord, AttendanceCorrection, HolidayCalendar, Timesheet, TimesheetEntry,
    LeaveType, LeaveBalance, LeaveApplication,
    SalaryStructure, PayrollRun, Payslip, FullFinalSettlement,
    JobRequisition, Candidate, InterviewSchedule,
    PerformanceCycle, Goal, PerformanceReview, Course, CourseEnrollment, EmployeeSkill, PeerRecognition,
    ExpenseClaim, HelpdeskTicket, DocumentRequest
)
from app.auth.security import get_password_hash

def seed_phase2_data(db: Session, emp_objs: dict, dept_objs: dict, admin_user: User):
    """Seed comprehensive Phase 2 operations data."""
    if db.query(Shift).count() > 0:
        print("Phase 2 data already seeded. Skipping.")
        return

    print("Seeding Phase 2 Operations: Shifts, Leaves, Attendance, Payroll, ATS, Performance, Expenses...")

    # 1. Shifts
    shifts = [
        Shift(name="Standard General Shift", start_time=time(9, 0), end_time=time(18, 0), grace_period_mins=15, work_hours=8.0, is_active=True),
        Shift(name="Early Morning Shift", start_time=time(6, 0), end_time=time(15, 0), grace_period_mins=15, work_hours=8.0, is_active=True),
        Shift(name="Late Evening Shift", start_time=time(14, 0), end_time=time(23, 0), grace_period_mins=15, work_hours=8.0, is_active=True)
    ]
    db.add_all(shifts)
    db.flush()

    # 2. Holiday Calendar
    current_year = date.today().year
    holidays = [
        HolidayCalendar(name="New Year's Day", date=date(current_year, 1, 1), holiday_type="NATIONAL", description="National Holiday"),
        HolidayCalendar(name="Memorial Day", date=date(current_year, 5, 25), holiday_type="NATIONAL", description="Federal Observance"),
        HolidayCalendar(name="Independence Day", date=date(current_year, 7, 4), holiday_type="NATIONAL", description="Federal Observance"),
        HolidayCalendar(name="Labor Day", date=date(current_year, 9, 7), holiday_type="NATIONAL", description="Federal Observance"),
        HolidayCalendar(name="Thanksgiving Day", date=date(current_year, 11, 26), holiday_type="NATIONAL", description="National Holiday"),
        HolidayCalendar(name="Christmas Day", date=date(current_year, 12, 25), holiday_type="NATIONAL", description="Christmas Holiday"),
    ]
    db.add_all(holidays)
    db.flush()

    # 3. Leave Types
    leave_types = [
        LeaveType(name="Earned / Paid Leave", code="PL", annual_quota=20, is_carry_forward=True, max_carry_forward=10, is_paid=True, description="Standard paid vacation leave"),
        LeaveType(name="Casual Leave", code="CL", annual_quota=12, is_carry_forward=False, max_carry_forward=0, is_paid=True, description="Short unplanned personal leave"),
        LeaveType(name="Sick / Medical Leave", code="SL", annual_quota=10, is_carry_forward=True, max_carry_forward=5, is_paid=True, description="Paid leave for illness or medical recovery"),
        LeaveType(name="Maternity Leave", code="ML", annual_quota=180, is_carry_forward=False, max_carry_forward=0, is_paid=True, description="Statutory paid maternity leave")
    ]
    db.add_all(leave_types)
    db.flush()

    # 4. Leave Balances for all employees
    for emp_code, emp in emp_objs.items():
        for lt in leave_types:
            used = 2.0 if lt.code == "CL" and emp_code == "EMP-0004" else 0.0
            pending = 1.0 if lt.code == "PL" and emp_code == "EMP-0004" else 0.0
            rem = float(lt.annual_quota) - used - pending
            lb = LeaveBalance(
                employee_id=emp.id,
                leave_type_id=lt.id,
                year=current_year,
                allocated=float(lt.annual_quota),
                used=used,
                pending=pending,
                remaining=rem
            )
            db.add(lb)
    db.flush()

    # 5. Seed Leave Applications for Alex Chen (EMP-0004)
    alex = emp_objs["EMP-0004"]
    marcus = emp_objs["EMP-0003"]
    cl_type = next(lt for lt in leave_types if lt.code == "CL")
    pl_type = next(lt for lt in leave_types if lt.code == "PL")

    past_leave = LeaveApplication(
        employee_id=alex.id,
        leave_type_id=cl_type.id,
        start_date=date.today() - timedelta(days=12),
        end_date=date.today() - timedelta(days=11),
        is_half_day=False,
        days_count=2.0,
        reason="Family personal event and travel",
        status="APPROVED",
        manager_id=marcus.user_id,
        manager_status="APPROVED",
        manager_comments="Approved. Sprint tickets have been handed off.",
        hr_id=emp_objs["EMP-0002"].user_id,
        hr_status="APPROVED",
        hr_comments="HR approved."
    )
    pending_leave = LeaveApplication(
        employee_id=alex.id,
        leave_type_id=pl_type.id,
        start_date=date.today() + timedelta(days=10),
        end_date=date.today() + timedelta(days=10),
        is_half_day=False,
        days_count=1.0,
        reason="Scheduled medical appointment",
        status="PENDING_MANAGER",
        manager_id=marcus.user_id,
        manager_status="PENDING"
    )
    db.add_all([past_leave, pending_leave])
    db.flush()

    # 6. Salary Structures
    salaries = [
        ("EMP-0001", 20000.0, 8000.0, 5000.0, 1800.0, 200.0, 3500.0),
        ("EMP-0002", 10000.0, 4000.0, 2500.0, 1800.0, 200.0, 1500.0),
        ("EMP-0003", 14000.0, 5600.0, 3500.0, 1800.0, 200.0, 2200.0),
        ("EMP-0004", 9500.0, 3800.0, 2000.0, 1800.0, 200.0, 1200.0),
        ("EMP-0005", 7500.0, 3000.0, 1500.0, 1800.0, 200.0, 800.0),
        ("EMP-0006", 8000.0, 3200.0, 1600.0, 1800.0, 200.0, 900.0),
        ("EMP-0007", 8500.0, 3400.0, 1800.0, 1800.0, 200.0, 1000.0),
        ("EMP-0008", 6500.0, 2600.0, 1200.0, 1800.0, 200.0, 600.0),
        ("EMP-0009", 11000.0, 4400.0, 2800.0, 1800.0, 200.0, 1600.0),
        ("EMP-0010", 6500.0, 2600.0, 1200.0, 1800.0, 200.0, 600.0),
    ]
    for emp_code, basic, hra, sp, pf, pt, tds in salaries:
        gross = basic + hra + sp
        tot_ded = pf + pt + tds
        net = gross - tot_ded
        ss = SalaryStructure(
            employee_id=emp_objs[emp_code].id,
            effective_from=date(2025, 1, 1),
            ctc_annual=gross * 12.0,
            basic_monthly=basic,
            hra_monthly=hra,
            special_allowance_monthly=sp,
            gross_monthly=gross,
            pf_employee=pf,
            esi_employee=0.0,
            professional_tax=pt,
            tds_monthly=tds,
            total_deductions_monthly=tot_ded,
            net_monthly=net,
            payment_mode="BANK_TRANSFER",
            bank_name="JPMorgan Chase",
            account_number="9876543210",
            ifsc_or_routing="CHASUS33",
            is_active=True
        )
        db.add(ss)
    db.flush()

    # Seed Completed Payroll Run & Payslips for Month 1
    payroll_run = PayrollRun(
        month=1,
        year=current_year,
        title=f"January {current_year} Monthly Payroll",
        status="APPROVED",
        processed_by=emp_objs["EMP-0006"].user_id, # David Miller
        approved_by=admin_user.id if admin_user else 1,
        processed_at=datetime.utcnow() - timedelta(days=25),
        paid_at=datetime.utcnow() - timedelta(days=24),
        employees_count=len(emp_objs)
    )
    db.add(payroll_run)
    db.flush()

    tot_gross = 0.0
    tot_ded = 0.0
    tot_net = 0.0

    for emp_code, emp in emp_objs.items():
        matched_sal = next((s for s in salaries if s[0] == emp_code), None)
        if not matched_sal:
            continue
        _, basic, hra, sp, pf, pt, tds = matched_sal
        gross = basic + hra + sp
        ded = pf + pt + tds
        net = gross - ded
        tot_gross += gross
        tot_ded += ded
        tot_net += net

        ps = Payslip(
            payroll_run_id=payroll_run.id,
            employee_id=emp.id,
            month=1,
            year=current_year,
            total_working_days=31.0,
            paid_days=31.0,
            loss_of_pay_days=0.0,
            basic_earned=basic,
            hra_earned=hra,
            allowances_earned=sp,
            bonus_amount=0.0,
            reimbursement_amount=0.0,
            gross_pay=gross,
            pf_deduction=pf,
            esi_deduction=0.0,
            prof_tax_deduction=pt,
            tds_deduction=tds,
            other_deductions=0.0,
            total_deductions=ded,
            net_pay=net,
            status="PAID",
            payment_date=date(current_year, 1, 31)
        )
        db.add(ps)

    payroll_run.total_gross = round(tot_gross, 2)
    payroll_run.total_deductions = round(tot_ded, 2)
    payroll_run.total_net = round(tot_net, 2)
    db.flush()

    # 7. Seed Attendance Records for Alex Chen (past 10 business days)
    today = date.today()
    for d_offset in range(1, 11):
        att_date = today - timedelta(days=d_offset)
        if att_date.weekday() >= 5:
            continue
        
        status = "PRESENT"
        hours = 8.5
        is_late = False
        late_min = 0
        if d_offset == 3:
            status = "PRESENT"
            is_late = True
            late_min = 35
            hours = 7.5

        ar = AttendanceRecord(
            employee_id=alex.id,
            date=att_date,
            check_in=datetime.combine(att_date, time(9, 35 if is_late else 9, 2)),
            check_out=datetime.combine(att_date, time(18, 0)),
            total_hours=hours,
            status=status,
            is_late=is_late,
            late_minutes=late_min,
            overtime_hours=0.5 if hours > 8.0 else 0.0,
            notes="Regular daily shift"
        )
        db.add(ar)

    # 8. Recruitment: Job Openings, Candidates & Interviews
    sr_eng = JobRequisition(
        title="Senior Cloud Platform Engineer",
        department_id=dept_objs["ENG"].id,
        openings_count=2,
        experience_required="5+ Years",
        employment_type="Full-Time",
        location="San Francisco HQ",
        salary_range="$140,000 - $180,000",
        status="OPEN",
        job_description="Lead our high-scale Kubernetes, FastAPI and multi-cloud resilience architecture.",
        hiring_manager_id=marcus.user_id,
        recruiter_id=emp_objs["EMP-0005"].user_id
    )
    rec_lead = JobRequisition(
        title="Lead Technical Recruiter",
        department_id=dept_objs["HR"].id,
        openings_count=1,
        experience_required="4+ Years",
        employment_type="Full-Time",
        location="New York Hub",
        salary_range="$95,000 - $125,000",
        status="OPEN",
        job_description="Scale technical hiring across Engineering, Product and Infrastructure disciplines.",
        hiring_manager_id=emp_objs["EMP-0002"].user_id,
        recruiter_id=emp_objs["EMP-0005"].user_id
    )
    db.add_all([sr_eng, rec_lead])
    db.flush()

    cand1 = Candidate(
        job_requisition_id=sr_eng.id,
        full_name="Maya Lin",
        email="maya.lin@example.com",
        phone="+1 555-432-8765",
        stage="INTERVIEW",
        current_company="CloudScale Systems",
        current_designation="Cloud Engineer II",
        experience_years=5.5,
        rating=5
    )
    cand2 = Candidate(
        job_requisition_id=sr_eng.id,
        full_name="Carlos Santana",
        email="carlos.santana@example.com",
        phone="+1 555-987-1234",
        stage="APPLIED",
        current_company="Apex Fintech",
        current_designation="DevOps Specialist",
        experience_years=4.0,
        rating=3
    )
    cand3 = Candidate(
        job_requisition_id=sr_eng.id,
        full_name="Priya Patel",
        email="priya.patel@example.com",
        phone="+1 555-776-3344",
        stage="OFFER",
        current_company="DataStream Corp",
        current_designation="Senior Systems Architect",
        experience_years=7.0,
        rating=5
    )
    db.add_all([cand1, cand2, cand3])
    db.flush()

    # Interview schedule for Maya Lin
    interview = InterviewSchedule(
        candidate_id=cand1.id,
        interviewer_id=marcus.user_id,
        round_name="System Architecture & Scalability",
        scheduled_time=datetime.utcnow() + timedelta(days=2),
        meeting_link="https://meet.enterprisehrms.com/eng-arch-maya",
        status="SCHEDULED"
    )
    db.add(interview)

    # 9. Performance & Learning
    cycle = PerformanceCycle(
        title="FY 2026 Mid-Year Performance Review",
        start_date=date(current_year, 1, 1),
        end_date=date(current_year, 6, 30),
        status="ACTIVE"
    )
    db.add(cycle)
    db.flush()

    goal1 = Goal(
        employee_id=alex.id,
        cycle_id=cycle.id,
        title="Modernize Microservices Architecture & OpenAPI specs",
        category="INDIVIDUAL",
        weightage=60,
        progress=75,
        target_metric="100% services migrated",
        status="ON_TRACK"
    )
    goal2 = Goal(
        employee_id=alex.id,
        cycle_id=cycle.id,
        title="Conduct 10 Technical System Design Interviews",
        category="TEAM",
        weightage=40,
        progress=60,
        target_metric="10 Interviews completed",
        status="ON_TRACK"
    )
    db.add_all([goal1, goal2])

    c1 = Course(
        title="Enterprise Zero Trust Security & IAM",
        code="SEC-101",
        category="COMPLIANCE",
        description="Comprehensive guide to role-based access control, cryptographic tokens, and network boundaries.",
        duration_hours=6.0,
        instructor="Corporate SecOps Academy",
        is_mandatory=True
    )
    c2 = Course(
        title="Async Python & High-Throughput API Architecture",
        code="ENG-201",
        category="TECHNICAL",
        description="Mastering FastAPI concurrency, SQLAlchemy 2 async patterns, and Redis pub/sub.",
        duration_hours=10.0,
        instructor="Engineering Guild",
        is_mandatory=False
    )
    c3 = Course(
        title="Inclusive Leadership & Team Mentorship",
        code="MGT-301",
        category="LEADERSHIP",
        description="Effective 1-on-1 coaching, cross-functional empathy, and conflict resolution.",
        duration_hours=4.0,
        instructor="People & Culture Team",
        is_mandatory=False
    )
    db.add_all([c1, c2, c3])
    db.flush()

    enrollment = CourseEnrollment(
        course_id=c1.id,
        employee_id=alex.id,
        enrolled_date=date.today() - timedelta(days=20),
        completion_date=date.today() - timedelta(days=5),
        status="COMPLETED",
        score=98.0,
        certificate_url="CERT-IAM-2026-0042"
    )
    db.add(enrollment)

    kudos = PeerRecognition(
        giver_id=marcus.user_id,
        receiver_id=alex.id,
        badge="Innovator",
        message="Outstanding execution on the automated database seeding and backend test coverage!"
    )
    db.add(kudos)

    # 10. Expenses & Self Service
    exp1 = ExpenseClaim(
        employee_id=alex.id,
        title="AWS Certified Solutions Architect Exam Fee",
        category="TRAINING",
        amount=375.00,
        currency="USD",
        expense_date=date.today() - timedelta(days=18),
        status="APPROVED",
        approver_id=marcus.user_id,
        approver_comments="Approved under 2026 L&D budget allowance."
    )
    exp2 = ExpenseClaim(
        employee_id=alex.id,
        title="Client technical advisory dinner and local rideshare transportation",
        category="TRAVEL",
        amount=142.50,
        currency="USD",
        expense_date=date.today() - timedelta(days=3),
        status="PENDING"
    )
    db.add_all([exp1, exp2])

    ticket1 = HelpdeskTicket(
        ticket_number="TICK-2026-101",
        employee_id=alex.id,
        category="IT_SUPPORT",
        priority="NORMAL",
        subject="Request for USB-C Dual Monitor Docking Station",
        description="Requiring a CalDigit TS4 dock to connect multi-display workstation setup.",
        status="RESOLVED",
        assigned_to_user_id=emp_objs["EMP-0007"].user_id,
        resolution_notes="Issued from corporate IT inventory. Dispatched via internal mail."
    )
    ticket2 = HelpdeskTicket(
        ticket_number="TICK-2026-102",
        employee_id=emp_objs["EMP-0008"].id,
        category="IT_SUPPORT",
        priority="HIGH",
        subject="GitHub Enterprise access token SSO authorization issue",
        description="Unable to push commits to backend repository after branch protection rule update.",
        status="IN_PROGRESS",
        assigned_to_user_id=emp_objs["EMP-0007"].user_id
    )
    db.add_all([ticket1, ticket2])

    doc_req = DocumentRequest(
        employee_id=alex.id,
        document_type="SALARY_CERTIFICATE",
        purpose="Standard salary & employment letter for mortgage application"
    )
    db.add(doc_req)

    db.commit()
    print("Phase 2 Operations seeded successfully!")

def seed_database(db: Session = None):
    close_at_end = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        close_at_end = True

    try:
        # Check if users already exist
        user_count = db.query(User).count()
        if user_count > 0:
            print("Users already exist. Checking Phase 2 seed data...")
            # Reconstruct emp_objs and dept_objs for Phase 2 seeding
            emp_objs = {e.employee_id: e for e in db.query(Employee).all()}
            dept_objs = {d.code: d for d in db.query(Department).all()}
            admin = db.query(User).filter_by(role=RoleEnum.SUPER_ADMIN.value).first()
            seed_phase2_data(db, emp_objs, dept_objs, admin)
            return

        print("Seeding enterprise database with realistic personas and data...")

        default_pw = get_password_hash("Enterprise@2026")

        # 1. Departments
        depts_data = [
            ("Executive Leadership", "EXEC", "Executive management and corporate governance."),
            ("Human Resources", "HR", "People operations, talent acquisition, culture and compliance."),
            ("Software Engineering", "ENG", "Product engineering, cloud infrastructure, and QA architecture."),
            ("Finance & Payroll", "FIN", "Corporate accounting, treasury, payroll and fiscal audits."),
            ("Information Technology", "IT", "Enterprise systems, corporate network, security and hardware."),
            ("Product Management", "PROD", "Product discovery, UX design, and roadmap execution."),
            ("Sales & Marketing", "MKT", "Revenue growth, enterprise sales, brand and growth marketing.")
        ]
        
        dept_objs = {}
        for name, code, desc in depts_data:
            d = Department(name=name, code=code, description=desc)
            db.add(d)
            db.flush()
            dept_objs[code] = d

        # 2. Designations
        designations_data = [
            ("Chief Executive Officer", "CEO", "EXEC", "C-Level"),
            ("Chief Technology Officer", "CTO", "EXEC", "C-Level"),
            ("VP of Human Resources", "VPHR", "HR", "VP"),
            ("Senior HR Operations Manager", "HRM", "HR", "Senior"),
            ("Lead Technical Recruiter", "REC", "HR", "Lead"),
            ("Director of Engineering", "ENGDIR", "ENG", "Director"),
            ("Lead Software Architect", "LEADARCH", "ENG", "Lead"),
            ("Senior Full-Stack Engineer", "SRSWE", "ENG", "Senior"),
            ("Frontend Engineer II", "SWE2", "ENG", "Mid-Level"),
            ("Finance Director", "FINDIR", "FIN", "Director"),
            ("Senior Payroll Specialist", "PAYSPEC", "FIN", "Senior"),
            ("IT Infrastructure Lead", "ITLEAD", "IT", "Lead"),
            ("Enterprise Systems Administrator", "SYSADMIN", "IT", "Senior"),
            ("Principal Product Manager", "PRINPM", "PROD", "Lead"),
            ("Senior Enterprise Sales Director", "SALESDIR", "MKT", "Director"),
        ]

        desig_objs = {}
        for title, code, dept_code, level in designations_data:
            des = Designation(
                title=title, 
                code=code, 
                department_id=dept_objs[dept_code].id, 
                level=level
            )
            db.add(des)
            db.flush()
            desig_objs[code] = des

        # 3. Provision Core Personas (All 7 Enterprise Roles)
        personas = [
            {
                "email": "admin@enterprisehrms.com",
                "name": "Arthur Pendelton",
                "role": RoleEnum.SUPER_ADMIN.value,
                "dept": "EXEC",
                "desig": "CEO",
                "emp_id": "EMP-0001",
                "manager_emp_id": None,
                "status": "Active"
            },
            {
                "email": "sarah.jenkins@enterprisehrms.com",
                "name": "Sarah Jenkins",
                "role": RoleEnum.HR_MANAGER.value,
                "dept": "HR",
                "desig": "HRM",
                "emp_id": "EMP-0002",
                "manager_emp_id": "EMP-0001",
                "status": "Active"
            },
            {
                "email": "marcus.vance@enterprisehrms.com",
                "name": "Marcus Vance",
                "role": RoleEnum.DEPT_MANAGER.value,
                "dept": "ENG",
                "desig": "ENGDIR",
                "emp_id": "EMP-0003",
                "manager_emp_id": "EMP-0001",
                "status": "Active"
            },
            {
                "email": "alex.chen@enterprisehrms.com",
                "name": "Alex Chen",
                "role": RoleEnum.EMPLOYEE.value,
                "dept": "ENG",
                "desig": "SRSWE",
                "emp_id": "EMP-0004",
                "manager_emp_id": "EMP-0003",
                "status": "Active"
            },
            {
                "email": "elena.rostova@enterprisehrms.com",
                "name": "Elena Rostova",
                "role": RoleEnum.RECRUITER.value,
                "dept": "HR",
                "desig": "REC",
                "emp_id": "EMP-0005",
                "manager_emp_id": "EMP-0002",
                "status": "Active"
            },
            {
                "email": "david.miller@enterprisehrms.com",
                "name": "David Miller",
                "role": RoleEnum.PAYROLL_OFFICER.value,
                "dept": "FIN",
                "desig": "PAYSPEC",
                "emp_id": "EMP-0006",
                "manager_emp_id": "EMP-0001",
                "status": "Active"
            },
            {
                "email": "rachel.green@enterprisehrms.com",
                "name": "Rachel Green",
                "role": RoleEnum.IT_ADMIN.value,
                "dept": "IT",
                "desig": "SYSADMIN",
                "emp_id": "EMP-0007",
                "manager_emp_id": "EMP-0001",
                "status": "Active"
            },
            # Additional team members
            {
                "email": "jessica.taylor@enterprisehrms.com",
                "name": "Jessica Taylor",
                "role": RoleEnum.EMPLOYEE.value,
                "dept": "ENG",
                "desig": "SWE2",
                "emp_id": "EMP-0008",
                "manager_emp_id": "EMP-0003",
                "status": "Probation"
            },
            {
                "email": "samuel.oak@enterprisehrms.com",
                "name": "Samuel Oak",
                "role": RoleEnum.EMPLOYEE.value,
                "dept": "PROD",
                "desig": "PRINPM",
                "emp_id": "EMP-0009",
                "manager_emp_id": "EMP-0001",
                "status": "Active"
            },
            {
                "email": "olivia.bennett@enterprisehrms.com",
                "name": "Olivia Bennett",
                "role": RoleEnum.EMPLOYEE.value,
                "dept": "ENG",
                "desig": "SWE2",
                "emp_id": "EMP-0010",
                "manager_emp_id": "EMP-0003",
                "status": "Onboarding"
            }
        ]

        emp_objs = {}
        for p in personas:
            first, *rest = p["name"].split(" ")
            last = " ".join(rest) if rest else "Staff"

            # Create User
            user = User(
                email=p["email"],
                hashed_password=default_pw,
                full_name=p["name"],
                role=p["role"],
                is_active=True,
                is_verified=True,
                department_id=dept_objs[p["dept"]].id
            )
            db.add(user)
            db.flush()

            # Create Employee
            mgr_id = emp_objs[p["manager_emp_id"]].id if p["manager_emp_id"] and p["manager_emp_id"] in emp_objs else None

            emp = Employee(
                employee_id=p["emp_id"],
                user_id=user.id,
                first_name=first,
                last_name=last,
                email=p["email"],
                phone="+1 (555) 234-5678",
                personal_email=f"{first.lower()}.personal@gmail.com",
                date_of_birth=date(1990, 5, 14),
                gender="Non-Binary" if first == "Alex" else ("Female" if first in ["Sarah", "Elena", "Rachel", "Jessica", "Olivia"] else "Male"),
                marital_status="Single",
                department_id=dept_objs[p["dept"]].id,
                designation_id=desig_objs[p["desig"]].id,
                reporting_manager_id=mgr_id,
                joining_date=date(2023, 1, 15) if p["emp_id"] != "EMP-0010" else date.today() - timedelta(days=5),
                employment_type="Full-Time",
                status=p["status"],
                location="San Francisco HQ" if p["dept"] in ["EXEC", "ENG"] else "New York Hub",
                address="100 Enterprise Way, Suite 400",
                emergency_contact_name=f"{first}'s Emergency Contact",
                emergency_contact_phone="+1 (555) 999-0000"
            )
            db.add(emp)
            db.flush()
            emp_objs[p["emp_id"]] = emp

            # Add department manager association
            if p["role"] == RoleEnum.DEPT_MANAGER.value:
                dept_objs[p["dept"]].manager_id = user.id

            # Add lifecycle record
            ev = LifecycleEvent(
                employee_id=emp.id,
                event_type="JOINED",
                description=f"Initial system onboarding and setup for {p['name']}",
                effective_date=emp.joining_date,
                recorded_by="HR Provisioning Automation"
            )
            db.add(ev)

        # 4. Seed Onboarding Tasks for Olivia Bennett
        olivia = emp_objs["EMP-0010"]
        alex = emp_objs["EMP-0004"]

        # Documents for Alex Chen and Company Policies
        docs_data = [
            (alex.id, "Employment Offer & Proprietary Agreement", "CONTRACT", "offer_agreement_alex_chen.pdf", "/uploads/documents/offer_agreement_alex_chen.pdf", 245000, "application/pdf", False, "Sarah Jenkins"),
            (alex.id, "IRS Form W-4 Employee Withholding", "ID_PROOF", "w4_form_alex_chen.pdf", "/uploads/documents/w4_form_alex_chen.pdf", 182000, "application/pdf", False, "Alex Chen"),
            (None, "Global Employee Code of Conduct 2026", "POLICY", "code_of_conduct_2026.pdf", "/uploads/policies/code_of_conduct_2026.pdf", 512000, "application/pdf", True, "Arthur Pendelton"),
            (None, "Information Security & Acceptable Use Policy", "POLICY", "infosec_policy_v2.pdf", "/uploads/policies/infosec_policy_v2.pdf", 328000, "application/pdf", True, "Rachel Green")
        ]
        for emp_id, title, cat, fname, fpath, fsize, mime, is_pol, up_by in docs_data:
            d = Document(
                employee_id=emp_id,
                title=title,
                category=cat,
                file_name=fname,
                file_path=fpath,
                file_size=fsize,
                mime_type=mime,
                is_company_policy=is_pol,
                uploaded_by=up_by
            )
            db.add(d)

        tasks = [
            ("Sign NDA & Electronic IP Agreement", "Review legal handbook and sign agreement", "COMPLIANCE", True, "Sarah Jenkins"),
            ("Identity & Background Verification", "Upload government ID and tax identification forms", "HR", True, "Sarah Jenkins"),
            ("Configure MacBook Pro & Developer Sandbox", "Provision M3 Max laptop and Docker environment", "IT", True, "Rachel Green"),
            ("Active Directory & Okta SSO Activation", "Grant access to GitHub Enterprise, Jira and Slack", "IT", False, None),
            ("Architecture 101 with Marcus Vance", "Review platform coding standards and CI/CD pipelines", "MANAGER", False, None),
            ("First Week Check-in & Review", "Review onboarding milestones with HR business partner", "HR", False, None),
        ]
        for t_title, t_desc, t_cat, t_done, t_by in tasks:
            t = OnboardingTask(
                employee_id=olivia.id,
                title=t_title,
                description=t_desc,
                category=t_cat,
                is_completed=t_done,
                completed_at=datetime.utcnow() if t_done else None,
                completed_by=t_by,
                due_date=date.today() + timedelta(days=7),
                assigned_role="HR Manager" if t_cat == "HR" else ("IT Administrator" if t_cat == "IT" else "Department Manager")
            )
            db.add(t)

        # 5. Assets
        assets_data = [
            ("AST-2026-0001", "MacBook Pro 16\" M3 Max", "LAPTOP", "SN-MBP16-99101", emp_objs["EMP-0004"].id, "ASSIGNED"),
            ("AST-2026-0002", "Dell UltraSharp 32\" 4K Monitor", "MONITOR", "SN-DEL32-4421", emp_objs["EMP-0004"].id, "ASSIGNED"),
            ("AST-2026-0003", "YubiKey 5C NFC Security Key", "ACCESSORY", "SN-YUBI-1002", emp_objs["EMP-0004"].id, "ASSIGNED"),
            ("AST-2026-0004", "ThinkPad P1 Gen 6", "LAPTOP", "SN-THK-88219", emp_objs["EMP-0010"].id, "ASSIGNED"),
            ("AST-2026-0005", "MacBook Air 15\" M3", "LAPTOP", "SN-MBA15-33100", None, "AVAILABLE"),
            ("AST-2026-0006", "LG UltraFine 27\" Display", "MONITOR", "SN-LG27-7711", None, "AVAILABLE"),
            ("AST-2026-0007", "Cisco VoIP Conference Phone", "ACCESSORY", "SN-CISCO-552", None, "MAINTENANCE"),
        ]

        for tag, name, cat, sn, emp_id, st in assets_data:
            ast = Asset(
                asset_tag=tag,
                name=name,
                category=cat,
                serial_number=sn,
                assigned_to_employee_id=emp_id,
                assigned_date=date.today() - timedelta(days=60) if emp_id else None,
                status=st,
                notes="Enterprise standard workstation package"
            )
            db.add(ast)

        # 6. Announcements
        announcements_data = [
            ("Annual Open Enrollment & Healthcare Policy Updates", "The 2026 employee benefits open enrollment period begins next Monday. Please review the updated health, dental, and life coverage plans in the Policy Library.", "HIGH", True, "Sarah Jenkins"),
            ("Q4 All-Hands Town Hall with Executive Leadership", "Join us this Thursday at 10:00 AM PST for our quarterly state of the company address. Live Q&A link is pinned in the Slack general channel.", "NORMAL", True, "Arthur Pendelton"),
            ("Information Security & Phishing Awareness Simulation", "Please be vigilant regarding external emails requesting credential verification. IT Security is conducting periodic compliance audits.", "URGENT", False, "Rachel Green"),
        ]

        for title, content, prio, pinned, author in announcements_data:
            ann = Announcement(
                title=title,
                content=content,
                priority=prio,
                is_pinned=pinned,
                author_name=author
            )
            db.add(ann)

        # 7. Audit Logs
        audits = [
            (1, "admin@enterprisehrms.com", "Super Admin", "LOGIN", "USER", "1", "Super Admin initiated session", "127.0.0.1"),
            (2, "sarah.jenkins@enterprisehrms.com", "HR Manager", "CREATE", "EMPLOYEE", str(olivia.id), "Created new hire profile for Olivia Bennett", "127.0.0.1"),
            (7, "rachel.green@enterprisehrms.com", "IT Administrator", "CREATE", "ASSET", "4", "Issued ThinkPad P1 to Olivia Bennett", "127.0.0.1"),
            (2, "sarah.jenkins@enterprisehrms.com", "HR Manager", "UPDATE", "ONBOARDING", "1", "Verified government identity for Olivia Bennett", "127.0.0.1")
        ]
        for a_id, email, role, act, ent, ent_id, det, ip in audits:
            al = AuditLog(
                actor_id=a_id,
                actor_email=email,
                actor_role=role,
                action=act,
                entity_type=ent,
                entity_id=ent_id,
                details=det,
                ip_address=ip
            )
            db.add(al)

        admin_user = db.query(User).filter_by(role=RoleEnum.SUPER_ADMIN.value).first()
        seed_phase2_data(db, emp_objs, dept_objs, admin_user)

        db.commit()
        print("Enterprise seed database initialized successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        if close_at_end:
            db.close()

if __name__ == "__main__":
    seed_database()
