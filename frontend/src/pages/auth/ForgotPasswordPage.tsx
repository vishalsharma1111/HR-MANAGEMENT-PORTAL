import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();
      setSuccessMessage(data.message || 'If registered, recovery instructions have been dispatched.');
    } catch {
      setErrorMessage('Unable to connect to the authentication service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-3 z-10">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/" className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 items-center justify-center text-white shadow-xl shadow-brand-500/25 mb-3">
          <Building2 className="w-6 h-6" />
        </Link>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Password Recovery
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Enter your corporate email address to receive secure recovery credentials.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {successMessage ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-emerald-300">Recovery Instructions Dispatched</div>
                  <div>{successMessage}</div>
                  <div className="text-[11px] text-emerald-400/80">Please inspect your inbox or corporate spam filter.</div>
                </div>
              </div>
              <Link
                to="/login"
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold block text-center"
              >
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3.5 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>{errorMessage}</div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Corporate Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@enterprisehrms.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
              >
                <span>{loading ? 'Dispatching Instructions...' : 'Send Recovery Instructions'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Remember your credentials?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-2">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
