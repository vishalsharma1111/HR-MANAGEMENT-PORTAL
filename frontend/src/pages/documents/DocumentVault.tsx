import React, { useEffect, useState } from 'react';
import { FileText, Upload, Download, Trash2, Plus, X, Shield, Lock, Eye } from 'lucide-react';
import { api } from '../../services/api';
import { DocumentItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const DocumentVault: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'policies' | 'personnel'>('policies');

  // Upload modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('POLICY');
  const [employeeId, setEmployeeId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.getDocuments({
        policiesOnly: tab === 'policies'
      });
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [tab]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('is_company_policy', tab === 'policies' ? 'true' : 'false');
      if (tab === 'personnel' && employeeId) {
        formData.append('employee_id', employeeId);
      }
      formData.append('file', file);

      await api.uploadDocument(formData);
      setModalOpen(false);
      setTitle('');
      setFile(null);
      fetchDocuments();
    } catch (err: any) {
      setError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this document from the vault?')) return;
    try {
      await api.deleteDocument(id);
      fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleDownload = (docId: number) => {
    const token = localStorage.getItem('token');
    window.open(`/api/documents/${docId}/download?token=${token}`, '_blank');
  };

  const canManage = ['Super Admin', 'HR Manager'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Secure Document Vault & Policy Library</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Encrypted storage repository for company policies, contracts, ID proofs, and compliance records.
          </p>
        </div>

        <button
          onClick={() => {
            setCategory(tab === 'policies' ? 'POLICY' : 'CONTRACT');
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-bold">
        <button
          onClick={() => setTab('policies')}
          className={`py-2 px-3 border-b-2 transition ${
            tab === 'policies'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Company Policies & Handbooks
        </button>
        <button
          onClick={() => setTab('personnel')}
          className={`py-2 px-3 border-b-2 transition ${
            tab === 'personnel'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Personnel Records & Contracts
        </button>
      </div>

      {/* Documents Grid / Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">Scanning secure vault...</div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">No documents found</div>
            <p className="text-xs text-slate-400">Upload a policy document or confidential personnel file to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">File Name & Size</th>
                  {tab === 'personnel' && <th className="py-3 px-4">Associated Employee</th>}
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-500" />
                      <span>{doc.title}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {doc.file_name} ({Math.round(doc.file_size / 1024)} KB)
                    </td>
                    {tab === 'personnel' && (
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {doc.employee_name || `Employee #${doc.employee_id}`}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-slate-500">
                      {doc.uploaded_by || 'HR Admin'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleDownload(doc.id)}
                        className="px-2.5 py-1 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                      {canManage && (
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="px-2.5 py-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Upload Secure Document</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-4 space-y-3 text-xs">
              {error && <div className="p-2 bg-red-50 text-red-600 rounded-lg">{error}</div>}
              <div>
                <label className="block font-semibold mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Employee Handbook 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="POLICY">Policy Document</option>
                  <option value="CONTRACT">Employment Contract</option>
                  <option value="ID_PROOF">Identity Proof</option>
                  <option value="CERTIFICATE">Certificate / Training</option>
                  <option value="PAYSLIP">Salary / Compensation</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {tab === 'personnel' && (
                <div>
                  <label className="block font-semibold mb-1">Target Employee ID #</label>
                  <input
                    type="number"
                    placeholder="e.g. 4 or 10"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Select File *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 dark:file:bg-brand-950 dark:file:text-brand-300 hover:file:bg-brand-100"
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
                  disabled={uploading}
                  className="px-4 py-1.5 bg-brand-600 text-white font-bold rounded-xl"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
