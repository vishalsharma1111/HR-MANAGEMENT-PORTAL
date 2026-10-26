import React, { useState, useEffect } from 'react';
import { 
  BarChart2, AlertCircle, Download, RefreshCw, 
  Users, Clock, Calendar, DollarSign, Briefcase
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { api } from '../../services/api';
import { 
  HeadcountReport, AttendanceReport, 
  LeaveReport, PayrollReport, RecruitmentReport, Department 
} from '../../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'headcount' | 'attendance' | 'leave' | 'payroll' | 'recruitment'>('headcount');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('');

  // Report States
  const [headcount, setHeadcount] = useState<HeadcountReport | null>(null);
  const [attendance, setAttendance] = useState<AttendanceReport | null>(null);
  const [leaveUtil, setLeaveUtil] = useState<LeaveReport | null>(null);
  const [payrollRep, setPayrollRep] = useState<PayrollReport | null>(null);
  const [recruitmentRep, setRecruitmentRep] = useState<RecruitmentReport | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const [depts, hc, att, lv, pay, rec] = await Promise.all([
        api.getDepartments().catch(() => []),
        api.getHeadcountReport(selectedDeptId ? Number(selectedDeptId) : undefined).catch(() => null),
        api.getAttendanceReport().catch(() => null),
        api.getLeaveUtilizationReport().catch(() => null),
        api.getPayrollReport().catch(() => null),
        api.getRecruitmentReport().catch(() => null)
      ]);
      setDepartments(depts);
      setHeadcount(hc);
      setAttendance(att);
      setLeaveUtil(lv);
      setPayrollRep(pay);
      setRecruitmentRep(rec);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate workforce reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedDeptId]);

  const handleExportCsv = (type: string) => {
    const url = api.exportReportCsvUrl(type);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports & Workforce Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real enterprise telemetry derived from persistent database records with streaming CSV exports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Filter Dept:</span>
            <select
              value={selectedDeptId}
              onChange={e => setSelectedDeptId(e.target.value ? Number(e.target.value) : '')}
              className="input text-xs py-1.5 px-3"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchReports}
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            title="Refresh Reports"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-3 text-red-800 dark:text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* CSV Quick-Export Bar */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Download Audit CSV Reports</h4>
          <p className="text-xs text-slate-500">Live streamed CSV exports with complete field metadata</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExportCsv('employees')}
            className="btn btn-sm btn-secondary text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Workforce CSV
          </button>
          <button
            onClick={() => handleExportCsv('attendance')}
            className="btn btn-sm btn-secondary text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Attendance CSV
          </button>
          <button
            onClick={() => handleExportCsv('payroll')}
            className="btn btn-sm btn-secondary text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Payroll Ledger CSV
          </button>
        </div>
      </div>

      {/* Report Module Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 sm:gap-6">
        <button
          onClick={() => setActiveTab('headcount')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'headcount'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" /> Headcount & Attrition
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Clock className="w-4 h-4" /> Attendance & Hours
        </button>
        <button
          onClick={() => setActiveTab('leave')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'leave'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4" /> Leave Utilization
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'payroll'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Payroll Disbursements
        </button>
        <button
          onClick={() => setActiveTab('recruitment')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'recruitment'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Recruitment Funnel
        </button>
      </div>

      {/* 1. Headcount & Attrition Report */}
      {activeTab === 'headcount' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Headcount</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {headcount?.total_workforce ?? '--'}
              </div>
            </div>
            <div className="card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Active Employees</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {headcount?.active_employees ?? '--'}
              </div>
            </div>
            <div className="card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Onboarding / Probation</span>
              <div className="text-2xl font-bold text-primary-600 mt-1">
                {(headcount?.probation ?? 0) + (headcount?.onboarding ?? 0)}
              </div>
            </div>
            <div className="card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Annualized Attrition Rate</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {headcount?.attrition_rate_percentage ?? 0}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Department Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={headcount?.by_department || []}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Workforce Status Ratio</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Active', value: headcount?.active_employees || 0 },
                        { name: 'Probation', value: headcount?.probation || 0 },
                        { name: 'Onboarding', value: headcount?.onboarding || 0 },
                        { name: 'Exited', value: headcount?.exited || 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Attendance & Absenteeism Report */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Present Rate</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {attendance?.present_rate ?? 0}%
              </div>
              <span className="text-xs text-slate-400 mt-1">{attendance?.present ?? 0} present days</span>
            </div>
            <div className="card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Absenteeism Rate</span>
              <div className="text-2xl font-bold text-red-600 mt-1">
                {attendance?.absenteeism_rate_percentage ?? 0}%
              </div>
              <span className="text-xs text-slate-400 mt-1">{attendance?.absent ?? 0} unauthorized days</span>
            </div>
            <div className="card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Cumulative Work Hours</span>
              <div className="text-2xl font-bold text-primary-600 mt-1">
                {attendance?.cumulative_work_hours ?? 0} hrs
              </div>
              <span className="text-xs text-slate-400 mt-1">Recorded shift hours</span>
            </div>
            <div className="card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Cumulative Overtime</span>
              <div className="text-2xl font-bold text-purple-600 mt-1">
                {attendance?.cumulative_overtime_hours ?? 0} hrs
              </div>
              <span className="text-xs text-slate-400 mt-1">Beyond standard shift</span>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Attendance Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Present', count: attendance?.present || 0, fill: '#10b981' },
                  { name: 'On Leave', count: attendance?.on_leave || 0, fill: '#3b82f6' },
                  { name: 'Late', count: attendance?.late_arrivals || 0, fill: '#f59e0b' },
                  { name: 'Half Day', count: attendance?.half_day || 0, fill: '#8b5cf6' },
                  { name: 'Absent', count: attendance?.absent || 0, fill: '#ef4444' }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 3. Leave Utilization Report */}
      {activeTab === 'leave' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Applications</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {leaveUtil?.total_applications ?? 0}
              </div>
            </div>
            <div className="card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Approved Applications</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {leaveUtil?.approved_applications ?? 0}
              </div>
            </div>
            <div className="card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Rejected Applications</span>
              <div className="text-2xl font-bold text-red-600 mt-1">
                {leaveUtil?.rejected_applications ?? 0}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Leave Utilization by Category (Days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaveUtil?.leave_by_type || []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="type_name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="days_utilized" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 4. Payroll Report */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Runs</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {payrollRep?.total_runs ?? 0}
              </div>
            </div>
            <div className="card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Gross Disbursed</span>
              <div className="text-2xl font-bold text-primary-600 mt-1">
                ${payrollRep?.cumulative_gross_disbursed.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}
              </div>
            </div>
            <div className="card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Net Disbursed</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                ${payrollRep?.cumulative_net_disbursed.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}
              </div>
            </div>
            <div className="card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Tax & PF Withheld</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                ${payrollRep?.cumulative_tax_withheld.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Monthly Net Payroll Trend ($)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={payrollRep?.monthly_trend || []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="title" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="net" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 5. Recruitment Report */}
      {activeTab === 'recruitment' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Applications</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {recruitmentRep?.total_applications ?? 0}
              </div>
            </div>
            <div className="card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Hires Handed Over</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {recruitmentRep?.hired_count ?? 0}
              </div>
            </div>
            <div className="card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Hire Conversion Rate</span>
              <div className="text-2xl font-bold text-primary-600 mt-1">
                {recruitmentRep?.hire_conversion_rate_percentage ?? 0}%
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Recruitment Conversion Funnel</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recruitmentRep?.funnel_stages || []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="stage" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
