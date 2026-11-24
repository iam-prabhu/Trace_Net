import { useState } from 'react';
import { X, Briefcase, Plus } from 'lucide-react';
import type { Investigation } from '../../types/investigation.types';

interface CreateInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Investigation>) => Promise<void>;
  initialAccount?: string;
}

export function CreateInvestigationModal({
  isOpen,
  onClose,
  onSubmit,
  initialAccount = '',
}: CreateInvestigationModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [assignedTo, setAssignedTo] = useState('Marcus Vance');
  const [accountIds, setAccountIds] = useState(initialAccount ? initialAccount : 'ACC-101');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description: `${description} [Associated Accounts: ${accountIds}]`,
        assignedTo,
        status: 'open',
      });
      onClose();
    } catch (err) {
      console.error('Failed to create investigation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Create New Investigation Case</h3>
              <p className="text-xs text-slate-400">Initialize a collaborative financial crime dossier</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Case Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Circular Routing Ring - ACC-101 Layering Cluster"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Dossier Narrative & Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline suspected AML typologies, structuring methods, or illicit counterparties..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="critical">Critical (Immediate Escalation)</option>
                <option value="high">High (SAR Required)</option>
                <option value="medium">Medium (Standard Triage)</option>
                <option value="low">Low (Routine Review)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Assigned Investigator</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="Sarah Lin">Sarah Lin (Lead Investigator)</option>
                <option value="Marcus Vance">Marcus Vance (Senior Analyst)</option>
                <option value="Dave Miller">Dave Miller (Fraud Specialist)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Initial Seed Account IDs (comma-separated)
            </label>
            <input
              type="text"
              value={accountIds}
              onChange={(e) => setAccountIds(e.target.value)}
              placeholder="e.g. ACC-101, ACC-102, ACC-103"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 !text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/25 transition cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              <Plus className="w-4 h-4 !text-white shrink-0" />
              <span className="!text-white font-bold">{isSubmitting ? 'Creating Case...' : 'Create Case Dossier'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
