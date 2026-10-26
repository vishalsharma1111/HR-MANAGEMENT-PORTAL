import React, { useState, useEffect } from 'react';
import { 
  Award, CheckCircle, AlertCircle, 
  Plus, BookOpen, Heart, RefreshCw, Send, Target
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Goal, Course, PeerRecognition, PerformanceCycle } from '../../types';

export const PerformancePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'goals' | 'courses' | 'kudos'>('goals');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [goals, setGoals] = useState<Goal[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recognitions, setRecognitions] = useState<PeerRecognition[]>([]);
  const [cycles, setCycles] = useState<PerformanceCycle[]>([]);

  // Modals
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showKudosModal, setShowKudosModal] = useState(false);

  // Goal Form State
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState<'INDIVIDUAL' | 'TEAM' | 'COMPANY'>('INDIVIDUAL');
  const [goalWeightage, setGoalWeightage] = useState(25);
  const [goalTarget, setGoalTarget] = useState('');

  // Kudos Form State
  const [kudosBadge, setKudosBadge] = useState('Team Player');
  const [kudosMessage, setKudosMessage] = useState('');
  const [kudosReceiverId, setKudosReceiverId] = useState<number>(4); // Default to Alex Chen or staff

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [g, c, r, cyc] = await Promise.all([
        api.getGoals().catch(() => []),
        api.getCourses().catch(() => []),
        api.getRecognitions().catch(() => []),
        api.getPerformanceCycles().catch(() => [])
      ]);
      setGoals(g);
      setCourses(c);
      setRecognitions(r);
      setCycles(cyc);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateGoalProgress = async (goalId: number, newProgress: number) => {
    try {
      const status = newProgress >= 100 ? 'COMPLETED' : (newProgress < 30 ? 'BEHIND' : 'ON_TRACK');
      await api.updateGoal(goalId, { progress: newProgress, status });
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, progress: newProgress, status } : g));
      setSuccess('Goal progress updated successfully.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update progress');
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || cycles.length === 0) return;

    try {
      await api.createGoal({
        cycle_id: cycles[0].id,
        title: goalTitle,
        category: goalCategory,
        weightage: goalWeightage,
        target_metric: goalTarget,
        progress: 0,
        status: 'ON_TRACK'
      });
      setSuccess('New OKR goal added to current review cycle.');
      setShowGoalModal(false);
      setGoalTitle('');
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create goal');
    }
  };

  const handleEnrollCourse = async (courseId: number) => {
    try {
      await api.enrollCourse(courseId);
      setSuccess('Successfully enrolled in training course! Check your learning path.');
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Course enrollment failed');
    }
  };

  const handleGiveKudos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kudosMessage) return;

    try {
      await api.giveRecognition({
        receiver_id: kudosReceiverId,
        badge: kudosBadge,
        message: kudosMessage
      });
      setSuccess('Peer kudos badge shared on the company recognition wall!');
      setShowKudosModal(false);
      setKudosMessage('');
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to share kudos');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Performance, Goals & Learning</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Objectives & Key Results (OKRs), corporate learning curriculum, and peer recognition culture.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGoalModal(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Goal
          </button>
          <button
            onClick={() => setShowKudosModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Heart className="w-4 h-4 text-pink-300" /> Give Kudos
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

      {/* Active Review Cycle Banner */}
      {cycles.length > 0 && (
        <div className="p-4 rounded-xl border border-primary-200 dark:border-primary-900/40 bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-950/20 dark:to-indigo-950/20 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Active Evaluation Cycle
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {cycles[0].title}
            </h3>
            <p className="text-xs text-slate-500">
              Evaluation Window: {cycles[0].start_date} to {cycles[0].end_date} • 360 Self & Peer Appraisals Open
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full text-xs font-bold self-start sm:self-auto">
            {cycles[0].status}
          </span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6">
        <button
          onClick={() => setActiveTab('goals')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'goals'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Target className="w-4 h-4" />
          Goals & OKRs ({goals.length})
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'courses'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Learning Academy ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('kudos')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'kudos'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Heart className="w-4 h-4" />
          Kudos & Peer Recognition ({recognitions.length})
        </button>
      </div>

      {/* Tab 1: Goals & OKRs */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(goal => (
            <div key={goal.id} className="card p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    goal.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : goal.status === 'BEHIND'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                  }`}>
                    {goal.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Weightage: {goal.weightage}%
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                  {goal.title}
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Category: <span className="font-medium text-slate-700 dark:text-slate-300">{goal.category}</span>
                  {goal.target_metric && ` • Target: ${goal.target_metric}`}
                </p>

                {/* Progress bar and slider */}
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-primary-600 dark:text-primary-400">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        goal.progress >= 100 ? 'bg-emerald-500' : 'bg-primary-500'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Update Slider */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <span className="text-xs text-slate-400 whitespace-nowrap">Slide to update:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={goal.progress}
                  onChange={e => handleUpdateGoalProgress(goal.id, Number(e.target.value))}
                  className="w-full accent-primary-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Learning Courses */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course.id} className="card p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {course.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {course.duration_hours} Hours
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-4">
                  {course.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400">By {course.instructor}</span>
                <button
                  onClick={() => handleEnrollCourse(course.id)}
                  className="btn btn-sm btn-primary text-xs py-1 px-3"
                >
                  Enroll Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Kudos Wall */}
      {activeTab === 'kudos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recognitions.map(rec => (
            <div key={rec.id} className="card p-6 bg-gradient-to-br from-white to-pink-50/20 dark:from-slate-800 dark:to-pink-950/10 border-pink-100 dark:border-pink-950/30">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-xl bg-pink-100 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300">
                    {rec.badge}
                  </span>
                </div>
              </div>

              <p className="text-sm italic text-slate-700 dark:text-slate-300 mb-4">
                "{rec.message}"
              </p>

              <div className="pt-3 border-t border-pink-100 dark:border-slate-700/60 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900 dark:text-white">{rec.receiver_name}</span>
                <span className="text-slate-400">From {rec.giver_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Create Performance Goal / OKR</h3>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="label">Goal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Migrate Core Monolith to Event Architecture"
                  value={goalTitle}
                  onChange={e => setGoalTitle(e.target.value)}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select
                    value={goalCategory}
                    onChange={e => setGoalCategory(e.target.value as 'INDIVIDUAL' | 'TEAM' | 'COMPANY')}
                    className="input"
                  >
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="TEAM">Team</option>
                    <option value="COMPANY">Company</option>
                  </select>
                </div>
                <div>
                  <label className="label">Weightage (%)</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={goalWeightage}
                    onChange={e => setGoalWeightage(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Target Key Result Metric</label>
                <input
                  type="text"
                  placeholder="e.g. 100% services migrated, 99.99% uptime"
                  value={goalTarget}
                  onChange={e => setGoalTarget(e.target.value)}
                  className="input"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Objective
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Give Kudos Modal */}
      {showKudosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Recognize a Colleague</h3>
            <p className="text-xs text-slate-500 mb-4">Send a public kudos badge for outstanding teamwork.</p>
            <form onSubmit={handleGiveKudos} className="space-y-4">
              <div>
                <label className="label">Recognition Badge</label>
                <select
                  value={kudosBadge}
                  onChange={e => setKudosBadge(e.target.value)}
                  className="input"
                >
                  <option value="Team Player">Team Player</option>
                  <option value="Innovator">Innovator</option>
                  <option value="Customer Hero">Customer Hero</option>
                  <option value="Problem Solver">Problem Solver</option>
                </select>
              </div>
              <div>
                <label className="label">Appreciation Message *</label>
                <textarea
                  required
                  rows={3}
                  value={kudosMessage}
                  onChange={e => setKudosMessage(e.target.value)}
                  placeholder="What did they do that was extraordinary?"
                  className="input"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowKudosModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex items-center gap-2">
                  <Send className="w-4 h-4" /> Share Kudos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
