import React, { useEffect, useState } from 'react';
import { Building2, Users, Plus, X, Briefcase, Award } from 'lucide-react';
import { api } from '../../services/api';
import { Department, Designation } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const DepartmentManager: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await api.getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createDepartment({
        name,
        code,
        description
      });
      setModalOpen(false);
      setName('');
      setCode('');
      setDescription('');
      fetchDepartments();
    } catch (err: any) {
      setError(err.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = ['Super Admin', 'HR Manager'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Departments & Designations</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational business units, designation levels, and organizational hierarchy.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Department</span>
          </button>
        )}
      </div>

      {/* Grid of Department Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-brand-500/40 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                    {dept.code}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dept.employee_count} members</span>
                  </div>
                </div>

                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-3">
                  {dept.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {dept.description || 'Enterprise functional team.'}
                </p>

                {dept.manager_name && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                    Department Head: <span className="font-semibold text-slate-800 dark:text-slate-200">{dept.manager_name}</span>
                  </div>
                )}
              </div>

              {/* Designations Pill List */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Designations ({dept.designations.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {dept.designations.slice(0, 4).map((d) => (
                    <span
                      key={d.id}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300"
                    >
                      {d.title}
                    </span>
                  ))}
                  {dept.designations.length > 4 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-500">
                      +{dept.designations.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Create New Department</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-3 text-xs">
              {error && <div className="p-2 bg-red-50 text-red-600 rounded-lg">{error}</div>}
              <div>
                <label className="block font-semibold mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Infrastructure"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CLOUD"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="Operational scope..."
                />
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
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
