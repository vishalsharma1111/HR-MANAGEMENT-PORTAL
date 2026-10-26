import React, { useEffect, useState } from 'react';
import {
  ClipboardCheck, CheckCircle2, Clock, Plus, X, User,
  Calendar, Shield, Laptop, UserCheck, AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { OnboardingTask, OnboardingSummary } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const OnboardingWorkflows: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [summary, setSummary] = useState<OnboardingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<'onboarding' | 'offboarding'>('onboarding');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskCat, setTaskCat] = useState('HR');
  const [taskRole, setTaskRole] = useState('HR Manager');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskList, sum] = await Promise.all([
        api.getOnboardingTasks({ isOffboarding: activeTab === 'offboarding' }),
        api.getOnboardingSummary()
      ]);
      setTasks(taskList);
      setSummary(sum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleToggleTask = async (task: OnboardingTask) => {
    try {
      const updated = await api.updateOnboardingTask(task.id, {
        is_completed: !task.is_completed
      });
      setTasks(tasks.map(t => (t.id === task.id ? updated : t)));
      // refresh summary
      const sum = await api.getOnboardingSummary();
      setSummary(sum);
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;
    setSubmitting(true);
    try {
      await api.createOnboardingTask({
        employee_id: Number(employeeId),
        title: taskTitle,
        description: taskDesc || undefined,
        category: taskCat,
        assigned_role: taskRole,
        is_offboarding: activeTab === 'offboarding'
      });
      setModalOpen(false);
      setTaskTitle('');
      setTaskDesc('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (categoryFilter === 'ALL') return true;
    return t.category === categoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Onboarding & Offboarding Lifecycle</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated compliance checkpoints, IT provisioning, and line manager orientation workflows.
          </p>
        </div>

        {['Super Admin', 'HR Manager', 'Department Manager'].includes(user?.role || '') && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Checklist Task</span>
          </button>
        )}
      </div>

      {/* Overview Metric Banner */}
      {summary && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Workforce Onboarding Progress
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {summary.completion_rate}% Complete
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {summary.completed_tasks} completed of {summary.total_tasks} total tasks ({summary.pending_tasks} remaining)
              </div>
            </div>

            <div className="w-full sm:w-64">
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${summary.completion_rate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'onboarding'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            New Hire Onboarding
          </button>
          <button
            onClick={() => setActiveTab('offboarding')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'offboarding'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Exit & Offboarding
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {['ALL', 'HR', 'IT', 'COMPLIANCE', 'MANAGER'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                categoryFilter === cat
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">Loading checklist...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            No active lifecycle checklist tasks found for this category.
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`p-4 bg-white dark:bg-slate-900 border rounded-2xl shadow-sm transition flex items-start gap-3.5 ${
                t.is_completed
                  ? 'border-emerald-200 dark:border-emerald-950/80 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-brand-500/40'
              }`}
            >
              <button
                onClick={() => handleToggleTask(t)}
                className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 ${
                  t.is_completed
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 hover:border-brand-500'
                }`}
                title={t.is_completed ? 'Mark pending' : 'Mark completed'}
              >
                {t.is_completed && <CheckCircle2 className="w-4 h-4" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`text-xs font-bold ${t.is_completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                    {t.title}
                  </h3>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider shrink-0">
                    {t.category}
                  </span>
                </div>

                {t.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {t.description}
                  </p>
                )}

                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{t.employee_name || `Employee #${t.employee_id}`}</span>
                    </span>
                    <span>·</span>
                    <span>Assigned: {t.assigned_role}</span>
                  </div>

                  {t.is_completed && t.completed_by && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Completed by {t.completed_by}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Add Lifecycle Checklist Task</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Target Employee ID # *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 4 or 10"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Issue Access Badge & Keycard"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Task Details</label>
                <textarea
                  rows={2}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={taskCat}
                    onChange={(e) => setTaskCat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="HR">HR</option>
                    <option value="IT">IT</option>
                    <option value="COMPLIANCE">COMPLIANCE</option>
                    <option value="MANAGER">MANAGER</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Assigned Role</label>
                  <select
                    value={taskRole}
                    onChange={(e) => setTaskRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="HR Manager">HR Manager</option>
                    <option value="IT Administrator">IT Administrator</option>
                    <option value="Department Manager">Department Manager</option>
                    <option value="Employee">Employee (Self)</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-brand-600 text-white font-bold rounded-xl"
                >
                  {submitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
