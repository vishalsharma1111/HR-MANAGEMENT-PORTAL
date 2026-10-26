from app.database import Base
from app.models.user import User, RoleEnum
from app.models.department import Department, Designation
from app.models.employee import Employee, LifecycleEvent
from app.models.document import Document
from app.models.onboarding import OnboardingTask
from app.models.asset import Asset
from app.models.announcement import Announcement
from app.models.audit import AuditLog

# Phase 2 Models
from app.models.attendance import Shift, AttendanceRecord, AttendanceCorrection, HolidayCalendar, Timesheet, TimesheetEntry
from app.models.leave import LeaveType, LeaveBalance, LeaveApplication
from app.models.payroll import SalaryStructure, PayrollRun, Payslip, FullFinalSettlement
from app.models.recruitment import JobRequisition, Candidate, InterviewSchedule
from app.models.performance import PerformanceCycle, Goal, PerformanceReview, Course, CourseEnrollment, EmployeeSkill, PeerRecognition
from app.models.expenses import ExpenseClaim, HelpdeskTicket, DocumentRequest
from app.models.contact import ContactSubmission

__all__ = [
    "Base",
    "User",
    "RoleEnum",
    "Department",
    "Designation",
    "Employee",
    "LifecycleEvent",
    "Document",
    "OnboardingTask",
    "Asset",
    "Announcement",
    "AuditLog",
    # Phase 2
    "Shift",
    "AttendanceRecord",
    "AttendanceCorrection",
    "HolidayCalendar",
    "Timesheet",
    "TimesheetEntry",
    "LeaveType",
    "LeaveBalance",
    "LeaveApplication",
    "SalaryStructure",
    "PayrollRun",
    "Payslip",
    "FullFinalSettlement",
    "JobRequisition",
    "Candidate",
    "InterviewSchedule",
    "PerformanceCycle",
    "Goal",
    "PerformanceReview",
    "Course",
    "CourseEnrollment",
    "EmployeeSkill",
    "PeerRecognition",
    "ExpenseClaim",
    "HelpdeskTicket",
    "DocumentRequest",
    "ContactSubmission"
]
