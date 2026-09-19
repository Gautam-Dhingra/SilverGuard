import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles } from 'lucide-react';

interface AudioInputButtonProps {
  onTranscript: (text: string) => void;
  label?: string;
  language?: string;
  highContrast?: boolean;
  className?: string;
}

export const AudioInputButton: React.FC<AudioInputButtonProps> = ({
  onTranscript,
  label = 'Bolen / Voice Input',
  language = 'hi-IN',
  highContrast = false,
  className = '',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  const isRecordingRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      isRecordingRef.current = true;
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      if (currentTranscript.trim()) {
        onTranscript(currentTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Audio input speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        isRecordingRef.current = false;
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      isRecordingRef.current = false;
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, [language, onTranscript]);

  const toggleRecording = () => {
    if (!isSupported) {
      alert('Voice input is not supported in this browser version. Please type your message.');
      return;
    }

    if (isRecording || isRecordingRef.current) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        console.error(e);
      } finally {
        isRecordingRef.current = false;
        setIsRecording(false);
      }
    } else {
      try {
        recognitionRef.current?.start();
        isRecordingRef.current = true;
        setIsRecording(true);
      } catch (e: any) {
        if (e.name === 'InvalidStateError' || e.message?.includes('already started')) {
          isRecordingRef.current = true;
          setIsRecording(true);
        } else {
          console.error(e);
          isRecordingRef.current = false;
          setIsRecording(false);
        }
      }
    }
  };

  return (
    <button
      onClick={toggleRecording}
      type="button"
      title={isRecording ? 'Listening... Tap to stop' : 'Tap to speak your input'}
      aria-label={isRecording ? 'Listening in progress' : 'Voice input mic button'}
      className={`px-4 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all min-h-[52px] cursor-pointer focus-visible:outline-none focus-visible:ring-4 ${
        isRecording
          ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-400 font-extrabold shadow-lg'
          : highContrast
          ? 'bg-yellow-400 text-black hover:bg-yellow-300 font-extrabold'
          : 'bg-orange-600 text-white hover:bg-orange-700 shadow-md'
      } ${className}`}
    >
      {isRecording ? (
        <>
          <MicOff className="w-6 h-6 animate-spin shrink-0" aria-hidden="true" />
          <span className="text-base sm:text-lg">Listening... (Boliye)</span>
        </>
      ) : (
        <>
          <Mic className="w-6 h-6 shrink-0" aria-hidden="true" />
          <span className="text-base sm:text-lg">{label}</span>
        </>
      )}
    </button>
  );
};
