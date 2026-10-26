import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, ArrowRight, ShieldCheck, CheckCircle2, 
  Users, Clock, DollarSign, Briefcase, TrendingUp, Sparkles,
  Bot, Lock, Database, ArrowUpRight, Check, Play
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [activePreviewTab, setActivePreviewTab] = useState<'kpi' | 'attendance' | 'payroll' | 'ai'>('kpi');

  return (
    <div className="space-y-24 pb-20">
      {/* 1. Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-600/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-[350px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-xs text-slate-300 shadow-sm mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-white">Full-Stack Enterprise People OS</span>
            <span className="text-slate-500">•</span>
            <span className="text-brand-400">Phase 1–4 Verified</span>
          </div>

          {/* Primary Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight max-w-5xl mx-auto leading-[1.1]">
            One Platform. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-brand-200 bg-clip-text text-transparent">
              Every People Operation.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Eliminate operational silos across your organization. Unify workforce lifecycle management, automated attendance clocking, decimal-safe payroll, ATS recruiting, and grounded AI-driven attrition intelligence on a single, secure platform.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 transition flex items-center justify-center gap-2 group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              to="/features"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-white font-semibold text-sm border border-slate-700 hover:border-slate-600 shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Explore Features</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>7 Role-Specific Portals</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>37 Relational Schema Tables</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>scikit-learn ML & Grounded RAG</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% Verified Automated Tests</span>
            </div>
          </div>
        </div>

        {/* 2. Interactive Application Preview Showcase */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
            {/* Preview Window Header & Tabs */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                <span className="text-[11px] text-slate-400 font-mono ml-2">app.enterprisehrms.com/dashboard</span>
              </div>

              {/* Interactive Tabs to Preview Actual Workflows */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setActivePreviewTab('kpi')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    activePreviewTab === 'kpi' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  KPI Dashboard
                </button>
                <button
                  onClick={() => setActivePreviewTab('attendance')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    activePreviewTab === 'attendance' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Time & Attendance
                </button>
                <button
                  onClick={() => setActivePreviewTab('payroll')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    activePreviewTab === 'payroll' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Payroll Engine
                </button>
                <button
                  onClick={() => setActivePreviewTab('ai')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    activePreviewTab === 'ai' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  AI Intelligence
                </button>
              </div>
            </div>

            {/* Preview Window Content */}
            <div className="p-6 sm:p-8 bg-slate-900/60 min-h-[380px] flex flex-col justify-center">
              {activePreviewTab === 'kpi' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                      <div className="text-[11px] text-slate-400 font-medium">Total Headcount</div>
                      <div className="text-2xl font-bold text-white mt-1">10 <span className="text-xs text-emerald-400 font-normal">Active</span></div>
                      <div className="text-[10px] text-slate-400 mt-1">7 Departments</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                      <div className="text-[11px] text-slate-400 font-medium">Today's Attendance</div>
                      <div className="text-2xl font-bold text-white mt-1">94.2%</div>
                      <div className="text-[10px] text-emerald-400 mt-1">1 On Approved Leave</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                      <div className="text-[11px] text-slate-400 font-medium">Pending Approvals</div>
                      <div className="text-2xl font-bold text-amber-400 mt-1">3 Tasks</div>
                      <div className="text-[10px] text-slate-400 mt-1">Leave & Corrections</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                      <div className="text-[11px] text-slate-400 font-medium">ML Attrition Alert</div>
                      <div className="text-2xl font-bold text-indigo-400 mt-1">Low Risk</div>
                      <div className="text-[10px] text-slate-400 mt-1">v1.0.0 Model Active</div>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-white">Live Workforce Activity Feed</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Real-time database events across Engineering, HR, and Operations</div>
                    </div>
                    <Link
                      to="/login"
                      className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <span>Sign In to Live App</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {activePreviewTab === 'attendance' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-white">Daily Punch State Machine</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Standard General Shift (09:00 - 18:00) • 15 min grace period</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        PUNCHED IN: 08:55 AM
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-700 text-slate-200">
                        7.8 hrs logged
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      <div className="text-slate-400 font-medium">Shift Grace Validation</div>
                      <div className="font-bold text-white mt-1">Automated Late Detection</div>
                      <div className="text-[10px] text-slate-400 mt-1">Prevents arbitrary missed clocking</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      <div className="text-slate-400 font-medium">Leave Sync Engine</div>
                      <div className="font-bold text-white mt-1">Approved → Attendance</div>
                      <div className="text-[10px] text-slate-400 mt-1">Automatically marks ON_LEAVE</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      <div className="text-slate-400 font-medium">Duplicate Punch Lock</div>
                      <div className="font-bold text-white mt-1">Idempotent Guards</div>
                      <div className="text-[10px] text-slate-400 mt-1">HTTP 400 rejection on double-punch</div>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'payroll' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Monthly Payroll Processing Run</div>
                        <div className="text-[11px] text-slate-400">Decimal-safe statutory engine (PF, ESI, TDS, Professional Tax)</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Status: APPROVED & PAID
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                      <div className="text-[10px] text-slate-400">Total Gross Pay</div>
                      <div className="font-bold text-white mt-0.5">$68,500.00</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                      <div className="text-[10px] text-slate-400">Loss of Pay (LOP)</div>
                      <div className="font-bold text-amber-400 mt-0.5">-$350.00 (Attendance sync)</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                      <div className="text-[10px] text-slate-400">Statutory Deductions</div>
                      <div className="font-bold text-slate-300 mt-0.5">-$8,450.00</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                      <div className="text-[10px] text-slate-400">Disbursed Net Pay</div>
                      <div className="font-bold text-emerald-400 mt-0.5">$59,700.00</div>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'ai' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-300">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Grounded AI Policy Assistant & RAG</div>
                        <div className="text-[11px] text-slate-400">Indexed across 5 approved handbooks (21 searchable chunks)</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Zero Hallucination Grounding
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
                    <div className="text-slate-400">User: "What is my remaining paid leave balance?"</div>
                    <div className="text-brand-300">
                      Assistant: "Hello Alex Chen. Your current leave balances from the live HR database are: Earned / Paid Leave: 18 days remaining; Casual Leave: 10 days remaining."
                    </div>
                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                      [Source: Live SQL Query filtered by authenticated employee_id • 0% LLM invention]
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Operational Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-2">Core Pillars</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Complete Enterprise People Operations
          </h3>
          <p className="mt-3 text-slate-400 text-sm">
            Everything your human resources, management, and finance teams need to manage the workforce lifecycle from hire to retirement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Workforce Lifecycle & Directory</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maintain dynamic employee records, department structures, visual hierarchy org charts, automated onboarding task checklists, and asset inventory registers.
            </p>
            <Link to="/features" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
              <span>Explore Core HR</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Time, Attendance & Leaves</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clock daily check-ins and check-outs with shift grace rules. Automated leave quotas, overlap checks, multi-tier approvals, and sync directly to payroll loss-of-pay.
            </p>
            <Link to="/features" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
              <span>Explore Time Tracking</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Decimal-Safe Payroll Engine</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Process monthly company payroll with attendance-derived loss of pay deductions, statutory withholding, full-and-final settlement, and printable payslip downloads.
            </p>
            <Link to="/features" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
              <span>Explore Payroll</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Recruitment & Applicant Tracking</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Manage job openings, candidate pipeline from screening through offer, interview scorecards, and 1-click hire-to-onboard employee profile conversion.
            </p>
            <Link to="/features" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
              <span>Explore ATS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Machine Learning & Attrition AI</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluate workforce retention risk using trained scikit-learn models (Holdout ROC-AUC 0.6227), versioned SHA-256 artifact registry, and input drift monitoring.
            </p>
            <Link to="/features" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
              <span>Explore ML Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Bot className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">AI HR Assistant with RAG</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive policy assistant grounded in 5 approved company handbooks. Answers employee questions, accesses own records via SQL isolation, and blocks injection attacks.
            </p>
            <Link to="/features" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
              <span>Explore AI Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Enterprise Security & Architecture Trust Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-4">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Compromise Security</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                Built from the Ground Up for Enterprise Data Isolation
              </h3>
              <p className="mt-3 text-slate-300 text-xs sm:text-sm leading-relaxed">
                Security is enforced at the database and API level—not by hiding buttons. Employees can never view peer compensation. Department Managers are strictly restricted to departmental boundaries. All administrative events are permanently ledgered in compliance audit logs.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>PBKDF2 / Bcrypt Hash Protection</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Timing-Safe Password Recovery</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Immutable Audit Logging</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Alembic Schema Versioning</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 space-y-3 font-mono text-[11px]">
              <div className="text-slate-400 flex items-center justify-between border-b border-slate-800 pb-2">
                <span>SECURITY ENFORCEMENT MATRIX</span>
                <span className="text-emerald-400 font-bold">ACTIVE</span>
              </div>
              <div className="text-slate-300 flex justify-between">
                <span>Employee Payslip Isolation:</span>
                <span className="text-emerald-400">ENFORCED (403 on breach)</span>
              </div>
              <div className="text-slate-300 flex justify-between">
                <span>Recruiter Payroll Access:</span>
                <span className="text-emerald-400">BLOCKED (403 on breach)</span>
              </div>
              <div className="text-slate-300 flex justify-between">
                <span>Department Manager Scope:</span>
                <span className="text-emerald-400">ISOLATED to Department</span>
              </div>
              <div className="text-slate-300 flex justify-between">
                <span>Cross-Employee AI Salary Leak:</span>
                <span className="text-emerald-400">INTERCEPTED & BLOCKED</span>
              </div>
              <div className="text-slate-300 flex justify-between">
                <span>Prompt Injection Defense:</span>
                <span className="text-emerald-400">DETECTED & FILTERED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pre-Footer Call to Action */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-10 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Ready to Experience Unified People Operations?
          </h3>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Explore our public feature catalog, test the role-specific solutions, or create a free employee account to test the self-service portal immediately.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition"
            >
              Create Account
            </Link>
            <Link
              to="/solutions"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
            >
              Explore Role Solutions
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
            >
              Contact Sales & Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
