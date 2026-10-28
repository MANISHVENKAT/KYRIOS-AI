import React, { useState } from 'react';
import { Project, ProjectNote } from '../../types';
import { StorageService } from '../../services/storage';
import {
  Briefcase,
  Plus,
  Clock,
  Tag,
  CheckCircle2,
  FileText,
  Sparkles,
  ChevronRight,
  Trash2,
  Calendar
} from 'lucide-react';

interface Props {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  onNavigateToChat: (prompt: string) => void;
}

export const ProjectsView: React.FC<Props> = ({
  projects,
  setProjects,
  onNavigateToChat,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [showAddProject, setShowAddProject] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newTag, setNewTag] = useState('');

  // Add note inside project
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = StorageService.addProject({
      title: newTitle.trim(),
      description: newDesc.trim(),
      status: 'active',
      tags: newTag ? newTag.split(',').map(t => t.trim()) : ['General'],
      deadline: newDeadline || undefined,
      notes: [],
      taskIds: []
    });

    setProjects(StorageService.getProjects());
    setSelectedProjectId(created.id);
    setNewTitle('');
    setNewDesc('');
    setNewDeadline('');
    setNewTag('');
    setShowAddProject(false);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !currentProject) return;

    const newNote: ProjectNote = {
      id: 'note-' + Date.now(),
      title: noteTitle.trim(),
      content: noteContent.trim(),
      createdAt: new Date().toISOString()
    };

    const updated = projects.map(p => {
      if (p.id === currentProject.id) {
        return { ...p, notes: [newNote, ...p.notes] };
      }
      return p;
    });

    StorageService.saveProjects(updated);
    setProjects(updated);
    setNoteTitle('');
    setNoteContent('');
    setShowAddNote(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Briefcase className="w-4 h-4" />
            <span>Project Intelligence</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Projects & Knowledge Hub</h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl">
            Track milestones, organize architectural notes, and prompt KYRIOS to synthesize progress or plan next steps.
          </p>
        </div>

        <button
          onClick={() => setShowAddProject(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Main Grid: Projects List & Selected Project Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Projects Selector */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block px-1">
            Active Projects ({projects.length})
          </span>
          <div className="space-y-2">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedProjectId === p.id
                    ? 'bg-indigo-600/20 border-indigo-500/60 shadow-lg shadow-indigo-950/30'
                    : 'bg-[#111827]/70 border-white/5 hover:border-white/10 hover:bg-[#111827]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-white">{p.title}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-2">{p.description}</p>
                {p.deadline && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3 text-indigo-400" />
                    <span>Due {p.deadline}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Selected Project Detail */}
        {currentProject && (
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                <div>
                  <h2 className="text-xl font-bold text-white">{currentProject.title}</h2>
                  <p className="text-xs text-slate-300 mt-1">{currentProject.description}</p>
                </div>

                <button
                  onClick={() => onNavigateToChat(`Summarize progress and suggest next strategic action items for project: "${currentProject.title}"`)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all self-start"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Project Review</span>
                </button>
              </div>

              {/* Tags & Meta */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {currentProject.tags.map((tag, idx) => (
                  <span key={idx} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/5">
                    <Tag className="w-3 h-3 text-indigo-400" />
                    <span>{tag}</span>
                  </span>
                ))}
                {currentProject.deadline && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    <Clock className="w-3 h-3" />
                    <span>Deadline: {currentProject.deadline}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className="p-6 rounded-2xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Project Notes & Decisions</h3>
                </div>
                <button
                  onClick={() => setShowAddNote(true)}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Note
                </button>
              </div>

              {currentProject.notes.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No notes saved in this project yet. Add notes or ask KYRIOS to propose one during chat.
                </div>
              ) : (
                <div className="space-y-3">
                  {currentProject.notes.map((note) => (
                    <div key={note.id} className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white">{note.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              Create New Project
            </h3>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NextGen Microservice Architecture"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Objective / Description</label>
                <textarea
                  rows={3}
                  placeholder="Goals, target milestones, and key deliverables"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Deadline (optional)</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="AI, FullStack"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProject(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Add Project Note
            </h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="Decision / Meeting / Architecture Note"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Key findings, decisions made, or reference snippets"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddNote(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
