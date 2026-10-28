/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  Message,
  TaskItem,
  Project,
  Habit,
  Memory,
  DocumentItem,
  LifeMode,
  AIState,
  ProposedAction
} from './types';
import { StorageService } from './services/storage';
import { INITIAL_LIFE_MODES } from './constants/lifeModes';
import { Sidebar, NavTab } from './components/Navigation/Sidebar';
import { TodayView } from './components/Home/TodayView';
import { ChatView } from './components/Chat/ChatView';
import { ModesView } from './components/Modes/ModesView';
import { ProjectsView } from './components/Projects/ProjectsView';
import { MemoryView } from './components/Memory/MemoryView';
import { CoderView } from './components/Coder/CoderView';
import { JournalView } from './components/Journal/JournalView';
import { TasksView } from './components/Tasks/TasksView';
import { KnowledgeView } from './components/Knowledge/KnowledgeView';
import { AuditLogView } from './components/Audit/AuditLogView';
import { SettingsView } from './components/Settings/SettingsView';
import { QuickCaptureModal } from './components/Modals/QuickCaptureModal';
import { AppLockModal } from './components/Modals/AppLockModal';
import {
  Menu,
  Zap,
  Lock,
  Plus
} from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getProfile());
  const [activeTab, setActiveTab] = useState<NavTab>('today');
  const [activeMode, setActiveMode] = useState<LifeMode>(INITIAL_LIFE_MODES[0]);
  const [aiState, setAiState] = useState<AIState>('idle');
  const [messages, setMessages] = useState<Message[]>(() => StorageService.getMessages());
  const [tasks, setTasks] = useState<TaskItem[]>(() => StorageService.getTasks());
  const [projects, setProjects] = useState<Project[]>(() => StorageService.getProjects());
  const [habits, setHabits] = useState<Habit[]>(() => StorageService.getHabits());
  const [memories, setMemories] = useState<Memory[]>(() => StorageService.getMemories());
  const [documents, setDocuments] = useState<DocumentItem[]>(() => StorageService.getDocuments());

  // UI state
  const [isLocked, setIsLocked] = useState<boolean>(() => !!profile.appPin);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState<boolean>(false);
  const [initialPrompt, setInitialPrompt] = useState<string>('');

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsQuickCaptureOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsQuickCaptureOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Action execution when approved in Chat
  const handleExecuteApprovedAction = (action: ProposedAction) => {
    if (action.type === 'task') {
      StorageService.addTask({
        title: action.data.title || action.title,
        completed: false,
        priority: action.data.priority || 'medium',
        dueDate: action.data.dueDate || undefined,
        category: action.data.category || activeMode.name
      });
      setTasks(StorageService.getTasks());
    } else if (action.type === 'memory') {
      StorageService.addMemory({
        category: action.data.category || 'preference',
        text: action.data.fact || action.title,
        importance: action.data.importance || 'normal',
      });
      setMemories(StorageService.getMemories());
    } else if (action.type === 'note') {
      const projs = StorageService.getProjects();
      if (projs.length > 0) {
        projs[0].notes.unshift({
          id: 'note-' + Date.now(),
          title: action.data.title || action.title,
          content: action.data.content || '',
          createdAt: new Date().toISOString()
        });
        StorageService.saveProjects(projs);
        setProjects(projs);
      }
    } else if (action.type === 'reminder') {
      StorageService.addTask({
        title: `⏰ Reminder: ${action.data.title || action.title}`,
        completed: false,
        priority: 'high',
        dueDate: action.data.time || undefined,
        category: 'Reminder'
      });
      setTasks(StorageService.getTasks());
    }

    StorageService.logAction(
      action.type,
      `User approved & executed: "${action.title}"`,
      'approved',
      action.data
    );
  };

  const handleToggleTask = (id: string) => {
    StorageService.toggleTask(id);
    setTasks(StorageService.getTasks());
  };

  const handleToggleHabit = (id: string) => {
    StorageService.toggleHabitToday(id);
    setHabits(StorageService.getHabits());
  };

  const handleNavigateToChat = (prompt?: string) => {
    if (prompt) {
      setInitialPrompt(prompt);
    }
    setActiveTab('chat');
  };

  const refreshAllState = () => {
    setTasks(StorageService.getTasks());
    setProjects(StorageService.getProjects());
    setMemories(StorageService.getMemories());
    setHabits(StorageService.getHabits());
    setDocuments(StorageService.getDocuments());
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F1F5F9] flex flex-col md:flex-row relative selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* App Lock Screen Overlay */}
      {isLocked && profile.appPin && (
        <AppLockModal
          isLocked={isLocked}
          correctPin={profile.appPin}
          onUnlock={() => setIsLocked(false)}
          userName={profile.name}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        aiState={aiState}
        activeMode={activeMode}
        onLockApp={() => setIsLocked(true)}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Top App Bar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0B0F17]/90 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm text-white tracking-tight">KYRIOS AI</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              {activeMode.name}
            </span>
            {profile.appPin && (
              <button
                onClick={() => setIsLocked(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* View Routing */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activeTab === 'today' && (
            <TodayView
              profile={profile}
              tasks={tasks}
              projects={projects}
              habits={habits}
              onToggleTask={handleToggleTask}
              onToggleHabit={handleToggleHabit}
              onNavigateToChat={handleNavigateToChat}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {activeTab === 'chat' && (
            <ChatView
              messages={messages}
              setMessages={setMessages}
              profile={profile}
              activeMode={activeMode}
              aiState={aiState}
              setAiState={setAiState}
              onExecuteApprovedAction={handleExecuteApprovedAction}
              initialPrompt={initialPrompt}
              onClearInitialPrompt={() => setInitialPrompt('')}
            />
          )}

          {activeTab === 'modes' && (
            <ModesView
              activeMode={activeMode}
              onSelectMode={(mode) => setActiveMode(mode)}
              onNavigateToChat={() => setActiveTab('chat')}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              setProjects={setProjects}
              onNavigateToChat={handleNavigateToChat}
            />
          )}

          {activeTab === 'memory' && (
            <MemoryView
              memories={memories}
              setMemories={setMemories}
              profile={profile}
              setProfile={setProfile}
            />
          )}

          {activeTab === 'coder' && (
            <CoderView />
          )}

          {activeTab === 'journal' && (
            <JournalView onNavigateToChat={handleNavigateToChat} />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              setTasks={setTasks}
              onToggleTask={handleToggleTask}
            />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgeView
              documents={documents}
              setDocuments={setDocuments}
              onNavigateToChat={handleNavigateToChat}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogView />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              profile={profile}
              setProfile={setProfile}
              onLockApp={() => setIsLocked(true)}
            />
          )}
        </main>
      </div>

      {/* Global Quick Capture Overlay Modal */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onRefresh={refreshAllState}
      />

      {/* Global Floating Quick-Capture FAB button */}
      {activeTab !== 'chat' && (
        <button
          onClick={() => setIsQuickCaptureOpen(true)}
          className="fixed bottom-24 right-6 z-30 p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-2xl shadow-indigo-600/50 flex items-center gap-2 border border-indigo-400/30 transition-all group"
          title="Quick Capture (Cmd+K)"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200" />
          <span className="hidden sm:inline text-xs font-semibold pr-1">Quick Capture</span>
        </button>
      )}
    </div>
  );
}
