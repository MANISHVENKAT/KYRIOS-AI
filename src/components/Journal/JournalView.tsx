import React, { useState } from 'react';
import { MoodEntry } from '../../types';
import { StorageService } from '../../services/storage';
import {
  Heart,
  Smile,
  Calendar,
  Sparkles,
  Send,
  MessageSquare
} from 'lucide-react';

interface Props {
  onNavigateToChat: (prompt: string) => void;
}

export const JournalView: React.FC<Props> = ({ onNavigateToChat }) => {
  const [entries, setEntries] = useState<MoodEntry[]>(StorageService.getMoodEntries());
  const [selectedScore, setSelectedScore] = useState<number>(5);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('⚡');
  const [moodLabel, setMoodLabel] = useState<string>('Energized & Clear');
  const [gratitude, setGratitude] = useState<string>('');
  const [reflection, setReflection] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];

  const moodPresets = [
    { emoji: '⚡', label: 'Energized & Focused', score: 5 },
    { emoji: '🌿', label: 'Calm & Grounded', score: 4 },
    { emoji: '🎨', label: 'Inspired & Creative', score: 4 },
    { emoji: '💭', label: 'Reflective & Thoughtful', score: 3 },
    { emoji: '😴', label: 'Tired / Low Energy', score: 2 },
    { emoji: '🌧️', label: 'Struggling / Overwhelmed', score: 1 },
  ];

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const created = StorageService.addMoodEntry({
      date: todayStr,
      emoji: selectedEmoji,
      moodLabel: moodLabel,
      score: selectedScore,
      gratitudeNote: gratitude || undefined,
      reflection: reflection || undefined,
    });

    setEntries(StorageService.getMoodEntries());
    setGratitude('');
    setReflection('');
    alert('Journal entry saved! KYRIOS has noted this for gentle reflection.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-pink-400 text-xs font-semibold uppercase tracking-wider">
            <Heart className="w-4 h-4" />
            <span>Emotional Awareness & Reflection</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Mood & Life Journal</h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl">
            Check in with your feelings, log moments of daily gratitude, and look back on your personal journey with honesty and empathy.
          </p>
        </div>

        <button
          onClick={() => onNavigateToChat('I want to do a heartfelt weekly reflection on how I have been feeling and what I learned.')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/30 text-pink-300 text-xs font-semibold shadow-md transition-all self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Reflect with Friend</span>
        </button>
      </div>

      {/* Daily Check-in Form */}
      <div className="p-6 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Smile className="w-5 h-5 text-indigo-400" />
          How are you feeling today?
        </h2>

        {/* Mood Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {moodPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setSelectedEmoji(preset.emoji);
                setMoodLabel(preset.label);
                setSelectedScore(preset.score);
              }}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                moodLabel === preset.label
                  ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-lg shadow-indigo-950/40'
                  : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.05]'
              }`}
            >
              <span className="text-2xl">{preset.emoji}</span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold truncate">{preset.label}</span>
                <span className="text-[10px] text-slate-500">Score {preset.score}/5</span>
              </div>
            </button>
          ))}
        </div>

        {/* Gratitude & Reflection Fields */}
        <form onSubmit={handleSaveEntry} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Gratitude Spark ✨ What is one thing you appreciate today?
            </label>
            <input
              type="text"
              placeholder="e.g. Quiet morning coffee, solving a tough bug, supportive conversation with a teammate"
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Reflections & Free Thoughts 💭
            </label>
            <textarea
              rows={3}
              placeholder="What went well? What challenged you? Any thoughts you want to get out of your head?"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="w-full bg-[#0B0F17] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Save Entry</span>
            </button>
          </div>
        </form>
      </div>

      {/* Previous Entries Timeline */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
          Recent Journal History ({entries.length})
        </h3>
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="p-4 rounded-2xl bg-[#111827]/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{entry.emoji}</span>
                  <span className="text-xs font-bold text-white">{entry.moodLabel}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
                    Energy: {entry.score}/5
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {entry.date}
                </span>
              </div>

              {entry.gratitudeNote && (
                <div className="text-xs text-indigo-300 bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-500/20">
                  <span className="font-semibold text-indigo-200">Grateful for:</span> {entry.gratitudeNote}
                </div>
              )}

              {entry.reflection && (
                <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap pl-1">
                  {entry.reflection}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
