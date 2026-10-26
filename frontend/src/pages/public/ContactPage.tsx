import React, { useState } from 'react';
import { 
  Mail, MessageSquare, User, Tag, Send, CheckCircle2, 
  AlertCircle, Building2, MapPin, Phone, ShieldCheck, Clock
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successResponse, setSuccessResponse] = useState<{ id: number; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessResponse(null);

    // Client-side validations
    if (fullName.trim().length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please provide a valid corporate email address.');
      return;
    }
    if (subject.trim().length < 3) {
      setErrorMessage('Please enter a descriptive subject line (at least 3 characters).');
      return;
    }
    if (message.trim().length < 10) {
      setErrorMessage('Your message must be at least 10 characters long.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to submit inquiry. Please try again.');
      }

      setSuccessResponse({
        id: data.id,
        message: 'Your inquiry has been successfully received and logged into the enterprise database.'
      });
      // Reset form
      setFullName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while connecting to the backend service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-brand-400 font-semibold">
          <span>Enterprise Communications</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Get in Touch with Our Team
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Have questions about the Enterprise HRMS platform, architecture, deployment options, or security controls? Submit your inquiry below.
        </p>
      </div>

      {/* Grid: Contact Form + Enterprise Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Contact Form Card */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Send Us an Inquiry</h2>
            <p className="text-xs text-slate-400">All submissions are directly registered with our enterprise support dispatch service.</p>
          </div>

          {successResponse && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-emerald-300">Inquiry Logged (Ticket #{successResponse.id})</div>
                <div>{successResponse.message}</div>
                <div className="text-[11px] text-emerald-400/80">An operations specialist will follow up with your email shortly.</div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Corporate Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane.doe@company.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Subject Line *
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Enterprise Pilot Deployment Inquiry"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Detailed Message *
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your organization's requirements, headcount, or specific technical questions..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Submitting Inquiry...' : 'Submit Contact Inquiry'}</span>
            </button>
          </form>
        </div>

        {/* Enterprise Operations Information */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-400" />
              <span>Enterprise Contact Channels</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">General Inquiries</div>
                  <div className="text-slate-400">contact@enterprisehrms.com</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Security & Audit Disclosure</div>
                  <div className="text-slate-400">security@enterprisehrms.com</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Support SLA</div>
                  <div className="text-slate-400">24/7 Operations Monitoring • 1 hr Tier-1 Response</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              Submissions through this form are persisted directly into the relational schema (`contact_submissions` table) and logged in compliance audit trails.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
