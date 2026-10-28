import React from 'react';
import {
  CalendarDays,
  MessageSquare,
  Sparkles,
  Briefcase,
  Brain,
  Code2,
  Heart,
  CheckSquare,
  BookOpen,
  History,
  Settings,
  Lock,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';
import { UserProfile, AIState, LifeMode } from '../../types';

export type NavTab =
  | 'today'
  | 'chat'
  | 'modes'
  | 'projects'
  | 'memory'
  | 'coder'
  | 'journal'
  | 'tasks'
  | 'knowledge'
  | 'audit'
  | 'settings';

interface Props {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  profile: UserProfile;
  aiState: AIState;
  activeMode: LifeMode;
  onLockApp: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  profile,
  aiState,
  activeMode,
  onLockApp,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const navItems = [
    { id: 'today' as NavTab, label: 'Today & Briefing', icon: CalendarDays, badge: 'Daily' },
    { id: 'chat' as NavTab, label: 'Chat Assistant', icon: MessageSquare },
    { id: 'modes' as NavTab, label: 'Life Modes', icon: Sparkles, badge: '10' },
    { id: 'projects' as NavTab, label: 'Projects & Notes', icon: Briefcase },
    { id: 'memory' as NavTab, label: 'Memory Engine', icon: Brain },
    { id: 'coder' as NavTab, label: 'Master Coder', icon: Code2, badge: 'IDE' },
    { id: 'journal' as NavTab, label: 'Mood & Journal', icon: Heart },
    { id: 'tasks' as NavTab, label: 'Tasks & Goals', icon: CheckSquare },
    { id: 'knowledge' as NavTab, label: 'Knowledge (RAG)', icon: BookOpen },
    { id: 'audit' as NavTab, label: 'Audit Activity', icon: History },
    { id: 'settings' as NavTab, label: 'Privacy & Profile', icon: Settings },
  ];

  const getStateColor = (state: AIState) => {
    switch (state) {
      case 'listening': return 'bg-emerald-400 shadow-emerald-400/50';
      case 'processing': return 'bg-amber-400 shadow-amber-400/50 animate-ping';
      case 'speaking': return 'bg-cyan-400 shadow-cyan-400/50';
      default: return 'bg-indigo-400 shadow-indigo-400/50';
    }
  };

  const getStateText = (state: AIState) => {
    switch (state) {
      case 'listening': return 'Listening...';
      case 'processing': return 'Thinking...';
      case 'speaking': return 'Speaking';
      default: return 'Online';
    }
  };

  const handleNavClick = (id: NavTab) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen z-50 flex flex-col bg-[#0B0F17]/95 md:bg-[#0B0F17]/80 backdrop-blur-xl border-r border-white/5 transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative shrink-0 w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Zap className="w-5 h-5 text-white" />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0B0F17] ${getStateColor(aiState)} shadow-sm`} />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  KYRIOS <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-500/20 text-indigo-400">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 truncate">Intelligence. Control.</span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Ephemeral Private Mode Alert if active */}
        {profile.privateMode && !isCollapsed && (
          <div className="mx-3 mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-300">
            <EyeOff className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Private Mode: Ephemeral session</span>
          </div>
        )}

        {/* Current Life Mode Indicator */}
        {!isCollapsed && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-xs font-semibold text-slate-300 truncate">Mode:</span>
              <span className="text-xs font-bold text-indigo-400 truncate">{activeMode.name}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {getStateText(aiState)}
            </span>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom User Profile & Lock Card */}
        <div className="p-3 border-t border-white/5">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-white truncate">{profile.name}</span>
                  <span className="text-[10px] text-slate-400 truncate">Friend: {profile.friendTone}</span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={onLockApp}
                title="Lock workspace"
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
