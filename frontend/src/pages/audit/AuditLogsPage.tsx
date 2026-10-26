import React, { useEffect, useState } from 'react';
import { ShieldAlert, Search, Filter, ShieldCheck, Clock, User, Globe } from 'lucide-react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs(100);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!filterType) return true;
    return l.entity_type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Immutable Governance & Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tamper-evident log of authentication events, employee records mutations, and security operations.
          </p>
        </div>

        {/* Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300"
        >
          <option value="">All Entity Types</option>
          <option value="USER">User & Auth</option>
          <option value="EMPLOYEE">Employee Record</option>
          <option value="DEPARTMENT">Department</option>
          <option value="DOCUMENT">Document Vault</option>
          <option value="ASSET">Asset Register</option>
          <option value="ONBOARDING">Onboarding Lifecycle</option>
        </select>
      </div>

      {/* Audit Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">Loading compliance ledger...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No audit log records match filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details / Description</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {filteredLogs.map((log) => {
                  const isCreate = log.action === 'CREATE';
                  const isDelete = log.action === 'DELETE';
                  const isLogin = log.action === 'LOGIN';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-sans whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-white">{log.actor_email}</div>
                        <div className="text-[10px] text-brand-600 dark:text-brand-400 font-mono">{log.actor_role}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isCreate
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : isDelete
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : isLogin
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                        {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-300 max-w-md truncate">
                        {log.details || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
