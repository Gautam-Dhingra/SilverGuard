import React, { useState } from 'react';
import {
  Stethoscope,
  Plus,
  Trash2,
  Sparkles,
  Volume2,
  Printer,
  CheckCircle2,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { generateDoctorPrepSheet } from '../services/geminiService';

interface DoctorPrepViewProps {
  highContrast: boolean;
  onReadAloud: (text: string) => void;
}

export const DoctorPrepView: React.FC<DoctorPrepViewProps> = ({
  highContrast,
  onReadAloud,
}) => {
  const [symptoms, setSymptoms] = useState<string[]>([
    'Mild knee pain when going down stairs',
    'Feeling a bit dizzy in the afternoon',
  ]);
  const [newSymptom, setNewSymptom] = useState('');

  const [medications] = useState<string[]>([
    'Lisinopril 10mg (Blood Pressure)',
    'Metformin 500mg (Blood Sugar)',
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [prepSheet, setPrepSheet] = useState<any | null>(null);

  const addSymptom = () => {
    if (newSymptom.trim()) {
      setSymptoms((prev) => [...prev, newSymptom.trim()]);
      setNewSymptom('');
    }
  };

  const removeSymptom = (index: number) => {
    setSymptoms((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setPrepSheet(null);

    try {
      const sheet = await generateDoctorPrepSheet(symptoms, medications);
      setPrepSheet(sheet);
      onReadAloud(
        `Doctor visit sheet generated! ${sheet.summary || 'Ready for your visit.'}`
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className={`p-6 rounded-3xl border-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          highContrast
            ? 'bg-zinc-950 text-yellow-300 border-yellow-400'
            : 'bg-blue-900 text-white border-blue-700'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500 text-slate-950 rounded-2xl shrink-0">
            <Stethoscope className="w-10 h-10" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Doctor Visit Prep Assistant
            </h2>
            <p className="text-base sm:text-lg font-semibold opacity-90 mt-1">
              Log your symptoms and concerns. AI will organize questions to ask your doctor.
            </p>
          </div>
        </div>
      </div>

      {/* Symptoms & Questions Logger */}
      <div
        className={`rounded-3xl border-4 p-6 shadow-xl space-y-6 ${
          highContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-white border-amber-200 text-slate-900'
        }`}
      >
        <h3 className="text-2xl font-extrabold">1. Log Your Symptoms & Questions:</h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={newSymptom}
            onChange={(e) => setNewSymptom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSymptom()}
            placeholder="Type e.g., 'Lower back ache in morning' or 'Question about prescription'..."
            className={`flex-1 p-4 rounded-2xl border-3 text-lg font-medium focus-visible:outline-none focus-visible:ring-4 ${
              highContrast
                ? 'bg-zinc-900 border-yellow-400 text-white placeholder:text-zinc-500'
                : 'bg-amber-50 border-amber-300 text-slate-900 placeholder:text-slate-400'
            }`}
          />
          <button
            onClick={addSymptom}
            type="button"
            className="px-6 py-4 rounded-2xl font-black text-xl bg-amber-600 text-white hover:bg-amber-700 min-h-[60px] flex items-center justify-center gap-2"
          >
            <Plus className="w-6 h-6" aria-hidden="true" />
            <span>Add</span>
          </button>
        </div>

        {/* List of Symptoms */}
        <div className="space-y-2">
          {symptoms.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-300 bg-amber-50 text-slate-900 text-lg font-bold"
            >
              <span>• {item}</span>
              <button
                onClick={() => removeSymptom(idx)}
                type="button"
                className="p-2 text-red-600 hover:bg-red-100 rounded-xl min-h-[48px] min-w-[48px] flex items-center justify-center"
                aria-label={`Remove symptom ${item}`}
              >
                <Trash2 className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={symptoms.length === 0 || isGenerating}
          type="button"
          className="w-full py-4 rounded-2xl font-black text-xl bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50 min-h-[64px] shadow-lg flex items-center justify-center gap-3 focus-visible:ring-4"
        >
          {isGenerating ? (
            <>
              <Sparkles className="w-6 h-6 animate-spin" aria-hidden="true" />
              <span>Generating Doctor Visit Summary Sheet...</span>
            </>
          ) : (
            <>
              <FileText className="w-6 h-6" aria-hidden="true" />
              <span>Generate Printable Doctor Sheet with AI</span>
            </>
          )}
        </button>
      </div>

      {/* Generated Doctor Sheet Output */}
      {prepSheet && (
        <div className="p-6 sm:p-8 rounded-3xl border-4 border-blue-600 bg-blue-50 text-slate-900 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 pb-4 border-blue-200">
            <div>
              <span className="text-sm font-extrabold uppercase text-blue-800">
                AI Doctor Visit Summary
              </span>
              <h3 className="text-2xl sm:text-3xl font-black">
                Doctor Appointment Cheat Sheet
              </h3>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  onReadAloud(
                    `${prepSheet.summary}. Questions to ask: ${prepSheet.questionsList.join(
                      ', '
                    )}`
                  )
                }
                type="button"
                className="px-4 py-2.5 rounded-xl font-bold bg-white text-blue-900 border-2 border-blue-300 hover:bg-blue-100 min-h-[48px] flex items-center gap-2"
              >
                <Volume2 className="w-5 h-5 text-blue-700" aria-hidden="true" />
                <span>Read Sheet</span>
              </button>

              <button
                onClick={() => window.print()}
                type="button"
                className="px-4 py-2.5 rounded-xl font-bold bg-blue-700 text-white hover:bg-blue-800 min-h-[48px] flex items-center gap-2"
              >
                <Printer className="w-5 h-5" aria-hidden="true" />
                <span>Print Sheet</span>
              </button>
            </div>
          </div>

          <p className="text-lg font-semibold leading-relaxed bg-white p-4 rounded-2xl border border-blue-200">
            {prepSheet.summary}
          </p>

          <div className="space-y-3">
            <h4 className="text-xl font-extrabold text-blue-950">
              📋 Questions to Ask Your Doctor:
            </h4>
            <ul className="space-y-2">
              {prepSheet.questionsList?.map((q: string, i: number) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-lg font-bold bg-white p-3.5 rounded-xl border border-blue-200"
                >
                  <span className="text-blue-700 font-black">❓</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xl font-extrabold text-blue-950">
              💊 Medication Review Notes:
            </h4>
            <p className="text-lg font-medium bg-white p-4 rounded-2xl border border-blue-200">
              {prepSheet.medicationsSummary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
