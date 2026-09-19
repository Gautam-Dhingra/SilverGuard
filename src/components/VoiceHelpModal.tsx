import React from 'react';
import { Mic, X, CheckCircle2, Volume2, Type } from 'lucide-react';

interface VoiceHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  highContrast: boolean;
}

export const VoiceHelpModal: React.FC<VoiceHelpModalProps> = ({
  isOpen,
  onClose,
  highContrast,
}) => {
  if (!isOpen) return null;

  const commands = [
    {
      action: 'Navigation',
      phrase: '"Go to scam checker" or "Check bill"',
      effect: 'Opens the Scam & Bill Safeguard screen',
    },
    {
      action: 'Navigation',
      phrase: '"Go to medications" or "Show my pills"',
      effect: 'Opens your daily pill schedule',
    },
    {
      action: 'Navigation',
      phrase: '"Go to doctor prep"',
      effect: 'Opens doctor appointment question builder',
    },
    {
      action: 'Navigation',
      phrase: '"Go to family" or "Messages"',
      effect: 'Opens family updates & reply helper',
    },
    {
      action: 'Accessibility',
      phrase: '"Bigger text" / "Smaller text"',
      effect: 'Increases or reduces text size',
    },
    {
      action: 'Accessibility',
      phrase: '"High contrast"',
      effect: 'Toggles yellow-on-black visual theme',
    },
    {
      action: 'Speech',
      phrase: '"Read aloud"',
      effect: 'Reads the active page summary aloud',
    },
    {
      action: 'Speech',
      phrase: '"Stop reading"',
      effect: 'Stops audio narration immediately',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-help-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
    >
      <div
        className={`w-full max-w-2xl rounded-3xl p-6 sm:p-8 border-4 shadow-2xl space-y-6 ${
          highContrast
            ? 'bg-black text-yellow-300 border-yellow-400'
            : 'bg-white text-slate-900 border-amber-400'
        }`}
      >
        <div className="flex items-center justify-between border-b-2 pb-4 border-slate-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-600 text-white rounded-2xl">
              <Mic className="w-8 h-8" aria-hidden="true" />
            </div>
            <div>
              <h2 id="voice-help-title" className="text-2xl sm:text-3xl font-extrabold">
                Voice Navigation Commands
              </h2>
              <p className="text-base sm:text-lg font-semibold opacity-90">
                Simply speak any of these phrases while microphone is active:
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-3 rounded-2xl bg-slate-200 text-slate-900 hover:bg-slate-300 focus-visible:ring-4 focus-visible:ring-slate-400 min-h-[56px] min-w-[56px] flex items-center justify-center"
            aria-label="Close voice help guide"
          >
            <X className="w-8 h-8" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {commands.map((cmd, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                highContrast
                  ? 'bg-zinc-900 border-yellow-400 text-yellow-300'
                  : 'bg-amber-50 border-amber-300 text-slate-900'
              }`}
            >
              <div>
                <div className="text-xl font-black text-amber-800 dark:text-yellow-300">
                  {cmd.phrase}
                </div>
                <div className="text-base font-semibold opacity-90">{cmd.effect}</div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                {cmd.action}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            type="button"
            className="w-full py-4 rounded-2xl font-extrabold text-xl bg-amber-700 text-white hover:bg-amber-800 focus-visible:ring-4 min-h-[60px]"
          >
            Got It! Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
