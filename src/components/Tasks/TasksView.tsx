import React, { useState } from 'react';
import { TaskItem, Priority } from '../../types';
import { StorageService } from '../../services/storage';
import {
  CheckSquare,
  Circle,
  CheckCircle2,
  Plus,
  Trash2,
  Calendar,
  Filter,
  Check
} from 'lucide-react';

interface Props {
  tasks: TaskItem[];
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  onToggleTask: (id: string) => void;
}

export const TasksView: React.FC<Props> = ({
  tasks,
  setTasks,
  onToggleTask,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newCategory, setNewCategory] = useState('work');

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending' && t.completed) return false;
    if (filter === 'completed' && !t.completed) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    StorageService.addTask({
      title: newTitle.trim(),
      completed: false,
      priority: newPriority,
      dueDate: newDueDate || undefined,
      category: newCategory
    });

    setTasks(StorageService.getTasks());
    setNewTitle('');
    setNewDueDate('');
    setShowAddModal(false);
  };

  const handleDeleteTask = (id: string) => {
    StorageService.deleteTask(id);
    setTasks(StorageService.getTasks());
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <CheckSquare className="w-4 h-4" />
            <span>Productivity & Execution</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Tasks & Focus Goals</h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl">
            Prioritize high-impact deliverables. KYRIOS proposes tasks during conversations and awaits your explicit approval.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#111827]/60 border border-white/5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'pending' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({tasks.filter(t => !t.completed).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'completed' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({tasks.filter(t => t.completed).length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({tasks.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#0B0F17] border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-[#111827]/40 border border-white/5 text-slate-400 text-xs">
            No tasks match this filter. Create one to stay ahead!
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                task.completed
                  ? 'bg-white/[0.02] border-white/5 text-slate-500 line-through'
                  : 'bg-[#111827]/70 border-white/5 hover:border-indigo-500/30 text-white'
              }`}
            >
              <div
                onClick={() => onToggleTask(task.id)}
                className="flex items-center gap-3.5 flex-1 cursor-pointer min-w-0"
              >
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-500 hover:text-indigo-400 shrink-0" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">{task.title}</span>
                  {task.dueDate && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Due {task.dueDate}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                  task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300' :
                  task.priority === 'high' ? 'bg-amber-500/20 text-amber-300' :
                  task.priority === 'medium' ? 'bg-blue-500/20 text-blue-300' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {task.priority}
                </span>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-400" />
              Create Focus Task
            </h3>
            <form onSubmit={handleAddTask} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement isolated code execution testing"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
