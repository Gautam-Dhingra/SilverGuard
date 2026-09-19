import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Volume2,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { ScamAnalysisResult } from '../types';
import { analyzeScamOrBillContent } from '../services/geminiService';
import { AudioInputButton } from './AudioInputButton';
import { getSecure, saveSecure } from '../services/cryptoStorage';

export const SCAM_CHECKER_LOCAL_STORAGE_KEY = 'silverguard_scam_checks_v1';

interface ScamCheckerNavProps {
  highContrast: boolean;
  onReadAloud: (text: string) => void;
}

export const ScamCheckerNav: React.FC<ScamCheckerNavProps> = ({
  highContrast,
  onReadAloud,
}) => {
  const [inputText, setInputText] = useState('');
  const [analysis, setAnalysis] = useState<ScamAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    getSecure<ScamAnalysisResult | null>(SCAM_CHECKER_LOCAL_STORAGE_KEY, null).then((saved) => {
      if (saved) {
        setAnalysis(saved);
      }
    });
  }, []);

  const sampleInputs = [
    {
      title: 'Electricity Power Disconnection SMS',
      text: 'Dear Consumer, your electricity power line will be disconnected tonight at 9:30 PM from discom office due to previous month bill update. Immediately call Electricity Officer at 9812345678 to avoid blackouts.',
    },
    {
      title: 'SBI / HDFC YONO APK Scam',
      text: 'SBI Urgent Notice: Dear customer, your YONO NetBanking account is suspended due to pending Aadhaar KYC. Download & install SBI_YONO_Unblock.apk file immediately to verify account.',
    },
    {
      title: 'TRAI / Police Digital Arrest Scam',
      text: 'TRAI Urgent Alert: Your mobile number is associated with illegal financial harassment and money laundering. CBI / Cyber Police has issued arrest warrant. Stay on call or face immediate police visit.',
    },
    {
      title: 'Legitimate BSES Electricity Bill',
      text: 'BSES Rajdhani Power Limited: Your monthly electricity bill for August is ₹2,450. Due date is 25th Sept. Pay online via official BSES portal or Paytm with Bill ID 400192837.',
    },
  ];

  const handleAnalyze = async (textToTest?: string) => {
    const text = textToTest || inputText;
    if (!text.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const result = await analyzeScamOrBillContent(text);
      setAnalysis(result);
      saveSecure(SCAM_CHECKER_LOCAL_STORAGE_KEY, result);
      onReadAloud(`${result.title}. ${result.simpleSummary}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyDraft = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div
        className={`p-6 rounded-3xl border-4 shadow-lg flex items-center justify-between gap-4 ${
          highContrast
            ? 'bg-zinc-950 text-yellow-300 border-yellow-400'
            : 'bg-emerald-900 text-white border-emerald-700'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500 text-slate-950 rounded-2xl shrink-0">
            <ShieldCheck className="w-10 h-10" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Indian Scam & Bill Safeguard (Khatra & Bijli Bill Checker)
            </h2>
            <p className="text-base sm:text-lg font-semibold opacity-90 mt-1">
              Speak or paste any SMS, WhatsApp text, APK link, or electricity bill. SilverGuard AI will check for fraud and guide you safely in simple language.
            </p>
          </div>
        </div>
      </div>

      {/* Input Box & Preset Samples */}
      <div
        className={`rounded-3xl border-4 p-6 shadow-xl space-y-4 ${
          highContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-white border-amber-200 text-slate-900'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="scam-input-text"
            className="block text-xl font-extrabold"
          >
            Type, Paste, or Speak Message Below:
          </label>

          <AudioInputButton
            onTranscript={(text) =>
              setInputText((prev) => (prev ? `${prev} ${text}` : text))
            }
            label="Speak Message (Awaaz Se Bolen)"
            highContrast={highContrast}
          />
        </div>

        <textarea
          id="scam-input-text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={4}
          placeholder="Paste suspicious SMS, WhatsApp message, electricity bill, or speak using the voice button..."
          className={`w-full p-4 rounded-2xl border-3 text-lg font-medium focus-visible:outline-none focus-visible:ring-4 ${
            highContrast
              ? 'bg-zinc-900 border-yellow-400 text-white placeholder:text-zinc-500'
              : 'bg-amber-50 border-amber-300 text-slate-900 placeholder:text-slate-400'
          }`}
        />

        <button
          onClick={() => handleAnalyze()}
          disabled={!inputText.trim() || isAnalyzing}
          type="button"
          className="w-full py-4 rounded-2xl font-black text-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 min-h-[60px] shadow-lg flex items-center justify-center gap-2 focus-visible:ring-4 cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <Sparkles className="w-6 h-6 animate-spin" aria-hidden="true" />
              <span>Checking Fraud Risk & Simplifying...</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-6 h-6" aria-hidden="true" />
              <span>Inspect Document / Message Now</span>
            </>
          )}
        </button>
      </div>

      {/* Analysis Output Section */}
      {analysis && (
        <div
          className={`rounded-3xl border-4 p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in ${
            analysis.riskLevel === 'high_risk'
              ? 'bg-red-50 text-red-950 border-red-600'
              : analysis.riskLevel === 'caution'
              ? 'bg-amber-50 text-amber-950 border-amber-500'
              : 'bg-emerald-50 text-emerald-950 border-emerald-600'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 pb-4 border-slate-300">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl text-white ${
                  analysis.riskLevel === 'high_risk'
                    ? 'bg-red-600'
                    : analysis.riskLevel === 'caution'
                    ? 'bg-amber-600'
                    : 'bg-emerald-600'
                }`}
              >
                {analysis.riskLevel === 'high_risk' ? (
                  <AlertTriangle className="w-8 h-8" aria-hidden="true" />
                ) : analysis.riskLevel === 'caution' ? (
                  <AlertTriangle className="w-8 h-8" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
                )}
              </div>

              <div>
                <span className="text-sm font-extrabold uppercase tracking-wide">
                  Analysis Result (Risk Score: {analysis.riskScore}/100)
                </span>
                <h3 className="text-2xl sm:text-3xl font-black">
                  {analysis.title}
                </h3>
              </div>
            </div>

            <button
              onClick={() =>
                onReadAloud(`${analysis.title}. ${analysis.simpleSummary}`)
              }
              type="button"
              className="px-4 py-2.5 rounded-xl font-bold bg-white text-slate-900 border-2 border-slate-300 hover:bg-slate-100 text-base min-h-[48px] flex items-center gap-2 cursor-pointer"
            >
              <Volume2 className="w-5 h-5 text-amber-700" aria-hidden="true" />
              <span>Read Aloud</span>
            </button>
          </div>

          {/* Simple Explanation */}
          <div className="space-y-2">
            <h4 className="text-xl font-extrabold">Simple Explanation:</h4>
            <p className="text-lg sm:text-xl font-medium leading-relaxed bg-white/80 p-4 rounded-2xl border border-slate-200">
              {analysis.simpleSummary}
            </p>
          </div>

          {/* Red Flags Identified */}
          {analysis.redFlags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xl font-extrabold text-red-800">
                ⚠️ Warning Flags Identified:
              </h4>
              <ul className="space-y-2">
                {analysis.redFlags.map((flag, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-lg font-bold bg-red-100 text-red-950 p-3.5 rounded-xl border border-red-300"
                  >
                    <span className="shrink-0 text-xl">❌</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Action Checklist */}
          <div className="space-y-2">
            <h4 className="text-xl font-extrabold">
              👉 What You Should Do Right Now:
            </h4>
            <ol className="space-y-2">
              {analysis.recommendedSteps.map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-lg font-bold bg-white text-slate-900 p-3.5 rounded-xl border border-slate-300"
                >
                  <span className="shrink-0 text-xl font-extrabold text-emerald-700">
                    {i + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Safe Reply Draft */}
          {analysis.safeReplyDraft && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xl font-extrabold">Safe Suggested Reply:</h4>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex-1 p-4 rounded-xl bg-slate-900 text-white font-mono text-base">
                  "{analysis.safeReplyDraft}"
                </div>
                <button
                  onClick={() => copyDraft(analysis.safeReplyDraft!)}
                  type="button"
                  className="px-5 py-3 rounded-xl font-bold bg-amber-600 text-white hover:bg-amber-700 min-h-[52px] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" aria-hidden="true" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" aria-hidden="true" />
                      <span>Copy Safe Reply</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
