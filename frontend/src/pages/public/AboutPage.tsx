import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, ShieldCheck, Database, Layers, Lock, 
  Cpu, Sparkles, CheckCircle2, ArrowRight, HeartHandshake, Eye
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
      {/* 1. Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-brand-400 font-semibold">
          <span>Enterprise Engineering & Design</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          About Enterprise HRMS
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          An enterprise-grade workforce operating system designed to eliminate fragmented point solutions through unified business workflows, transactional database persistence, and grounded artificial intelligence.
        </p>
      </div>

      {/* 2. Mission & Purpose */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-400">Our Purpose</h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
            Why Modern Organizations Need a Unified People OS
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Most organizations struggle with fragmented HR technology stacks: one tool for tracking applicant resumes, a disconnected spreadsheet for timesheets, a third service for leave quotas, and a separate vendor for monthly payroll runs.
          </p>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            This fragmentation creates severe operational failure modes: leave approvals that fail to sync with monthly payroll deductions, duplicate clock-in punches, disconnected onboarding checklists, and zero visibility into workforce attrition risks.
          </p>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Enterprise HRMS solves this by interlocking all operational domains around a single verified relational schema, ensuring that every leave approval directly updates attendance records, every absence calculates decimal-safe loss of pay, and hiring a candidate automatically provisions an onboarding profile.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-brand-400" />
            <span>Guiding Principles</span>
          </h4>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-white">Real Persistent Operations:</span> Every button, form submission, and status transition executes real database transactions—zero simulated or fake CRUD.
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-white">Strict Authorization:</span> Permissions are enforced on the backend at the endpoint level. An employee cannot view peer payslips even if they forge an API request.
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-white">Grounded AI Intelligence:</span> Machine learning and AI assistants are decision-support tools anchored in verifiable training data and approved corporate handbooks—never ungrounded hallucinations.
            </div>
          </div>
        </div>
      </section>

      {/* 3. High-Level Technical Architecture */}
      <section className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 space-y-8 shadow-xl">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-400">Technical Foundation</h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Modern Multi-Tier Architecture</h3>
          <p className="text-xs text-slate-400">Built using modern enterprise full-stack standards for performance, security, and developer ergonomics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tier 1: Frontend */}
          <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Frontend Client</h4>
            <ul className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
              <li>• React 19 SPA with TypeScript</li>
              <li>• Vite 8 for fast sub-second bundling</li>
              <li>• Tailwind CSS for responsive design</li>
              <li>• Recharts interactive data visualization</li>
              <li>• Lucide icons & accessible form controls</li>
            </ul>
          </div>

          {/* Tier 2: Backend & ML */}
          <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">API & Inference Layer</h4>
            <ul className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
              <li>• Python FastAPI with Pydantic v2</li>
              <li>• PBKDF2/Bcrypt & JWT Bearer authentication</li>
              <li>• Scikit-learn Logistic Regression Champion</li>
              <li>• Versioned model registry with SHA-256</li>
              <li>• TF-IDF cosine similarity RAG vector store</li>
            </ul>
          </div>

          {/* Tier 3: Database */}
          <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Relational Data Persistence</h4>
            <ul className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
              <li>• PostgreSQL 16 & SQLite support</li>
              <li>• SQLAlchemy 2.0 ORM with connection pooling</li>
              <li>• Alembic schema migration versioning</li>
              <li>• 37 relational tables with foreign keys</li>
              <li>• Permanent compliance audit ledger</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Privacy Principles & Responsible AI */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            <span>Data Privacy Principles</span>
          </div>
          <h3 className="text-xl font-bold text-white">Zero Unauthorized Data Exposure</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            We adhere to strict data minimization and role scoping:
          </p>
          <ul className="text-xs text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Personal records and compensation are isolated by employee ID.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Department managers can only query staff in their assigned department.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Personal Identifiable Information (PII) is excluded from machine learning training feature matrices.</span>
            </li>
          </ul>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Responsible AI Framework</span>
          </div>
          <h3 className="text-xl font-bold text-white">Decision Support, Not Automated Employment Actions</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Our machine learning models are designed strictly for human decision support:
          </p>
          <ul className="text-xs text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>Predictions provide attribution risk factors (such as overtime strain) to inform retention retention strategies.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>The system strictly prohibits consequential employment actions (termination, demotion) from being automated.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>Grounded RAG answers always cite handbook page and clause references.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* 5. CTA */}
      <div className="text-center space-y-4 pt-6">
        <h3 className="text-xl font-bold text-white">Explore the Architecture in Action</h3>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/features"
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition"
          >
            Explore Feature Specs
          </Link>
          <Link
            to="/contact"
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            Contact Team
          </Link>
        </div>
      </div>
    </div>
  );
};
