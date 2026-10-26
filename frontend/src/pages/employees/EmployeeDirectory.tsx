import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users, Search, Filter, Plus, ChevronLeft, ChevronRight,
  Mail, Phone, MapPin, Building2, Briefcase, Calendar,
  MoreVertical, X, CheckCircle2, AlertCircle, FileText,
  Laptop, History, ShieldAlert, ArrowUpDown, Trash2
} from 'lucide-react';
import { api } from '../../services/api';
import { Employee, Department, Designation, PaginatedResponse } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const EmployeeDirectory: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<string>('');
  const [employmentType, setEmploymentType] = useState<string>('');

  // Modals & Drawer
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'lifecycle' | 'assets' | 'tasks'>('overview');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    personal_email: '',
    department_id: '',
    designation_id: '',
    employment_type: 'Full-Time',
    status: 'Active',
    location: 'Headquarters',
    create_user_account: true,
    user_role: 'Employee'
  });

  const fetchEmployees = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await api.getEmployees({
        page,
        pageSize: 10,
        search: search.trim() || undefined,
        departmentId: departmentId || undefined,
        status: status || undefined,
        employmentType: employmentType || undefined
      });
      setEmployees(res.items);
      setPagination({
        page: res.page,
        total_pages: res.total_pages,
        total: res.total
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [depts, desigs] = await Promise.all([
        api.getDepartments(),
        api.getDesignations()
      ]);
      setDepartments(depts);
      setDesignations(desigs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchEmployees(1);
  }, [departmentId, status, employmentType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmployees(1);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    try {
      await api.createEmployee({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || undefined,
        personal_email: formData.personal_email || undefined,
        department_id: formData.department_id ? Number(formData.department_id) : undefined,
        designation_id: formData.designation_id ? Number(formData.designation_id) : undefined,
        employment_type: formData.employment_type,
        status: formData.status as any,
        location: formData.location,
        create_user_account: formData.create_user_account,
        user_role: formData.user_role
      });
      setCreateModalOpen(false);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        personal_email: '',
        department_id: '',
        designation_id: '',
        employment_type: 'Full-Time',
        status: 'Active',
        location: 'Headquarters',
        create_user_account: true,
        user_role: 'Employee'
      });
      fetchEmployees(1);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create employee');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate and offboard this employee?')) return;
    try {
      await api.deactivateEmployee(id);
      fetchEmployees(pagination.page);
      if (selectedEmployee?.id === id) {
        setSelectedEmployee(null);
      }
    } catch (err: any) {
      alert(err.message || 'Deactivation failed');
    }
  };

  const canManage = ['Super Admin', 'HR Manager', 'Recruiter'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Employee Directory</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage enterprise personnel profiles, status, department assignments, and lifecycle records.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-brand-500/20 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee by name, ID code, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-20 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-semibold transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={departmentId || ''}
            onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : undefined)}
            className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Onboarding">Onboarding</option>
            <option value="Probation">Probation</option>
            <option value="Notice Period">Notice Period</option>
            <option value="Terminated">Terminated</option>
          </select>

          {/* Employment Type */}
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Types</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Contract">Contract</option>
            <option value="Intern">Intern</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
            Loading enterprise employee roster...
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">No employees match criteria</div>
            <p className="text-xs text-slate-400">Try adjusting your search filters or add a new employee profile.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">ID Code</th>
                  <th className="py-3 px-4">Department & Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.map((emp) => {
                  const isActive = emp.status === 'Active';
                  const isOnboarding = emp.status === 'Onboarding';
                  const isProbation = emp.status === 'Probation';
                  const isTerminated = emp.status === 'Terminated';

                  return (
                    <tr
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                          {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {emp.first_name} {emp.last_name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{emp.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* ID Code */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {emp.employee_id}
                      </td>

                      {/* Department & Designation */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {emp.designation_title || 'Staff'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {emp.department_name || 'General'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : isOnboarding
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : isProbation
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {emp.location || 'HQ'}
                      </td>

                      {/* Joining Date */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {new Date(emp.joining_date).toLocaleDateString()}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmployee(emp);
                          }}
                          className="px-2.5 py-1 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950 rounded-lg text-xs font-semibold transition"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold">{employees.length}</span> of{' '}
            <span className="font-semibold">{pagination.total}</span> employees
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchEmployees(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <button
              onClick={() => fetchEmployees(pagination.page + 1)}
              disabled={pagination.page >= pagination.total_pages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Employee Detail Drawer */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end transition-opacity">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  {selectedEmployee.first_name.charAt(0)}{selectedEmployee.last_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </h2>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-brand-600 dark:text-brand-400 font-semibold">{selectedEmployee.employee_id}</span>
                    <span>·</span>
                    <span>{selectedEmployee.designation_title || 'Staff'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold">
              <button
                onClick={() => setDrawerTab('overview')}
                className={`py-3 px-3 border-b-2 transition ${
                  drawerTab === 'overview'
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setDrawerTab('lifecycle')}
                className={`py-3 px-3 border-b-2 transition ${
                  drawerTab === 'lifecycle'
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Lifecycle Events ({selectedEmployee.lifecycle_events?.length || 0})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {drawerTab === 'overview' && (
                <div className="space-y-4">
                  {/* Job Details Card */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                    <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      Job & Department Hierarchy
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[11px] text-slate-400">Department</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmployee.department_name || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Designation</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmployee.designation_title || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Reporting Manager</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmployee.reporting_manager_name || 'Direct Leadership'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Direct Reports</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmployee.direct_reports_count} personnel</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Employment Type</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmployee.employment_type}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Status</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmployee.status}</div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info Card */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                    <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      Contact & Location
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[11px] text-slate-400">Corporate Email</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmployee.email}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Phone</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmployee.phone || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Personal Email</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmployee.personal_email || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Work Location</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmployee.location || 'Headquarters'}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[11px] text-slate-400">Residential Address</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmployee.address || 'Confidential on file'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                    <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      Emergency Contact Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[11px] text-slate-400">Contact Person</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmployee.emergency_contact_name || 'Designated kin'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Emergency Phone</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmployee.emergency_contact_phone || 'On file'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'lifecycle' && (
                <div className="space-y-4">
                  <div className="relative border-l-2 border-brand-200 dark:border-brand-900 pl-4 space-y-4 ml-2">
                    {selectedEmployee.lifecycle_events && selectedEmployee.lifecycle_events.length > 0 ? (
                      selectedEmployee.lifecycle_events.map((ev) => (
                        <div key={ev.id} className="relative group">
                          <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-brand-600 ring-4 ring-white dark:ring-slate-900"></div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white">{ev.event_type}</span>
                              <span className="text-[10px] text-slate-400">{new Date(ev.effective_date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">{ev.description}</p>
                            <div className="text-[10px] text-slate-400 mt-1.5">Recorded by: {ev.recorded_by || 'HR Operations'}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 text-xs">No recorded lifecycle transitions.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            {canManage && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                <button
                  onClick={() => handleDeactivate(selectedEmployee.id)}
                  disabled={selectedEmployee.status === 'Terminated'}
                  className="px-3 py-1.5 border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold disabled:opacity-40 transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Initiate Exit / Deactivate</span>
                </button>

                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-300 transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Register New Enterprise Employee
              </h2>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-5 space-y-4 text-xs">
              {createError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-600 dark:text-red-300 rounded-xl">
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Department</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Designation</label>
                  <select
                    value={formData.designation_id}
                    onChange={(e) => setFormData({ ...formData, designation_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">Select Designation</option>
                    {designations.map((des) => (
                      <option key={des.id} value={des.id}>{des.title} ({des.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Employment Type</label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Active">Active</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Probation">Probation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* User Account Access Provisioning */}
              <div className="p-3 bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="createUserAccount"
                    checked={formData.create_user_account}
                    onChange={(e) => setFormData({ ...formData, create_user_account: e.target.checked })}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="createUserAccount" className="font-bold text-slate-900 dark:text-white">
                    Auto-provision login portal credentials
                  </label>
                </div>
                {formData.create_user_account && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-semibold text-[11px] mb-1">System Role</label>
                      <select
                        value={formData.user_role}
                        onChange={(e) => setFormData({ ...formData, user_role: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="Employee">Employee</option>
                        <option value="Department Manager">Department Manager</option>
                        <option value="HR Manager">HR Manager</option>
                        <option value="Recruiter">Recruiter</option>
                        <option value="Payroll Officer">Payroll Officer</option>
                        <option value="IT Administrator">IT Administrator</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-[11px] mb-1">Initial Credentials</label>
                      <div className="w-full px-2 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-500 italic">
                        Secure temporary credentials automatically dispatched via email
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {createLoading ? 'Provisioning...' : 'Confirm & Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
