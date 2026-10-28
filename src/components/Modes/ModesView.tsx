import React, { useState } from 'react';
import { LifeMode } from '../../types';
import { INITIAL_LIFE_MODES } from '../../constants/lifeModes';
import { StorageService } from '../../services/storage';
import {
  Sparkles,
  HeartHandshake,
  Code2,
  Briefcase,
  GraduationCap,
  Activity,
  CircleDollarSign,
  Home,
  Compass,
  Plus,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface Props {
  activeMode: LifeMode;
  onSelectMode: (mode: LifeMode) => void;
  onNavigateToChat: () => void;
}

export const ModesView: React.FC<Props> = ({
  activeMode,
  onSelectMode,
  onNavigateToChat,
}) => {
  const [customModes, setCustomModes] = useState<LifeMode[]>(StorageService.getCustomModes());
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customTagline, setCustomTagline] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  const allModes = [...INITIAL_LIFE_MODES, ...customModes];

  const getIcon = (name: string) => {
    switch (name) {
      case 'HeartHandshake': return HeartHandshake;
      case 'Code2': return Code2;
      case 'Briefcase': return Briefcase;
      case 'GraduationCap': return GraduationCap;
      case 'Activity': return Activity;
      case 'CircleDollarSign': return CircleDollarSign;
      case 'Home': return Home;
      case 'Sparkles': return Sparkles;
      case 'Compass': return Compass;
      default: return Sparkles;
    }
  };

  const handleCreateCustomMode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newMode: LifeMode = {
      id: 'custom-' + Date.now(),
      name: customName.trim(),
      tagline: customTagline.trim() || 'Custom AI Assistant persona',
      iconName: 'Sparkles',
      color: 'from-indigo-500 to-cyan-500',
      systemPrompt: customPrompt.trim() || `You are an AI assistant in ${customName} mode.`,
      isCustom: true
    };

    StorageService.addCustomMode(newMode);
    setCustomModes(StorageService.getCustomModes());
    onSelectMode(newMode);
    setCustomName('');
    setCustomTagline('');
    setCustomPrompt('');
    setShowAddCustom(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Versatile Digital Partner</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">10 Specialized Life Modes</h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl">
            Switch KYRIOS's specialized focus instantly. Every mode shares your verified personal memory while adapting tone, tools, and expertise.
          </p>
        </div>

        <button
          onClick={() => setShowAddCustom(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Custom Mode</span>
        </button>
      </div>

      {/* Grid of Modes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allModes.map((mode) => {
          const IconComponent = getIcon(mode.iconName);
          const isSelected = activeMode.id === mode.id;

          return (
            <div
              key={mode.id}
              onClick={() => onSelectMode(mode)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#141C30] border-indigo-500/60 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/50'
                  : 'bg-[#111827]/70 border-white/5 hover:border-white/15 hover:bg-[#111827]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${mode.color} flex items-center justify-center text-white shadow-md`}>
                    <IconComponent className="w-5 h-5" />
                  </div>

                  {isSelected && (
                    <span className="flex items-center gap-1 text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-base text-white">{mode.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{mode.tagline}</p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  {mode.isCustom ? 'Custom Mode' : 'Built-in Mode'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMode(mode);
                    onNavigateToChat();
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  Start Chat <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Mode Modal */}
      {showAddCustom && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Create Custom Life Mode
            </h3>
            <form onSubmit={handleCreateCustomMode} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Mode Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Startup Pitch Coach or Novelist"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Tagline</label>
                <input
                  type="text"
                  placeholder="Short 1-line mission"
                  value={customTagline}
                  onChange={(e) => setCustomTagline(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">System Instructions</label>
                <textarea
                  rows={4}
                  required
                  placeholder="How should KYRIOS act and what guidelines should it follow in this mode?"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustom(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  Save Mode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
