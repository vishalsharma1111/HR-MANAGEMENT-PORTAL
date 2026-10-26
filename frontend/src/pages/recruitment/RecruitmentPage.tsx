import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle, AlertCircle, 
  Plus, Check, Calendar, Star, RefreshCw, Send, ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { JobRequisition, Candidate, Department, Designation } from '../../types';

export const RecruitmentPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'openings'>('pipeline');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [requisitions, setRequisitions] = useState<JobRequisition[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);

  // Filter
  const [selectedReqFilter, setSelectedReqFilter] = useState<number | ''>('');

  // Modals
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  // Candidate form state
  const [candidateReqId, setCandidateReqId] = useState<number | ''>('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [candidateCompany, setCandidateCompany] = useState('');
  const [candidateDesig, setCandidateDesig] = useState('');
  const [candidateExp, setCandidateExp] = useState(3.0);

  // Hire & Onboard state
  const [hiringCandidate, setHiringCandidate] = useState<Candidate | null>(null);
  const [hireDeptId, setHireDeptId] = useState<number | ''>('');
  const [hireDesigId, setHireDesigId] = useState<number | ''>('');
  const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [hireSalary, setHireSalary] = useState(140000);

  // Interview state
  const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null);
  const [interviewRound, setInterviewRound] = useState('System Design & Architecture');
  const [interviewTime, setInterviewTime] = useState('');

  const isRecruiterOrAdmin = ['Super Admin', 'HR Manager', 'Recruiter'].includes(user?.role || '');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqs, cands, depts, desigs] = await Promise.all([
        api.getJobRequisitions().catch(() => []),
        api.getCandidates().catch(() => []),
        api.getDepartments().catch(() => []),
        api.getDesignations().catch(() => [])
      ]);
      setRequisitions(reqs);
      setCandidates(cands);
      setDepartments(depts);
      setDesignations(desigs);
      if (reqs.length > 0 && candidateReqId === '') {
        setCandidateReqId(reqs[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load recruitment pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStageChange = async (candidateId: number, nextStage: Candidate['stage']) => {
    try {
      await api.updateCandidate(candidateId, { stage: nextStage });
      setSuccess(`Candidate moved to ${nextStage} stage.`);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to advance candidate stage');
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateReqId || !candidateName || !candidateEmail) return;

    try {
      await api.createCandidate({
        job_requisition_id: Number(candidateReqId),
        full_name: candidateName,
        email: candidateEmail,
        phone: candidatePhone,
        current_company: candidateCompany,
        current_designation: candidateDesig,
        experience_years: candidateExp,
        stage: 'APPLIED'
      });
      setSuccess('Candidate added to applicant tracking pipeline.');
      setShowAddCandidateModal(false);
      setCandidateName('');
      setCandidateEmail('');
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register candidate');
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewCandidate || !interviewTime) return;

    try {
      await api.scheduleInterview({
        candidate_id: interviewCandidate.id,
        round_name: interviewRound,
        scheduled_time: interviewTime,
        meeting_link: 'https://meet.enterprisehrms.com/eval-' + interviewCandidate.id
      });
      setSuccess(`Interview scheduled for ${interviewCandidate.full_name}`);
      setShowInterviewModal(false);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Interview scheduling failed');
    }
  };

  const handleHireAndOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hiringCandidate || !hireDeptId) return;

    try {
      const newEmp = await api.hireAndOnboardCandidate(hiringCandidate.id, {
        department_id: Number(hireDeptId),
        designation_id: hireDesigId ? Number(hireDesigId) : undefined,
        joining_date: hireDate,
        starting_salary: Number(hireSalary)
      });
      setSuccess(`Handover complete! ${hiringCandidate.full_name} is now hired with Employee Code ${newEmp.employee_id} and onboarding checklist initiated.`);
      setShowHireModal(false);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Onboarding conversion failed');
    }
  };

  const stages: Candidate['stage'][] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];

  const filteredCandidates = selectedReqFilter 
    ? candidates.filter(c => c.job_requisition_id === Number(selectedReqFilter))
    : candidates;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recruitment & ATS Pipeline</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Job requisitions, applicant pipeline stages, structured interviews, and 1-click hire-to-onboard handover.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isRecruiterOrAdmin && (
            <button
              onClick={() => setShowAddCandidateModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Candidate
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

      {/* Pipeline Filter & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'pipeline'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Candidate Funnel ({filteredCandidates.length})
          </button>
          <button
            onClick={() => setActiveTab('openings')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'openings'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Open Requisitions ({requisitions.length})
          </button>
        </div>

        {activeTab === 'pipeline' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filter Requisition:</span>
            <select
              value={selectedReqFilter}
              onChange={e => setSelectedReqFilter(e.target.value ? Number(e.target.value) : '')}
              className="input text-xs py-1 px-2.5 max-w-xs"
            >
              <option value="">All Job Openings</option>
              {requisitions.map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Candidate Funnel (Kanban Stage Columns) */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stages.map(stage => {
            const stageCandidates = filteredCandidates.filter(c => c.stage === stage);
            return (
              <div key={stage} className="bg-slate-50/70 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 flex flex-col h-full">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider">
                    {stage}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    {stageCandidates.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {stageCandidates.map(cand => (
                    <div 
                      key={cand.id} 
                      className="card p-3 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                          {cand.full_name}
                        </h4>
                        <div className="flex items-center text-amber-500 text-xs">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span className="ml-0.5 font-bold">{cand.rating || 4}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 truncate mb-1.5">
                        {cand.current_designation || 'Specialist'} {cand.current_company && `• ${cand.current_company}`}
                      </p>

                      <div className="text-xs text-slate-400 mb-2 font-mono">
                        {cand.experience_years} yrs exp
                      </div>

                      {/* Stage Progression Actions */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-col gap-1.5">
                        {stage === 'INTERVIEW' && (
                          <button
                            onClick={() => {
                              setInterviewCandidate(cand);
                              setShowInterviewModal(true);
                            }}
                            className="btn btn-sm btn-secondary text-xs py-1 flex items-center justify-center gap-1 w-full"
                          >
                            <Calendar className="w-3 h-3 text-primary-500" /> Schedule Round
                          </button>
                        )}

                        {stage === 'OFFER' && (
                          <button
                            onClick={() => handleStageChange(cand.id, 'HIRED')}
                            className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1 flex items-center justify-center gap-1 w-full"
                          >
                            <Check className="w-3 h-3" /> Mark Hired
                          </button>
                        )}

                        {stage === 'HIRED' && !cand.converted_employee_id && (
                          <button
                            onClick={() => {
                              setHiringCandidate(cand);
                              const req = requisitions.find(r => r.id === cand.job_requisition_id);
                              if (req) {
                                setHireDeptId(req.department_id);
                                if (req.designation_id) setHireDesigId(req.designation_id);
                              }
                              setShowHireModal(true);
                            }}
                            className="btn btn-sm bg-primary-600 hover:bg-primary-700 text-white text-xs py-1 flex items-center justify-center gap-1 w-full font-bold shadow-sm animate-pulse"
                          >
                            <ArrowRight className="w-3 h-3" /> Hire & Onboard
                          </button>
                        )}

                        {stage === 'HIRED' && cand.converted_employee_id && (
                          <span className="text-xs text-emerald-600 font-semibold text-center block">
                            ✓ Onboarding Initiated
                          </span>
                        )}

                        {stage !== 'HIRED' && stage !== 'REJECTED' && (
                          <div className="flex gap-1 mt-1">
                            {stage === 'APPLIED' && (
                              <button
                                onClick={() => handleStageChange(cand.id, 'SCREENING')}
                                className="text-xs text-primary-600 hover:underline flex-1 text-center font-medium"
                              >
                                Advance →
                              </button>
                            )}
                            {stage === 'SCREENING' && (
                              <button
                                onClick={() => handleStageChange(cand.id, 'INTERVIEW')}
                                className="text-xs text-primary-600 hover:underline flex-1 text-center font-medium"
                              >
                                Interview →
                              </button>
                            )}
                            {stage === 'INTERVIEW' && (
                              <button
                                onClick={() => handleStageChange(cand.id, 'OFFER')}
                                className="text-xs text-emerald-600 hover:underline flex-1 text-center font-medium"
                              >
                                Make Offer →
                              </button>
                            )}
                            <button
                              onClick={() => handleStageChange(cand.id, 'REJECTED')}
                              className="text-xs text-red-500 hover:underline text-right"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Job Openings */}
      {activeTab === 'openings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requisitions.map(req => (
            <div key={req.id} className="card p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    {req.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {req.openings_count} {req.openings_count === 1 ? 'Opening' : 'Openings'}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                  {req.title}
                </h3>
                <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mb-3">
                  {req.department_name} • {req.location}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-4">
                  {req.job_description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {req.salary_range || '$140k - $175k'}
                </span>
                <span className="text-slate-400 font-medium">
                  {req.candidates_count} Candidates in pipeline
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddCandidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Add New Candidate</h3>
            <p className="text-xs text-slate-500 mb-4">Register an applicant directly to the recruitment pipeline.</p>
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div>
                <label className="label">Target Job Opening *</label>
                <select
                  required
                  value={candidateReqId}
                  onChange={e => setCandidateReqId(Number(e.target.value))}
                  className="input"
                >
                  {requisitions.map(r => (
                    <option key={r.id} value={r.id}>{r.title} ({r.department_name})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Candidate Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Bellfort"
                  value={candidateName}
                  onChange={e => setCandidateName(e.target.value)}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="jordan@example.com"
                    value={candidateEmail}
                    onChange={e => setCandidateEmail(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 555-0199"
                    value={candidatePhone}
                    onChange={e => setCandidatePhone(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Current Employer</label>
                  <input
                    type="text"
                    placeholder="CloudScale Inc"
                    value={candidateCompany}
                    onChange={e => setCandidateCompany(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Experience (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={candidateExp}
                    onChange={e => setCandidateExp(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddCandidateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add to ATS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connected 1-Click Hire & Onboard Handover Modal */}
      {showHireModal && hiringCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6 animate-scale-in border-2 border-emerald-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Handover Candidate to Onboarding
                </h3>
                <span className="text-xs text-emerald-600 font-semibold">
                  Connected Phase 1 & 2 Workflow Integration
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Converting <strong>{hiringCandidate.full_name}</strong> will provision their unique Employee ID, active user credentials, and default IT/HR onboarding checklist automatically.
            </p>

            <form onSubmit={handleHireAndOnboard} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Department *</label>
                  <select
                    required
                    value={hireDeptId}
                    onChange={e => setHireDeptId(Number(e.target.value))}
                    className="input"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Designation Title</label>
                  <select
                    value={hireDesigId}
                    onChange={e => setHireDesigId(Number(e.target.value))}
                    className="input"
                  >
                    <option value="">Select Designation...</option>
                    {designations.map(des => (
                      <option key={des.id} value={des.id}>{des.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Official Joining Date *</label>
                  <input
                    type="date"
                    required
                    value={hireDate}
                    onChange={e => setHireDate(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Starting Annual CTC ($) *</label>
                  <input
                    type="number"
                    required
                    value={hireSalary}
                    onChange={e => setHireSalary(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowHireModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 font-bold"
                >
                  <Check className="w-4 h-4" /> Provision Employee Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showInterviewModal && interviewCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Schedule Interview</h3>
            <p className="text-xs text-slate-500 mb-4">
              Schedule technical assessment or hiring manager round for {interviewCandidate.full_name}.
            </p>
            <form onSubmit={handleScheduleInterview} className="space-y-4">
              <div>
                <label className="label">Round Title *</label>
                <input
                  type="text"
                  required
                  value={interviewRound}
                  onChange={e => setInterviewRound(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={interviewTime}
                  onChange={e => setInterviewTime(e.target.value)}
                  className="input"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInterviewModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex items-center gap-2">
                  <Send className="w-4 h-4" /> Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
