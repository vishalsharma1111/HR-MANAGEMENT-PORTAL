import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, ChevronDown, ChevronUp, Search, 
  ShieldCheck, Bot, Sparkles, ArrowRight, CheckCircle2 
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export const HelpFAQPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<string[]>(['faq-1', 'faq-4', 'faq-7']);

  const toggleFAQ = (id: string) => {
    if (openIds.includes(id)) {
      setOpenIds(openIds.filter(item => item !== id));
    } else {
      setOpenIds([...openIds, id]);
    }
  };

  const faqs: FAQItem[] = [
    {
      id: 'faq-1',
      category: 'General & Access',
      question: 'What is Enterprise HRMS and who is it designed for?',
      answer: 'Enterprise HRMS is an all-in-one workforce operating system built for modern mid-to-large enterprises. It consolidates employee directories, clock-in attendance with grace rules, leave approvals, decimal-safe payroll with loss-of-pay proration, recruitment applicant tracking, and grounded AI policy assistance.'
    },
    {
      id: 'faq-2',
      category: 'General & Access',
      question: 'How do role permissions and data isolation work?',
      answer: 'The system enforces 7 distinct operational roles: Super Admin, HR Manager, Department Manager, Employee, Recruiter, Payroll Officer, and IT Administrator. Security is enforced at the backend endpoint and database level—not merely by hiding buttons. An employee can never access peer compensation records, and department managers are strictly restricted to their assigned departmental roster.'
    },
    {
      id: 'faq-3',
      category: 'Operations',
      question: 'How does Attendance connect directly to Payroll?',
      answer: 'When monthly payroll is processed, the system automatically queries attendance records and approved leaves. Unexcused absences calculate Loss-of-Pay (LOP) deductions which prorate gross earnings into net pay, eliminating manual spreadsheets.'
    },
    {
      id: 'faq-4',
      category: 'Operations',
      question: 'Can employees punch in multiple times per day?',
      answer: 'No. The attendance engine features duplicate punch prevention. Calling check-in when an active punch-in already exists returns an HTTP 400 rejection to ensure time integrity.'
    },
    {
      id: 'faq-5',
      category: 'Intelligence',
      question: 'How is the Employee Attrition model trained and evaluated?',
      answer: 'The attrition model is a scikit-learn Champion Logistic Regression pipeline fitted with balanced class weights on standardized numerical features and one-hot encoded categoricals. On our holdout evaluation test set (N = 295), it achieved a ROC-AUC of 0.6227 and 52.5% positive-class recall. Predictions are strictly human decision-support—never used to automate employment termination.'
    },
    {
      id: 'faq-6',
      category: 'Intelligence',
      question: 'How does the AI HR Assistant prevent hallucinations?',
      answer: 'The assistant uses grounded Retrieval-Augmented Generation (RAG) across 21 searchable chunks from 5 approved corporate handbooks. When an employee asks a policy question, the assistant explicitly cites handbook clauses. For personal records like leave balances or payslip net pay, it executes authenticated database queries rather than allowing an LLM to invent numbers.'
    },
    {
      id: 'faq-7',
      category: 'Security',
      question: 'How does self-service password recovery work?',
      answer: 'Password recovery uses an enumeration-resistant endpoint (`POST /api/auth/forgot-password`). It returns an identical response whether an email is registered or not to prevent user enumeration, while logging recovery events into compliance audit logs.'
    },
    {
      id: 'faq-8',
      category: 'Security',
      question: 'Can anyone publicly register as an HR Admin or Payroll Officer?',
      answer: 'No. Public registration strictly provisions non-privileged standard Employee accounts. Privileged administrative roles must be assigned directly through an authorized Super Admin workflow.'
    }
  ];

  const filteredFaqs = faqs.filter(f => 
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-brand-400 font-semibold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Knowledge & FAQ</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Find answers regarding role authorization, connected business workflows, machine learning models, and security guarantees.
        </p>

        {/* Search Input */}
        <div className="pt-4 max-w-md mx-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or keywords..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs shadow-inner"
          />
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 text-center text-xs text-slate-400">
            No matching questions found for "{searchQuery}". Try searching for "payroll", "roles", or "AI".
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = openIds.includes(faq.id);
            return (
              <div
                key={faq.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-800/50 transition"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-brand-400 tracking-wider">
                      {faq.category}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">{faq.question}</h3>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-950/40">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Help Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div>
          <div className="font-bold text-white">Have a specific question not listed here?</div>
          <div className="text-slate-400 text-[11px] mt-0.5">Submit a message to our support team or explore role solutions.</div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/contact"
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition"
          >
            Contact Team
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition"
          >
            Portal Login
          </Link>
        </div>
      </div>
    </div>
  );
};
