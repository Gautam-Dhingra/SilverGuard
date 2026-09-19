import React, { useState } from 'react';
import {
  Pill,
  CheckCircle2,
  Clock,
  Plus,
  Volume2,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Check,
  RefreshCw,
} from 'lucide-react';
import { MedicationItem } from '../types';

interface MedicationTrackerProps {
  highContrast: boolean;
  onReadAloud: (text: string) => void;
}

export const MedicationTracker: React.FC<MedicationTrackerProps> = ({
  highContrast,
  onReadAloud,
}) => {
  const [meds, setMeds] = useState<MedicationItem[]>([
    {
      id: '1',
      name: 'Lisinopril (Blood Pressure)',
      dosage: '10 mg',
      frequency: 'Once Daily',
      timeOfDay: 'morning',
      instructions: 'Take 1 tablet with a full glass of water after breakfast.',
      takenToday: true,
      takenTime: '8:30 AM',
      aiTip: 'Helps maintain healthy blood pressure. Avoid sudden standing up quickly.',
      refillNeeded: false,
    },
    {
      id: '2',
      name: 'Metformin (Blood Sugar)',
      dosage: '500 mg',
      frequency: 'Twice Daily',
      timeOfDay: 'morning',
      instructions: 'Take with food to prevent upset stomach.',
      takenToday: false,
      aiTip: 'Best taken right during your morning meal.',
      refillNeeded: true,
    },
    {
      id: '3',
      name: 'Vitamin D3 Supplement',
      dosage: '1000 IU',
      frequency: 'Once Daily',
      timeOfDay: 'afternoon',
      instructions: 'Take 1 softgel daily after lunch.',
      takenToday: false,
      aiTip: 'Supports bone strength and joint health.',
      refillNeeded: false,
    },
    {
      id: '4',
      name: 'Atorvastatin (Cholesterol)',
      dosage: '20 mg',
      frequency: 'Once Daily',
      timeOfDay: 'evening',
      instructions: 'Take before bedtime.',
      takenToday: false,
      aiTip: 'Works best when taken in the evening.',
      refillNeeded: false,
    },
  ]);

  const [selectedTime, setSelectedTime] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [aiQuestionMed, setAiQuestionMed] = useState<MedicationItem | null>(null);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAskingAi, setIsAskingAi] = useState(false);

  const toggleTaken = (id: string) => {
    setMeds((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextTaken = !m.takenToday;
          const time = nextTaken
            ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : undefined;
          if (nextTaken) {
            onReadAloud(`Great job! Marked ${m.name} as taken.`);
          }
          return { ...m, takenToday: nextTaken, takenTime: time };
        }
        return m;
      })
    );
  };

  const askAiAboutPill = async (med: MedicationItem) => {
    setAiQuestionMed(med);
    setIsAskingAi(true);
    setAiAnswer(null);

    // Call Gemini for pill explanation
    try {
      const res = await fetch('/api/ai/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              parts: [
                {
                  text: `Explain what ${med.name} (${med.dosage}) is used for, key safety precautions, and whether it should be taken with food, in simple senior-friendly 5th grade English.`,
                },
              ],
            },
          ],
        }),
      });
      const data = await res.json();
      const text = data.text || 'Please consult your doctor or pharmacist regarding specific drug details.';
      setAiAnswer(text);
      onReadAloud(text);
    } catch {
      setAiAnswer(`Always follow doctor instructions for ${med.name}. ${med.instructions}`);
    } finally {
      setIsAskingAi(false);
    }
  };

  const filteredMeds = meds.filter(
    (m) => selectedTime === 'all' || m.timeOfDay === selectedTime
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className={`p-6 rounded-3xl border-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          highContrast
            ? 'bg-zinc-950 text-yellow-300 border-yellow-400'
            : 'bg-amber-900 text-white border-amber-700'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shrink-0">
            <Pill className="w-10 h-10" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Medication Schedule
            </h2>
            <p className="text-base sm:text-lg font-semibold opacity-90 mt-1">
              Tap the big checkmarks when you take your pills today.
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            onReadAloud(
              `You have taken ${meds.filter((m) => m.takenToday).length} out of ${
                meds.length
              } medications today.`
            )
          }
          type="button"
          className="px-5 py-3 rounded-2xl font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 min-h-[52px] flex items-center gap-2 text-base"
        >
          <Volume2 className="w-5 h-5" aria-hidden="true" />
          <span>Read Status Aloud</span>
        </button>
      </div>

      {/* Time Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'morning', 'afternoon', 'evening'] as const).map((time) => (
          <button
            key={time}
            onClick={() => setSelectedTime(time)}
            type="button"
            className={`px-5 py-3 rounded-2xl font-black text-lg min-h-[56px] border-3 transition-all ${
              selectedTime === time
                ? 'bg-amber-600 text-white border-amber-700 ring-4 ring-amber-300 scale-[1.02]'
                : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {time === 'all'
              ? 'All Pills'
              : time.charAt(0).toUpperCase() + time.slice(1)}
          </button>
        ))}
      </div>

      {/* Pill Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMeds.map((med) => (
          <div
            key={med.id}
            className={`p-6 rounded-3xl border-4 shadow-xl flex flex-col justify-between gap-4 transition-all ${
              med.takenToday
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                : highContrast
                ? 'bg-black border-yellow-400 text-white'
                : 'bg-white border-amber-200 text-slate-900'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-200 text-amber-950 inline-block mb-1">
                    {med.timeOfDay}
                  </span>
                  <h3 className="text-2xl font-extrabold">{med.name}</h3>
                  <p className="text-lg font-bold opacity-90">{med.dosage} • {med.frequency}</p>
                </div>

                {med.refillNeeded && (
                  <span className="px-3 py-1.5 rounded-xl font-extrabold text-sm bg-rose-600 text-white animate-pulse">
                    Refill Needed
                  </span>
                )}
              </div>

              <p className="text-base sm:text-lg font-medium leading-relaxed bg-black/5 p-3.5 rounded-2xl border border-black/10">
                👉 {med.instructions}
              </p>

              {med.aiTip && (
                <p className="text-sm sm:text-base font-semibold text-amber-900 dark:text-yellow-300">
                  💡 Senior Tip: {med.aiTip}
                </p>
              )}
            </div>

            {/* Huge Touch Button to Mark Taken */}
            <div className="space-y-2 pt-2 border-t-2 border-slate-200">
              <button
                onClick={() => toggleTaken(med.id)}
                type="button"
                className={`w-full py-4 px-6 rounded-2xl font-black text-xl flex items-center justify-center gap-3 min-h-[64px] transition-all shadow-md focus-visible:ring-4 ${
                  med.takenToday
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}
              >
                {med.takenToday ? (
                  <>
                    <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
                    <span>Taken Today ({med.takenTime})</span>
                  </>
                ) : (
                  <>
                    <Check className="w-8 h-8" aria-hidden="true" />
                    <span>Tap to Mark as Taken</span>
                  </>
                )}
              </button>

              <button
                onClick={() => askAiAboutPill(med)}
                type="button"
                className="w-full py-2.5 rounded-xl font-bold text-base border-2 border-amber-300 hover:bg-amber-50 text-amber-900 flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Sparkles className="w-5 h-5 text-amber-600" aria-hidden="true" />
                <span>Ask AI About This Pill</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AI Pill Advice Modal / Expander */}
      {aiQuestionMed && (
        <div className="p-6 rounded-3xl bg-amber-50 border-4 border-amber-400 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-2xl font-extrabold text-amber-950">
              AI Guide for {aiQuestionMed.name}
            </h4>
            <button
              onClick={() => setAiQuestionMed(null)}
              type="button"
              className="px-4 py-2 font-bold bg-amber-200 rounded-xl min-h-[48px]"
            >
              Close
            </button>
          </div>

          {isAskingAi ? (
            <div className="p-4 font-bold animate-pulse text-lg text-amber-900">
              Asking Gemini AI for pill instructions...
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-lg font-medium text-slate-900 leading-relaxed bg-white p-4 rounded-2xl border border-amber-200">
                {aiAnswer}
              </p>
              <button
                onClick={() => onReadAloud(aiAnswer || '')}
                type="button"
                className="px-4 py-2.5 rounded-xl font-bold bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-2 min-h-[48px]"
              >
                <Volume2 className="w-5 h-5" aria-hidden="true" />
                <span>Read Answer Aloud</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
