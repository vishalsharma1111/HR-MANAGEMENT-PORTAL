import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  Server,
  TrendingUp,
  Cpu,
  CheckCircle2,
  FileCode,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ModelMetadata {
  version: string;
  checksum_sha256: string;
  model_type: string;
  approval_status: string;
  is_production: boolean;
  metrics: {
    accuracy: number;
    majority_class_baseline_accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    confusion_matrix: number[][];
  };
  training_config: Record<string, any>;
  dataset_provenance: Record<string, any>;
}

interface PredictionResult {
  model_version: string;
  prediction: number;
  attrition_risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  confidence_score: number;
  top_contributing_factors: string[];
  latency_ms: number;
  decision_support_disclaimer: string;
  evaluated_at: string;
}

interface DriftReport {
  inferences_analyzed: number;
  drift_status: string;
  drifted_features_count: number;
  interpretation: string;
  performance_degradation_note: string;
  feature_drift_reports: Array<{
    feature: string;
    type: string;
    baseline_mean: number;
    live_mean: number;
    pct_change: number;
    z_score_deviation: number;
    has_drift: boolean;
  }>;
}

export const AttritionPredictorPage: React.FC = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'predict' | 'registry' | 'drift'>('predict');

  // Metadata & Health
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
  const [modelList, setModelList] = useState<ModelMetadata[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [driftData, setDriftData] = useState<DriftReport | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    age: 32,
    department: 'Software Engineering',
    job_role: 'Senior Software Engineer',
    monthly_income: 9200,
    distance_from_home: 14,
    education_level: 3,
    environment_satisfaction: 3,
    job_satisfaction: 3,
    work_life_balance: 2,
    performance_rating: 3,
    overtime: 'Yes',
    total_working_years: 8,
    years_at_company: 3,
    years_in_current_role: 2,
    years_since_last_promotion: 1,
    years_with_curr_manager: 2,
    num_companies_worked: 2,
    stock_option_level: 1,
    training_times_last_year: 3
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Retraining State
  const [retrainVersion, setRetrainVersion] = useState('v1.1.0');
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchMetadata();
    fetchHealth();
    fetchModelList();
    fetchDrift();
  }, [token]);

  const fetchMetadata = async () => {
    try {
      const res = await fetch('/api/ml/model/metadata', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setMetadata(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/ml/model/health');
      if (res.ok) setHealthData(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchModelList = async () => {
    try {
      const res = await fetch('/api/ml/models', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setModelList(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDrift = async () => {
    try {
      const res = await fetch('/api/ml/monitoring/drift', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setDriftData(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ml/predict/attrition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Inference execution failed');
      }

      const data: PredictionResult = await res.json();
      setResult(data);
      fetchHealth();
      fetchDrift();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (presetType: 'strained' | 'stable' | 'junior') => {
    if (presetType === 'strained') {
      setFormData({
        age: 31,
        department: 'Software Engineering',
        job_role: 'Senior Software Engineer',
        monthly_income: 6200,
        distance_from_home: 28,
        education_level: 3,
        environment_satisfaction: 1,
        job_satisfaction: 1,
        work_life_balance: 1,
        performance_rating: 3,
        overtime: 'Yes',
        total_working_years: 7,
        years_at_company: 3,
        years_in_current_role: 3,
        years_since_last_promotion: 3,
        years_with_curr_manager: 1,
        num_companies_worked: 3,
        stock_option_level: 0,
        training_times_last_year: 1
      });
    } else if (presetType === 'stable') {
      setFormData({
        age: 46,
        department: 'Software Engineering',
        job_role: 'Engineering Director',
        monthly_income: 18500,
        distance_from_home: 8,
        education_level: 4,
        environment_satisfaction: 4,
        job_satisfaction: 4,
        work_life_balance: 3,
        performance_rating: 4,
        overtime: 'No',
        total_working_years: 22,
        years_at_company: 12,
        years_in_current_role: 5,
        years_since_last_promotion: 1,
        years_with_curr_manager: 5,
        num_companies_worked: 2,
        stock_option_level: 2,
        training_times_last_year: 4
      });
    } else {
      setFormData({
        age: 24,
        department: 'Finance & Payroll',
        job_role: 'Financial Analyst',
        monthly_income: 4800,
        distance_from_home: 12,
        education_level: 2,
        environment_satisfaction: 3,
        job_satisfaction: 3,
        work_life_balance: 3,
        performance_rating: 3,
        overtime: 'No',
        total_working_years: 2,
        years_at_company: 1,
        years_in_current_role: 1,
        years_since_last_promotion: 0,
        years_with_curr_manager: 1,
        num_companies_worked: 1,
        stock_option_level: 0,
        training_times_last_year: 5
      });
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainSuccess(null);
    try {
      const res = await fetch('/api/ml/retrain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ version: retrainVersion, auto_promote: false })
      });
      if (res.ok) {
        setRetrainSuccess(`Retraining completed! Candidate ${retrainVersion} registered in model registry.`);
        fetchModelList();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRetraining(false);
    }
  };

  const handlePromote = async (version: string) => {
    try {
      const res = await fetch(`/api/ml/models/${version}/promote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchMetadata();
        fetchModelList();
        fetchHealth();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRollback = async (version: string) => {
    try {
      const res = await fetch(`/api/ml/models/${version}/rollback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchMetadata();
        fetchModelList();
        fetchHealth();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const canManageModels = ['Super Admin', 'HR Manager'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
              <Cpu className="w-3 h-3" /> Scikit-Learn Production Artifact
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Active: {metadata?.version || 'v1.0.0'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Workforce Attrition Analytics & ML Governance</h1>
          <p className="text-sm text-slate-300">
            Empirical turnover risk scoring, feature attribution drivers, baseline drift detection, and versioned artifact registry.
          </p>
        </div>

        {healthData && (
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs">
            <div>
              <div className="text-slate-400">Total Inferences</div>
              <div className="text-lg font-bold text-white">{healthData.total_predictions}</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <div className="text-slate-400">Avg Latency</div>
              <div className="text-lg font-bold text-emerald-400">{healthData.average_latency_ms} ms</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('predict')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'predict'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BrainCircuit className="w-4 h-4" /> Turnover Risk Assessor
        </button>
        <button
          onClick={() => setActiveTab('registry')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'registry'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" /> Model Registry & Artifacts
        </button>
        <button
          onClick={() => setActiveTab('drift')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'drift'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" /> Operational Drift & Health
        </button>
      </div>

      {/* Tab 1: Predictor & Simulator */}
      {activeTab === 'predict' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Employee Attributes & Telemetry</h3>
                <p className="text-xs text-slate-500">Provide verified operational metrics to compute attrition likelihood</p>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('strained')}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 hover:bg-red-100 transition"
                  title="Overworked with low satisfaction"
                >
                  Strained Profile
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('stable')}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100 transition"
                  title="Senior executive with high compensation"
                >
                  Stable Profile
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('junior')}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 transition"
                >
                  Junior Associate
                </button>
              </div>
            </div>

            <form onSubmit={handlePredict} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Age</label>
                  <input
                    type="number"
                    min={18}
                    max={75}
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Finance & Payroll">Finance & Payroll</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Product Management">Product Management</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Role</label>
                  <input
                    type="text"
                    value={formData.job_role}
                    onChange={(e) => setFormData({ ...formData, job_role: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Monthly Gross Pay ($)</label>
                  <input
                    type="number"
                    step={100}
                    value={formData.monthly_income}
                    onChange={(e) => setFormData({ ...formData, monthly_income: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Commute Distance (Miles)</label>
                  <input
                    type="number"
                    value={formData.distance_from_home}
                    onChange={(e) => setFormData({ ...formData, distance_from_home: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Overtime Active</label>
                  <select
                    value={formData.overtime}
                    onChange={(e) => setFormData({ ...formData, overtime: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="No">No Overtime</option>
                    <option value="Yes">Yes (Active Overtime)</option>
                  </select>
                </div>
              </div>

              {/* Sliders for sentiment ratings */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Workplace Sentiment Survey Metrics (1: Low to 4: High)</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Job Satisfaction</span>
                      <span className="font-bold">{formData.job_satisfaction} / 4</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={4}
                      value={formData.job_satisfaction}
                      onChange={(e) => setFormData({ ...formData, job_satisfaction: Number(e.target.value) })}
                      className="w-full accent-brand-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Work-Life Balance</span>
                      <span className="font-bold">{formData.work_life_balance} / 4</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={4}
                      value={formData.work_life_balance}
                      onChange={(e) => setFormData({ ...formData, work_life_balance: Number(e.target.value) })}
                      className="w-full accent-brand-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Environment Score</span>
                      <span className="font-bold">{formData.environment_satisfaction} / 4</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={4}
                      value={formData.environment_satisfaction}
                      onChange={(e) => setFormData({ ...formData, environment_satisfaction: Number(e.target.value) })}
                      className="w-full accent-brand-600"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Total Career Yrs</label>
                  <input
                    type="number"
                    value={formData.total_working_years}
                    onChange={(e) => setFormData({ ...formData, total_working_years: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Company Tenure</label>
                  <input
                    type="number"
                    value={formData.years_at_company}
                    onChange={(e) => setFormData({ ...formData, years_at_company: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Yrs In Current Role</label>
                  <input
                    type="number"
                    value={formData.years_in_current_role}
                    onChange={(e) => setFormData({ ...formData, years_in_current_role: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Yrs Since Promo</label>
                  <input
                    type="number"
                    value={formData.years_since_last_promotion}
                    onChange={(e) => setFormData({ ...formData, years_since_last_promotion: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Execute Live Attrition Model Inference
              </button>
            </form>
          </div>

          {/* Results Output */}
          <div className="lg:col-span-5 space-y-4">
            {result ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Model Evaluation Output
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Lat: {result.latency_ms} ms
                  </span>
                </div>

                {/* Score Gauge */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Turnover Risk Probability</div>
                  <div className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {(result.attrition_risk_score * 100).toFixed(1)}%
                  </div>

                  <div className="mt-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        result.risk_level === 'High'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                          : result.risk_level === 'Medium'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {result.risk_level} Attrition Risk
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full mt-4 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        result.risk_level === 'High'
                          ? 'bg-red-500'
                          : result.risk_level === 'Medium'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, result.attrition_risk_score * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Top Contributing Factors */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Feature Attributions</h4>
                  <div className="space-y-2">
                    {result.top_contributing_factors.map((factor, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 border border-slate-100 dark:border-slate-700/50"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-brand-500 flex-shrink-0 mt-0.5" />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance Disclaimer */}
                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-300 text-xs flex gap-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Decision Support Mandatory Notice:</strong> {result.decision_support_disclaimer}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center text-slate-400 space-y-3">
                <BrainCircuit className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Inference Output Pending</div>
                <p className="text-xs max-w-xs">
                  Fill in employee telemetry attributes and click Execute to run the live model pipeline.
                </p>
              </div>
            )}

            {/* Model Card Quick Info */}
            {metadata && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                  <span className="flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-brand-500" /> Loaded Production Pipeline
                  </span>
                  <span className="font-mono text-brand-600 dark:text-brand-400">{metadata.version}</span>
                </div>
                <div className="text-slate-500 flex items-center justify-between">
                  <span>Algorithm</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{metadata.model_type}</span>
                </div>
                <div className="text-slate-500 flex items-center justify-between">
                  <span>Holdout ROC-AUC</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{metadata.metrics.roc_auc.toFixed(4)}</span>
                </div>
                <div className="text-slate-500 flex items-center justify-between">
                  <span>Baseline Accuracy</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {(metadata.metrics.majority_class_baseline_accuracy * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono truncate" title={metadata.checksum_sha256}>
                    SHA256: {metadata.checksum_sha256.substring(0, 24)}...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Model Registry & Artifacts */}
      {activeTab === 'registry' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Versioned Artifact Registry</h3>
              <p className="text-xs text-slate-500">Inspect model versions, SHA-256 checksums, holdout evaluation metrics, and promotion status.</p>
            </div>

            {canManageModels && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={retrainVersion}
                  onChange={(e) => setRetrainVersion(e.target.value)}
                  className="px-3 py-1.5 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 w-24"
                />
                <button
                  type="button"
                  onClick={handleRetrain}
                  disabled={retraining}
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                >
                  {retraining ? <RotateCcw className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3" />}
                  Train Candidate
                </button>
              </div>
            )}
          </div>

          {retrainSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{retrainSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {modelList.map((model) => (
              <div
                key={model.version}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4 ${
                  model.is_production
                    ? 'border-brand-500/50 ring-1 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-base text-slate-900 dark:text-white">{model.version}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        model.approval_status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : model.approval_status === 'CANDIDATE'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {model.approval_status}
                    </span>
                    {model.is_production && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                        Active Production
                      </span>
                    )}
                  </div>

                  {canManageModels && !model.is_production && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePromote(model.version)}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
                      >
                        Promote to Production
                      </button>
                      <button
                        onClick={() => handleRollback(model.version)}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition"
                      >
                        Rollback
                      </button>
                    </div>
                  )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-slate-400">ROC-AUC</div>
                    <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {model.metrics.roc_auc.toFixed(4)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-slate-400">F1 Score</div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {model.metrics.f1_score.toFixed(4)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-slate-400">Recall</div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {(model.metrics.recall * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-slate-400">Precision</div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {(model.metrics.precision * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-slate-400">Baseline Acc</div>
                    <div className="text-base font-bold text-slate-500">
                      {(model.metrics.majority_class_baseline_accuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between text-xs text-slate-500 gap-1 font-mono pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>SHA-256: {model.checksum_sha256}</span>
                  <span>Type: {model.model_type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Drift & Monitoring */}
      {activeTab === 'drift' && (
        <div className="space-y-6">
          {driftData ? (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          driftData.drift_status === 'STABLE'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        Status: {driftData.drift_status}
                      </span>
                      <span className="text-xs text-slate-400">
                        Evaluated {driftData.inferences_analyzed} live inferences
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{driftData.interpretation}</p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-xs rounded-xl border border-blue-200 dark:border-blue-800/50 flex gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{driftData.performance_degradation_note}</p>
                </div>
              </div>

              {/* Drift Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-semibold text-sm text-slate-900 dark:text-white">
                  Baseline vs Live Feature Distribution Comparison
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Feature Name</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Baseline Mean</th>
                        <th className="py-3 px-4">Live Mean</th>
                        <th className="py-3 px-4">% Shift</th>
                        <th className="py-3 px-4">Z-Deviation</th>
                        <th className="py-3 px-4">Drift Alert</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {driftData.feature_drift_reports.map((row) => (
                        <tr key={row.feature} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{row.feature}</td>
                          <td className="py-3 px-4 text-slate-500 uppercase">{row.type}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{row.baseline_mean}</td>
                          <td className="py-3 px-4 text-slate-900 dark:text-white font-semibold">{row.live_mean}</td>
                          <td className="py-3 px-4 font-mono">{row.pct_change}%</td>
                          <td className="py-3 px-4 font-mono">{row.z_score_deviation} σ</td>
                          <td className="py-3 px-4">
                            {row.has_drift ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                DRIFT DETECTED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                Nominal
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-sm">
              Loading monitoring drift metrics...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
