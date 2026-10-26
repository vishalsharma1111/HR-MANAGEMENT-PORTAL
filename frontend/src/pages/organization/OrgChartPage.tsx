import React, { useEffect, useState } from 'react';
import { GitFork, ChevronDown, ChevronRight, User, Building2, Mail, Users } from 'lucide-react';
import { api } from '../../services/api';
import { OrgChartNode } from '../../types';

interface TreeNodeProps {
  node: OrgChartNode;
  level?: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level = 0 }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div className="relative group">
        <div className="w-64 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-brand-500/50 transition-all text-left">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                {node.name.split(' ').map(n => n.charAt(0)).join('')}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {node.name}
                </div>
                <div className="text-[11px] font-medium text-brand-600 dark:text-brand-400 truncate">
                  {node.title}
                </div>
              </div>
            </div>

            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" title={node.status}></span>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{node.department}</span>
            </span>
            <span className="font-mono text-slate-500 font-semibold">{node.employee_id}</span>
          </div>

          {/* Children Toggle Pill */}
          {hasChildren && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1 transition"
            >
              <span>{node.children.length}</span>
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Children connector lines */}
      {hasChildren && expanded && (
        <div className="flex flex-col items-center mt-6">
          <div className="w-0.5 h-6 bg-slate-200 dark:bg-slate-800"></div>
          <div className="flex items-start gap-8 relative pt-4">
            {node.children.length > 1 && (
              <div className="absolute top-0 left-32 right-32 h-0.5 bg-slate-200 dark:bg-slate-800"></div>
            )}
            {node.children.map((child) => (
              <div key={child.id} className="relative flex flex-col items-center">
                <div className="w-0.5 h-4 bg-slate-200 dark:bg-slate-800 absolute -top-4"></div>
                <TreeNode node={child} level={level + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const OrgChartPage: React.FC = () => {
  const [roots, setRoots] = useState<OrgChartNode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChart = async () => {
    try {
      setLoading(true);
      const data = await api.getOrgChart();
      setRoots(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChart();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <GitFork className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <span>Interactive Organization Chart</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Hierarchical reporting structure from executive management down through department direct reports.
        </p>
      </div>

      {/* Canvas */}
      <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 overflow-x-auto min-h-[500px] flex items-center justify-center">
        {loading ? (
          <div className="text-xs text-slate-400 animate-pulse">Building organization graph...</div>
        ) : roots.length === 0 ? (
          <div className="text-xs text-slate-400">No organizational hierarchy records available.</div>
        ) : (
          <div className="flex flex-col items-center gap-12 py-6">
            {roots.map((root) => (
              <TreeNode key={root.id} node={root} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
