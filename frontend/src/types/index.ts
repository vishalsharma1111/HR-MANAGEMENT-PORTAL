export type EnterpriseRole =
  | 'Super Admin'
  | 'HR Manager'
  | 'Department Manager'
  | 'Employee'
  | 'Recruiter'
  | 'Payroll Officer'
  | 'IT Administrator';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: EnterpriseRole;
  is_active: boolean;
  is_verified: boolean;
  department_id?: number | null;
  created_at: string;
  employee_id?: number | null;
  employee_code?: string | null;
}

export interface Persona {
  id: number;
  email: string;
  full_name: string;
  role: EnterpriseRole;
  department: string;
  employee_code: string;
}

export interface LifecycleEvent {
  id: number;
  employee_id: number;
  event_type: string;
  description: string;
  effective_date: string;
  recorded_by?: string | null;
  created_at: string;
}

export interface Employee {
  id: number;
  employee_id: string;
  user_id?: number | null;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  personal_email?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  department_id?: number | null;
  designation_id?: number | null;
  reporting_manager_id?: number | null;
  joining_date: string;
  employment_type: string;
  status: 'Active' | 'Onboarding' | 'Probation' | 'Notice Period' | 'Terminated' | 'Resigned';
  exit_date?: string | null;
  exit_reason?: string | null;
  location?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  created_at: string;
  updated_at: string;
  department_name?: string | null;
  designation_title?: string | null;
  reporting_manager_name?: string | null;
  direct_reports_count: number;
  lifecycle_events?: LifecycleEvent[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Designation {
  id: number;
  title: string;
  code: string;
  department_id: number;
  description?: string | null;
  level?: string | null;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  manager_id?: number | null;
  created_at: string;
  updated_at: string;
  designations: Designation[];
  employee_count: number;
  manager_name?: string | null;
}

export interface DocumentItem {
  id: number;
  employee_id?: number | null;
  employee_name?: string | null;
  title: string;
  category: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  is_company_policy: boolean;
  uploaded_by?: string | null;
  created_at: string;
}

export interface OnboardingTask {
  id: number;
  employee_id: number;
  employee_name?: string | null;
  title: string;
  description?: string | null;
  category: 'HR' | 'IT' | 'COMPLIANCE' | 'MANAGER' | 'OFFBOARDING';
  is_completed: boolean;
  completed_at?: string | null;
  completed_by?: string | null;
  due_date?: string | null;
  assigned_role: string;
  is_offboarding: boolean;
  created_at: string;
}

export interface OnboardingSummary {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  completion_rate: number;
}

export interface Asset {
  id: number;
  asset_tag: string;
  name: string;
  category: string;
  serial_number?: string | null;
  assigned_to_employee_id?: number | null;
  assigned_employee_name?: string | null;
  assigned_employee_code?: string | null;
  assigned_date?: string | null;
  return_date?: string | null;
  status: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  is_pinned: boolean;
  author_name: string;
  department_target: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_id?: number | null;
  actor_email?: string | null;
  actor_role?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface DashboardMetrics {
  total_employees: number;
  active_employees: number;
  probation_employees: number;
  onboarding_employees: number;
  total_departments: number;
  open_tasks: number;
  onboarding_completion_rate: number;
  department_distribution: { department: string; count: number }[];
  status_distribution: { status: string; count: number }[];
  recent_activity: AuditLog[];
  announcements: Announcement[];
}

export interface OrgChartNode {
  id: number;
  employee_id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  status: string;
  children: OrgChartNode[];
}

// ==========================================
// Phase 2: Operations Types & Interfaces
// ==========================================

// 1. Attendance & Shifts
export interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  grace_period_mins: number;
  work_hours: number;
  is_active: boolean;
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  employee_name?: string | null;
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  total_hours: number;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEKEND';
  is_late: boolean;
  late_minutes: number;
  overtime_hours: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceCorrection {
  id: number;
  employee_id: number;
  employee_name?: string | null;
  attendance_record_id?: number | null;
  date: string;
  requested_check_in?: string | null;
  requested_check_out?: string | null;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewer_name?: string | null;
  review_notes?: string | null;
  created_at: string;
  reviewed_at?: string | null;
}

export interface HolidayItem {
  id: number;
  name: string;
  date: string;
  holiday_type: string;
  description?: string | null;
}

export interface AttendanceSummary {
  employee_id?: number | null;
  employee_name?: string | null;
  month: number;
  year: number;
  total_working_days: number;
  present_days: number;
  absent_days: number;
  half_days: number;
  leave_days: number;
  late_days: number;
  overtime_hours_total: number;
}

export interface TimesheetEntry {
  id?: number;
  project_name: string;
  task_description: string;
  date: string;
  hours: number;
}

export interface Timesheet {
  id: number;
  employee_id: number;
  employee_name?: string | null;
  week_start_date: string;
  week_end_date: string;
  total_hours: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  reviewer_name?: string | null;
  review_notes?: string | null;
  entries: TimesheetEntry[];
  created_at: string;
}

// 2. Leave Management
export interface LeaveType {
  id: number;
  name: string;
  code: string;
  annual_quota: number;
  is_carry_forward: boolean;
  max_carry_forward: number;
  is_paid: boolean;
  description?: string | null;
}

export interface LeaveBalance {
  id: number;
  employee_id: number;
  leave_type_id: number;
  leave_type_name: string;
  leave_type_code: string;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
}

export interface LeaveApplication {
  id: number;
  employee_id: number;
  employee_name?: string | null;
  department_name?: string | null;
  leave_type_id: number;
  leave_type_name: string;
  leave_type_code: string;
  start_date: string;
  end_date: string;
  is_half_day: boolean;
  half_day_session?: string | null;
  days_count: number;
  reason: string;
  status: 'PENDING_MANAGER' | 'PENDING_HR' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  manager_name?: string | null;
  manager_status: string;
  manager_comments?: string | null;
  hr_approver_name?: string | null;
  hr_status: string;
  hr_comments?: string | null;
  created_at: string;
  updated_at: string;
}

// 3. Payroll & Compensation
export interface SalaryStructure {
  id: number;
  employee_id: number;
  employee_name?: string | null;
  ctc_annual: number;
  basic_monthly: number;
  hra_monthly: number;
  special_allowance_monthly: number;
  gross_monthly: number;
  pf_employee: number;
  esi_employee: number;
  professional_tax: number;
  tds_monthly: number;
  total_deductions_monthly: number;
  net_monthly: number;
  payment_mode: string;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_or_routing?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Payslip {
  id: number;
  payroll_run_id: number;
  employee_id: number;
  employee_name?: string | null;
  employee_code?: string | null;
  department_name?: string | null;
  designation_title?: string | null;
  month: number;
  year: number;
  total_working_days: number;
  paid_days: number;
  loss_of_pay_days: number;
  basic_earned: number;
  hra_earned: number;
  allowances_earned: number;
  bonus_amount: number;
  reimbursement_amount: number;
  gross_pay: number;
  pf_deduction: number;
  esi_deduction: number;
  prof_tax_deduction: number;
  tds_deduction: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  status: string;
  payment_date?: string | null;
  created_at: string;
}

export interface PayrollRun {
  id: number;
  month: number;
  year: number;
  title: string;
  status: 'DRAFT' | 'PROCESSED' | 'APPROVED' | 'PAID';
  processed_by_name?: string | null;
  approved_by_name?: string | null;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  employees_count: number;
  processed_at?: string | null;
  paid_at?: string | null;
  created_at: string;
  payslips?: Payslip[];
}

export interface FullFinalSettlement {
  id: number;
  employee_id: number;
  employee_name?: string | null;
  employee_code?: string | null;
  resignation_or_exit_date: string;
  last_working_day: string;
  gratuity_amount: number;
  leave_encashment_amount: number;
  notice_period_pay: number;
  other_earnings: number;
  notice_period_recovery: number;
  asset_recovery_deduction: number;
  tax_deduction: number;
  other_deductions: number;
  total_settlement_net: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  remarks?: string | null;
  created_at: string;
}

// 4. Recruitment & ATS
export interface JobRequisition {
  id: number;
  title: string;
  department_id: number;
  department_name?: string | null;
  designation_id?: number | null;
  designation_title?: string | null;
  openings_count: number;
  experience_required: string;
  employment_type: string;
  location: string;
  salary_range?: string | null;
  status: 'DRAFT' | 'OPEN' | 'ON_HOLD' | 'CLOSED';
  job_description: string;
  hiring_manager_id?: number | null;
  hiring_manager_name?: string | null;
  recruiter_id?: number | null;
  recruiter_name?: string | null;
  candidates_count: number;
  created_at: string;
}

export interface InterviewSchedule {
  id: number;
  candidate_id: number;
  round_name: string;
  interviewer_name?: string | null;
  scheduled_time: string;
  meeting_link?: string | null;
  status: string;
  scorecard_rating?: number | null;
  scorecard_feedback?: string | null;
  created_at: string;
}

export interface Candidate {
  id: number;
  job_requisition_id: number;
  job_title?: string | null;
  department_name?: string | null;
  full_name: string;
  email: string;
  phone?: string | null;
  current_company?: string | null;
  current_designation?: string | null;
  experience_years: number;
  stage: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
  rating: number;
  converted_employee_id?: number | null;
  interviews?: InterviewSchedule[];
  created_at: string;
  updated_at: string;
}

// 5. Performance & Learning
export interface Goal {
  id: number;
  employee_id: number;
  employee_name?: string | null;
  cycle_id: number;
  cycle_title?: string | null;
  title: string;
  description?: string | null;
  category: 'INDIVIDUAL' | 'TEAM' | 'COMPANY';
  weightage: number;
  progress: number;
  target_metric?: string | null;
  status: 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'COMPLETED';
  created_at: string;
}

export interface PerformanceCycle {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export interface Course {
  id: number;
  title: string;
  code: string;
  category: string;
  description: string;
  duration_hours: number;
  instructor: string;
  is_mandatory: boolean;
  created_at: string;
}

export interface CourseEnrollment {
  id: number;
  course_id: number;
  course_title: string;
  course_code: string;
  category: string;
  duration_hours: number;
  employee_id: number;
  enrolled_date: string;
  completion_date?: string | null;
  status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';
  score?: number | null;
  certificate_url?: string | null;
}

export interface PeerRecognition {
  id: number;
  giver_name: string;
  receiver_name: string;
  badge: string;
  message: string;
  created_at: string;
}

// 6. Expenses, Helpdesk & ESS
export interface ExpenseClaim {
  id: number;
  employee_id: number;
  employee_name?: string | null;
  title: string;
  category: string;
  amount: number;
  currency: string;
  receipt_path?: string | null;
  expense_date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REIMBURSED_IN_PAYROLL';
  approver_name?: string | null;
  approver_comments?: string | null;
  payroll_run_id?: number | null;
  created_at: string;
}

export interface HelpdeskTicket {
  id: number;
  ticket_number: string;
  employee_id: number;
  employee_name?: string | null;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assigned_agent_name?: string | null;
  resolution_notes?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface DocumentRequest {
  id: number;
  employee_id: number;
  employee_name?: string | null;
  document_type: string;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by_name?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

// 7. Reports
export interface HeadcountReport {
  total_workforce: number;
  active_employees: number;
  probation: number;
  onboarding: number;
  exited: number;
  attrition_rate_percentage: number;
  by_department: { department: string; count: number }[];
}

export interface AttendanceReport {
  total_records: number;
  present: number;
  absent: number;
  half_day: number;
  on_leave: number;
  late_arrivals: number;
  absenteeism_rate_percentage: number;
  present_rate: number;
  cumulative_work_hours: number;
  cumulative_overtime_hours: number;
}

export interface LeaveReport {
  year: number;
  total_applications: number;
  approved_applications: number;
  rejected_applications: number;
  leave_by_type: { type_code: string; type_name: string; days_utilized: number }[];
}

export interface PayrollReport {
  total_runs: number;
  cumulative_gross_disbursed: number;
  cumulative_net_disbursed: number;
  cumulative_pf_withheld: number;
  cumulative_tax_withheld: number;
  monthly_trend: { month: number; year: number; title: string; gross: number; net: number; employee_count: number }[];
}

export interface RecruitmentReport {
  total_applications: number;
  hired_count: number;
  hire_conversion_rate_percentage: number;
  funnel_stages: { stage: string; count: number }[];
}
