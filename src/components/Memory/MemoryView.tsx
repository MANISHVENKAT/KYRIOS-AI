import React, { useState } from 'react';
import { Memory, MemoryCategory, UserProfile } from '../../types';
import { StorageService } from '../../services/storage';
import {
  Brain,
  Pin,
  Trash2,
  Edit2,
  Plus,
  Search,
  Filter,
  Check,
  EyeOff,
  Download,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface Props {
  memories: Memory[];
  setMemories: React.Dispatch<React.SetStateAction<Memory[]>>;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const MemoryView: React.FC<Props> = ({
  memories,
  setMemories,
  profile,
  setProfile,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // New memory form
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('preference');
  const [newImportance, setNewImportance] = useState<'normal' | 'high'>('normal');

  const categories: { id: string; label: string; count: number }[] = [
    { id: 'all', label: 'All Memories', count: memories.length },
    { id: 'preference', label: 'Preferences', count: memories.filter(m => m.category === 'preference').length },
    { id: 'personal_fact', label: 'Personal Facts', count: memories.filter(m => m.category === 'personal_fact').length },
    { id: 'project_decision', label: 'Decisions', count: memories.filter(m => m.category === 'project_decision').length },
    { id: 'workflow', label: 'Workflows', count: memories.filter(m => m.category === 'workflow').length },
    { id: 'instruction', label: 'Instructions', count: memories.filter(m => m.category === 'instruction').length },
  ];

  const filteredMemories = memories.filter(m => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch = !search || m.text.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTogglePin = (id: string) => {
    StorageService.togglePinMemory(id);
    setMemories(StorageService.getMemories());
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this memory permanently? KYRIOS will no longer recall it.')) {
      StorageService.deleteMemory(id);
      setMemories(StorageService.getMemories());
    }
  };

  const handleStartEdit = (m: Memory) => {
    setEditingId(m.id);
    setEditText(m.text);
  };

  const handleSaveEdit = (id: string) => {
    const updated = memories.map(m => m.id === id ? { ...m, text: editText, updatedAt: new Date().toISOString() } : m);
    StorageService.saveMemories(updated);
    setMemories(updated);
    setEditingId(null);
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    StorageService.addMemory({
      category: newCategory,
      text: newText.trim(),
      importance: newImportance,
      pinned: false
    });

    setMemories(StorageService.getMemories());
    setNewText('');
    setShowAddModal(false);
  };

  const handleTogglePrivateMode = () => {
    const updated = { ...profile, privateMode: !profile.privateMode };
    StorageService.saveProfile(updated);
    setProfile(updated);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Brain className="w-4 h-4" />
            <span>Sovereign Knowledge Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Long-Term Memory</h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl">
            KYRIOS remembers your verified preferences and project decisions. You maintain total sovereignty: inspect, edit, pin, or delete anything anytime.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleTogglePrivateMode}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              profile.privateMode
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
            title="Ephemeral mode prevents saving chats and memories"
          >
            <EyeOff className="w-4 h-4" />
            <span>Private Mode: {profile.privateMode ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Memory</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memories..."
            className="w-full bg-[#111827]/80 border border-white/5 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Memories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMemories.length === 0 ? (
          <div className="col-span-full text-center py-12 rounded-2xl bg-[#111827]/40 border border-white/5 text-slate-400 text-xs">
            No memories match your query. Add one or converse with KYRIOS to auto-extract facts!
          </div>
        ) : (
          filteredMemories.map((m) => (
            <div
              key={m.id}
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                m.pinned
                  ? 'bg-[#141C30]/90 border-indigo-500/30 shadow-md'
                  : 'bg-[#111827]/70 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="space-y-2">
                {/* Card Top */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    m.category === 'preference' ? 'bg-indigo-500/20 text-indigo-300' :
                    m.category === 'personal_fact' ? 'bg-cyan-500/20 text-cyan-300' :
                    m.category === 'project_decision' ? 'bg-emerald-500/20 text-emerald-300' :
                    'bg-purple-500/20 text-purple-300'
                  }`}>
                    {m.category.replace('_', ' ')}
                  </span>

                  <button
                    onClick={() => handleTogglePin(m.id)}
                    className={`p-1 rounded-md transition-colors ${
                      m.pinned ? 'text-indigo-400 hover:text-indigo-300' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title={m.pinned ? 'Unpin from high priority' : 'Pin for all prompts'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${m.pinned ? 'fill-indigo-400' : ''}`} />
                  </button>
                </div>

                {/* Card Text or Editing */}
                {editingId === m.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-[#0B0F17] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 rounded text-[11px] bg-white/5 text-slate-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(m.id)}
                        className="px-2 py-1 rounded text-[11px] bg-indigo-600 text-white font-medium flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">{m.text}</p>
                )}
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-[10px] text-slate-500">
                <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(m)}
                    className="p-1 rounded hover:bg-white/10 hover:text-slate-200 transition-colors"
                    title="Edit text"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-1 rounded hover:bg-white/10 hover:text-rose-400 transition-colors"
                    title="Delete memory"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                Add Permanent Memory
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="preference">User Preference (tools, style, formatting)</option>
                  <option value="personal_fact">Personal Fact (goals, background, likes)</option>
                  <option value="project_decision">Project Decision (architectural decisions)</option>
                  <option value="workflow">Workflow & Routine</option>
                  <option value="instruction">Permanent Custom Instruction</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Fact or Instruction</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Always generate Dockerfile and tsconfig with clean inline comments."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="imp"
                    checked={newImportance === 'high'}
                    onChange={(e) => setNewImportance(e.target.checked ? 'high' : 'normal')}
                    className="rounded text-indigo-600 focus:ring-0 bg-[#0B0F17]"
                  />
                  <label htmlFor="imp" className="text-xs text-slate-300">High priority memory</label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-semibold"
                  >
                    Save Memory
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
