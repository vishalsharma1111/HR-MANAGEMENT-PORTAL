import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Building2, Lock, Mail, ArrowRight, ShieldCheck, 
  CheckCircle2, Eye, EyeOff, ArrowLeft, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, personas, switchPersona } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState(() => localStorage.getItem('remembered_email') || 'admin@enterprisehrms.com');
  const [password, setPassword] = useState('Enterprise@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('remembered_email'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail || email }),
      });
      const data = await res.json();
      setForgotMessage(data.message || 'Recovery email dispatched.');
    } catch {
      setForgotMessage('Unable to reach authentication server. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      await login(email, password);
      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = async (personaId: number) => {
    setLoading(true);
    setError(null);
    try {
      await switchPersona(personaId);
      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to switch persona');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Back to Home Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-3 z-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/" className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 items-center justify-center text-white shadow-xl shadow-brand-500/25 mb-3">
          <Building2 className="w-6 h-6" />
        </Link>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Sign In to Portal
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Next-Generation Workforce Management & Lifecycle Operating System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs transition"
                  placeholder="name@enterprisehrms.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-semibold">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-brand-400 hover:text-brand-300 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs transition"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 text-[11px]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-brand-600 focus:ring-brand-500"
                />
                <span>Remember email address</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2 text-xs disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Link to Register */}
          <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
            Don't have an enterprise account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-2">
              Create Account
            </Link>
          </div>

          {/* Quick Demo Persona Access */}
          <div className="pt-4 border-t border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Quick Demo Role Logins</span>
              <span className="text-[10px] text-brand-400 font-normal">1-Click Evaluation</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {personas.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleQuickPersona(p.id)}
                  disabled={loading}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition hover:border-brand-500/50"
                >
                  <div className="font-bold text-white truncate">{p.full_name}</div>
                  <div className="text-[10px] text-brand-400 truncate">{p.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Protected by AES-256 encrypted authentication & RBAC controls</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <h3 className="text-base font-bold text-white">Self-Service Account Recovery</h3>
            <p className="text-xs text-slate-400">
              Enter your corporate email address to receive secure password recovery instructions.
            </p>

            {forgotMessage ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-200 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>{forgotMessage}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotMessage(null);
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Corporate Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder={email || "name@enterprisehrms.com"}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold disabled:opacity-50"
                  >
                    {forgotLoading ? 'Dispatching...' : 'Send Recovery Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
