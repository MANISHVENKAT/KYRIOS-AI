import React, { useState } from 'react';
import { StorageService } from '../../services/storage';
import { Priority, MemoryCategory } from '../../types';
import {
  Zap,
  CheckSquare,
  FileText,
  Brain,
  Lightbulb,
  X,
  Check
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const QuickCaptureModal: React.FC<Props> = ({ isOpen, onClose, onRefresh }) => {
  const [captureType, setCaptureType] = useState<'task' | 'note' | 'memory' | 'idea'>('task');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (captureType === 'task') {
      StorageService.addTask({
        title: title.trim(),
        completed: false,
        priority,
        dueDate: dueDate || undefined,
        category: 'Quick Capture'
      });
    } else if (captureType === 'note') {
      const projects = StorageService.getProjects();
      if (projects.length > 0) {
        projects[0].notes.unshift({
          id: 'note-' + Date.now(),
          title: title.trim(),
          content: content.trim() || title.trim(),
          createdAt: new Date().toISOString()
        });
        StorageService.saveProjects(projects);
      }
    } else if (captureType === 'memory') {
      StorageService.addMemory({
        category: 'preference' as MemoryCategory,
        text: title.trim(),
        importance: 'normal',
      });
    } else if (captureType === 'idea') {
      StorageService.addMemory({
        category: 'workflow' as MemoryCategory,
        text: `Idea: ${title.trim()} ${content ? '- ' + content.trim() : ''}`,
        importance: 'normal',
      });
    }

    setSavedSuccess(true);
    onRefresh();
    setTimeout(() => {
      setSavedSuccess(false);
      setTitle('');
      setContent('');
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Global Quick Capture</h3>
              <p className="text-[10px] text-slate-400">Instantly save a thought or action</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Capture Type Switcher */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setCaptureType('task')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              captureType === 'task' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Task</span>
          </button>

          <button
            type="button"
            onClick={() => setCaptureType('note')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              captureType === 'note' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Note</span>
          </button>

          <button
            type="button"
            onClick={() => setCaptureType('memory')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              captureType === 'memory' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Memory</span>
          </button>

          <button
            type="button"
            onClick={() => setCaptureType('idea')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              captureType === 'idea' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Idea</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {captureType === 'task' ? 'Task Title' :
               captureType === 'note' ? 'Note Subject' :
               captureType === 'memory' ? 'Fact or Preference to Remember' :
               'Idea Summary'}
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder="What's on your mind?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {(captureType === 'note' || captureType === 'idea') && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Details (optional)</label>
              <textarea
                rows={3}
                placeholder="Expand on this thought..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {captureType === 'task' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <span className="text-[11px] text-slate-500">Press Enter to save</span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savedSuccess}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  savedSuccess ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Captured!
                  </>
                ) : (
                  'Capture'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
