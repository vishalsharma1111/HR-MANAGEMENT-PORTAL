import React, { useState, useEffect } from 'react';
import { 
  Calendar, CheckCircle, AlertCircle, 
  Plus, Check, X, Send, RefreshCw 
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LeaveType, LeaveBalance, LeaveApplication } from '../../types';

export const LeaveManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'balances' | 'applications' | 'approvals'>('balances');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [applications, setApplications] = useState<LeaveApplication[]>([]);

  // Apply Leave Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [session, setSession] = useState<'FIRST_HALF' | 'SECOND_HALF'>('FIRST_HALF');
  const [reason, setReason] = useState('');

  // Review Modal state
  const [reviewAppId, setReviewAppId] = useState<number | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewComments, setReviewComments] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);

  const isApprover = ['Super Admin', 'HR Manager', 'Department Manager'].includes(user?.role || '');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [types, bals, apps] = await Promise.all([
        api.getLeaveTypes().catch(() => []),
        api.getLeaveBalances().catch(() => []),
        api.getLeaveApplications().catch(() => [])
      ]);
      setLeaveTypes(types);
      setBalances(bals);
      setApplications(apps);
      if (types.length > 0 && selectedTypeId === '') {
        setSelectedTypeId(types[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId || !startDate || !endDate || !reason) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.applyLeave({
        leave_type_id: Number(selectedTypeId),
        start_date: startDate,
        end_date: endDate,
        is_half_day: isHalfDay,
        half_day_session: isHalfDay ? session : undefined,
        reason
      });
      setSuccess('Leave application submitted successfully for supervisor approval.');
      setShowApplyModal(false);
      setReason('');
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Leave application failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAppId) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.reviewLeaveApplication(reviewAppId, reviewAction, reviewComments);
      setSuccess(`Leave request #${reviewAppId} ${reviewAction.toLowerCase()} successfully.`);
      setShowReviewModal(false);
      setReviewComments('');
      setReviewAppId(null);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Review action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingApprovals = applications.filter(a => 
    a.status === 'PENDING_MANAGER' || a.status === 'PENDING_HR'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leave & Absence Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Accruals, balance allocation, transactional overlap checks, and multi-tier approval workflow.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowApplyModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Apply For Leave
          </button>
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

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map(bal => {
          const usedPct = bal.allocated > 0 ? (bal.used / bal.allocated) * 100 : 0;
          return (
            <div key={bal.id} className="card p-5 relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {bal.leave_type_code} • {bal.leave_type_name}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                  {bal.remaining}d Left
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                {bal.remaining} <span className="text-sm font-normal text-slate-400">/ {bal.allocated} days</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-3 overflow-hidden">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, usedPct)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Used: {bal.used}d</span>
                <span>Pending: {bal.pending}d</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6">
        <button
          onClick={() => setActiveTab('balances')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'balances'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          My Applications History
        </button>
        {isApprover && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'approvals'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Manager Approvals Queue
            {pendingApprovals.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-white font-bold">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Applications List Tab */}
      {activeTab === 'balances' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white">Leave Applications Log</h3>
            <span className="text-xs text-slate-500">{applications.length} total applications</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Dates Span</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Supervisor Comments</th>
                  <th>Applied On</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      Loading leave applications...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      No leave requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  applications.map(app => (
                    <tr key={app.id}>
                      <td className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mr-1.5">
                          {app.leave_type_code}
                        </span>
                        {app.leave_type_name}
                      </td>
                      <td className="text-sm font-medium">
                        {app.start_date} {app.start_date !== app.end_date && `→ ${app.end_date}`}
                      </td>
                      <td>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {app.days_count} {app.days_count === 1 ? 'day' : 'days'}
                        </span>
                        {app.is_half_day && (
                          <span className="block text-xs text-slate-400">
                            Half Day ({app.half_day_session || 'First Half'})
                          </span>
                        )}
                      </td>
                      <td className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {app.reason}
                      </td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          app.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : app.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500 max-w-xs truncate">
                        {app.manager_comments || app.hr_comments || '--'}
                      </td>
                      <td className="text-xs text-slate-400 whitespace-nowrap">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approvals Queue Tab */}
      {activeTab === 'approvals' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white">Supervisor Approval Queue</h3>
            <span className="text-xs text-amber-600 font-semibold">{pendingApprovals.length} pending review</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Type & Duration</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      No pending leave requests awaiting approval.
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.map(app => (
                    <tr key={app.id}>
                      <td className="font-semibold text-slate-900 dark:text-white">
                        {app.employee_name || `Employee #${app.employee_id}`}
                      </td>
                      <td className="text-xs text-slate-500">
                        {app.department_name || 'Engineering'}
                      </td>
                      <td>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {app.leave_type_code} ({app.days_count} days)
                        </span>
                      </td>
                      <td className="text-xs font-mono text-slate-600 dark:text-slate-300">
                        {app.start_date} → {app.end_date}
                      </td>
                      <td className="text-sm max-w-xs truncate text-slate-600 dark:text-slate-400">
                        {app.reason}
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          {app.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setReviewAppId(app.id);
                              setReviewAction('APPROVED');
                              setShowReviewModal(true);
                            }}
                            className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1 px-2.5 flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => {
                              setReviewAppId(app.id);
                              setReviewAction('REJECTED');
                              setShowReviewModal(true);
                            }}
                            className="btn btn-sm bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2.5 flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Apply for Leave</h3>
            <p className="text-xs text-slate-500 mb-4">
              Select leave category and date span. Balances and calendar overlaps are validated before reservation.
            </p>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="label">Leave Type *</label>
                <select
                  value={selectedTypeId}
                  onChange={e => setSelectedTypeId(Number(e.target.value))}
                  className="input"
                  required
                >
                  {leaveTypes.map(lt => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} ({lt.code}) — {lt.annual_quota} days/yr
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <input
                  type="checkbox"
                  id="halfDay"
                  checked={isHalfDay}
                  onChange={e => setIsHalfDay(e.target.checked)}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="halfDay" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Half-Day Leave (Single date only)
                </label>
                {isHalfDay && (
                  <select
                    value={session}
                    onChange={e => setSession(e.target.value as 'FIRST_HALF' | 'SECOND_HALF')}
                    className="input text-xs py-1 px-2 ml-auto w-36"
                  >
                    <option value="FIRST_HALF">First Half (AM)</option>
                    <option value="SECOND_HALF">Second Half (PM)</option>
                  </select>
                )}
              </div>

              <div>
                <label className="label">Reason & Justification *</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Provide context for manager review..."
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Validating...' : 'Submit Leave Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Confirmation Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {reviewAction === 'APPROVED' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {reviewAction === 'APPROVED'
                ? 'Approving will deduct leave balance and automatically mark attendance as ON_LEAVE.'
                : 'Rejecting will release the reserved pending balance.'}
            </p>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="label">Supervisor Comments</label>
                <textarea
                  rows={3}
                  value={reviewComments}
                  onChange={e => setReviewComments(e.target.value)}
                  placeholder="Enter notes or handoff instructions..."
                  className="input"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`btn ${reviewAction === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'btn-danger'}`}
                >
                  {submitting ? 'Saving...' : `Confirm ${reviewAction}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
