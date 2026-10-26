import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Users, Briefcase, DollarSign, Clock, 
  Check, ArrowRight, Lock, Eye, AlertCircle, FileText, ChevronRight
} from 'lucide-react';

interface RoleSolution {
  id: string;
  roleTitle: string;
  badge: string;
  targetAudience: string;
  icon: any;
  color: string;
  headline: string;
  coreWorkflows: string[];
  keyBenefits: string[];
  privacyGuarantee: string;
}

export const SolutionsPage: React.FC = () => {
  const solutions: RoleSolution[] = [
    {
      id: 'hr-admin',
      roleTitle: 'HR & System Administrators',
      badge: 'Super Admin Portal',
      targetAudience: 'Chief People Officers, HR Operations Directors, IT Compliance Leads',
      icon: ShieldCheck,
      color: 'blue',
      headline: 'Complete Operational Governance and System Auditability',
      coreWorkflows: [
        'Enterprise-wide workforce provisioning and department hierarchy setup',
        'Global role and permission matrix management across all 7 operational roles',
        'Company-wide shift scheduling and holiday calendar configuration',
        'Immutable compliance audit logging of every administrative transaction',
        'Controlled machine learning model retraining and version promotion'
      ],
      keyBenefits: [
        'Total visibility across all organizational departments with 0 blind spots',
        'Zero manual paperwork for compliance audits via permanent audit trails',
        'Single pane of glass for organizational health, headcount, and attrition risk'
      ],
      privacyGuarantee: 'Administrators govern policies and structures without exposing sensitive personal tokens or raw credentials.'
    },
    {
      id: 'hr-manager',
      roleTitle: 'HR Managers',
      badge: 'Workforce Operations Portal',
      targetAudience: 'HR Business Partners, People Operations Managers',
      icon: Users,
      color: 'indigo',
      headline: 'Effortless Workforce Lifecycles from Onboarding to Offboarding',
      coreWorkflows: [
        'Automated onboarding task assignment upon candidate hiring',
        'Leave application review with multi-level approval thresholds',
        'Performance review cycle setup with 1-5 rating matrix evaluations',
        'Asset inventory tracking and clearance inspection upon employee exit',
        'Attrition risk simulation using calibrated machine learning models'
      ],
      keyBenefits: [
        '70% reduction in onboarding coordination delays via automated checklists',
        'Zero leave deduction calculation errors with real-time balance reservations',
        'Early identification of retention risks before critical employees resign'
      ],
      privacyGuarantee: 'Managers review workforce operations while respecting data boundaries between unrelated business units.'
    },
    {
      id: 'dept-manager',
      roleTitle: 'Department Managers',
      badge: 'Department Portal (Scoped)',
      targetAudience: 'Engineering Leads, Sales Directors, Operations Supervisors',
      icon: Briefcase,
      color: 'emerald',
      headline: 'Focused Team Leadership without Cross-Department Friction',
      coreWorkflows: [
        'Scoped employee directory restricted strictly to direct and indirect team reports',
        'Attendance missed punch correction approvals with shift grace validation',
        'Departmental leave request review and team coverage calendar tracking',
        'Measurable OKR progress slider updates and team milestone recognition',
        'Job requisition requests for expanding departmental headcount'
      ],
      keyBenefits: [
        'Instant approvals without wading through company-wide unassigned queues',
        'Strict departmental isolation: cannot accidentally access peer department files',
        'Clear visibility into team availability, holidays, and active working hours'
      ],
      privacyGuarantee: 'Department Managers are strictly restricted to their own departmental boundary; access to other departments is rejected with HTTP 403.'
    },
    {
      id: 'employee',
      roleTitle: 'Employees',
      badge: 'Employee Self-Service (ESS)',
      targetAudience: 'All Full-Time, Part-Time, and Contract Staff',
      icon: Clock,
      color: 'teal',
      headline: 'Empowering Self-Service for Time, Leaves, and Compensation',
      coreWorkflows: [
        'Daily check-in and check-out punches with real-time working hour counter',
        'Missed punch correction submission with reason notes for supervisor review',
        'One-click leave application with dynamic live quota balance calculator',
        'Private payslip viewing and secure printable PDF statement downloads',
        'Conversational AI HR Assistant for policy inquiries and personal balances'
      ],
      keyBenefits: [
        'Instant access to personal documents, contracts, and compensation history',
        'Zero waiting on HR for leave balance queries—accessible 24/7 via AI Assistant',
        'Transparent tracking of reimbursement claims and IT helpdesk tickets'
      ],
      privacyGuarantee: 'Complete peer privacy: an employee can NEVER inspect another employee’s salary, payslip, or private profile.'
    },
    {
      id: 'recruiter',
      roleTitle: 'Recruiting & Talent Acquisition',
      badge: 'Applicant Tracking (ATS)',
      targetAudience: 'Talent Acquisition Specialists, Hiring Recruiters',
      icon: Eye,
      color: 'amber',
      headline: 'Accelerated Candidate Pipelines from Application to Offer',
      coreWorkflows: [
        'Job opening creation with department, required openings, and recruiter assignment',
        '6-stage visual candidate pipeline (Applied → Screening → Interview → Offer → Hired)',
        'Interview scheduling with interviewer scorecards (1-5 ratings & notes)',
        'Offer status tracking and negotiation documentation repository',
        '1-click candidate-to-employee onboarding handover generating EMP ID'
      ],
      keyBenefits: [
        'Seamless transition from candidate offer to employee onboarding checklist',
        'Consolidated candidate resume and scorecard storage with zero data loss',
        'Recruitment conversion analytics with stage-by-stage dropoff tracking'
      ],
      privacyGuarantee: 'Recruiters are strictly isolated to candidate data and BLOCKED from accessing sensitive payroll structures and company salary registers.'
    },
    {
      id: 'payroll-officer',
      roleTitle: 'Payroll & Finance Officers',
      badge: 'Compensation & Payroll Portal',
      targetAudience: 'Payroll Specialists, Compensation Managers, Finance Controllers',
      icon: DollarSign,
      color: 'purple',
      headline: 'Decimal-Safe Compensation with Automated Attendance LOP Proration',
      coreWorkflows: [
        'Base salary structure setup: Basic, HRA, Allowances, and Statutory deductions',
        'Monthly payroll run aggregation pulling approved leaves and unapproved absences',
        'Automated Loss-of-Pay (LOP) calculations prorating monthly net pay',
        'Multi-stage payroll run review: Draft → Processed → Approved → Paid',
        'Full-and-final (F&F) settlement computation for exiting employees'
      ],
      keyBenefits: [
        'Elimination of manual attendance-to-payroll spreadsheets and human error',
        'Idempotent payroll processing: duplicate monthly runs are strictly prevented',
        'Instant streaming CSV export of payroll registers for banking disbursements'
      ],
      privacyGuarantee: 'Payroll operations enforce strict decimal calculations and fiscal audit records; unauthorized roles cannot access payroll endpoints.'
    }
  ];

  const [activeTab, setActiveTab] = useState<string>('hr-admin');
  const activeSolution = solutions.find(s => s.id === activeTab) || solutions[0];
  const ActiveIcon = activeSolution.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-brand-400 font-semibold">
          <span>Role-Based Enterprise Solutions</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Tailored for Every Enterprise Role
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          The Enterprise HRMS adapts to the unique workflow of each stakeholder—from executive compliance and hiring managers to employee self-service and payroll officers.
        </p>
      </div>

      {/* Role Selector Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-800 pb-4">
        {solutions.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveTab(s.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === s.id
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/25'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {React.createElement(s.icon, { className: "w-4 h-4" })}
            <span>{s.roleTitle}</span>
          </button>
        ))}
      </div>

      {/* Active Role Solution Showcase */}
      <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 shrink-0 shadow-md">
              <ActiveIcon className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
                {activeSolution.badge}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                {activeSolution.headline}
              </h2>
              <div className="text-xs text-slate-400 mt-1 font-medium">
                Designed for: <span className="text-slate-300">{activeSolution.targetAudience}</span>
              </div>
            </div>
          </div>

          <Link
            to="/login"
            className="self-start lg:self-center px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition flex items-center gap-2 shrink-0"
          >
            <span>Test Role in Live App</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Workflows & Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Workflows */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-400" />
              <span>Core Supported Workflows</span>
            </h3>
            <div className="space-y-2.5">
              {activeSolution.coreWorkflows.map((wf, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-brand-600/20 text-brand-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-brand-500/30">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{wf}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits & Privacy Guarantee */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Operational Impact & Benefits</span>
              </h3>
              <div className="space-y-2.5">
                {activeSolution.keyBenefits.map((ben, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{ben}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy Guarantee Box */}
            <div className="p-4 rounded-xl bg-brand-950/40 border border-brand-800/50 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-300">
                <Lock className="w-4 h-4" />
                <span>Strict Privacy & Isolation Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {activeSolution.privacyGuarantee}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Role Navigation Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {solutions.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveTab(s.id)}
            className={`p-3 rounded-xl border text-left transition ${
              activeTab === s.id
                ? 'bg-slate-800 border-brand-500'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-[10px] font-bold text-brand-400">{s.badge}</div>
            <div className="text-xs font-bold text-white mt-1 truncate">{s.roleTitle}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
