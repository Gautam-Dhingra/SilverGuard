import { useState, useEffect, useCallback, useRef } from 'react';
import { NavigationTab } from '../types';

interface VoiceRecognitionProps {
  onNavigate: (tab: NavigationTab) => void;
  onToggleHighContrast: () => void;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onReadAloud: () => void;
  onStopReading: () => void;
  onTranscriptDictated?: (text: string) => void;
}

export function useVoiceRecognition({
  onNavigate,
  onToggleHighContrast,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onReadAloud,
  onStopReading,
  onTranscriptDictated,
}: VoiceRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }

      setTranscript(currentTranscript);
      const lower = currentTranscript.toLowerCase().trim();

      // Check navigation and action commands
      if (lower.includes('go to companion') || lower.includes('go to chat') || lower.includes('home')) {
        onNavigate('companion');
        setLastCommand('Navigated to Companion');
      } else if (lower.includes('scam') || lower.includes('check bill') || lower.includes('go to scam')) {
        onNavigate('scam-checker');
        setLastCommand('Navigated to Scam & Bill Safeguard');
      } else if (lower.includes('medication') || lower.includes('pills') || lower.includes('go to pills')) {
        onNavigate('medications');
        setLastCommand('Navigated to Medication Schedule');
      } else if (lower.includes('doctor') || lower.includes('appointment') || lower.includes('prep visit')) {
        onNavigate('doctor-prep');
        setLastCommand('Navigated to Doctor Visit Prep');
      } else if (lower.includes('family') || lower.includes('social') || lower.includes('messages')) {
        onNavigate('family-social');
        setLastCommand('Navigated to Family Updates');
      } else if (lower.includes('bigger text') || lower.includes('increase font') || lower.includes('large text')) {
        onIncreaseFontSize();
        setLastCommand('Increased font size');
      } else if (lower.includes('smaller text') || lower.includes('normal text')) {
        onDecreaseFontSize();
        setLastCommand('Decreased font size');
      } else if (lower.includes('high contrast') || lower.includes('toggle contrast')) {
        onToggleHighContrast();
        setLastCommand('Toggled High Contrast Mode');
      } else if (lower.includes('read aloud') || lower.includes('read page')) {
        onReadAloud();
        setLastCommand('Reading screen aloud');
      } else if (lower.includes('stop reading') || lower.includes('stop speech') || lower.includes('be quiet')) {
        onStopReading();
        setLastCommand('Stopped speech');
      }

      // Always dictate transcript to active/primary page input field if available
      if (onTranscriptDictated && currentTranscript) {
        onTranscriptDictated(currentTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [
    onNavigate,
    onToggleHighContrast,
    onIncreaseFontSize,
    onDecreaseFontSize,
    onReadAloud,
    onStopReading,
    onTranscriptDictated,
  ]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript('');
        setLastCommand(null);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (err) {
        console.error('Failed to stop speech recognition:', err);
      }
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    lastCommand,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}
