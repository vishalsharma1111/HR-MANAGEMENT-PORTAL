import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Clock, Calendar, DollarSign, UserCheck, Award, CreditCard,
  BarChart3, BrainCircuit, Bot, Database, Sparkles, CheckCircle2,
  CalendarDays, GitPullRequest, Layers
} from 'lucide-react';

interface ModuleConfig {
  title: string;
  phase: string;
  description: string;
  icon: any;
  plannedFeatures: string[];
  backendArchitecture: string;
}

const moduleConfigs: Record<string, ModuleConfig> = {
  attendance: {
    title: 'Attendance & Time Tracking',
    phase: 'Phase 2 Planned',
    description: 'Biometric capture, geofenced mobile clock-in, overtime rule computation, and shifts scheduling.',
    icon: Clock,
    plannedFeatures: [
      'Geofenced mobile and web check-in with GPS validation',
      'Integration with biometric hardware clocking terminals',
      'Overtime, night differential, and holiday pay rule calculators',
      'Roster management and rotational shift scheduling',
      'Automated timesheet approvals and late penalty deductions'
    ],
    backendArchitecture: 'FastAPI Timekeeping Service + Celery scheduled shift reconciliation engine'
  },
  leave: {
    title: 'Leave & Absence Management',
    phase: 'Phase 2 Planned',
    description: 'Statutory leave accruals, multi-tier manager approval chains, and holiday calendars.',
    icon: Calendar,
    plannedFeatures: [
      'Automated monthly/annual accrual calculations (PTO, Sick, Maternity, Paternity)',
      'Multi-level hierarchical approval workflows with email escalations',
      'Custom company holiday calendars per geographic hub',
      'Leave encashment, rollover, and forfeiture rule automation',
      'Absence calendar with Google/Outlook calendar synchronization'
    ],
    backendArchitecture: 'SQLAlchemy Polymorphic Accrual Policies + Event-driven state machines'
  },
  payroll: {
    title: 'Payroll & Compensation Processing',
    phase: 'Phase 2 Planned',
    description: 'End-to-end salary calculations, tax withholdings, statutory filings, and encrypted payslip delivery.',
    icon: DollarSign,
    plannedFeatures: [
      'Automated gross-to-net computation with flexible formula engines',
      'Statutory deductions (Federal, State, Social Security, PF, ESI, Pension)',
      'Direct deposit NACHA file generation and banking integrations',
      'Tamper-evident, password-protected digital payslip PDF generator',
      'Year-end tax forms (W-2, 1099, Form 16) generation and ledger exports'
    ],
    backendArchitecture: 'Double-entry fiscal ledger + PyPDF2/WeasyPrint payslip rendering pipeline'
  },
  recruitment: {
    title: 'Recruitment & Applicant Tracking (ATS)',
    phase: 'Phase 2 Planned',
    description: 'Job requisition pipelines, candidate scoring, interview scheduling, and automated offer letter generation.',
    icon: UserCheck,
    plannedFeatures: [
      'Kanban board candidate pipeline (Screening, Interview, Technical, Offer)',
      'Career site embedding and job board syndicate feeds (LinkedIn, Indeed)',
      'Automated interview scheduling with interviewer scorecard feedback',
      'Dynamic offer letter generator with electronic signature capture',
      '1-click candidate to employee onboarding transition'
    ],
    backendArchitecture: 'ATS pipeline service with automated email dispatch and candidate tracking'
  },
  performance: {
    title: 'Performance & OKR Reviews',
    phase: 'Phase 2 Planned',
    description: '360-degree feedback, annual appraisals, continuous 1:1 goals, and 9-box talent matrix.',
    icon: Award,
    plannedFeatures: [
      'Continuous OKR (Objective & Key Result) alignment and milestone check-ins',
      '360-degree peer, manager, and self-review review cycles',
      'Calibrated performance rating distribution and 9-box talent matrix',
      'Development plans, coaching notes, and merit review linkages',
      'Automated appraisal reminders and completion tracking dashboards'
    ],
    backendArchitecture: 'Review orchestration service with rating normalization algorithms'
  },
  expenses: {
    title: 'Travel & Expense Reimbursements',
    phase: 'Phase 2 Planned',
    description: 'Receipt OCR scanning, multi-currency conversion, mileage logs, and policy compliance audits.',
    icon: CreditCard,
    plannedFeatures: [
      'Receipt photo upload with automated OCR line-item extraction',
      'Multi-currency exchange rates and corporate card feed reconciliation',
      'Per-diem and mileage automated travel reimbursement calculators',
      'Policy violations flagger (e.g. out-of-policy luxury hotel charges)',
      'Batch payout integration with Payroll & Accounts Payable'
    ],
    backendArchitecture: 'OCR document parsing + Multi-currency FX microservice'
  },
  reports: {
    title: 'Enterprise BI Reports & Analytics',
    phase: 'Phase 2 Planned',
    description: 'Custom report builder, workforce turnover metrics, diversity analytics, and CSV/PDF data exports.',
    icon: BarChart3,
    plannedFeatures: [
      'Ad-hoc SQL report query generator with customizable field selection',
      'Cohort turnover, attrition, and tenure survival analytics',
      'Gender diversity, pay parity, and compensation ratio dashboards',
      'Automated weekly email report delivery to executive leadership',
      'Direct exports to Excel, CSV, and formatted executive PDF briefs'
    ],
    backendArchitecture: 'Materialized analytical view aggregation with asynchronous CSV streaming'
  },
  'ai-insights': {
    title: 'AI Workforce Intelligence',
    phase: 'Phase 3 Planned',
    description: 'Predictive talent attrition risks, salary benchmark modeling, and workforce sentiment analytics.',
    icon: BrainCircuit,
    plannedFeatures: [
      'Early-warning flight risk attrition prediction using Random Forests / XGBoost',
      'Compensation market parity benchmarking using internal & industry datasets',
      'Team sentiment and burnout telemetry via anonymized feedback NLP',
      'Strategic workforce capacity planning and headcount forecasting',
      'Automated skill gap analysis and personalized training recommendations'
    ],
    backendArchitecture: 'Dedicated Python ML service module (ml_service) + ONNX / Scikit-Learn models'
  },
  'hr-assistant': {
    title: 'HR Generative Assistant Bot',
    phase: 'Phase 3 Planned',
    description: '24/7 conversational employee self-service bot for policy Q&A, leave balance checks, and FAQ resolution.',
    icon: Bot,
    plannedFeatures: [
      'RAG (Retrieval-Augmented Generation) trained over company policy PDF vault',
      'Natural language leave balance inquiries ("How many PTO days do I have left?")',
      'Interactive benefit explanations and health plan comparison walkthroughs',
      'Role-restricted query boundaries ensuring sensitive payroll data isolation',
      'Escalation triggers to live HR business partners when sentiment is distressed'
    ],
    backendArchitecture: 'LangChain/LlamaIndex RAG pipeline with ChromaDB vector embeddings'
  }
};

export const PlannedModulePage: React.FC = () => {
  const location = useLocation();
  const segment = location.pathname.split('/').pop() || 'attendance';
  const config = moduleConfigs[segment] || moduleConfigs['attendance'];
  const Icon = config.icon;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Planned Phase Notice Banner */}
      <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-amber-800 dark:text-amber-200">
        <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <div className="text-xs">
          <span className="font-bold uppercase tracking-wider text-[11px] bg-amber-200 dark:bg-amber-900/60 px-2 py-0.5 rounded text-amber-900 dark:text-amber-100 mr-2">
            {config.phase}
          </span>
          This module is part of the planned Enterprise HRMS roadmap and will be activated in upcoming phases. The underlying architecture and schemas have been designed for seamless integration.
        </div>
      </div>

      {/* Main Module Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 border border-brand-100 dark:border-brand-900">
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              Planned Module Specification
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {config.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {config.description}
            </p>
          </div>
        </div>

        {/* Feature Roadmap List */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Planned Capability Deliverables
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {config.plannedFeatures.map((feat, index) => (
              <div
                key={index}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs flex items-start gap-2.5 text-slate-700 dark:text-slate-300"
              >
                <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Architecture Integration */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Architectural Foundation
          </h2>
          <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono">
            {config.backendArchitecture}
          </div>
        </div>
      </div>
    </div>
  );
};
