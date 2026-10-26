import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  Building2, Menu, X, ArrowRight, ShieldCheck, 
  ChevronRight, Sparkles, Users, Award, FileText, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: 'Solutions', path: '/solutions' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'FAQ', path: '/faq' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 border-b border-brand-800/40 py-1.5 px-4 text-center text-[11px] text-slate-300 flex items-center justify-center gap-2">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
          v4.0 Released
        </span>
        <span>Enterprise People OS with Real-Time Workforce Analytics & Grounded AI Assistant</span>
        <Link to="/features" className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-2 ml-1">
          Explore What's New →
        </Link>
      </div>

      {/* Main Persistent Top Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                <span>Enterprise HRMS</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide">
                Workforce Operating System
              </div>
            </div>
          </Link>

          {/* Center Public Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-brand-400 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Right Action Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition"
                >
                  <span>Go to Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs hover:bg-slate-800"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition border border-transparent hover:border-slate-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition"
                >
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-900/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-brand-600/20 text-brand-400 font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-brand-600 text-white text-center text-xs font-bold shadow-md"
                  >
                    Go to Portal Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className="w-full py-2 rounded-xl text-slate-400 text-center text-xs hover:bg-slate-800"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-center text-xs font-semibold border border-slate-700"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-center text-xs font-bold shadow-md shadow-brand-500/20"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Public Page View Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Enterprise Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Col 1: Brand & Statement */}
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-bold text-white text-sm">Enterprise HRMS</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm mb-4">
                The unified, modern people operations platform. From automated attendance and decimal-safe payroll to applicant tracking and grounded AI intelligence.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Enterprise Grade Security • 7-Role Isolation • 37 Tables Verified</span>
              </div>
            </div>

            {/* Col 2: Platform Modules */}
            <div>
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">Platform</h4>
              <ul className="space-y-2">
                <li><Link to="/features" className="hover:text-white transition">Employee Directory</Link></li>
                <li><Link to="/features" className="hover:text-white transition">Attendance & Shifts</Link></li>
                <li><Link to="/features" className="hover:text-white transition">Leave & Balances</Link></li>
                <li><Link to="/features" className="hover:text-white transition">Payroll Engine</Link></li>
                <li><Link to="/features" className="hover:text-white transition">Recruitment ATS</Link></li>
              </ul>
            </div>

            {/* Col 3: Role Solutions */}
            <div>
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">Solutions</h4>
              <ul className="space-y-2">
                <li><Link to="/solutions" className="hover:text-white transition">For HR Leaders</Link></li>
                <li><Link to="/solutions" className="hover:text-white transition">For Department Managers</Link></li>
                <li><Link to="/solutions" className="hover:text-white transition">For Employees (ESS)</Link></li>
                <li><Link to="/solutions" className="hover:text-white transition">For Payroll Officers</Link></li>
                <li><Link to="/solutions" className="hover:text-white transition">For Hiring Recruiters</Link></li>
              </ul>
            </div>

            {/* Col 4: Intelligence & Trust */}
            <div>
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">Intelligence</h4>
              <ul className="space-y-2">
                <li><Link to="/features" className="hover:text-white transition">Attrition Predictor</Link></li>
                <li><Link to="/features" className="hover:text-white transition">AI Policy Assistant</Link></li>
                <li><Link to="/features" className="hover:text-white transition">Drift Monitoring</Link></li>
                <li><Link to="/about" className="hover:text-white transition">Security Architecture</Link></li>
                <li><Link to="/contact" className="hover:text-white transition">Contact Support</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div>
              © {new Date().getFullYear()} Enterprise HRMS Platform. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <Link to="/about" className="hover:text-white transition">Architecture</Link>
              <Link to="/faq" className="hover:text-white transition">Help & FAQ</Link>
              <Link to="/contact" className="hover:text-white transition">Contact</Link>
              <Link to="/login" className="hover:text-white transition">Admin Portal</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
