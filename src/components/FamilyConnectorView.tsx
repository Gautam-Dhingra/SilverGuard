import React, { useState } from 'react';
import {
  Users,
  Heart,
  MessageCircle,
  Sparkles,
  Volume2,
  Send,
  Copy,
  Check,
  Mic,
} from 'lucide-react';
import { FamilyUpdate } from '../types';
import { draftFamilyReply } from '../services/geminiService';

interface FamilyConnectorViewProps {
  highContrast: boolean;
  onReadAloud: (text: string) => void;
}

export const FamilyConnectorView: React.FC<FamilyConnectorViewProps> = ({
  highContrast,
  onReadAloud,
}) => {
  const [updates] = useState<FamilyUpdate[]>([
    {
      id: '1',
      senderName: 'Sarah (Daughter)',
      relation: 'Daughter',
      message:
        'Hi Grandma! Tommy scored two goals at his soccer match today! We missed you and hope you are having a wonderful Friday. Sending big hugs!',
      date: 'Today at 10:15 AM',
      photoUrl:
        'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80',
      unread: true,
    },
    {
      id: '2',
      senderName: 'David (Son)',
      relation: 'Son',
      message:
        'Good morning Mom! Just checking in to see if you need any groceries or medicine picked up this weekend?',
      date: 'Yesterday at 4:30 PM',
      unread: false,
    },
  ]);

  const [activeUpdate, setActiveUpdate] = useState<FamilyUpdate>(updates[0]);
  const [intention, setIntention] = useState('');
  const [draftReply, setDraftReply] = useState<string | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDraft = async () => {
    if (!intention.trim() || isDrafting) return;

    setIsDrafting(true);
    setDraftReply(null);

    try {
      const draft = await draftFamilyReply(activeUpdate.message, intention);
      setDraftReply(draft);
      onReadAloud(`Drafted reply: ${draft}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDrafting(false);
    }
  };

  const copyReply = () => {
    if (draftReply) {
      navigator.clipboard.writeText(draftReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className={`p-6 rounded-3xl border-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          highContrast
            ? 'bg-zinc-950 text-yellow-300 border-yellow-400'
            : 'bg-rose-900 text-white border-rose-700'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-500 text-slate-950 rounded-2xl shrink-0">
            <Heart className="w-10 h-10" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Family & Social Updates
            </h2>
            <p className="text-base sm:text-lg font-semibold opacity-90 mt-1">
              Stay connected with your children and grandchildren effortlessly.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Family Message Selector List */}
        <div className="space-y-3">
          <h3 className="text-xl font-extrabold">Recent Family Messages:</h3>

          {updates.map((update) => (
            <button
              key={update.id}
              onClick={() => {
                setActiveUpdate(update);
                setDraftReply(null);
                setIntention('');
              }}
              type="button"
              className={`w-full p-4 rounded-3xl border-4 text-left transition-all min-h-[72px] ${
                activeUpdate.id === update.id
                  ? 'bg-rose-600 text-white border-rose-700 ring-4 ring-rose-300 scale-[1.02]'
                  : highContrast
                  ? 'bg-black border-yellow-400 text-white'
                  : 'bg-white border-amber-200 text-slate-900 hover:bg-rose-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xl">{update.senderName}</span>
                <span className="text-xs font-bold opacity-80">{update.date}</span>
              </div>
              <p className="text-base font-medium line-clamp-2 mt-1 opacity-90">
                {update.message}
              </p>
            </button>
          ))}
        </div>

        {/* Active Update Details & Reply Assistant */}
        <div className="lg:col-span-2 space-y-6">
          <div
            className={`rounded-3xl border-4 p-6 shadow-xl space-y-4 ${
              highContrast
                ? 'bg-black border-yellow-400 text-white'
                : 'bg-white border-amber-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b-2 pb-3 border-slate-200">
              <div>
                <span className="text-sm font-extrabold text-rose-600 uppercase">
                  Message from {activeUpdate.relation}
                </span>
                <h3 className="text-2xl font-black">{activeUpdate.senderName}</h3>
              </div>

              <button
                onClick={() => onReadAloud(activeUpdate.message)}
                type="button"
                className="px-4 py-2.5 rounded-xl font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 text-base min-h-[48px] flex items-center gap-2"
              >
                <Volume2 className="w-5 h-5 text-amber-700" aria-hidden="true" />
                <span>Read Message</span>
              </button>
            </div>

            <p className="text-xl font-medium leading-relaxed bg-amber-50/80 p-5 rounded-2xl border border-amber-200 text-slate-900">
              "{activeUpdate.message}"
            </p>

            {/* Photo Attachment if present */}
            {activeUpdate.photoUrl && (
              <div className="rounded-2xl overflow-hidden border-2 border-amber-200 max-h-72">
                <img
                  src={activeUpdate.photoUrl}
                  alt={`Photo sent by ${activeUpdate.senderName}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* AI Reply Assistant Box */}
            <div className="pt-4 space-y-3 border-t-2 border-slate-200">
              <h4 className="text-xl font-extrabold">
                💖 Draft a Reply with AI Assistant:
              </h4>

              <input
                type="text"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="What do you want to say? e.g. 'Tell Tommy I am so proud of his goals!'"
                className={`w-full p-4 rounded-2xl border-3 text-lg font-medium focus-visible:outline-none focus-visible:ring-4 ${
                  highContrast
                    ? 'bg-zinc-900 border-yellow-400 text-white placeholder:text-zinc-500'
                    : 'bg-amber-50 border-amber-300 text-slate-900 placeholder:text-slate-400'
                }`}
              />

              <button
                onClick={handleDraft}
                disabled={!intention.trim() || isDrafting}
                type="button"
                className="w-full py-4 rounded-2xl font-black text-xl bg-rose-700 text-white hover:bg-rose-800 disabled:opacity-50 min-h-[60px] shadow-lg flex items-center justify-center gap-2 focus-visible:ring-4"
              >
                {isDrafting ? (
                  <>
                    <Sparkles className="w-6 h-6 animate-spin" aria-hidden="true" />
                    <span>Writing Loving Reply...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" aria-hidden="true" />
                    <span>Draft Warm Text Message</span>
                  </>
                )}
              </button>
            </div>

            {/* Draft Result */}
            {draftReply && (
              <div className="p-5 rounded-2xl bg-rose-50 border-3 border-rose-400 text-slate-900 space-y-3">
                <h5 className="text-lg font-extrabold text-rose-900">
                  Your Polished Reply Draft:
                </h5>
                <p className="text-xl font-medium bg-white p-4 rounded-xl border border-rose-200">
                  "{draftReply}"
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={copyReply}
                    type="button"
                    className="flex-1 px-5 py-3 rounded-xl font-black bg-rose-700 text-white hover:bg-rose-800 min-h-[52px] flex items-center justify-center gap-2 text-lg"
                  >
                    {copied ? (
                      <>
                        <Check className="w-6 h-6" aria-hidden="true" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-6 h-6" aria-hidden="true" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onReadAloud(draftReply)}
                    type="button"
                    className="px-5 py-3 rounded-xl font-bold bg-white text-slate-900 border-2 border-slate-300 hover:bg-slate-100 min-h-[52px] flex items-center gap-2"
                  >
                    <Volume2 className="w-5 h-5" aria-hidden="true" />
                    <span>Listen</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
