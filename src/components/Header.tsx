import React from 'react';
import {
  ShieldCheck,
  PhoneCall,
  Volume2,
  VolumeX,
  Eye,
  Type,
  Mic,
  MicOff,
  HelpCircle,
  Lock,
} from 'lucide-react';
import { AccessibilitySettings } from '../types';

interface HeaderProps {
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  onOpenEmergencyModal: () => void;
  onOpenVoiceHelp: () => void;
  onOpenGdprModal: () => void;
  isListening: boolean;
  onToggleVoiceNav: () => void;
  isSpeaking: boolean;
  onStopSpeech: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  onOpenEmergencyModal,
  onOpenVoiceHelp,
  onOpenGdprModal,
  isListening,
  onToggleVoiceNav,
  isSpeaking,
  onStopSpeech,
}) => {
  const isHighContrast = settings.highContrast;

  return (
    <header
      role="banner"
      className={`border-b-4 transition-colors duration-200 ${
        isHighContrast
          ? 'bg-black text-yellow-300 border-yellow-400'
          : 'bg-amber-100/90 text-slate-900 border-amber-300'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Title with High Contrast & Senior Friendly Size */}
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl flex items-center justify-center ${
              isHighContrast
                ? 'bg-yellow-400 text-black'
                : 'bg-amber-600 text-white shadow-sm'
            }`}
          >
            <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-none">
              SilverGuard India
            </h1>
            <p className="text-sm sm:text-base font-semibold opacity-90 mt-0.5">
              Voice AI Companion for Seniors (Dada-Dadi / Nana-Nani)
            </p>
          </div>
        </div>

        {/* Global Action Bar: Emergency Contact, Security & Accessibility Shortcuts */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {/* Active Speech Indicator & Stop Button */}
          {isSpeaking && (
            <button
              onClick={onStopSpeech}
              type="button"
              className="flex items-center gap-2 min-h-[52px] px-4 py-2.5 rounded-xl font-bold bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-all text-base shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-400"
              aria-label="Stop text-to-speech reading"
            >
              <VolumeX className="w-6 h-6 animate-pulse" aria-hidden="true" />
              <span>Stop Reading</span>
            </button>
          )}

          {/* Zero-Knowledge Security & GDPR Vault Button */}
          <button
            onClick={onOpenGdprModal}
            type="button"
            className={`flex items-center gap-2 min-h-[52px] px-3.5 py-2.5 rounded-xl font-bold border-2 transition-all text-base focus-visible:outline-none focus-visible:ring-4 cursor-pointer ${
              isHighContrast
                ? 'border-emerald-400 bg-emerald-950 text-emerald-300 hover:bg-emerald-900'
                : 'border-emerald-500 bg-emerald-700 text-white hover:bg-emerald-800 shadow-md'
            }`}
            aria-label="Open GDPR & Zero-Knowledge Security Center"
          >
            <Lock className="w-5 h-5 text-emerald-300 shrink-0" aria-hidden="true" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
              AES-256 E2EE Vault
            </span>
          </button>

          {/* Voice Help Button */}
          <button
            onClick={onOpenVoiceHelp}
            type="button"
            className={`flex items-center gap-1.5 min-h-[52px] px-3.5 py-2.5 rounded-xl font-bold border-2 transition-all text-base focus-visible:outline-none focus-visible:ring-4 ${
              isHighContrast
                ? 'border-yellow-300 bg-black text-yellow-300 hover:bg-yellow-900/40'
                : 'border-amber-400 bg-white text-slate-800 hover:bg-amber-50'
            }`}
            aria-label="View voice command guide and help"
          >
            <HelpCircle className="w-6 h-6" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Help</span>
          </button>

          {/* Emergency Red Button */}
          <button
            onClick={onOpenEmergencyModal}
            type="button"
            className="flex items-center gap-2 min-h-[52px] px-4 sm:px-5 py-2.5 rounded-xl font-extrabold bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all text-base sm:text-lg shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-400"
            aria-label="Open emergency contacts and trusted family dialer"
          >
            <PhoneCall className="w-6 h-6" aria-hidden="true" />
            <span>Emergency</span>
          </button>
        </div>
      </div>
    </header>
  );
};
