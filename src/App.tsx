import React, { useState, useEffect, useCallback } from 'react';
import {
  AccessibilitySettings,
  NavigationTab,
  FontSizeOption,
} from './types';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import { Header } from './components/Header';
import { AccessibilityToolbar } from './components/AccessibilityToolbar';
import { Navigation } from './components/Navigation';
import { VoiceCommandBar } from './components/VoiceCommandBar';
import { EmergencyModal } from './components/EmergencyModal';
import { VoiceHelpModal } from './components/VoiceHelpModal';
import { GdprSecurityModal } from './components/GdprSecurityModal';

import { CompanionView } from './components/CompanionView';
import { ScamCheckerNav } from './components/ScamCheckerNav';
import { MedicationTracker } from './components/MedicationTracker';
import { DoctorPrepView } from './components/DoctorPrepView';
import { FamilyConnectorView } from './components/FamilyConnectorView';
import { UserProfileView } from './components/UserProfileView';
import { TestCaseSandboxView } from './components/TestCaseSandboxView';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('companion');
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 'normal',
    highContrast: false,
    ttsEnabled: true,
    voiceNavActive: false,
    speechRate: 0.9,
  });

  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isVoiceHelpOpen, setIsVoiceHelpOpen] = useState(false);
  const [isGdprOpen, setIsGdprOpen] = useState(false);

  const { speak, stop, isSpeaking } = useTextToSpeech(settings.speechRate);

  const updateSettings = (newPartial: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...newPartial }));
  };

  const handleNavigate = useCallback((tab: NavigationTab) => {
    setActiveTab(tab);
  }, []);

  const handleToggleHighContrast = useCallback(() => {
    setSettings((prev) => ({ ...prev, highContrast: !prev.highContrast }));
  }, []);

  const handleIncreaseFontSize = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      fontSize: prev.fontSize === 'normal' ? 'large' : 'xlarge',
    }));
  }, []);

  const handleDecreaseFontSize = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      fontSize: prev.fontSize === 'xlarge' ? 'large' : 'normal',
    }));
  }, []);

  const handleReadActivePage = useCallback(() => {
    if (activeTab === 'companion') {
      speak(
        'You are on the Daily Helper companion chat screen. Ask any question in plain words.'
      );
    } else if (activeTab === 'scam-checker') {
      speak(
        'You are on the Scam and Bill Safeguard screen. Paste a suspicious message or bill to verify safety.'
      );
    } else if (activeTab === 'medications') {
      speak(
        'You are on the Medication Schedule screen. Check off your pills as you take them today.'
      );
    } else if (activeTab === 'doctor-prep') {
      speak(
        'You are on the Doctor Visit Prep screen. Log your symptoms and generate questions for your doctor.'
      );
    } else if (activeTab === 'family-social') {
      speak(
        'You are on the Family Updates screen. Read messages from family and draft warm replies.'
      );
    } else if (activeTab === 'profile') {
      speak(
        'You are on the Profile and Routine screen. Set your prescribed medicines, daily schedule, and at least three family emergency contacts.'
      );
    } else if (activeTab === 'test-cases') {
      speak(
        'You are on the Test Use Cases Sandbox. Select a scenario and run live AI test cases.'
      );
    }
  }, [activeTab, speak]);

  const handleTranscriptDictated = useCallback((text: string) => {
    if (!text) return;
    let targetEl = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;

    if (
      !targetEl ||
      (targetEl.tagName !== 'INPUT' && targetEl.tagName !== 'TEXTAREA') ||
      targetEl.readOnly ||
      targetEl.disabled
    ) {
      const pageInputs = Array.from(
        document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
          'main input[type="text"], main input:not([type]), main textarea, main input[type="search"]'
        )
      );
      const visibleInput = pageInputs.find(
        (el) => el.offsetWidth > 0 && el.offsetHeight > 0 && !el.disabled && !el.readOnly
      );
      if (visibleInput) {
        targetEl = visibleInput;
        targetEl.focus();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    if (targetEl && (targetEl.tagName === 'INPUT' || targetEl.tagName === 'TEXTAREA')) {
      const prototype =
        targetEl.tagName === 'INPUT'
          ? window.HTMLInputElement.prototype
          : window.HTMLTextAreaElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(targetEl, text);
      } else {
        targetEl.value = text;
      }
      targetEl.dispatchEvent(new Event('input', { bubbles: true }));
      targetEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, []);

  const {
    isListening,
    transcript,
    lastCommand,
    isSupported,
    toggleListening,
  } = useVoiceRecognition({
    onNavigate: handleNavigate,
    onToggleHighContrast: handleToggleHighContrast,
    onIncreaseFontSize: handleIncreaseFontSize,
    onDecreaseFontSize: handleDecreaseFontSize,
    onReadAloud: handleReadActivePage,
    onStopReading: stop,
    onTranscriptDictated: handleTranscriptDictated,
  });

  // Handle keyboard navigation shortcuts (Alt+1 through Alt+7)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === '1') handleNavigate('companion');
        if (e.key === '2') handleNavigate('scam-checker');
        if (e.key === '3') handleNavigate('medications');
        if (e.key === '4') handleNavigate('doctor-prep');
        if (e.key === '5') handleNavigate('family-social');
        if (e.key === '6') handleNavigate('profile');
        if (e.key === '7') handleNavigate('test-cases');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNavigate]);

  const getFontSizeClass = () => {
    if (settings.fontSize === 'large') return 'text-xl';
    if (settings.fontSize === 'xlarge') return 'text-2xl';
    return 'text-lg';
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 pb-28 ${
        settings.highContrast
          ? 'bg-black text-white'
          : 'bg-amber-50/40 text-slate-900'
      } ${getFontSizeClass()}`}
    >
      {/* Header */}
      <Header
        settings={settings}
        onUpdateSettings={updateSettings}
        onOpenEmergencyModal={() => setIsEmergencyOpen(true)}
        onOpenVoiceHelp={() => setIsVoiceHelpOpen(true)}
        onOpenGdprModal={() => setIsGdprOpen(true)}
        isListening={isListening}
        onToggleVoiceNav={toggleListening}
        isSpeaking={isSpeaking}
        onStopSpeech={stop}
      />

      {/* Accessibility Bar */}
      <AccessibilityToolbar
        settings={settings}
        onUpdateSettings={updateSettings}
        onReadAloudPage={handleReadActivePage}
      />

      {/* Primary Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={handleNavigate}
        highContrast={settings.highContrast}
      />

      {/* Main Content Area */}
      <main
        id={`panel-${activeTab}`}
        role="region"
        aria-labelledby={`tab-${activeTab}`}
        className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6"
      >
        {activeTab === 'companion' && (
          <CompanionView
            highContrast={settings.highContrast}
            fontSize={settings.fontSize}
            onReadAloud={speak}
            onNavigateToTab={handleNavigate}
          />
        )}

        {activeTab === 'scam-checker' && (
          <ScamCheckerNav
            highContrast={settings.highContrast}
            onReadAloud={speak}
          />
        )}

        {activeTab === 'medications' && (
          <MedicationTracker
            highContrast={settings.highContrast}
            onReadAloud={speak}
            onNavigateToTab={handleNavigate}
          />
        )}

        {activeTab === 'doctor-prep' && (
          <DoctorPrepView
            highContrast={settings.highContrast}
            onReadAloud={speak}
          />
        )}

        {activeTab === 'family-social' && (
          <FamilyConnectorView
            highContrast={settings.highContrast}
            onReadAloud={speak}
            onNavigateToTab={handleNavigate}
          />
        )}

        {activeTab === 'profile' && (
          <UserProfileView
            highContrast={settings.highContrast}
            onReadAloud={speak}
            onNavigateToTab={handleNavigate}
          />
        )}

        {activeTab === 'test-cases' && (
          <TestCaseSandboxView
            highContrast={settings.highContrast}
            onReadAloud={speak}
            onNavigateToTab={handleNavigate}
          />
        )}
      </main>

      {/* Footer W3C Compliance Notice */}
      <footer
        role="contentinfo"
        className={`border-t-2 py-4 px-6 text-center text-sm font-bold opacity-80 ${
          settings.highContrast
            ? 'bg-black text-yellow-300 border-yellow-400'
            : 'bg-amber-100/60 text-slate-800 border-amber-200'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            SilverGuard Companion • Designed for Senior Citizens & W3C WCAG 2.1 AA Compliant
          </span>
          <span className="text-xs opacity-75">
            Voice Control Enabled • Powered by Google Gemini AI
          </span>
        </div>
      </footer>

      {/* Floating Voice Command Bar */}
      <VoiceCommandBar
        isListening={isListening}
        transcript={transcript}
        lastCommand={lastCommand}
        onToggleListening={toggleListening}
        highContrast={settings.highContrast}
        isSupported={isSupported}
      />

      {/* Emergency Contact Dialer Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        highContrast={settings.highContrast}
      />

      {/* Voice Commands Guide Modal */}
      <VoiceHelpModal
        isOpen={isVoiceHelpOpen}
        onClose={() => setIsVoiceHelpOpen(false)}
        highContrast={settings.highContrast}
      />

      {/* Zero-Knowledge & GDPR Security Center Modal */}
      <GdprSecurityModal
        isOpen={isGdprOpen}
        onClose={() => setIsGdprOpen(false)}
        highContrast={settings.highContrast}
      />
    </div>
  );
}
