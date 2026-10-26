import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, CheckCircle2, Clock, AlertTriangle, Building2,
  TrendingUp, ArrowUpRight, Plus, ShieldCheck, FileText,
  UserPlus, Laptop, Award, BellRing
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { api } from '../services/api';
import { DashboardMetrics } from '../types';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#0284c7', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load enterprise dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-red-700 dark:text-red-300">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span>Error loading enterprise metrics</span>
        </div>
        <p className="text-xs mt-1">{error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-3 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-brand-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-sm text-white uppercase tracking-wider">
              {user?.role} Portal
            </span>
            <span className="text-xs text-brand-100">· {user?.department_id ? 'Department Access' : 'Enterprise Global View'}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-xs text-brand-100 mt-1 max-w-xl">
            Here is your live enterprise workforce pulse, active onboarding pipelines, department allocations, and governance activity.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {['Super Admin', 'HR Manager', 'Recruiter'].includes(user?.role || '') && (
            <Link
              to="/employees"
              className="px-3.5 py-2 bg-white text-brand-700 hover:bg-brand-50 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </Link>
          )}
          <Link
            to="/onboarding"
            className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition backdrop-blur-sm flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Tasks</span>
          </Link>
          <Link
            to="/documents"
            className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition backdrop-blur-sm flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Vault</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Headcount */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-brand-500/50 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Headcount</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {metrics.total_employees}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +4 this mo.
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Active: <span className="font-semibold text-slate-700 dark:text-slate-200">{metrics.active_employees}</span> · Probation: <span className="font-semibold text-slate-700 dark:text-slate-200">{metrics.probation_employees}</span>
          </div>
        </div>

        {/* Onboarding Pipeline */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-brand-500/50 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Onboarding Cohort</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {metrics.onboarding_employees}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              new hires joined
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Completion rate: <span className="font-semibold text-emerald-600">{metrics.onboarding_completion_rate}%</span>
          </div>
        </div>

        {/* Pending Lifecycle Tasks */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-brand-500/50 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Open Action Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {metrics.open_tasks}
            </span>
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
              pending review
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            IT provisioning & compliance checkpoints
          </div>
        </div>

        {/* Active Departments */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-brand-500/50 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Departments</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {metrics.total_departments}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              business units
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Global hierarchy & matrix reporting
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Department Workforce Distribution</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Headcount allocation by operational business unit</p>
            </div>
            <Link to="/departments" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center">
              View all <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.department_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="department" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Workforce Status Breakdown</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Employment lifecycle stage breakdown</p>
            </div>
            <Link to="/employees" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center">
              Directory <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.status_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                >
                  {metrics.status_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Announcements & Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Announcements */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-brand-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Company Announcements</h2>
            </div>
            <span className="text-[11px] text-slate-400">Pinned notices</span>
          </div>

          <div className="space-y-3">
            {metrics.announcements.map((ann) => {
              const isUrgent = ann.priority === 'URGENT';
              const isHigh = ann.priority === 'HIGH';

              return (
                <div
                  key={ann.id}
                  className={`p-3.5 rounded-xl border transition ${
                    isUrgent
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : isHigh
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{ann.title}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isUrgent
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : isHigh
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {ann.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {ann.content}
                  </p>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 flex items-center justify-between">
                    <span>By {ann.author_name}</span>
                    <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit Activity Feed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Governance & Audit Stream</h2>
            </div>
            <Link to="/audit" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center">
              All logs <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {metrics.recent_activity.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-brand-600 dark:text-brand-400 shrink-0">
                  {log.action.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                      {log.actor_email}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {log.details || `${log.action} on ${log.entity_type}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
