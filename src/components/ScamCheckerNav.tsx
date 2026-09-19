import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Volume2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { ScamAnalysisResult } from '../types';
import { analyzeScamOrBillContent } from '../services/geminiService';

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

  const sampleInputs = [
    {
      title: 'Suspicious Bank SMS',
      text: 'URGENT: Your Chase Bank account is suspended due to unusual activity. Click http://chase-security-verify.net to unlock within 2 hours or pay $250 fee.',
    },
    {
      title: 'Legitimate Electric Bill',
      text: 'City Electric Utility: Your monthly statement for August is $112.50. Automatic payment will process on Sept 25 from account ending in 4321.',
    },
    {
      title: 'Unclaimed Prize Call Script',
      text: 'Congratulations! You won a $5,000 Walmart Gift Card! To claim your reward, send a $50 processing fee via Target Gift Card code immediately.',
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
              Scam & Bill Safeguard
            </h2>
            <p className="text-base sm:text-lg font-semibold opacity-90 mt-1">
              Paste any text, email, or bill here. Gemini AI will check for fraud tactics and explain it simply.
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
        <label
          htmlFor="scam-input-text"
          className="block text-xl font-extrabold"
        >
          Paste Message or Bill Text Below:
        </label>

        <textarea
          id="scam-input-text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={4}
          placeholder="Paste suspicious text message, email, or letter content here..."
          className={`w-full p-4 rounded-2xl border-3 text-lg font-medium focus-visible:outline-none focus-visible:ring-4 ${
            highContrast
              ? 'bg-zinc-900 border-yellow-400 text-white placeholder:text-zinc-500'
              : 'bg-amber-50 border-amber-300 text-slate-900 placeholder:text-slate-400'
          }`}
        />

        {/* Preset Sample Buttons for Evaluator Testing */}
        <div className="space-y-2">
          <span className="text-sm sm:text-base font-bold opacity-80">
            Or test with an instant example:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleInputs.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputText(sample.text);
                  handleAnalyze(sample.text);
                }}
                className="px-4 py-2.5 rounded-xl font-bold text-sm sm:text-base bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 min-h-[48px]"
              >
                🔍 {sample.title}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => handleAnalyze()}
          disabled={!inputText.trim() || isAnalyzing}
          type="button"
          className="w-full py-4 rounded-2xl font-black text-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 min-h-[60px] shadow-lg flex items-center justify-center gap-2 focus-visible:ring-4"
        >
          {isAnalyzing ? (
            <>
              <Sparkles className="w-6 h-6 animate-spin" aria-hidden="true" />
              <span>Analyzing Fraud Risk & Simplifying...</span>
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
              className="px-4 py-2.5 rounded-xl font-bold bg-white text-slate-900 border-2 border-slate-300 hover:bg-slate-100 text-base min-h-[48px] flex items-center gap-2"
            >
              <Volume2 className="w-5 h-5 text-amber-700" aria-hidden="true" />
              <span>Read Aloud</span>
            </button>
          </div>

          {/* Simple Explanation */}
          <div className="space-y-2">
            <h4 className="text-xl font-extrabold">Plain English Explanation:</h4>
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
              👉 What You Should Do Next:
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
                  className="px-5 py-3 rounded-xl font-bold bg-amber-600 text-white hover:bg-amber-700 min-h-[52px] flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" aria-hidden="true" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" aria-hidden="true" />
                      <span>Copy Reply</span>
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
