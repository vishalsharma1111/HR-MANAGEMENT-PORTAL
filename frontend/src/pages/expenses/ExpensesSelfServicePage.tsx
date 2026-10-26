import React, { useState, useEffect } from 'react';
import { 
  Receipt, CheckCircle, AlertCircle, 
  Plus, Check, LifeBuoy, FileText, RefreshCw, Send
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ExpenseClaim, HelpdeskTicket, DocumentRequest } from '../../types';

export const ExpensesSelfServicePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'expenses' | 'helpdesk' | 'letters'>('expenses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [docRequests, setDocRequests] = useState<DocumentRequest[]>([]);

  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  // Expense form
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('TRAVEL');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);

  // Ticket form
  const [tktSubject, setTktSubject] = useState('');
  const [tktCategory, setTktCategory] = useState('IT_SUPPORT');
  const [tktPriority, setTktPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [tktDescription, setTktDescription] = useState('');

  // Letter form
  const [docType, setDocType] = useState('SALARY_CERTIFICATE');
  const [docPurpose, setDocPurpose] = useState('');

  const isManagerOrAdmin = ['Super Admin', 'HR Manager', 'Department Manager', 'IT Administrator'].includes(user?.role || '');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cls, tkts, docs] = await Promise.all([
        api.getExpenseClaims().catch(() => []),
        api.getHelpdeskTickets().catch(() => []),
        api.getDocumentRequests().catch(() => [])
      ]);
      setClaims(cls);
      setTickets(tkts);
      setDocRequests(docs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load self-service records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || expAmount <= 0) return;

    try {
      await api.createExpenseClaim({
        title: expTitle,
        category: expCategory,
        amount: Number(expAmount),
        currency: 'USD',
        expense_date: expDate
      });
      setSuccess('Expense reimbursement claim submitted for manager approval.');
      setShowExpenseModal(false);
      setExpTitle('');
      setExpAmount(0);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Expense claim failed');
    }
  };

  const handleReviewExpense = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.reviewExpenseClaim(id, status, `Reviewed and ${status.toLowerCase()} by supervisor`);
      setSuccess(`Expense claim ${status.toLowerCase()} successfully.`);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Review action failed');
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tktSubject || !tktDescription) return;

    try {
      await api.createHelpdeskTicket({
        category: tktCategory,
        priority: tktPriority,
        subject: tktSubject,
        description: tktDescription
      });
      setSuccess('Helpdesk support ticket registered. IT / HR agent assigned.');
      setShowTicketModal(false);
      setTktSubject('');
      setTktDescription('');
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    }
  };

  const handleResolveTicket = async (ticketId: number) => {
    try {
      await api.updateHelpdeskTicket(ticketId, {
        status: 'RESOLVED',
        resolution_notes: 'Resolved and closed by IT support technician.'
      });
      setSuccess('Ticket marked as resolved.');
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update ticket status');
    }
  };

  const handleCreateDocRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docPurpose) return;

    try {
      await api.createDocumentRequest({
        document_type: docType,
        purpose: docPurpose
      });
      setSuccess('Employment verification letter requested from HR department.');
      setShowDocModal(false);
      setDocPurpose('');
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Document request failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Expenses & Employee Self-Service</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Reimbursement claims, corporate IT helpdesk support, and employment verification letters.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'expenses' && (
            <button
              onClick={() => setShowExpenseModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Claim Expense
            </button>
          )}
          {activeTab === 'helpdesk' && (
            <button
              onClick={() => setShowTicketModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Open Ticket
            </button>
          )}
          {activeTab === 'letters' && (
            <button
              onClick={() => setShowDocModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Request Letter
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

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'expenses'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Expense Reimbursements ({claims.length})
        </button>
        <button
          onClick={() => setActiveTab('helpdesk')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'helpdesk'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          Helpdesk Support ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('letters')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'letters'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          Document & Letter Requests ({docRequests.length})
        </button>
      </div>

      {/* Tab 1: Expense Claims */}
      {activeTab === 'expenses' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white">Reimbursement Claims Log</h3>
            <span className="text-xs text-slate-500">
              Approved claims disburse directly in the next monthly payroll run
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Expense Item</th>
                  <th>Employee</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Expense Date</th>
                  <th>Status</th>
                  <th>Supervisor Review</th>
                  {isManagerOrAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {claims.length === 0 ? (
                  <tr>
                    <td colSpan={isManagerOrAdmin ? 8 : 7} className="text-center py-8 text-slate-500">
                      No expense reimbursement claims on record.
                    </td>
                  </tr>
                ) : (
                  claims.map(claim => (
                    <tr key={claim.id}>
                      <td className="font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {claim.title}
                      </td>
                      <td className="font-medium text-slate-800 dark:text-slate-200">
                        {claim.employee_name || `Staff #${claim.employee_id}`}
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {claim.category}
                        </span>
                      </td>
                      <td className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                        ${claim.amount.toFixed(2)} {claim.currency}
                      </td>
                      <td className="text-xs text-slate-500">
                        {claim.expense_date}
                      </td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          claim.status === 'APPROVED' || claim.status === 'REIMBURSED_IN_PAYROLL'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : claim.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}>
                          {claim.status === 'REIMBURSED_IN_PAYROLL' ? 'PAID IN PAYROLL' : claim.status}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500 max-w-xs truncate">
                        {claim.approver_comments || (claim.status === 'PENDING' ? 'Awaiting supervisor approval' : 'Approved')}
                      </td>
                      {isManagerOrAdmin && (
                        <td>
                          {claim.status === 'PENDING' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReviewExpense(claim.id, 'APPROVED')}
                                className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1 px-2.5 flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleReviewExpense(claim.id, 'REJECTED')}
                                className="btn btn-sm bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2.5"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Processed</span>
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

      {/* Tab 2: Helpdesk Support Tickets */}
      {activeTab === 'helpdesk' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white">IT & Workplace Helpdesk Requests</h3>
            <span className="text-xs text-slate-500">{tickets.length} total tickets</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Employee</th>
                  <th>Status</th>
                  <th>Assigned Agent</th>
                  {isManagerOrAdmin && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={isManagerOrAdmin ? 8 : 7} className="text-center py-8 text-slate-500">
                      No support tickets opened.
                    </td>
                  </tr>
                ) : (
                  tickets.map(tkt => (
                    <tr key={tkt.id}>
                      <td className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400 whitespace-nowrap">
                        {tkt.ticket_number}
                      </td>
                      <td className="font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {tkt.subject}
                      </td>
                      <td className="text-xs">
                        {tkt.category}
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          tkt.priority === 'HIGH' || tkt.priority === 'URGENT'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {tkt.priority}
                        </span>
                      </td>
                      <td className="text-xs text-slate-600 dark:text-slate-300">
                        {tkt.employee_name || 'Staff Member'}
                      </td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          tkt.status === 'RESOLVED' || tkt.status === 'CLOSED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}>
                          {tkt.status}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500">
                        {tkt.assigned_agent_name || 'Rachel Green (IT Admin)'}
                      </td>
                      {isManagerOrAdmin && (
                        <td>
                          {tkt.status !== 'RESOLVED' && tkt.status !== 'CLOSED' ? (
                            <button
                              onClick={() => handleResolveTicket(tkt.id)}
                              className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1 px-2.5 flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Resolve
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-semibold">✓ Closed</span>
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

      {/* Tab 3: Document Requests */}
      {activeTab === 'letters' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white">Employment & Salary Certificate Requests</h3>
            <span className="text-xs text-slate-500">{docRequests.length} requests</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Requested Document</th>
                  <th>Purpose</th>
                  <th>Requested By</th>
                  <th>Status</th>
                  <th>Sign-off Status</th>
                </tr>
              </thead>
              <tbody>
                {docRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      No document requests found.
                    </td>
                  </tr>
                ) : (
                  docRequests.map(doc => (
                    <tr key={doc.id}>
                      <td className="font-bold text-slate-900 dark:text-white">
                        {doc.document_type.replace('_', ' ')}
                      </td>
                      <td className="text-xs text-slate-600 dark:text-slate-300 max-w-sm truncate">
                        {doc.purpose}
                      </td>
                      <td className="text-xs text-slate-500">
                        {doc.employee_name || 'Employee Self-Service'}
                      </td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          doc.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500">
                        {doc.approved_by_name || 'Sarah Jenkins (HR Ops)'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Claim Expense Reimbursement</h3>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="label">Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Certification Exam Fee, Client Lunch..."
                  value={expTitle}
                  onChange={e => setExpTitle(e.target.value)}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select
                    value={expCategory}
                    onChange={e => setExpCategory(e.target.value)}
                    className="input"
                  >
                    <option value="TRAVEL">Travel & Transit</option>
                    <option value="MEALS">Meals & Entertainment</option>
                    <option value="TRAINING">Certifications & L&D</option>
                    <option value="HARDWARE">Hardware & Accessories</option>
                    <option value="SOFTWARE">Software SaaS Subscriptions</option>
                  </select>
                </div>
                <div>
                  <label className="label">Amount ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={expAmount}
                    onChange={e => setExpAmount(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Expense Date *</label>
                <input
                  type="date"
                  required
                  value={expDate}
                  onChange={e => setExpDate(e.target.value)}
                  className="input"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex items-center gap-2">
                  <Send className="w-4 h-4" /> Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Open Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Open IT Support Ticket</h3>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="label">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="Brief description of the technical issue..."
                  value={tktSubject}
                  onChange={e => setTktSubject(e.target.value)}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select
                    value={tktCategory}
                    onChange={e => setTktCategory(e.target.value)}
                    className="input"
                  >
                    <option value="IT_SUPPORT">IT & Hardware</option>
                    <option value="SOFTWARE">Software & Access</option>
                    <option value="PAYROLL">Payroll & Benefits</option>
                    <option value="WORKPLACE">Workplace Facilities</option>
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select
                    value={tktPriority}
                    onChange={e => setTktPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
                    className="input"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Outage)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Detailed Explanation *</label>
                <textarea
                  required
                  rows={3}
                  value={tktDescription}
                  onChange={e => setTktDescription(e.target.value)}
                  placeholder="Include reproduction steps, device serial number, or error messages..."
                  className="input"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex items-center gap-2">
                  <Send className="w-4 h-4" /> Open Support Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Letter Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Request HR Employment Letter</h3>
            <form onSubmit={handleCreateDocRequest} className="space-y-4">
              <div>
                <label className="label">Letter Type</label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="input"
                >
                  <option value="SALARY_CERTIFICATE">Salary Certificate / Proof of Income</option>
                  <option value="EXPERIENCE_LETTER">Experience & Service Letter</option>
                  <option value="BONAFIDE_CERTIFICATE">Bonafide Employment Verification</option>
                  <option value="VISA_LETTER">Visa & Consular Travel Letter</option>
                </select>
              </div>
              <div>
                <label className="label">Purpose / Recipient Authority *</label>
                <textarea
                  required
                  rows={3}
                  value={docPurpose}
                  onChange={e => setDocPurpose(e.target.value)}
                  placeholder="e.g. Mortgage application at Chase Bank, Schengen Visa application..."
                  className="input"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex items-center gap-2">
                  <Send className="w-4 h-4" /> Request Letter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
