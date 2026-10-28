import React, { useState } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

interface Props {
  isLocked: boolean;
  correctPin: string;
  onUnlock: () => void;
  userName: string;
}

export const AppLockModal: React.FC<Props> = ({
  isLocked,
  correctPin,
  onUnlock,
  userName,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isLocked) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const next = pin + digit;
      setPin(next);
      setError(false);

      if (next === correctPin) {
        setTimeout(() => {
          setPin('');
          onUnlock();
        }, 200);
      } else if (next.length === correctPin.length) {
        setError(true);
        setTimeout(() => setPin(''), 600);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 bg-[#0B0F17]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 z-50">
      <div className="max-w-xs w-full flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-2xl">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">KYRIOS Workspace Locked</h2>
          <p className="text-xs text-slate-400">Welcome back, {userName}. Enter your PIN to unlock.</p>
        </div>

        <div className="flex items-center gap-3 py-2">
          {Array.from({ length: correctPin.length || 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border transition-all ${
                i < pin.length
                  ? error ? 'bg-rose-500 border-rose-500' : 'bg-indigo-400 border-indigo-400 scale-110'
                  : 'border-white/20 bg-white/5'
              }`}
            />
          ))}
        </div>

        {error && (
          <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Incorrect PIN. Please try again.
          </span>
        )}

        <div className="grid grid-cols-3 gap-3 w-full pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, idx) => {
            if (!k) return <div key={idx} />;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => (k === '⌫' ? handleBackspace() : handleDigit(k))}
                className="h-14 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-indigo-600 border border-white/5 text-lg font-mono font-semibold text-white transition-all flex items-center justify-center active:scale-95 shadow-sm"
              >
                {k}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
