import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Clock, Calendar, DollarSign, Briefcase, 
  TrendingUp, BarChart3, Bot, Sparkles, ArrowRight, 
  Check, X, Shield, Lock, ExternalLink, ChevronRight
} from 'lucide-react';

interface FeatureItem {
  id: string;
  title: string;
  category: 'Core HR' | 'Operations' | 'Intelligence' | 'Compliance';
  icon: any;
  color: string;
  summary: string;
  capabilities: string[];
  specs: {
    authorizedRoles: string[];
    endpoints: string[];
    persistenceTable: string;
  };
  learnMoreDetails: string;
  directRoute: string;
}

export const FeaturesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeModalFeature, setActiveModalFeature] = useState<FeatureItem | null>(null);

  const features: FeatureItem[] = [
    {
      id: 'employee-mgmt',
      title: 'Employee Management',
      category: 'Core HR',
      icon: Users,
      color: 'blue',
      summary: 'Centralized enterprise workforce directory, automated unique EMP-XXXX generation, lifecycle transitions, document vault, and visual org charts.',
      capabilities: [
        'Automated EMP-XXXX identification code generation',
        'Visual interactive hierarchy tree from Executive down to staff',
        'Lifecycle event audit ledger (Joined, Promoted, Transferred, Exited)',
        'Private document storage with role-based download permissions',
        'Asset inventory tagging (AST-2026-XXXX) with return inspection status'
      ],
      specs: {
        authorizedRoles: ['Super Admin', 'HR Manager', 'Department Manager (Scoped)', 'Employee (Self)'],
        endpoints: ['GET /api/employees', 'POST /api/employees', 'GET /api/employees/org-chart'],
        persistenceTable: 'employees, lifecycle_events, assets, documents'
      },
      learnMoreDetails: 'The Employee Core engine unifies the workforce database with automated validation. It eliminates duplicate corporate emails, enforces department-level isolation for managers, and isolates employee self-views so staff can only view authorized records.',
      directRoute: '/employees'
    },
    {
      id: 'attendance-timesheets',
      title: 'Attendance and Timesheets',
      category: 'Operations',
      icon: Clock,
      color: 'emerald',
      summary: 'State-machine driven check-in and check-out tracking with shift scheduling, 15-minute grace thresholds, overtime logging, and supervisor punch correction approvals.',
      capabilities: [
        'Idempotent clock-in and clock-out with duplicate punch prevention',
        'Configurable shift schedules with grace periods and standard working hours',
        'Employee missed punch correction workflow with supervisor review',
        'Integrated company holiday calendar with national and regional observances',
        'Weekly and monthly timesheets with project-based hour allocations'
      ],
      specs: {
        authorizedRoles: ['All Authenticated Employees (Clocking)', 'Managers & HR (Approvals)'],
        endpoints: ['POST /api/attendance/check-in', 'POST /api/attendance/check-out', 'PUT /api/attendance/corrections/{id}'],
        persistenceTable: 'attendance_records, shifts, holiday_calendar, timesheets'
      },
      learnMoreDetails: 'The Attendance engine enforces genuine business logic. Duplicate punches on the same calendar day are rejected with HTTP 400. Missed punches can be submitted as correction requests which dynamically update records upon supervisor review.',
      directRoute: '/attendance'
    },
    {
      id: 'leave-mgmt',
      title: 'Leave Management',
      category: 'Operations',
      icon: Calendar,
      color: 'teal',
      summary: 'Comprehensive leave policy engine supporting Earned, Casual, Sick, and Maternity categories with quota reservations, overlap validation, and auto-sync to attendance.',
      capabilities: [
        'Configurable annual quotas, carry-forward rules, and paid vs unpaid policies',
        'Real-time transactional quota balance reservations to prevent negative balances',
        'Date overlap detection preventing duplicate leave applications across dates',
        'Multi-tier manager and HR review workflow with status audit trail',
        'Automatic synchronization: Approved leave marks the employee ON_LEAVE in attendance'
      ],
      specs: {
        authorizedRoles: ['Employees (Apply & View Balances)', 'Managers & HR (Review & Approve)'],
        endpoints: ['GET /api/leave/balances/my', 'POST /api/leave/apply', 'PUT /api/leave/applications/{id}/review'],
        persistenceTable: 'leave_types, leave_balances, leave_applications'
      },
      learnMoreDetails: 'Leave operations maintain transactional integrity. Balance deductions occur within atomic database transactions, preventing race conditions. Once approved, the record communicates directly with the Attendance engine.',
      directRoute: '/leave'
    },
    {
      id: 'payroll-engine',
      title: 'Payroll and Payslips',
      category: 'Operations',
      icon: DollarSign,
      color: 'purple',
      summary: 'Decimal-safe salary structures, monthly payroll aggregation with automated loss-of-pay (LOP) proration from attendance, statutory deductions, and printable payslip downloads.',
      capabilities: [
        'Complete salary structures: Basic, HRA, Allowances, PF, ESI, Professional Tax, TDS',
        'Automated attendance aggregation: unpaid absences calculate LOP deductions',
        'Monthly payroll batch processing: Draft → Processed → Approved → Paid',
        'Idempotent payroll runs: duplicate monthly runs are strictly blocked (HTTP 400)',
        'Employee self-service payslip viewer with formatted printable statements'
      ],
      specs: {
        authorizedRoles: ['Super Admin & Payroll Officer (Processing)', 'Employee (Own Payslips Only)'],
        endpoints: ['POST /api/payroll/run', 'GET /api/payroll/runs', 'GET /api/payroll/payslips/{id}'],
        persistenceTable: 'salary_structures, payroll_runs, payslips, full_final_settlements'
      },
      learnMoreDetails: 'Payroll calculations use decimal-safe rounding. An employee can never inspect peer salary structures or payslips (enforced by backend HTTP 403 authorization). Recruiters are explicitly blocked from all payroll structures.',
      directRoute: '/payroll'
    },
    {
      id: 'recruitment-ats',
      title: 'Recruitment and Applicant Tracking',
      category: 'Core HR',
      icon: Briefcase,
      color: 'amber',
      summary: 'End-to-end talent acquisition with job requisitions, 6-stage candidate pipeline, interview scheduling with scorecards, and 1-click hire-to-onboard handover.',
      capabilities: [
        'Job opening requisitions with department, openings, and recruiter assignment',
        'Candidate pipeline: Applied → Screening → Interview → Offer → Hired → Rejected',
        'Interview scheduling with interviewer scorecards (1-5 ratings & feedback)',
        '1-click candidate-to-employee onboarding handover provisioning EMP code',
        'Candidate document repository with confidential recruiter access'
      ],
      specs: {
        authorizedRoles: ['Super Admin', 'HR Manager', 'Recruiter', 'Department Manager (Hiring)'],
        endpoints: ['GET /api/recruitment/requisitions', 'POST /api/recruitment/candidates/{id}/stage'],
        persistenceTable: 'job_requisitions, candidates, interview_schedules'
      },
      learnMoreDetails: 'The ATS connects talent acquisition directly to operations. Marking a candidate as HIRED executes an atomic handover, generating a corporate Employee ID and auto-provisioning their initial onboarding checklist tasks.',
      directRoute: '/recruitment'
    },
    {
      id: 'performance-learning',
      title: 'Performance Management',
      category: 'Core HR',
      icon: TrendingUp,
      color: 'rose',
      summary: 'Goal setting and OKR progress tracking, review cycles with self and manager 1-5 ratings, course training catalog with enrollments, and peer recognition kudos.',
      capabilities: [
        'Review cycles with self-evaluation and manager assessment rating matrix',
        'Interactive OKR goal sliders with measurable key results and status tracking',
        'Training course catalog with employee enrollment, progress, and certificates',
        'Employee skills matrix tracking proficiency across technologies and competencies',
        'Public peer recognition kudos wall for celebrating team achievements'
      ],
      specs: {
        authorizedRoles: ['All Authenticated Employees (Goals & Learning)', 'Managers & HR (Reviews)'],
        endpoints: ['GET /api/performance/cycles', 'POST /api/performance/goals', 'GET /api/performance/courses'],
        persistenceTable: 'performance_cycles, performance_reviews, goals, courses, peer_recognitions'
      },
      learnMoreDetails: 'Enables continuous employee development. Goal progress can be updated in real time, and course completion registers directly into the employee skill profile for internal mobility.',
      directRoute: '/performance'
    },
    {
      id: 'reports-analytics',
      title: 'Reports and Analytics',
      category: 'Compliance',
      icon: BarChart3,
      color: 'indigo',
      summary: 'Real database-derived workforce business intelligence with interactive Recharts visual analytics and streaming CSV data exports.',
      capabilities: [
        'Headcount breakdown by department, designation, and employment type',
        'Attendance rate analytics, late arrival percentages, and overtime distributions',
        'Leave utilization summaries across Casual, Earned, and Medical leave types',
        'Payroll registers with gross pay, statutory deductions, and net disbursements',
        'One-click streaming CSV exports (text/csv) directly from database queries'
      ],
      specs: {
        authorizedRoles: ['Super Admin', 'HR Manager', 'Payroll Officer (Payroll Reports)'],
        endpoints: ['GET /api/reports/headcount', 'GET /api/reports/payroll', 'GET /api/reports/export/csv'],
        persistenceTable: 'Derived from live relational tables in hrms.db'
      },
      learnMoreDetails: 'Reports reflect real persisted records rather than fabricated mock charts. CSV exports stream live from the database with complete headers suitable for external auditing.',
      directRoute: '/reports'
    },
    {
      id: 'ai-assistant',
      title: 'AI HR Assistant',
      category: 'Intelligence',
      icon: Bot,
      color: 'teal',
      summary: 'Conversational assistant with Retrieval-Augmented Generation (RAG) grounded in 5 approved enterprise handbooks, prompt injection defense, and SQL isolation.',
      capabilities: [
        'Zero-hallucination semantic search across 21 policy chunks in 5 approved handbooks',
        'Explicit citations citing handbook name and section header for every answer',
        'Authenticated user private database routing for leave balances and payslips',
        'Prompt injection detection blocking prompt hijacking and SQL manipulation attempts',
        'Cross-employee privacy block intercepting unauthorized peer compensation queries'
      ],
      specs: {
        authorizedRoles: ['All Authenticated Employees (Own Data & Policies)'],
        endpoints: ['POST /api/ai/chat', 'GET /api/ai/knowledge-base'],
        persistenceTable: 'handbooks (vector index) + live users/payslips/leaves'
      },
      learnMoreDetails: 'Built for enterprise trust. When an employee asks "What is my remaining paid leave balance?", the assistant does not generate an imaginary number—it executes an authorized SQL query for that specific user. Prompt injection attacks are intercepted.',
      directRoute: '/hr-assistant'
    },
    {
      id: 'ml-insights',
      title: 'Machine Learning Insights',
      category: 'Intelligence',
      icon: Sparkles,
      color: 'amber',
      summary: 'Employee attrition risk prediction using trained scikit-learn models (Holdout ROC-AUC 0.6227), versioned SHA-256 artifact registry, and input drift monitoring.',
      capabilities: [
        'Trained Champion Logistic Regression model with balanced class weights',
        'Real singleton inference API returning risk scores (0.0-1.0) and top risk drivers',
        'Versioned artifact registry (v1.0.0) with SHA-256 integrity verification',
        'Operational feature drift detection comparing live requests to training baseline',
        'Controlled retraining endpoint with candidate promotion and instant rollback'
      ],
      specs: {
        authorizedRoles: ['Super Admin', 'HR Manager (Employee predictions blocked with 403)'],
        endpoints: ['POST /api/ml/predict/attrition', 'GET /api/ml/model/health', 'POST /api/ml/retrain'],
        persistenceTable: 'models/v1.0.0/ (Joblib pipeline, metadata.json)'
      },
      learnMoreDetails: 'Designed strictly as human decision-support. Provides key attribution factors (such as active overtime or long distance) rather than black-box decisions. Non-HR employees are strictly blocked from running attrition predictions.',
      directRoute: '/analytics/attrition-ai'
    }
  ];

  const categories = ['All', 'Core HR', 'Operations', 'Intelligence', 'Compliance'];

  const filteredFeatures = selectedCategory === 'All'
    ? features
    : features.filter(f => f.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-brand-400 font-semibold">
          <span>Enterprise Platform Capabilities</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Interactive Feature Explorer
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Discover all 9 core capabilities powering the Enterprise HRMS platform. Every module is connected through transactional business workflows and backed by real database persistence.
        </p>

        {/* Category Filter Pills */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeatures.map((f) => {
          const IconComp = f.icon;
          return (
            <div
              key={f.id}
              className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between group shadow-lg"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-brand-400 group-hover:scale-105 transition-transform border border-slate-700">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/60">
                    {f.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition">
                    {f.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {f.summary}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">Key Highlights:</div>
                  {f.capabilities.slice(0, 3).map((cap, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="truncate">{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Functional Interactive Actions */}
              <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveModalFeature(f)}
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 group/btn"
                >
                  <span>Learn More</span>
                  <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>

                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1"
                >
                  <span>Test in App</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Learn More Interactive Modal */}
      {activeModalFeature && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-brand-400 border border-slate-700">
                  {React.createElement(activeModalFeature.icon, { className: "w-6 h-6" })}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{activeModalFeature.title}</h3>
                  <span className="text-xs text-brand-400 font-semibold">{activeModalFeature.category} Architecture</span>
                </div>
              </div>
              <button
                onClick={() => setActiveModalFeature(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Architecture Overview</h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {activeModalFeature.learnMoreDetails}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Verified Capabilities</h4>
              <div className="space-y-2">
                {activeModalFeature.capabilities.map((cap, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-400">
                <span className="font-semibold text-slate-300">RBAC Scope:</span>
                <span>{activeModalFeature.specs.authorizedRoles.join(', ')}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-400">
                <span className="font-semibold text-slate-300">API Endpoints:</span>
                <span className="font-mono text-[11px] text-brand-300">{activeModalFeature.specs.endpoints.join(', ')}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-400">
                <span className="font-semibold text-slate-300">Database Tables:</span>
                <span className="font-mono text-[11px] text-emerald-300">{activeModalFeature.specs.persistenceTable}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveModalFeature(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
              >
                Close
              </button>
              <Link
                to="/login"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:from-brand-500 hover:to-indigo-500"
              >
                Sign In to Test Live
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
