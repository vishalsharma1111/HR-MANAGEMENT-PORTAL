import React, { useState, useEffect } from 'react';
import { 
  Clock, CheckCircle, AlertCircle, Calendar, 
  Plus, Search, RefreshCw, Send, Check
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  AttendanceRecord, AttendanceCorrection, Shift, 
  HolidayItem, AttendanceSummary, Timesheet 
} from '../../types';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'attendance' | 'corrections' | 'shifts' | 'timesheets'>('attendance');
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);

  // Filter states
  const [historyFilter, setHistoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [corrDate, setCorrDate] = useState('');
  const [corrIn, setCorrIn] = useState('09:00');
  const [corrOut, setCorrOut] = useState('18:00');
  const [corrReason, setCorrReason] = useState('');

  const isManagerOrAdmin = ['Super Admin', 'HR Manager', 'Department Manager'].includes(user?.role || '');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [today, hist, summ, corrs, shf, hols, tsheets] = await Promise.all([
        api.getTodayAttendance().catch(() => null),
        api.getAttendanceHistory().catch(() => []),
        api.getAttendanceSummary().catch(() => null),
        api.getAttendanceCorrections().catch(() => []),
        api.getShifts().catch(() => []),
        api.getHolidays().catch(() => []),
        api.getTimesheets().catch(() => [])
      ]);
      setTodayRecord(today);
      setHistory(hist);
      setSummary(summ);
      setCorrections(corrs);
      setShifts(shf);
      setHolidays(hols);
      setTimesheets(tsheets);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckIn = async () => {
    setPunchLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const rec = await api.checkIn('Web Clock-In');
      setTodayRecord(rec);
      setSuccess('Successfully clocked in for today!');
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setPunchLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setPunchLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const rec = await api.checkOut('Web Clock-Out');
      setTodayRecord(rec);
      setSuccess('Successfully clocked out for today!');
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Check-out failed');
    } finally {
      setPunchLoading(false);
    }
  };

  const handleCreateCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!corrDate || !corrReason) return;
    try {
      const reqIn = corrIn ? `${corrDate}T${corrIn}:00` : undefined;
      const reqOut = corrOut ? `${corrDate}T${corrOut}:00` : undefined;
      await api.createAttendanceCorrection({
        date: corrDate,
        requested_check_in: reqIn,
        requested_check_out: reqOut,
        reason: corrReason
      });
      setSuccess('Correction request submitted for manager review.');
      setShowCorrectionModal(false);
      setCorrReason('');
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit correction');
    }
  };

  const handleReviewCorrection = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.reviewAttendanceCorrection(id, status, `Reviewed and ${status.toLowerCase()} by manager`);
      setSuccess(`Correction request ${status.toLowerCase()} successfully.`);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Review action failed');
    }
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = !historyFilter || 
      (item.employee_name && item.employee_name.toLowerCase().includes(historyFilter.toLowerCase())) ||
      item.date.includes(historyFilter);
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance & Workforce</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time daily clocking, shift scheduling, and manager correction approvals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCorrectionModal(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Clock className="w-4 h-4 text-primary-500" />
            Request Correction
          </button>
          <button
            onClick={fetchData}
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            title="Refresh Attendance Data"
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

      {/* Today Punch Widget & Monthly Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clock Punch Card */}
        <div className="card p-6 border-l-4 border-l-primary-500 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Today's Punch Station
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                todayRecord?.check_out 
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                  : todayRecord?.check_in 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' 
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {todayRecord?.check_out ? 'Shift Ended' : todayRecord?.check_in ? 'Clocked In' : 'Not Clocked In'}
              </span>
            </div>

            <div className="text-center py-4">
              <div className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-4 text-xs">
              <div>
                <span className="text-slate-400 block">First In</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {todayRecord?.check_in ? new Date(todayRecord.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Last Out</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {todayRecord?.check_out ? new Date(todayRecord.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {!todayRecord?.check_in ? (
              <button
                onClick={handleCheckIn}
                disabled={punchLoading}
                className="btn btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                {punchLoading ? 'Clocking In...' : 'Clock In Now'}
              </button>
            ) : !todayRecord?.check_out ? (
              <button
                onClick={handleCheckOut}
                disabled={punchLoading}
                className="btn btn-danger w-full py-2.5 flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                {punchLoading ? 'Clocking Out...' : 'Clock Out Now'}
              </button>
            ) : (
              <button disabled className="btn btn-secondary w-full py-2.5 opacity-60 cursor-not-allowed">
                Daily Shift Completed
              </button>
            )}
          </div>
        </div>

        {/* Monthly Summary Statistics */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Days Present</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {summary?.present_days ?? '--'}
            </span>
            <span className="text-xs text-emerald-600 mt-1 font-medium">Recorded this month</span>
          </div>
          <div className="card p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">On Leave</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {summary?.leave_days ?? '--'}
            </span>
            <span className="text-xs text-slate-400 mt-1">Approved absences</span>
          </div>
          <div className="card p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Late Arrivals</span>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
              {summary?.late_days ?? '--'}
            </span>
            <span className="text-xs text-amber-500 mt-1">&gt;15 min shift grace</span>
          </div>
          <div className="card p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Overtime Hours</span>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
              {summary?.overtime_hours_total ? `${summary.overtime_hours_total}h` : '0h'}
            </span>
            <span className="text-xs text-slate-400 mt-1">Beyond standard shift</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'attendance'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Attendance History
        </button>
        <button
          onClick={() => setActiveTab('corrections')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'corrections'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Correction Requests
          {corrections.filter(c => c.status === 'PENDING').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-xs bg-amber-500 text-white">
              {corrections.filter(c => c.status === 'PENDING').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('shifts')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'shifts'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Shifts & Holidays
        </button>
        <button
          onClick={() => setActiveTab('timesheets')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'timesheets'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Timesheets & Projects
        </button>
      </div>

      {/* Tab 1: Attendance History */}
      {activeTab === 'attendance' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by date or name..."
                value={historyFilter}
                onChange={e => setHistoryFilter(e.target.value)}
                className="input pl-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="input text-sm w-40"
              >
                <option value="">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="ABSENT">Absent</option>
                <option value="HALF_DAY">Half Day</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Work Hours</th>
                  <th>Status</th>
                  <th>Overtime</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500">
                      Loading attendance records...
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500">
                      No attendance records found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map(row => (
                    <tr key={row.id}>
                      <td className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {row.date}
                      </td>
                      <td>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {row.employee_name || `Employee #${row.employee_id}`}
                        </span>
                      </td>
                      <td className="text-sm">
                        {row.check_in ? new Date(row.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                        {row.is_late && (
                          <span className="ml-2 text-xs text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                            +{row.late_minutes}m Late
                          </span>
                        )}
                      </td>
                      <td className="text-sm">
                        {row.check_out ? new Date(row.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                      </td>
                      <td className="font-semibold text-slate-700 dark:text-slate-300">
                        {row.total_hours ? `${row.total_hours} hrs` : '--'}
                      </td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          row.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : row.status === 'ON_LEAVE'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : row.status === 'HALF_DAY'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        {row.overtime_hours > 0 ? `+${row.overtime_hours} hrs` : '--'}
                      </td>
                      <td className="text-xs text-slate-500 max-w-xs truncate">
                        {row.notes || '--'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Correction Requests */}
      {activeTab === 'corrections' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white">Attendance Punch Corrections</h3>
            <button
              onClick={() => setShowCorrectionModal(true)}
              className="btn btn-primary text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Submit Correction
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Request Date</th>
                  <th>Employee</th>
                  <th>Proposed Times</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Manager Review</th>
                  {isManagerOrAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {corrections.length === 0 ? (
                  <tr>
                    <td colSpan={isManagerOrAdmin ? 7 : 6} className="text-center py-8 text-slate-500">
                      No correction requests on record.
                    </td>
                  </tr>
                ) : (
                  corrections.map(corr => (
                    <tr key={corr.id}>
                      <td className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {corr.date}
                      </td>
                      <td className="font-medium text-slate-800 dark:text-slate-200">
                        {corr.employee_name || `Employee #${corr.employee_id}`}
                      </td>
                      <td className="text-xs font-mono">
                        {corr.requested_check_in ? new Date(corr.requested_check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                        {' → '}
                        {corr.requested_check_out ? new Date(corr.requested_check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                      </td>
                      <td className="text-sm max-w-xs truncate text-slate-600 dark:text-slate-400">
                        {corr.reason}
                      </td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          corr.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : corr.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}>
                          {corr.status}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500">
                        {corr.reviewer_name ? `${corr.reviewer_name}: ${corr.review_notes || 'Approved'}` : 'Pending Review'}
                      </td>
                      {isManagerOrAdmin && (
                        <td>
                          {corr.status === 'PENDING' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReviewCorrection(corr.id, 'APPROVED')}
                                className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1 px-2.5 flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleReviewCorrection(corr.id, 'REJECTED')}
                                className="btn btn-sm bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2.5"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Completed</span>
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

      {/* Tab 3: Shifts & Holidays */}
      {activeTab === 'shifts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shifts Catalog */}
          <div className="card p-5">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-500" />
              Configured Working Shifts
            </h3>
            <div className="space-y-3">
              {shifts.map(shift => (
                <div key={shift.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{shift.name}</h4>
                    <span className="text-xs text-slate-500">
                      Standard {shift.work_hours} hrs/day • {shift.grace_period_mins}m grace period
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-semibold text-primary-600 dark:text-primary-400">
                      {shift.start_time} - {shift.end_time}
                    </span>
                    <span className="block text-xs text-slate-400">Fixed Hours</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Holiday Calendar */}
          <div className="card p-5">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              Enterprise Holiday Calendar (2026)
            </h3>
            <div className="space-y-3">
              {holidays.map(hol => (
                <div key={hol.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{hol.name}</h4>
                    <span className="text-xs text-slate-500">{hol.description || 'Statutory Public Holiday'}</span>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-semibold">
                      {hol.date}
                    </span>
                    <span className="block text-xs text-slate-400 mt-1">{hol.holiday_type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Timesheets */}
      {activeTab === 'timesheets' && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Project Work Timesheets</h3>
              <p className="text-xs text-slate-500">Track and submit weekly project and billable development hours.</p>
            </div>
          </div>

          {timesheets.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No submitted timesheets for current week.</p>
              <p className="text-xs text-slate-400 mt-1">Timesheets auto-collate from sprint backlog tasks and punch records.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timesheets.map(ts => (
                <div key={ts.id} className="p-4 border rounded-xl border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">
                      Week: {ts.week_start_date} to {ts.week_end_date}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      {ts.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-3">Total Hours: {ts.total_hours}h</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {ts.entries.map((ent, idx) => (
                      <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{ent.project_name}</span>: {ent.task_description} ({ent.hours}h)
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Correction Request Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Request Punch Correction</h3>
            <p className="text-xs text-slate-500 mb-4">
              Submit missed punches or adjustments for supervisor verification.
            </p>
            <form onSubmit={handleCreateCorrection} className="space-y-4">
              <div>
                <label className="label">Date of Missed Punch *</label>
                <input
                  type="date"
                  required
                  value={corrDate}
                  onChange={e => setCorrDate(e.target.value)}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Requested In Time</label>
                  <input
                    type="time"
                    value={corrIn}
                    onChange={e => setCorrIn(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Requested Out Time</label>
                  <input
                    type="time"
                    value={corrOut}
                    onChange={e => setCorrOut(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Reason for Correction *</label>
                <textarea
                  required
                  rows={3}
                  value={corrReason}
                  onChange={e => setCorrReason(e.target.value)}
                  placeholder="e.g. Card badge forgotten at client site, biometric scanner failed..."
                  className="input"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex items-center gap-2">
                  <Send className="w-4 h-4" /> Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
