"""
Administrative Script to Safely Migrate Demo User Accounts and Passwords.
Preserves all foreign key relationships, leaves, attendances, payroll runs,
performance reviews, and audit history.
"""
from app.database import SessionLocal
from app.models.user import User, RoleEnum
from app.models.employee import Employee, LifecycleEvent
from app.models.announcement import Announcement
from app.models.audit import AuditLog
from app.models.document import Document
from app.models.onboarding import OnboardingTask
from app.auth.security import get_password_hash

ACCOUNT_UPDATES = [
    {
        "old_email": "admin@enterprisehrms.com",
        "new_email": "admin@enterprisehrms.com",
        "old_name": "Arthur Pendelton",
        "new_name": "Vishal Sharma",
        "first_name": "Vishal",
        "last_name": "Sharma",
        "role": RoleEnum.SUPER_ADMIN.value,
        "password": "Vishal@123"
    },
    {
        "old_email": "sarah.jenkins@enterprisehrms.com",
        "new_email": "vishu.soam@enterprisehrms.com",
        "old_name": "Sarah Jenkins",
        "new_name": "Vishu Soam",
        "first_name": "Vishu",
        "last_name": "Soam",
        "role": RoleEnum.HR_MANAGER.value,
        "password": "Vishu@123"
    },
    {
        "old_email": "marcus.vance@enterprisehrms.com",
        "new_email": "yash.sharma@enterprisehrms.com",
        "old_name": "Marcus Vance",
        "new_name": "Yash Sharma",
        "first_name": "Yash",
        "last_name": "Sharma",
        "role": RoleEnum.DEPT_MANAGER.value,
        "password": "Yash@123"
    },
    {
        "old_email": "alex.chen@enterprisehrms.com",
        "new_email": "aman@enterprisehrms.com",
        "old_name": "Alex Chen",
        "new_name": "Aman",
        "first_name": "Aman",
        "last_name": "",
        "role": RoleEnum.EMPLOYEE.value,
        "password": "Aman@123"
    },
    {
        "old_email": "elena.rostova@enterprisehrms.com",
        "new_email": "vishal.maurya@enterprisehrms.com",
        "old_name": "Elena Rostova",
        "new_name": "Vishal Maurya",
        "first_name": "Vishal",
        "last_name": "Maurya",
        "role": RoleEnum.RECRUITER.value,
        "password": "Vishal@123"
    },
    {
        "old_email": "david.miller@enterprisehrms.com",
        "new_email": "vishal.bhardwaj@enterprisehrms.com",
        "old_name": "David Miller",
        "new_name": "Vishal Bhardwaj",
        "first_name": "Vishal",
        "last_name": "Bhardwaj",
        "role": RoleEnum.PAYROLL_OFFICER.value,
        "password": "Vishal@123"
    },
    {
        "old_email": "jessica.taylor@enterprisehrms.com",
        "new_email": "vishnu@enterprisehrms.com",
        "old_name": "Jessica Taylor",
        "new_name": "Vishnu",
        "first_name": "Vishnu",
        "last_name": "",
        "role": RoleEnum.EMPLOYEE.value,
        "password": "Vishnu@123"
    },
    {
        "old_email": "samuel.oak@enterprisehrms.com",
        "new_email": "yash.bhardwaj@enterprisehrms.com",
        "old_name": "Samuel Oak",
        "new_name": "Yash Bhardwaj",
        "first_name": "Yash",
        "last_name": "Bhardwaj",
        "role": RoleEnum.EMPLOYEE.value,
        "password": "Yash@123"
    },
    {
        "old_email": "olivia.bennett@enterprisehrms.com",
        "new_email": "rohini@enterprisehrms.com",
        "old_name": "Olivia Bennett",
        "new_name": "Rohini",
        "first_name": "Rohini",
        "last_name": "",
        "role": RoleEnum.EMPLOYEE.value,
        "password": "Rohini@123"
    }
]

def migrate_accounts():
    db = SessionLocal()
    try:
        print("Starting safe migration of demonstration accounts...")
        for item in ACCOUNT_UPDATES:
            # Check by old email or new email
            user = db.query(User).filter(User.email.ilike(item["old_email"])).first()
            if not user and item["old_email"] != item["new_email"]:
                user = db.query(User).filter(User.email.ilike(item["new_email"])).first()

            if user:
                print(f"Updating user id={user.id}: {user.email} -> {item['new_email']} ({item['new_name']})")
                user.email = item["new_email"]
                user.full_name = item["new_name"]
                user.role = item["role"]
                user.hashed_password = get_password_hash(item["password"])
                db.flush()

                emp = db.query(Employee).filter(Employee.user_id == user.id).first()
                if emp:
                    emp.first_name = item["first_name"]
                    emp.last_name = item["last_name"]
                    emp.email = item["new_email"]
                    db.flush()

                # Update announcements author_name
                db.query(Announcement).filter(Announcement.author_name == item["old_name"]).update(
                    {Announcement.author_name: item["new_name"]}
                )

                # Update documents uploaded_by
                db.query(Document).filter(Document.uploaded_by == item["old_name"]).update(
                    {Document.uploaded_by: item["new_name"]}
                )

                # Update onboarding_tasks completed_by
                db.query(OnboardingTask).filter(OnboardingTask.completed_by == item["old_name"]).update(
                    {OnboardingTask.completed_by: item["new_name"]}
                )

                # Update lifecycle events description
                events = db.query(LifecycleEvent).filter(LifecycleEvent.description.contains(item["old_name"])).all()
                for ev in events:
                    ev.description = ev.description.replace(item["old_name"], item["new_name"])

            else:
                print(f"User not found for {item['old_email']}, creating fresh...")
                user = User(
                    email=item["new_email"],
                    hashed_password=get_password_hash(item["password"]),
                    full_name=item["new_name"],
                    role=item["role"],
                    is_active=True,
                    is_verified=True
                )
                db.add(user)
                db.flush()

        # Clean up any leftover test accounts if desired
        live_test = db.query(User).filter(User.email == "live.test@enterprisehrms.com").first()
        if live_test:
            emp_test = db.query(Employee).filter(Employee.user_id == live_test.id).first()
            if emp_test:
                db.delete(emp_test)
            db.delete(live_test)

        db.commit()
        print("Migration committed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Migration error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_accounts()
