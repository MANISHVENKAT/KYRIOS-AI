import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { StorageService } from '../../services/storage';
import { VoiceService } from '../../services/voice';
import {
  Settings,
  User,
  Shield,
  Volume2,
  Lock,
  Download,
  Trash2,
  EyeOff,
  Check,
  Play
} from 'lucide-react';

interface Props {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onLockApp: () => void;
}

export const SettingsView: React.FC<Props> = ({
  profile,
  setProfile,
  onLockApp,
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [pinInput, setPinInput] = useState<string>(profile.appPin || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const voices = VoiceService.getVoices();
    setAvailableVoices(voices);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...formData, appPin: pinInput || undefined };
    StorageService.saveProfile(updated);
    setProfile(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleTestVoice = () => {
    VoiceService.speak(`Hello ${formData.name}! I am KYRIOS AI, your personal digital partner.`, {
      speed: formData.voiceSpeed,
      pitch: formData.voicePitch,
      voiceName: formData.preferredVoice
    });
  };

  const handleExportJSON = () => {
    const { json } = StorageService.exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kyrios-ai-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const { markdown } = StorageService.exportAllData();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kyrios-ai-summary-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleWipeAllData = () => {
    if (confirm('CRITICAL: Are you sure you want to delete ALL data permanently? All conversations, memories, projects, habits, and tasks will be erased.')) {
      if (confirm('Second confirmation: This action cannot be undone. Wipe all data now?')) {
        StorageService.wipeAllData();
        window.location.reload();
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Settings className="w-4 h-4" />
            <span>Sovereign Configuration</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Privacy, Voice & Profile</h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl">
            Tailor KYRIOS's personality, calibrate your speech engine, set up app lock, or download and export your entire workspace.
          </p>
        </div>

        {profile.appPin && (
          <button
            onClick={onLockApp}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold self-start md:self-auto"
          >
            <Lock className="w-4 h-4 text-indigo-400" />
            <span>Lock Now</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* Section 1: User & Friend Character */}
        <div className="p-6 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
            <User className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">User Identity & Friend Character</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Your Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Nickname / Call Name</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Friend Tone</label>
              <select
                value={formData.friendTone}
                onChange={(e) => setFormData({ ...formData, friendTone: e.target.value as any })}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="warm">Warm & Loyal (encouraging, empathetic)</option>
                <option value="chill">Chill & Casual (laid back, concise)</option>
                <option value="cheerful">Cheerful & Energetic (optimistic, high energy)</option>
                <option value="witty">Witty & Sharp (clever, playful banter)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Feedback Style</label>
              <select
                value={formData.feedbackStyle}
                onChange={(e) => setFormData({ ...formData, feedbackStyle: e.target.value as any })}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="gentle">Gentle (soft, supportive framing)</option>
                <option value="direct">Direct (blunt, efficient, engineering-first)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Permanent Custom Instructions</label>
            <textarea
              rows={3}
              value={formData.customInstructions}
              onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
              placeholder="e.g. Always lead with the answer. In code, provide typed tests."
              className="w-full bg-[#0B0F17] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Section 2: Voice Customization */}
        <div className="p-6 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Voice & Speech Engine</h2>
            </div>
            <button
              type="button"
              onClick={handleTestVoice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-semibold transition-all border border-cyan-500/30"
            >
              <Play className="w-3.5 h-3.5 fill-cyan-300" />
              <span>Test Voice</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Preferred Voice</label>
              <select
                value={formData.preferredVoice || ''}
                onChange={(e) => setFormData({ ...formData, preferredVoice: e.target.value })}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Default System Voice</option>
                {availableVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Speaking Speed</span>
                <span className="font-mono text-cyan-400">{formData.voiceSpeed}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.05"
                value={formData.voiceSpeed}
                onChange={(e) => setFormData({ ...formData, voiceSpeed: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Pitch</span>
                <span className="font-mono text-cyan-400">{formData.voicePitch}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.2"
                step="0.05"
                value={formData.voicePitch}
                onChange={(e) => setFormData({ ...formData, voicePitch: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 3: App Security & Lock PIN */}
        <div className="p-6 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
            <Lock className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">App Lock & Workspace Protection</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Passcode / PIN (Leave blank to disable lock)
              </label>
              <input
                type="password"
                maxLength={6}
                placeholder="e.g. 1234"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 tracking-widest"
              />
            </div>
            <p className="text-xs text-slate-400">
              When a PIN is set, KYRIOS locks the workspace when inactive or when you click the Lock button.
            </p>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex items-center justify-between">
          {saveSuccess ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Check className="w-4 h-4" /> Preferences saved successfully!
            </span>
          ) : (
            <span className="text-xs text-slate-500">All data stored locally in your browser</span>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            Save Profile & Settings
          </button>
        </div>
      </form>

      {/* Section 4: Data Export & Wipe Zone */}
      <div className="p-6 rounded-3xl bg-[#111827]/80 border border-rose-500/20 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
          <Shield className="w-5 h-5 text-rose-400" />
          <h2 className="text-base font-bold text-white">Data Sovereignty & Danger Zone</h2>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          You have absolute control over your digital partner. Download your complete memories, tasks, and notes at any time, or permanently wipe all records.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold transition-all"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export Full Data (JSON)</span>
          </button>

          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Readable Markdown (.md)</span>
          </button>

          <button
            onClick={handleWipeAllData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Everything</span>
          </button>
        </div>
      </div>
    </div>
  );
};
