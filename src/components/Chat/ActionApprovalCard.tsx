import React, { useState } from 'react';
import { ProposedAction } from '../../types';
import { Check, X, Edit3, ShieldAlert, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface Props {
  action: ProposedAction;
  onApprove: (action: ProposedAction) => void;
  onReject: (actionId: string) => void;
  onEdit: (updatedAction: ProposedAction) => void;
}

export const ActionApprovalCard: React.FC<Props> = ({
  action,
  onApprove,
  onReject,
  onEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(action.title);
  const [editedDetails, setEditedDetails] = useState(JSON.stringify(action.data, null, 2));

  const handleSaveEdit = () => {
    try {
      const parsedData = JSON.parse(editedDetails);
      onEdit({
        ...action,
        title: editedTitle,
        data: parsedData,
        status: 'edited'
      });
      setIsEditing(false);
    } catch {
      alert('Invalid JSON in action details');
    }
  };

  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case 'task': return 'Create Task';
      case 'note': return 'Save Project Note';
      case 'memory': return 'Commit to Long-Term Memory';
      case 'reminder': return 'Schedule Reminder';
      case 'code_scaffold': return 'Generate Code Scaffolding';
      default: return 'Proposed Action';
    }
  };

  return (
    <div className={`my-3 p-4 rounded-xl border transition-all duration-200 ${
      action.status === 'approved'
        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100'
        : action.status === 'rejected'
        ? 'bg-rose-950/20 border-rose-500/30 text-rose-200 opacity-60'
        : 'bg-[#131B2E]/90 border-indigo-500/40 shadow-lg shadow-indigo-950/30'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            action.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
            action.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
            'bg-amber-500/20 text-amber-400 animate-pulse'
          }`}>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              {getActionTypeLabel(action.type)}
            </span>
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
              Action Proposal
            </span>
          </div>
        </div>

        <div>
          {action.status === 'approved' && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Executed
            </span>
          )}
          {action.status === 'rejected' && (
            <span className="flex items-center gap-1 text-xs text-rose-400 font-medium">
              <XCircle className="w-3.5 h-3.5" /> Rejected by User
            </span>
          )}
          {action.status === 'pending' && (
            <span className="text-xs text-amber-300 font-medium flex items-center gap-1">
              Awaiting Approval
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-2 mt-2">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Title / Action summary</label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full bg-[#0B0F17] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Parameters (JSON)</label>
            <textarea
              rows={4}
              value={editedDetails}
              onChange={(e) => setEditedDetails(e.target.value)}
              className="w-full bg-[#0B0F17] border border-white/10 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="font-medium text-sm text-white mb-1.5 flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            {action.title}
          </div>

          {action.data && Object.keys(action.data).length > 0 && (
            <div className="bg-black/30 rounded-lg p-2.5 text-xs text-slate-300 space-y-1 font-mono border border-white/5">
              {Object.entries(action.data).map(([k, v]) => (
                <div key={k} className="flex flex-wrap gap-1">
                  <span className="text-slate-400 font-semibold">{k}:</span>
                  <span className="text-indigo-200 break-words">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons if pending */}
          {action.status === 'pending' && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
              <button
                onClick={() => onApprove(action)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <Check className="w-3.5 h-3.5" /> Approve & Execute
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => onReject(action.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium transition-colors ml-auto"
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
