import React from 'react';
import { Mic, MicOff, Volume2, Sparkles, AlertCircle } from 'lucide-react';

interface VoiceCommandBarProps {
  isListening: boolean;
  transcript: string;
  lastCommand: string | null;
  onToggleListening: () => void;
  highContrast: boolean;
  isSupported: boolean;
}

export const VoiceCommandBar: React.FC<VoiceCommandBarProps> = ({
  isListening,
  transcript,
  lastCommand,
  onToggleListening,
  highContrast,
  isSupported,
}) => {
  if (!isSupported) return null;

  return (
    <div
      role="region"
      aria-label="Voice command bar status"
      className="fixed bottom-4 left-4 right-4 z-40 max-w-4xl mx-auto"
    >
      <div
        className={`rounded-3xl p-4 sm:p-5 border-4 shadow-2xl flex flex-wrap items-center justify-between gap-4 transition-all ${
          isListening
            ? highContrast
              ? 'bg-yellow-400 text-black border-yellow-300 ring-4 ring-yellow-300'
              : 'bg-emerald-700 text-white border-emerald-400 ring-4 ring-emerald-300'
            : highContrast
            ? 'bg-zinc-950 text-yellow-300 border-yellow-400'
            : 'bg-slate-900 text-white border-amber-400'
        }`}
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-[240px]">
          <button
            onClick={onToggleListening}
            type="button"
            className={`p-4 rounded-2xl font-extrabold flex items-center justify-center min-h-[64px] min-w-[64px] shadow-lg transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-4 ${
              isListening
                ? 'bg-red-600 text-white animate-bounce'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
            }`}
            aria-label={
              isListening ? 'Stop listening for voice' : 'Start listening for voice commands'
            }
          >
            {isListening ? (
              <Mic className="w-8 h-8 text-white" aria-hidden="true" />
            ) : (
              <MicOff className="w-8 h-8" aria-hidden="true" />
            )}
          </button>

          <div>
            <div className="flex items-center gap-2 font-black text-lg sm:text-xl">
              <span>{isListening ? '🎤 Voice Active — Speak Now' : 'Voice Assistant Ready'}</span>
            </div>
            <p className="text-sm sm:text-base font-medium opacity-90 line-clamp-1">
              {transcript
                ? `Heard: "${transcript}"`
                : lastCommand
                ? `Action executed: "${lastCommand}"`
                : 'Say e.g. "Go to scam checker", "Show pills", or "Bigger text"'}
            </p>
          </div>
        </div>

        <button
          onClick={onToggleListening}
          type="button"
          className={`min-h-[56px] px-6 py-3 rounded-2xl font-black text-base sm:text-lg transition-all focus-visible:ring-4 ${
            isListening
              ? 'bg-white text-emerald-900 hover:bg-emerald-100'
              : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
        >
          {isListening ? 'Stop Mic' : 'Tap to Speak'}
        </button>
      </div>
    </div>
  );
};
