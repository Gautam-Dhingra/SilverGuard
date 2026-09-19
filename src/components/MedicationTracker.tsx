import React, { useState, useEffect } from 'react';
import {
  Pill,
  CheckCircle2,
  Clock,
  Plus,
  Volume2,
  Sparkles,
  Check,
  X,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { MedicationItem } from '../types';
import { AudioInputButton } from './AudioInputButton';
import { MEDS_LOCAL_STORAGE_KEY } from './UserProfileView';
import { getSecure, saveSecure } from '../services/cryptoStorage';

interface MedicationTrackerProps {
  highContrast: boolean;
  onReadAloud: (text: string) => void;
  onNavigateToTab?: (tab: any) => void;
}

export const MedicationTracker: React.FC<MedicationTrackerProps> = ({
  highContrast,
  onReadAloud,
  onNavigateToTab,
}) => {
  const [meds, setMeds] = useState<MedicationItem[]>([]);

  // Load user-provided prescribed medicines with zero-knowledge AES-256 decryption
  useEffect(() => {
    let active = true;
    getSecure<MedicationItem[]>(MEDS_LOCAL_STORAGE_KEY, []).then((res) => {
      if (active && res) setMeds(res);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    saveSecure(MEDS_LOCAL_STORAGE_KEY, meds).then(() => {
      window.dispatchEvent(new Event('silverguard_data_updated'));
    });
  }, [meds]);

  // Re-sync with storage if updated externally
  useEffect(() => {
    const handleSync = () => {
      getSecure<MedicationItem[]>(MEDS_LOCAL_STORAGE_KEY, []).then((parsed) => {
        if (parsed) {
          setMeds((prev) => (JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed));
        }
      });
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('silverguard_data_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('silverguard_data_updated', handleSync);
    };
  }, []);

  const [selectedTime, setSelectedTime] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [aiQuestionMed, setAiQuestionMed] = useState<MedicationItem | null>(null);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAskingAi, setIsAskingAi] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newDosage, setNewDosage] = useState('1 tablet');
  const [newTimeOfDay, setNewTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [newInstructions, setNewInstructions] = useState('Take with water after food');

  const toggleTaken = (id: string) => {
    setMeds((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextTaken = !m.takenToday;
          const time = nextTaken
            ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : undefined;
          if (nextTaken) {
            onReadAloud(`Shabash! Marked ${m.name} as taken.`);
          }
          return { ...m, takenToday: nextTaken, takenTime: time };
        }
        return m;
      })
    );
  };

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    const newPill: MedicationItem = {
      id: Date.now().toString(),
      name: newMedName.trim(),
      dosage: newDosage,
      frequency: 'Daily',
      timeOfDay: newTimeOfDay,
      instructions: newInstructions,
      takenToday: false,
      refillNeeded: false,
    };

    setMeds((prev) => [...prev, newPill]);
    setNewMedName('');
    setIsAddModalOpen(false);
    onReadAloud(`Added ${newPill.name} to your daily schedule.`);
  };

  const askAiAboutPill = async (med: MedicationItem) => {
    setAiQuestionMed(med);
    setIsAskingAi(true);
    setAiAnswer(null);

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
                  text: `Explain what ${med.name} (${med.dosage}) is used for in simple senior-friendly terms for Indian grandparents, and give 2 clear safety precautions.`,
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
              Dawai Schedule (Medications)
            </h2>
            <p className="text-base sm:text-lg font-semibold opacity-90 mt-1">
              Tap the big checkmarks when you take your pills today.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          type="button"
          className="px-5 py-3 rounded-2xl font-black bg-amber-400 text-slate-950 hover:bg-amber-300 min-h-[52px] flex items-center gap-2 text-base cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          <span>+ Add New Medicine</span>
        </button>
      </div>

      {/* Time Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'morning', 'afternoon', 'evening'] as const).map((time) => (
          <button
            key={time}
            onClick={() => setSelectedTime(time)}
            type="button"
            className={`px-5 py-3 rounded-2xl font-black text-lg min-h-[56px] border-3 transition-all cursor-pointer ${
              selectedTime === time
                ? 'bg-amber-600 text-white border-amber-700 ring-4 ring-amber-300 scale-[1.02]'
                : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {time === 'all'
              ? 'All Pills (Sabhi Dawai)'
              : time.charAt(0).toUpperCase() + time.slice(1)}
          </button>
        ))}
      </div>

      {/* Pill Cards or Empty Safety Banner */}
      {filteredMeds.length === 0 ? (
        <div
          className={`p-8 rounded-3xl border-4 text-center space-y-4 shadow-xl ${
            highContrast
              ? 'bg-zinc-950 border-yellow-400 text-yellow-300'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}
        >
          <div className="p-4 bg-amber-500 text-slate-950 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-10 h-10" aria-hidden="true" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black">
            Medical Safety Notice & Empty Schedule
          </h3>
          <p className="text-lg sm:text-xl font-extrabold max-w-2xl mx-auto leading-relaxed">
            SilverGuard NEVER prescribes, recommends, or guesses medicines on its own without user information.
          </p>
          <p className="text-base sm:text-lg font-medium opacity-90 max-w-xl mx-auto">
            Please tap <strong>"+ Add New Medicine"</strong> or go to <strong>Profile & Routine</strong> to enter or speak your official doctor's prescription details!
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              type="button"
              className="px-6 py-3.5 rounded-2xl font-black text-lg bg-amber-600 text-white hover:bg-amber-700 shadow-md min-h-[52px] cursor-pointer"
            >
              + Add Prescribed Medicine Now
            </button>
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('profile')}
                type="button"
                className="px-6 py-3.5 rounded-2xl font-black text-lg bg-slate-800 text-white hover:bg-slate-900 shadow-md min-h-[52px] cursor-pointer"
              >
                Go to Profile & Routine Setup
              </button>
            )}
          </div>
        </div>
      ) : (
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
                className={`w-full py-4 px-6 rounded-2xl font-black text-xl flex items-center justify-center gap-3 min-h-[64px] transition-all shadow-md focus-visible:ring-4 cursor-pointer ${
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
                className="w-full py-2.5 rounded-xl font-bold text-base border-2 border-amber-300 hover:bg-amber-50 text-amber-900 flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-amber-600" aria-hidden="true" />
                <span>Ask AI About This Pill</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Modal to Add Custom Medicine */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
        >
          <div
            className={`w-full max-w-xl rounded-3xl p-6 sm:p-8 border-4 shadow-2xl space-y-6 ${
              highContrast
                ? 'bg-black text-yellow-300 border-yellow-400'
                : 'bg-white text-slate-900 border-amber-500'
            }`}
          >
            <div className="flex items-center justify-between border-b-2 pb-4 border-slate-200">
              <div className="flex items-center gap-3">
                <Pill className="w-8 h-8 text-amber-600" aria-hidden="true" />
                <h3 className="text-2xl font-extrabold">Add New Medicine</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                type="button"
                className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleAddMedication} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-lg font-extrabold">
                    Medicine Name (Dawai Ka Naam):
                  </label>
                  <AudioInputButton
                    onTranscript={(text) =>
                      setNewMedName((prev) => (prev ? `${prev} ${text}` : text))
                    }
                    label="Speak Name"
                    highContrast={highContrast}
                  />
                </div>
                <input
                  type="text"
                  required
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  placeholder="e.g. Amlodipine 5mg or Crocin"
                  className="w-full p-4 rounded-2xl border-2 border-slate-300 text-lg font-medium text-slate-900 bg-amber-50/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-lg font-extrabold mb-1">Dosage:</label>
                  <input
                    type="text"
                    value={newDosage}
                    onChange={(e) => setNewDosage(e.target.value)}
                    placeholder="e.g. 1 tablet"
                    className="w-full p-4 rounded-2xl border-2 border-slate-300 text-lg font-medium text-slate-900 bg-amber-50/50"
                  />
                </div>

                <div>
                  <label className="block text-lg font-extrabold mb-1">Time of Day:</label>
                  <select
                    value={newTimeOfDay}
                    onChange={(e: any) => setNewTimeOfDay(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-slate-300 text-lg font-medium text-slate-900 bg-amber-50/50"
                  >
                    <option value="morning">Morning (Subah)</option>
                    <option value="afternoon">Afternoon (Dopahar)</option>
                    <option value="evening">Evening (Raat)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-lg font-extrabold mb-1">Instructions:</label>
                <input
                  type="text"
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="e.g. Take with warm water after breakfast"
                  className="w-full p-4 rounded-2xl border-2 border-slate-300 text-lg font-medium text-slate-900 bg-amber-50/50"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-lg bg-slate-200 text-slate-800 hover:bg-slate-300 min-h-[56px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 rounded-2xl font-black text-lg bg-amber-600 text-white hover:bg-amber-700 min-h-[56px] shadow-lg cursor-pointer"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              className="px-4 py-2 font-bold bg-amber-200 rounded-xl min-h-[48px] cursor-pointer"
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
                className="px-4 py-2.5 rounded-xl font-bold bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-2 min-h-[48px] cursor-pointer"
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
