import React, { useState, useEffect, useRef } from 'react';
import {
  Pill,
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  X,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Bot,
} from 'lucide-react';
import { MedicationItem } from '../types';
import { MEDS_LOCAL_STORAGE_KEY } from './UserProfileView';
import { getSecure, saveSecure } from '../services/cryptoStorage';

interface VoiceAddMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  highContrast: boolean;
  onReadAloud: (text: string) => void;
  onMedicationAdded?: (med: MedicationItem) => void;
}

type AddMedStep = 'name' | 'dosage' | 'timeOfDay' | 'instructions' | 'confirm' | 'success';

export const VoiceAddMedicationModal: React.FC<VoiceAddMedicationModalProps> = ({
  isOpen,
  onClose,
  highContrast,
  onReadAloud,
  onMedicationAdded,
}) => {
  const [step, setStep] = useState<AddMedStep>('name');
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [instructions, setInstructions] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // Auto-prompt voice questions on step change
  useEffect(() => {
    if (!isOpen) return;

    let questionPrompt = '';
    if (step === 'name') {
      questionPrompt = 'Boliye, dawai ka naam kya hai? For example, Crocin or Amlodipine.';
    } else if (step === 'dosage') {
      questionPrompt = `Kitni dosage leni hai ${medName} ki? For example, 1 tablet, 2 drops, or 5ml syrup.`;
    } else if (step === 'timeOfDay') {
      questionPrompt = 'Yeh dawai kab leni hai? Subah (Morning), Dopahar (Afternoon), ya Shaam (Evening)?';
    } else if (step === 'instructions') {
      questionPrompt = 'Khane se pehle leni hai ya khane ke baad? Any special instructions?';
    } else if (step === 'confirm') {
      questionPrompt = `Please confirm: Add ${medName}, dosage ${dosage}, time ${timeOfDay}, instructions ${instructions}? Say Yes or Haan to confirm.`;
    } else if (step === 'success') {
      questionPrompt = `Shabash! ${medName} has been saved to your daily medication schedule.`;
    }

    if (questionPrompt) {
      onReadAloud(questionPrompt);
    }

    // Auto-start listening after TTS prompt delay for seamless hands-free experience
    if (step !== 'success') {
      const timer = setTimeout(() => {
        startVoiceListening();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [step, isOpen]);

  // Setup Web Speech Recognition
  const startVoiceListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN'; // Accepts English & Hindi accents

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      setLiveTranscript('');
    };

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setLiveTranscript(currentTranscript);
      handleStepVoiceAnswer(currentTranscript);
    };

    recognition.onerror = (event: any) => {
      console.warn('Voice medication adder error:', event.error);
      isListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      isListeningRef.current = false;
      setIsListening(false);
    }
  };

  const stopVoiceListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    isListeningRef.current = false;
    setIsListening(false);
  };

  // Process senior's spoken response step by step
  const handleStepVoiceAnswer = (spokenText: string) => {
    const cleanText = spokenText.trim();
    if (!cleanText) return;

    const lower = cleanText.toLowerCase();

    if (step === 'name') {
      setMedName(cleanText);
    } else if (step === 'dosage') {
      setDosage(cleanText);
    } else if (step === 'timeOfDay') {
      if (lower.includes('dopahar') || lower.includes('afternoon') || lower.includes('12') || lower.includes('2')) {
        setTimeOfDay('afternoon');
      } else if (lower.includes('shaam') || lower.includes('evening') || lower.includes('night') || lower.includes('raat') || lower.includes('8')) {
        setTimeOfDay('evening');
      } else {
        setTimeOfDay('morning');
      }
    } else if (step === 'instructions') {
      setInstructions(cleanText);
    } else if (step === 'confirm') {
      if (lower.includes('yes') || lower.includes('haan') || lower.includes('sahi') || lower.includes('confirm') || lower.includes('add') || lower.includes('thik')) {
        saveFinalMedication();
      }
    }
  };

  const advanceNextStep = () => {
    stopVoiceListening();
    if (step === 'name') {
      if (!medName) setMedName('Daily Prescribed Pill');
      setStep('dosage');
    } else if (step === 'dosage') {
      if (!dosage) setDosage('1 tablet');
      setStep('timeOfDay');
    } else if (step === 'timeOfDay') {
      setStep('instructions');
    } else if (step === 'instructions') {
      if (!instructions) setInstructions('Take with water after food');
      setStep('confirm');
    } else if (step === 'confirm') {
      saveFinalMedication();
    }
  };

  const saveFinalMedication = async () => {
    stopVoiceListening();
    const finalMedName = medName.trim() || 'Prescribed Medicine';
    const finalDosage = dosage.trim() || '1 tablet';
    const finalInstructions = instructions.trim() || 'Take with water after food';

    const newMed: MedicationItem = {
      id: Date.now().toString(),
      name: finalMedName,
      dosage: finalDosage,
      frequency: 'Daily',
      timeOfDay: timeOfDay,
      instructions: finalInstructions,
      takenToday: false,
      refillNeeded: false,
    };

    const existing = await getSecure<MedicationItem[]>(MEDS_LOCAL_STORAGE_KEY, []);
    const updated = [newMed, ...(Array.isArray(existing) ? existing : [])];

    await saveSecure(MEDS_LOCAL_STORAGE_KEY, updated);
    window.dispatchEvent(new Event('silverguard_data_updated'));

    if (onMedicationAdded) {
      onMedicationAdded(newMed);
    }

    setStep('success');
  };

  const handleResetModal = () => {
    stopVoiceListening();
    setMedName('');
    setDosage('');
    setTimeOfDay('morning');
    setInstructions('');
    setLiveTranscript('');
    setStep('name');
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        className={`w-full max-w-2xl rounded-3xl p-6 sm:p-8 border-4 shadow-2xl space-y-6 ${
          highContrast
            ? 'bg-zinc-950 text-yellow-300 border-yellow-400'
            : 'bg-amber-50 text-slate-900 border-amber-500'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b-2 pb-4 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shrink-0">
              <Bot className="w-8 h-8" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black">
                Voice Assistant: Add Prescribed Medicine
              </h3>
              <p className="text-sm font-bold opacity-90">
                100% Hands-Free Voice Guided Setup (Senior Friendly)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopVoiceListening();
              onClose();
            }}
            type="button"
            className="p-2.5 rounded-2xl bg-amber-200 hover:bg-amber-300 text-amber-950 min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer border border-amber-400"
          >
            <X className="w-7 h-7" aria-hidden="true" />
          </button>
        </div>

        {/* STEP 1: Medicine Name */}
        {step === 'name' && (
          <div className="space-y-5 animate-fade-in">
            <div className="p-5 rounded-3xl bg-white border-3 border-amber-300 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-amber-600 text-white font-black rounded-full text-xs uppercase">
                  Question 1 of 4
                </span>
                <button
                  onClick={() => onReadAloud('Boliye, dawai ka naam kya hai? For example, Crocin or Amlodipine.')}
                  className="p-2 text-amber-800 hover:bg-amber-100 rounded-xl cursor-pointer flex items-center gap-1 font-bold text-xs"
                >
                  <Volume2 className="w-4 h-4" /> Listen
                </button>
              </div>
              <h4 className="text-2xl sm:text-3xl font-black text-slate-900">
                🗣️ Boliye, dawai ka naam kya hai?
              </h4>
              <p className="text-base font-semibold text-slate-600">
                (Speak the medicine name clearly into your mic e.g. Crocin, Amlodipine, Glycomet)
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-extrabold opacity-90">Your Spoken Medicine Name:</label>
              <input
                type="text"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="Listening to your voice..."
                className="w-full p-4 rounded-2xl border-3 border-amber-400 font-extrabold text-xl bg-white text-slate-900 shadow-inner"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Dosage */}
        {step === 'dosage' && (
          <div className="space-y-5 animate-fade-in">
            <div className="p-5 rounded-3xl bg-white border-3 border-amber-300 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-amber-600 text-white font-black rounded-full text-xs uppercase">
                  Question 2 of 4
                </span>
                <span className="font-extrabold text-amber-900">Medicine: {medName}</span>
              </div>
              <h4 className="text-2xl sm:text-3xl font-black text-slate-900">
                🗣️ Yeh dawai kitni leni hai? (Dosage)
              </h4>
              <p className="text-base font-semibold text-slate-600">
                (Speak the dosage e.g. 1 tablet, 2 drops, 5ml syrup, or 500mg)
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-extrabold opacity-90">Your Spoken Dosage:</label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="Listening to your voice..."
                className="w-full p-4 rounded-2xl border-3 border-amber-400 font-extrabold text-xl bg-white text-slate-900 shadow-inner"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Time of Day */}
        {step === 'timeOfDay' && (
          <div className="space-y-5 animate-fade-in">
            <div className="p-5 rounded-3xl bg-white border-3 border-amber-300 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-amber-600 text-white font-black rounded-full text-xs uppercase">
                  Question 3 of 4
                </span>
                <span className="font-extrabold text-amber-900">{medName} ({dosage})</span>
              </div>
              <h4 className="text-2xl sm:text-3xl font-black text-slate-900">
                🗣️ Yeh dawai kab leni hai?
              </h4>
              <p className="text-base font-semibold text-slate-600">
                (Speak: Subah / Morning, Dopahar / Afternoon, ya Shaam / Evening)
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '🌅 Subah (Morning)', val: 'morning' },
                { label: '☀️ Dopahar (Afternoon)', val: 'afternoon' },
                { label: '🌙 Shaam / Raat (Evening)', val: 'evening' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setTimeOfDay(opt.val as any)}
                  type="button"
                  className={`p-4 rounded-2xl border-3 font-black text-base transition-all cursor-pointer ${
                    timeOfDay === opt.val
                      ? 'bg-amber-600 text-white border-amber-800 ring-4 ring-amber-300 shadow-lg scale-[1.03]'
                      : 'bg-white text-slate-900 border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Instructions */}
        {step === 'instructions' && (
          <div className="space-y-5 animate-fade-in">
            <div className="p-5 rounded-3xl bg-white border-3 border-amber-300 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-amber-600 text-white font-black rounded-full text-xs uppercase">
                  Question 4 of 4
                </span>
                <span className="font-extrabold text-amber-900">{medName} ({timeOfDay})</span>
              </div>
              <h4 className="text-2xl sm:text-3xl font-black text-slate-900">
                🗣️ Khane se pehle ya khane ke baad?
              </h4>
              <p className="text-base font-semibold text-slate-600">
                (Speak instructions e.g. Khane ke baad paani se, or Before food)
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-extrabold opacity-90">Your Spoken Instructions:</label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Listening to your voice..."
                className="w-full p-4 rounded-2xl border-3 border-amber-400 font-extrabold text-xl bg-white text-slate-900 shadow-inner"
              />
            </div>
          </div>
        )}

        {/* STEP 5: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-5 animate-fade-in">
            <div className="p-6 rounded-3xl bg-amber-500 text-slate-950 border-4 border-amber-700 shadow-xl space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-7 h-7" />
                <h4 className="text-2xl font-black">Confirm Medicine Details:</h4>
              </div>
              <div className="bg-white/90 p-4 rounded-2xl space-y-2 text-slate-950 font-bold text-lg">
                <p>💊 Medicine: <strong>{medName}</strong></p>
                <p>📏 Dosage: <strong>{dosage}</strong></p>
                <p>⏰ Timing: <strong>{timeOfDay.toUpperCase()}</strong></p>
                <p>👉 Instructions: <strong>{instructions || 'Take after food'}</strong></p>
              </div>
              <p className="text-base font-extrabold">
                Boliye <strong>"Yes"</strong> ya <strong>"Haan"</strong> to confirm and add!
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <div className="p-8 rounded-3xl bg-emerald-600 text-white text-center space-y-4 shadow-2xl animate-fade-in">
            <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-200" />
            <h4 className="text-3xl font-black">Dawai Add Ho Gayi Hai!</h4>
            <p className="text-xl font-bold">
              {medName} ({dosage}) has been added to your {timeOfDay} schedule.
            </p>
            <button
              onClick={() => {
                onClose();
                handleResetModal();
              }}
              type="button"
              className="px-8 py-4 rounded-2xl font-black text-xl bg-white text-slate-950 hover:bg-emerald-100 shadow-lg cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        )}

        {/* Hands-Free Big Voice Mic Control Bar */}
        {step !== 'success' && (
          <div className="pt-4 border-t-2 border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={isListening ? stopVoiceListening : startVoiceListening}
              type="button"
              className={`w-full sm:w-auto px-6 py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg min-h-[64px] ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-400'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-8 h-8 animate-spin shrink-0" />
                  <span>Listening... (Boliye)</span>
                </>
              ) : (
                <>
                  <Mic className="w-8 h-8 shrink-0" />
                  <span>Tap to Speak Response</span>
                </>
              )}
            </button>

            <div className="flex gap-3 w-full sm:w-auto">
              {step !== 'name' && (
                <button
                  onClick={() => {
                    stopVoiceListening();
                    if (step === 'dosage') setStep('name');
                    if (step === 'timeOfDay') setStep('dosage');
                    if (step === 'instructions') setStep('timeOfDay');
                    if (step === 'confirm') setStep('instructions');
                  }}
                  type="button"
                  className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl font-bold bg-slate-200 text-slate-900 hover:bg-slate-300 min-h-[52px] cursor-pointer"
                >
                  Back
                </button>
              )}

              <button
                onClick={advanceNextStep}
                type="button"
                className="flex-1 sm:flex-initial px-6 py-3.5 rounded-2xl font-black text-lg bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md min-h-[52px] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{step === 'confirm' ? 'Confirm & Save' : 'Next Step'}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
