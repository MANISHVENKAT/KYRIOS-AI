import React, { useState, useEffect } from 'react';
import { UserProfile, TaskItem, Project, Habit, MoodEntry } from '../../types';
import { StorageService } from '../../services/storage';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Flame,
  ArrowRight,
  RefreshCw,
  Plus,
  Clock,
  Compass,
  MessageSquare,
  AlertCircle,
  Calendar,
  Heart,
  Smile,
  Send,
  Check,
  TrendingUp,
  FileText
} from 'lucide-react';

interface Props {
  profile: UserProfile;
  tasks: TaskItem[];
  projects: Project[];
  habits: Habit[];
  onToggleTask: (id: string) => void;
  onToggleHabit: (id: string) => void;
  onNavigateToChat: (initialPrompt?: string) => void;
  onOpenQuickCapture: () => void;
}

export const TodayView: React.FC<Props> = ({
  profile,
  tasks,
  projects,
  habits,
  onToggleTask,
  onToggleHabit,
  onNavigateToChat,
  onOpenQuickCapture
}) => {
  const [briefing, setBriefing] = useState<string>('');
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState<boolean>(false);

  // Journal Check-in state
  const todayStr = new Date().toISOString().split('T')[0];
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>(() => StorageService.getMoodEntries());
  const todayJournal = moodHistory.find(m => m.date === todayStr);

  const [selectedMood, setSelectedMood] = useState<string>(todayJournal?.moodLabel || 'Energized');
  const [selectedEmoji, setSelectedEmoji] = useState<string>(todayJournal?.emoji || '⚡');
  const [selectedScore, setSelectedScore] = useState<number>(todayJournal?.score || 5);
  const [gratitudeText, setGratitudeText] = useState<string>(todayJournal?.gratitudeNote || '');
  const [reflectionText, setReflectionText] = useState<string>(todayJournal?.reflection || '');
  const [journalSaved, setJournalSaved] = useState<boolean>(!!todayJournal);

  // Inline Quick Task Add
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState<string>('');
  const [quickTaskPriority, setQuickTaskPriority] = useState<TaskItem['priority']>('high');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayTasks = tasks.filter(t => !t.dueDate || t.dueDate <= todayStr);
  const completedTodayTasks = todayTasks.filter(t => t.completed).length;
  const pendingUrgentTasks = tasks.filter(t => !t.completed && (t.priority === 'urgent' || t.priority === 'high'));

  // Calculate project deadlines
  const projectsWithDeadlines = projects.map(p => {
    let daysUntil: number | null = null;
    let isUrgent = false;
    if (p.deadline) {
      const diffMs = new Date(p.deadline).getTime() - new Date(todayStr).getTime();
      daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysUntil <= 3) isUrgent = true;
    }
    const projectTasks = tasks.filter(t => t.projectId === p.id);
    const completedCount = projectTasks.filter(t => t.completed).length;
    const progress = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;

    return { ...p, daysUntil, isUrgent, projectTasksCount: projectTasks.length, progress };
  });

  const moods = [
    { emoji: '⚡', label: 'Energized', score: 5 },
    { emoji: '🌿', label: 'Calm & Grounded', score: 4 },
    { emoji: '🎯', label: 'Hyper-focused', score: 5 },
    { emoji: '🎨', label: 'Creative', score: 4 },
    { emoji: '💭', label: 'Reflective', score: 3 },
    { emoji: '😴', label: 'Tired / Low Battery', score: 2 },
  ];

  const handleSaveJournalCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = StorageService.addMoodEntry({
      date: todayStr,
      emoji: selectedEmoji,
      moodLabel: selectedMood,
      score: selectedScore,
      gratitudeNote: gratitudeText || undefined,
      reflection: reflectionText || undefined,
    });

    setMoodHistory(StorageService.getMoodEntries());
    setJournalSaved(true);
    // Refresh briefing with new journal check-in context
    fetchBriefing();
  };

  const handleCreateQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    StorageService.addTask({
      title: quickTaskTitle.trim(),
      completed: false,
      priority: quickTaskPriority,
      dueDate: todayStr,
      category: 'Morning Focus'
    });

    setQuickTaskTitle('');
    setIsAddingTask(false);
    fetchBriefing();
  };

  const fetchBriefing = async () => {
    setIsGeneratingBriefing(true);
    try {
      const currentMoods = StorageService.getMoodEntries();
      const currentTasks = StorageService.getTasks();
      const currentProjects = StorageService.getProjects();
      const currentHabits = StorageService.getHabits();

      const res = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: currentTasks.filter(t => !t.completed).slice(0, 10),
          projects: currentProjects.map(p => ({
            title: p.title,
            deadline: p.deadline,
            status: p.status
          })),
          habits: currentHabits,
          moodHistory: currentMoods.slice(-3),
          userName: profile.name
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBriefing(data.briefing || '');
      } else {
        setBriefing(`Welcome back, ${profile.name}. Review your active tasks and upcoming deadlines below to steer your morning with clarity.`);
      }
    } catch {
      setBriefing(`Ready to tackle the day, ${profile.name}. Your morning briefing brings your live tasks, deadlines, and reflections into one clear picture.`);
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Banner Greeting */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/60 border border-indigo-500/20 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>Morning Executive Briefing • {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300">{profile.name}</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl">
              Live tasks, upcoming project deadlines, and your emotional check-in synchronized into one morning command center.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateToChat('Review my morning briefing and build an hour-by-hour strategic timeline for today.')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Discuss Strategy with Friend</span>
            </button>
            <button
              onClick={onOpenQuickCapture}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all backdrop-blur-md"
            >
              <Plus className="w-4 h-4" />
              <span>Capture (⌘K)</span>
            </button>
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
      </div>

      {/* 3-Pillar Unified Live Status Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pillar 1: Live Tasks */}
        <div className="p-4 rounded-2xl bg-[#111827]/75 border border-white/5 backdrop-blur-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Live Tasks Today</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">{completedTodayTasks}/{todayTasks.length}</span>
              <span className="text-xs text-slate-400">completed</span>
            </div>
          </div>
          <div className={`p-2.5 rounded-xl ${pendingUrgentTasks.length > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Pillar 2: Project Deadlines */}
        <div className="p-4 rounded-2xl bg-[#111827]/75 border border-white/5 backdrop-blur-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Project Deadlines</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-cyan-400">{projectsWithDeadlines.filter(p => p.deadline).length}</span>
              <span className="text-xs text-slate-400">tracked</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Pillar 3: Journal Check-in */}
        <div className="p-4 rounded-2xl bg-[#111827]/75 border border-white/5 backdrop-blur-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Morning Mood Check</span>
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedEmoji}</span>
              <span className="text-xs font-bold text-white truncate max-w-[120px]">{selectedMood}</span>
            </div>
          </div>
          <div className={`p-2.5 rounded-xl ${journalSaved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-pink-500/20 text-pink-400 animate-pulse'}`}>
            <Heart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Morning Journal Check-in & Gratitude Widget */}
      <div className="p-6 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Morning Journal & Energy Check-in</h2>
              <p className="text-xs text-slate-400">Pulls your emotional baseline into the AI morning synthesis</p>
            </div>
          </div>

          {journalSaved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Checked in for today
            </span>
          )}
        </div>

        {/* Mood Selector Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {moods.map((m) => (
            <button
              key={m.label}
              type="button"
              onClick={() => {
                setSelectedEmoji(m.emoji);
                setSelectedMood(m.label);
                setSelectedScore(m.score);
              }}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                selectedMood === m.label
                  ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                  : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.05]'
              }`}
            >
              <span className="text-lg">{m.emoji}</span>
              <span className="truncate">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Gratitude & Quick Reflection inputs */}
        <form onSubmit={handleSaveJournalCheckIn} className="space-y-3 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">
                Morning Gratitude Spark ✨ (One thing you appreciate)
              </label>
              <input
                type="text"
                placeholder="e.g. A clear mind, building new capabilities, peaceful morning tea"
                value={gratitudeText}
                onChange={(e) => setGratitudeText(e.target.value)}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">
                Mindset Intention 💭 (How do you want to show up today?)
              </label>
              <input
                type="text"
                placeholder="e.g. Focus on quality, remain calm under pressure, celebrate progress"
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-md shadow-pink-600/30 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{journalSaved ? 'Update Morning Check-in' : 'Save Morning Check-in'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Main Grid: AI Morning Briefing Synthesis (Left 2 cols) + Project Deadlines (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): AI Morning Briefing + Live Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Morning Briefing Card */}
          <div className="p-6 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">KYRIOS Synthesized Morning Briefing</h2>
                  <p className="text-xs text-slate-400">Grounded in your live tasks, deadlines, and morning energy</p>
                </div>
              </div>

              <button
                onClick={fetchBriefing}
                disabled={isGeneratingBriefing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors disabled:opacity-50"
                title="Regenerate Briefing with live data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingBriefing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            <div className="prose prose-invert max-w-none text-sm text-slate-200 leading-relaxed font-sans bg-black/30 p-5 rounded-2xl border border-white/5 whitespace-pre-line shadow-inner">
              {isGeneratingBriefing ? (
                <div className="flex items-center gap-3 py-4 text-slate-400">
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing live tasks, project deadlines, and journal check-in with Gemini...</span>
                </div>
              ) : (
                briefing || 'No briefing generated yet. Click refresh to generate.'
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Synchronized with local storage and AI orchestration
              </span>
              <button
                onClick={() => onNavigateToChat('Based on this morning briefing, what is the single most important step I should take right now?')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                Plan immediate next step <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Live Tasks Board */}
          <div className="p-6 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Live Focus Tasks Today</h2>
                <p className="text-xs text-slate-400">
                  {completedTodayTasks} of {todayTasks.length} completed
                </p>
              </div>

              <button
                onClick={() => setIsAddingTask(!isAddingTask)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Add</span>
              </button>
            </div>

            {/* Quick Add Task Form */}
            {isAddingTask && (
              <form onSubmit={handleCreateQuickTask} className="p-3.5 rounded-xl bg-[#0B0F17] border border-white/10 space-y-3">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="What needs to get done today?"
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  className="w-full bg-transparent border-b border-white/10 pb-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Priority:</span>
                    <select
                      value={quickTaskPriority}
                      onChange={(e) => setQuickTaskPriority(e.target.value as any)}
                      className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingTask(false)}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                    >
                      Add Task
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Task list */}
            <div className="space-y-2">
              {todayTasks.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  All tasks complete! Add a new task above or capture with ⌘K.
                </div>
              ) : (
                todayTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onToggleTask(t.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      t.completed
                        ? 'bg-white/[0.02] border-white/5 text-slate-500 line-through'
                        : 'bg-white/[0.04] border-white/10 text-slate-100 hover:border-indigo-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {t.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500 hover:text-indigo-400 shrink-0" />
                      )}
                      <span className="text-xs font-semibold truncate">{t.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        t.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300' :
                        t.priority === 'high' ? 'bg-amber-500/20 text-amber-300' :
                        t.priority === 'medium' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {t.priority}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Project Deadlines & Habit Streaks */}
        <div className="space-y-6">
          {/* Project Deadlines & Timelines */}
          <div className="p-6 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Project Deadlines</h2>
              </div>
              <span className="text-xs text-indigo-400 font-semibold">{projectsWithDeadlines.length} projects</span>
            </div>

            <div className="space-y-3">
              {projectsWithDeadlines.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white truncate max-w-[170px]">{p.title}</span>
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                      p.isUrgent ? 'bg-rose-500/20 text-rose-300 font-bold animate-pulse' : 'bg-white/10 text-slate-300'
                    }`}>
                      {p.daysUntil !== null ? (p.daysUntil <= 0 ? 'Due Today' : `${p.daysUntil}d left`) : p.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2">{p.description}</p>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Tasks Done</span>
                      <span className="font-mono text-cyan-300">{p.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>

                  {p.deadline && (
                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        Target: {p.deadline}
                      </span>
                      <button
                        onClick={() => onNavigateToChat(`How can I accelerate completion for "${p.title}" before the ${p.deadline} deadline?`)}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold"
                      >
                        Review →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Habit Streaks */}
          <div className="p-6 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Habit Rhythms</h2>
              </div>
              <span className="text-xs text-slate-400">Tap to toggle</span>
            </div>

            <div className="space-y-2">
              {habits.map((h) => {
                const isLogged = h.logDates.includes(todayStr);
                return (
                  <div
                    key={h.id}
                    onClick={() => onToggleHabit(h.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      isLogged
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-100'
                        : 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${isLogged ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'}`}>
                        {isLogged ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-semibold">{h.name}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{h.streak}d</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
