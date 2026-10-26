import React, { useState, useEffect } from 'react';
import { 
  DollarSign, CheckCircle, AlertCircle, 
  Plus, Check, Eye, Download, Printer, RefreshCw, FileText
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PayrollRun, Payslip, FullFinalSettlement } from '../../types';

export const PayrollPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'runs' | 'payslips' | 'settlements'>('runs');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [settlements, setSettlements] = useState<FullFinalSettlement[]>([]);

  // Selected Payslip for View/Print modal
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  // New Payroll Run Modal
  const [showRunModal, setShowRunModal] = useState(false);
  const [runMonth, setRunMonth] = useState<number>(new Date().getMonth() + 1);
  const [runYear, setRunYear] = useState<number>(new Date().getFullYear());
  const [runTitle, setRunTitle] = useState('');

  const isPayrollOfficerOrAdmin = ['Super Admin', 'Payroll Officer', 'HR Manager'].includes(user?.role || '');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [runs, slips, setts] = await Promise.all([
        api.getPayrollRuns().catch(() => []),
        api.getPayslips().catch(() => []),
        api.getSettlements().catch(() => [])
      ]);
      setPayrollRuns(runs);
      setPayslips(slips);
      setSettlements(setts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    setSuccess(null);
    try {
      const title = runTitle || `${new Date(runYear, runMonth - 1).toLocaleString('default', { month: 'long' })} ${runYear} Monthly Payroll`;
      await api.createPayrollRun({
        month: Number(runMonth),
        year: Number(runYear),
        title
      });
      setSuccess(`Payroll for ${title} processed successfully with automated LOP deductions.`);
      setShowRunModal(false);
      setRunTitle('');
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payroll run processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveRun = async (runId: number) => {
    try {
      await api.approvePayrollRun(runId);
      setSuccess(`Payroll run #${runId} approved and disbursed to employee accounts.`);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve payroll run');
    }
  };

  const handlePrintPayslip = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payroll & Compensation</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Decimal-safe gross/net calculations, attendance LOP loss-of-pay proration, and compliant payslip delivery.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isPayrollOfficerOrAdmin && (
            <button
              onClick={() => setShowRunModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Process Monthly Payroll
            </button>
          )}
          <button
            onClick={fetchData}
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-3 text-red-800 dark:text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Payroll KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Payroll Runs</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {payrollRuns.length}
          </div>
          <span className="text-xs text-slate-400 mt-1">Processed batches</span>
        </div>
        <div className="card p-5 border-l-4 border-l-primary-500">
          <span className="text-xs font-semibold text-slate-500 uppercase">Cumulative Net Disbursed</span>
          <div className="text-2xl font-extrabold text-primary-600 dark:text-primary-400 mt-2">
            ${payrollRuns.reduce((sum, r) => sum + r.total_net, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 mt-1">Direct bank deposits</span>
        </div>
        <div className="card p-5 border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold text-slate-500 uppercase">Statutory PF & Taxes</span>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            ${payrollRuns.reduce((sum, r) => sum + r.total_deductions, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 mt-1">Withheld compliance totals</span>
        </div>
        <div className="card p-5 border-l-4 border-l-purple-500">
          <span className="text-xs font-semibold text-slate-500 uppercase">Active Payslips</span>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
            {payslips.length}
          </div>
          <span className="text-xs text-slate-400 mt-1">Individual statements generated</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6">
        <button
          onClick={() => setActiveTab('runs')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'runs'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Monthly Payroll Runs
        </button>
        <button
          onClick={() => setActiveTab('payslips')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'payslips'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Payslips Vault
        </button>
        <button
          onClick={() => setActiveTab('settlements')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'settlements'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Full & Final Settlements (Exit)
        </button>
      </div>

      {/* Tab 1: Payroll Runs */}
      {activeTab === 'runs' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white">Payroll Batches & Variance</h3>
            <span className="text-xs text-slate-500">{payrollRuns.length} runs executed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Period & Title</th>
                  <th>Employees</th>
                  <th>Total Gross</th>
                  <th>Total Deductions</th>
                  <th>Net Disbursed</th>
                  <th>Status</th>
                  <th>Processed By</th>
                  {isPayrollOfficerOrAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500">Loading payroll runs...</td>
                  </tr>
                ) : payrollRuns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500">No payroll runs found. Trigger one above.</td>
                  </tr>
                ) : (
                  payrollRuns.map(run => (
                    <tr key={run.id}>
                      <td className="font-semibold text-slate-900 dark:text-white">
                        {run.title}
                        <span className="block text-xs text-slate-400 font-normal">
                          Month {run.month} / {run.year}
                        </span>
                      </td>
                      <td className="font-medium text-slate-700 dark:text-slate-300">
                        {run.employees_count} staff
                      </td>
                      <td className="font-mono text-sm text-slate-800 dark:text-slate-200">
                        ${run.total_gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="font-mono text-sm text-amber-600 dark:text-amber-400">
                        ${run.total_deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        ${run.total_net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          run.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : run.status === 'APPROVED'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500">
                        {run.processed_by_name || 'System Auto'}
                      </td>
                      {isPayrollOfficerOrAdmin && (
                        <td>
                          {run.status === 'PROCESSED' ? (
                            <button
                              onClick={() => handleApproveRun(run.id)}
                              className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1 px-2.5 flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve & Pay
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Disbursed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payslips Vault */}
      {activeTab === 'payslips' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white">Employee Payslips Vault</h3>
            <span className="text-xs text-slate-500">{payslips.length} payslips available</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Employee</th>
                  <th>Work Days</th>
                  <th>LOP Days</th>
                  <th>Gross Pay</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payslips.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500">No payslips found on record.</td>
                  </tr>
                ) : (
                  payslips.map(slip => (
                    <tr key={slip.id}>
                      <td className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {new Date(slip.year, slip.month - 1).toLocaleString('default', { month: 'short' })} {slip.year}
                      </td>
                      <td>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {slip.employee_name || 'Staff Member'}
                        </div>
                        <span className="text-xs text-slate-400">{slip.employee_code} • {slip.department_name}</span>
                      </td>
                      <td className="text-xs font-semibold text-slate-600">
                        {slip.paid_days} / {slip.total_working_days}d
                      </td>
                      <td className="text-xs font-semibold text-amber-600">
                        {slip.loss_of_pay_days > 0 ? `-${slip.loss_of_pay_days}d LOP` : '0d'}
                      </td>
                      <td className="font-mono text-sm text-slate-800 dark:text-slate-200">
                        ${slip.gross_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="font-mono text-sm text-amber-600">
                        -${slip.total_deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="font-mono text-sm font-bold text-emerald-600">
                        ${slip.net_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedPayslip(slip)}
                          className="btn btn-sm btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Slip
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Settlements */}
      {activeTab === 'settlements' && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Full & Final (F&F) Settlements</h3>
              <p className="text-xs text-slate-500">Separation accounting, leave encashment, gratuity, and asset recovery records.</p>
            </div>
          </div>

          {settlements.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No pending or settled F&F statements.</p>
              <p className="text-xs text-slate-400 mt-1">F&F accounts initialize automatically when offboarding employees are deactivated.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {settlements.map(sett => (
                <div key={sett.id} className="p-4 border rounded-xl border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {sett.employee_name} ({sett.employee_code})
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {sett.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-3">
                    Exit Date: {sett.resignation_or_exit_date} • Last Working Day: {sett.last_working_day}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                      <span className="text-slate-400 block">Gratuity</span>
                      <span className="font-mono font-semibold">${sett.gratuity_amount.toFixed(2)}</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                      <span className="text-slate-400 block">Leave Encashment</span>
                      <span className="font-mono font-semibold">${sett.leave_encashment_amount.toFixed(2)}</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                      <span className="text-slate-400 block">Asset Recovery Deductions</span>
                      <span className="font-mono font-semibold text-red-500">-${sett.asset_recovery_deduction.toFixed(2)}</span>
                    </div>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded">
                      <span className="text-emerald-600 block font-semibold">Total Net Settlement</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">${sett.total_settlement_net.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Payroll Run Modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Process Monthly Payroll Run</h3>
            <p className="text-xs text-slate-500 mb-4">
              Calculates monthly compensation, prorates unauthorized absences (LOP), adds approved expense reimbursements, and withholds PF/TDS.
            </p>
            <form onSubmit={handleCreateRun} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Month (1-12) *</label>
                  <select
                    value={runMonth}
                    onChange={e => setRunMonth(Number(e.target.value))}
                    className="input"
                    required
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <option key={m} value={m}>
                        {new Date(2026, m - 1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Year *</label>
                  <input
                    type="number"
                    required
                    value={runYear}
                    onChange={e => setRunYear(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Custom Batch Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. November 2026 Regular Operations Payroll"
                  value={runTitle}
                  onChange={e => setRunTitle(e.target.value)}
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRunModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  {processing ? 'Processing Run...' : 'Execute Payroll Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Payslip Statement Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="card w-full max-w-2xl p-8 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-2xl animate-scale-in print:m-0 print:p-0 print:border-none print:shadow-none">
            {/* Payslip Header */}
            <div className="flex justify-between items-start border-b pb-4 border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Enterprise HRMS Inc.
                </h2>
                <p className="text-xs text-slate-500">100 Enterprise Way, Suite 400, San Francisco, CA</p>
                <p className="text-xs text-slate-400 mt-1">Tax ID / EIN: 94-2884910 • Confidential Payroll Statement</p>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-bold text-xs">
                  {selectedPayslip.status}
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
                  {new Date(selectedPayslip.year, selectedPayslip.month - 1).toLocaleString('default', { month: 'long' })} {selectedPayslip.year}
                </p>
              </div>
            </div>

            {/* Employee Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-xs border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block uppercase">Employee Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedPayslip.employee_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Employee ID</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedPayslip.employee_code}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Department</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedPayslip.department_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Designation</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedPayslip.designation_title}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Working Days</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPayslip.total_working_days} Days</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Paid Days</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPayslip.paid_days} Days</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Loss of Pay (LOP)</span>
                <span className="font-semibold text-amber-600">{selectedPayslip.loss_of_pay_days} Days</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Payment Mode</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Direct Deposit</span>
              </div>
            </div>

            {/* Earnings & Deductions Breakdown Table */}
            <div className="grid grid-cols-2 gap-6 py-4">
              {/* Earnings */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 border-b pb-1">Earnings</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Basic Salary</span>
                    <span className="font-mono font-medium">${selectedPayslip.basic_earned.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">House Rent Allowance (HRA)</span>
                    <span className="font-mono font-medium">${selectedPayslip.hra_earned.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Special Allowances</span>
                    <span className="font-mono font-medium">${selectedPayslip.allowances_earned.toFixed(2)}</span>
                  </div>
                  {selectedPayslip.reimbursement_amount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Expense Reimbursements</span>
                      <span className="font-mono">+${selectedPayslip.reimbursement_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedPayslip.bonus_amount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Performance Bonus</span>
                      <span className="font-mono">+${selectedPayslip.bonus_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>Gross Earnings</span>
                    <span className="font-mono">${selectedPayslip.gross_pay.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 border-b pb-1">Deductions</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Provident Fund (PF)</span>
                    <span className="font-mono font-medium">${selectedPayslip.pf_deduction.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Professional Tax</span>
                    <span className="font-mono font-medium">${selectedPayslip.prof_tax_deduction.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Income Tax / TDS</span>
                    <span className="font-mono font-medium">${selectedPayslip.tds_deduction.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-200 dark:border-slate-800 text-amber-600">
                    <span>Total Deductions</span>
                    <span className="font-mono">-${selectedPayslip.total_deductions.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Pay Callout */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex justify-between items-center my-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block">Total Net Salary Payable</span>
                <span className="text-xs text-slate-400">Directly remitted to verified corporate bank account</span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                ${selectedPayslip.net_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Actions (Hidden on Print) */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800 print:hidden">
              <span className="text-xs text-slate-400">Generated by Enterprise HRMS Payroll Engine</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePrintPayslip}
                  className="btn btn-secondary flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayslip(null)}
                  className="btn btn-primary"
                >
                  Close Statement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
