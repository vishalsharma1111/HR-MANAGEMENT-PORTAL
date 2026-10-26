import React, { useEffect, useState } from 'react';
import { Laptop, Plus, X, Search, User, CheckCircle2, RotateCcw } from 'lucide-react';
import { api } from '../../services/api';
import { Asset } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AssetManagement: React.FC = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState('LAPTOP');
  const [serialNumber, setSerialNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const data = await api.getAssets({
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
      });
      setAssets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [categoryFilter, statusFilter]);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createAsset({
        name: assetName,
        category: assetCategory,
        serial_number: serialNumber || undefined,
        notes: notes || undefined,
        status: 'AVAILABLE'
      });
      setModalOpen(false);
      setAssetName('');
      setSerialNumber('');
      setNotes('');
      fetchAssets();
    } catch (err: any) {
      alert(err.message || 'Failed to register asset');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnAsset = async (asset: Asset) => {
    if (!window.confirm(`Mark ${asset.name} (${asset.asset_tag}) as returned to IT inventory?`)) return;
    try {
      await api.updateAsset(asset.id, {
        assigned_to_employee_id: 0 // clears assignment
      });
      fetchAssets();
    } catch (err: any) {
      alert(err.message || 'Return action failed');
    }
  };

  const canManage = ['Super Admin', 'IT Administrator', 'HR Manager'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Laptop className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Asset Inventory & Assignments</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Enterprise hardware tags, laptops, monitors, security tokens, and return records.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Register Asset</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300"
        >
          <option value="">All Categories</option>
          <option value="LAPTOP">Laptops</option>
          <option value="MONITOR">Monitors</option>
          <option value="ACCESSORY">Accessories & Tokens</option>
          <option value="MOBILE">Mobile</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="RETIRED">Retired</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">Loading asset register...</div>
        ) : assets.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No assets registered under current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Asset Tag</th>
                  <th className="py-3 px-4">Device Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned To</th>
                  {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {asset.asset_tag}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {asset.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">
                        {asset.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {asset.serial_number || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          asset.status === 'AVAILABLE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : asset.status === 'ASSIGNED'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {asset.assigned_employee_name ? (
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{asset.assigned_employee_name} ({asset.assigned_employee_code})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="py-3.5 px-4 text-right">
                        {asset.status === 'ASSIGNED' && (
                          <button
                            onClick={() => handleReturnAsset(asset)}
                            className="px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg font-semibold transition inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Return</span>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Asset Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Register Hardware Asset</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateAsset} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Asset Model / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dell XPS 15 9530"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="LAPTOP">Laptop</option>
                    <option value="MONITOR">Monitor</option>
                    <option value="ACCESSORY">Accessory / Key</option>
                    <option value="MOBILE">Mobile</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Serial Number</label>
                  <input
                    type="text"
                    placeholder="e.g. SN-88910"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Notes / Specifications</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="32GB RAM, 1TB SSD..."
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
                  {submitting ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
