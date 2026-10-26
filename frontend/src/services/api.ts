import {
  User, Persona, Employee, PaginatedResponse, Department, 
  Designation, DocumentItem, OnboardingTask, OnboardingSummary, 
  Asset, Announcement, AuditLog, DashboardMetrics, OrgChartNode,
  Shift, AttendanceRecord, AttendanceCorrection, HolidayItem, AttendanceSummary, Timesheet,
  LeaveType, LeaveBalance, LeaveApplication,
  SalaryStructure, Payslip, PayrollRun, FullFinalSettlement,
  JobRequisition, Candidate, InterviewSchedule,
  Goal, PerformanceCycle, Course, CourseEnrollment, PeerRecognition,
  ExpenseClaim, HelpdeskTicket, DocumentRequest,
  HeadcountReport, AttendanceReport, LeaveReport, PayrollReport, RecruitmentReport
} from '../types';

const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set default Content-Type if body is not FormData
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch {
      // ignore
    }

    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    throw new ApiError(errorMsg, response.status);
  }

  return response.json();
}

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    return request<{ access_token: string; token_type: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getCurrentUser: async () => {
    return request<User>('/auth/me');
  },

  getPersonas: async () => {
    return request<Persona[]>('/auth/personas');
  },

  switchPersona: async (userId: number) => {
    return request<{ access_token: string; token_type: string; user: User }>(`/auth/switch-persona/${userId}`, {
      method: 'POST',
    });
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    return request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  },

  // Dashboard
  getDashboardMetrics: async () => {
    return request<DashboardMetrics>('/dashboard/metrics');
  },

  // Employees
  getEmployees: async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    departmentId?: number;
    designationId?: number;
    status?: string;
    employmentType?: string;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.pageSize) query.append('page_size', params.pageSize.toString());
    if (params.search) query.append('search', params.search);
    if (params.departmentId) query.append('department_id', params.departmentId.toString());
    if (params.designationId) query.append('designation_id', params.designationId.toString());
    if (params.status) query.append('status', params.status);
    if (params.employmentType) query.append('employment_type', params.employmentType);

    return request<PaginatedResponse<Employee>>(`/employees?${query.toString()}`);
  },

  getEmployeeDetail: async (id: number) => {
    return request<Employee>(`/employees/${id}`);
  },

  createEmployee: async (data: Partial<Employee> & { create_user_account?: boolean; user_role?: string }) => {
    return request<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateEmployee: async (id: number, data: Partial<Employee>) => {
    return request<Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deactivateEmployee: async (id: number) => {
    return request<{ message: string }>(`/employees/${id}`, {
      method: 'DELETE',
    });
  },

  getOrgChart: async () => {
    return request<OrgChartNode[]>('/employees/organization/org-chart');
  },

  // Departments
  getDepartments: async () => {
    return request<Department[]>('/departments');
  },

  createDepartment: async (data: { name: string; code: string; description?: string; manager_id?: number }) => {
    return request<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getDesignations: async () => {
    return request<Designation[]>('/departments/designations/all');
  },

  createDesignation: async (data: { title: string; code: string; department_id: number; description?: string; level?: string }) => {
    return request<Designation>('/departments/designations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Documents
  getDocuments: async (params: { employeeId?: number; category?: string; policiesOnly?: boolean } = {}) => {
    const query = new URLSearchParams();
    if (params.employeeId) query.append('employee_id', params.employeeId.toString());
    if (params.category) query.append('category', params.category);
    if (params.policiesOnly) query.append('policies_only', 'true');

    return request<DocumentItem[]>(`/documents?${query.toString()}`);
  },

  uploadDocument: async (formData: FormData) => {
    return request<DocumentItem>('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  deleteDocument: async (id: number) => {
    return request<{ message: string }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  },

  // Onboarding
  getOnboardingTasks: async (params: { employeeId?: number; isOffboarding?: boolean } = {}) => {
    const query = new URLSearchParams();
    if (params.employeeId) query.append('employee_id', params.employeeId.toString());
    if (params.isOffboarding !== undefined) query.append('is_offboarding', params.isOffboarding.toString());

    return request<OnboardingTask[]>(`/onboarding?${query.toString()}`);
  },

  createOnboardingTask: async (data: {
    employee_id: number;
    title: string;
    description?: string;
    category?: string;
    due_date?: string;
    assigned_role?: string;
    is_offboarding?: boolean;
  }) => {
    return request<OnboardingTask>('/onboarding/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateOnboardingTask: async (taskId: number, data: Partial<OnboardingTask>) => {
    return request<OnboardingTask>(`/onboarding/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getOnboardingSummary: async () => {
    return request<OnboardingSummary>('/onboarding/summary');
  },

  // Assets
  getAssets: async (params: { employeeId?: number; category?: string; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.employeeId) query.append('employee_id', params.employeeId.toString());
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);

    return request<Asset[]>(`/assets?${query.toString()}`);
  },

  createAsset: async (data: Partial<Asset>) => {
    return request<Asset>('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateAsset: async (id: number, data: Partial<Asset>) => {
    return request<Asset>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Announcements
  getAnnouncements: async () => {
    return request<Announcement[]>('/announcements');
  },

  createAnnouncement: async (data: {
    title: string;
    content: string;
    priority?: string;
    is_pinned?: boolean;
    department_target?: string;
  }) => {
    return request<Announcement>('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Audit Logs
  getAuditLogs: async (limit: number = 50) => {
    return request<AuditLog[]>(`/audit?limit=${limit}`);
  },

  // ==========================================
  // Phase 2: Operations API Methods
  // ==========================================

  // 1. Attendance & Workforce Management
  getTodayAttendance: async (employeeId?: number) => {
    const url = employeeId ? `/attendance/today?employee_id=${employeeId}` : '/attendance/today';
    return request<AttendanceRecord | null>(url);
  },

  checkIn: async (notes?: string, employeeId?: number) => {
    return request<AttendanceRecord>('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({ notes, employee_id: employeeId }),
    });
  },

  checkOut: async (notes?: string, employeeId?: number) => {
    return request<AttendanceRecord>('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({ notes, employee_id: employeeId }),
    });
  },

  getAttendanceHistory: async (params: { employeeId?: number; startDate?: string; endDate?: string; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.employeeId) query.append('employee_id', params.employeeId.toString());
    if (params.startDate) query.append('start_date', params.startDate);
    if (params.endDate) query.append('end_date', params.endDate);
    if (params.status) query.append('status_filter', params.status);
    return request<AttendanceRecord[]>(`/attendance/history?${query.toString()}`);
  },

  getAttendanceSummary: async (employeeId?: number, month?: number, year?: number) => {
    const query = new URLSearchParams();
    if (employeeId) query.append('employee_id', employeeId.toString());
    if (month) query.append('month', month.toString());
    if (year) query.append('year', year.toString());
    return request<AttendanceSummary>(`/attendance/summary?${query.toString()}`);
  },

  getShifts: async () => {
    return request<Shift[]>('/attendance/shifts');
  },

  getHolidays: async () => {
    return request<HolidayItem[]>('/attendance/holidays');
  },

  getAttendanceCorrections: async () => {
    return request<AttendanceCorrection[]>('/attendance/corrections');
  },

  createAttendanceCorrection: async (data: { date: string; requested_check_in?: string; requested_check_out?: string; reason: string }) => {
    return request<AttendanceCorrection>('/attendance/corrections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  reviewAttendanceCorrection: async (id: number, status: string, reviewNotes?: string) => {
    return request<AttendanceCorrection>(`/attendance/corrections/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, review_notes: reviewNotes }),
    });
  },

  getTimesheets: async () => {
    return request<Timesheet[]>('/attendance/timesheets');
  },

  createTimesheet: async (data: { week_start_date: string; week_end_date: string; entries: { project_name: string; task_description: string; date: string; hours: number }[] }) => {
    return request<Timesheet>('/attendance/timesheets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 2. Leave Management
  getLeaveTypes: async () => {
    return request<LeaveType[]>('/leave/types');
  },

  getLeaveBalances: async (employeeId?: number, year?: number) => {
    const query = new URLSearchParams();
    if (employeeId) query.append('employee_id', employeeId.toString());
    if (year) query.append('year', year.toString());
    return request<LeaveBalance[]>(`/leave/balances?${query.toString()}`);
  },

  getLeaveApplications: async (statusFilter?: string) => {
    const query = new URLSearchParams();
    if (statusFilter) query.append('status_filter', statusFilter);
    return request<LeaveApplication[]>(`/leave/applications?${query.toString()}`);
  },

  applyLeave: async (data: { leave_type_id: number; start_date: string; end_date: string; is_half_day?: boolean; half_day_session?: string; reason: string }) => {
    return request<LeaveApplication>('/leave/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  reviewLeaveApplication: async (id: number, status: string, comments?: string) => {
    return request<LeaveApplication>(`/leave/applications/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, comments }),
    });
  },

  // 3. Payroll & Compensation
  getSalaryStructure: async (employeeId: number) => {
    return request<SalaryStructure>(`/payroll/structures/${employeeId}`);
  },

  saveSalaryStructure: async (data: Partial<SalaryStructure> & { employee_id: number }) => {
    return request<SalaryStructure>('/payroll/structures', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPayrollRuns: async () => {
    return request<PayrollRun[]>('/payroll/runs');
  },

  createPayrollRun: async (data: { month: number; year: number; title?: string }) => {
    return request<PayrollRun>('/payroll/runs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  approvePayrollRun: async (runId: number) => {
    return request<PayrollRun>(`/payroll/runs/${runId}/approve`, {
      method: 'PUT',
    });
  },

  getRunPayslips: async (runId: number) => {
    return request<Payslip[]>(`/payroll/runs/${runId}/payslips`);
  },

  getPayslips: async (params: { employeeId?: number; month?: number; year?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.employeeId) query.append('employee_id', params.employeeId.toString());
    if (params.month) query.append('month', params.month.toString());
    if (params.year) query.append('year', params.year.toString());
    return request<Payslip[]>(`/payroll/payslips?${query.toString()}`);
  },

  getPayslipDetail: async (payslipId: number) => {
    return request<Payslip>(`/payroll/payslips/${payslipId}`);
  },

  getSettlements: async () => {
    return request<FullFinalSettlement[]>('/payroll/settlements');
  },

  createSettlement: async (data: Partial<FullFinalSettlement> & { employee_id: number; resignation_or_exit_date: string; last_working_day: string }) => {
    return request<FullFinalSettlement>('/payroll/settlements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 4. Recruitment & ATS
  getJobRequisitions: async () => {
    return request<JobRequisition[]>('/recruitment/requisitions');
  },

  createJobRequisition: async (data: Partial<JobRequisition>) => {
    return request<JobRequisition>('/recruitment/requisitions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getCandidates: async (params: { requisitionId?: number; stage?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.requisitionId) query.append('requisition_id', params.requisitionId.toString());
    if (params.stage) query.append('stage', params.stage);
    return request<Candidate[]>(`/recruitment/candidates?${query.toString()}`);
  },

  createCandidate: async (data: Partial<Candidate> & { job_requisition_id: number; full_name: string; email: string }) => {
    return request<Candidate>('/recruitment/candidates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCandidate: async (id: number, data: Partial<Candidate>) => {
    return request<Candidate>(`/recruitment/candidates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  scheduleInterview: async (data: { candidate_id: number; round_name: string; scheduled_time: string; meeting_link?: string; interviewer_id?: number }) => {
    return request<InterviewSchedule>('/recruitment/interviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  hireAndOnboardCandidate: async (candidateId: number, data: { department_id: number; designation_id?: number; joining_date: string; starting_salary?: number }) => {
    return request<Employee>(`/recruitment/candidates/${candidateId}/hire`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 5. Performance, Goals & Learning
  getPerformanceCycles: async () => {
    return request<PerformanceCycle[]>('/performance/cycles');
  },

  getGoals: async (employeeId?: number, cycleId?: number) => {
    const query = new URLSearchParams();
    if (employeeId) query.append('employee_id', employeeId.toString());
    if (cycleId) query.append('cycle_id', cycleId.toString());
    return request<Goal[]>(`/performance/goals?${query.toString()}`);
  },

  createGoal: async (data: Partial<Goal> & { cycle_id: number; title: string }) => {
    return request<Goal>('/performance/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateGoal: async (id: number, data: { progress?: number; status?: string; description?: string }) => {
    return request<Goal>(`/performance/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getCourses: async () => {
    return request<Course[]>('/performance/courses');
  },

  enrollCourse: async (courseId: number) => {
    return request<CourseEnrollment>(`/performance/courses/${courseId}/enroll`, {
      method: 'POST',
    });
  },

  getRecognitions: async () => {
    return request<PeerRecognition[]>('/performance/recognitions');
  },

  giveRecognition: async (data: { receiver_id: number; badge: string; message: string }) => {
    return request<PeerRecognition>('/performance/recognitions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 6. Expenses, Helpdesk & Self-Service
  getExpenseClaims: async (employeeId?: number, statusFilter?: string) => {
    const query = new URLSearchParams();
    if (employeeId) query.append('employee_id', employeeId.toString());
    if (statusFilter) query.append('status_filter', statusFilter);
    return request<ExpenseClaim[]>(`/expenses/claims?${query.toString()}`);
  },

  createExpenseClaim: async (data: { title: string; category: string; amount: number; currency?: string; expense_date: string }) => {
    return request<ExpenseClaim>('/expenses/claims', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  reviewExpenseClaim: async (id: number, status: string, comments?: string) => {
    return request<ExpenseClaim>(`/expenses/claims/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, approver_comments: comments }),
    });
  },

  getHelpdeskTickets: async () => {
    return request<HelpdeskTicket[]>('/expenses/tickets');
  },

  createHelpdeskTicket: async (data: { category: string; priority: string; subject: string; description: string }) => {
    return request<HelpdeskTicket>('/expenses/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateHelpdeskTicket: async (id: number, data: { status?: string; resolution_notes?: string; assigned_to_user_id?: number }) => {
    return request<HelpdeskTicket>(`/expenses/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getDocumentRequests: async () => {
    return request<DocumentRequest[]>('/expenses/letters');
  },

  createDocumentRequest: async (data: { document_type: string; purpose: string }) => {
    return request<DocumentRequest>('/expenses/letters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 7. BI Reports & CSV Exports
  getHeadcountReport: async (departmentId?: number) => {
    const query = departmentId ? `?department_id=${departmentId}` : '';
    return request<HeadcountReport>(`/reports/headcount${query}`);
  },

  getAttendanceReport: async (startDate?: string, endDate?: string) => {
    const query = new URLSearchParams();
    if (startDate) query.append('start_date', startDate);
    if (endDate) query.append('end_date', endDate);
    return request<AttendanceReport>(`/reports/attendance?${query.toString()}`);
  },

  getLeaveUtilizationReport: async (year?: number) => {
    const query = year ? `?year=${year}` : '';
    return request<LeaveReport>(`/reports/leave-utilization${query}`);
  },

  getPayrollReport: async (year?: number) => {
    const query = year ? `?year=${year}` : '';
    return request<PayrollReport>(`/reports/payroll${query}`);
  },

  getRecruitmentReport: async () => {
    return request<RecruitmentReport>('/reports/recruitment');
  },

  exportReportCsvUrl: (reportType: string) => {
    return `${API_BASE}/reports/export-csv/${reportType}`;
  },
};
