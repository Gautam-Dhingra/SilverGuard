import React, { useState, useEffect } from 'react';
import {
  Users,
  Heart,
  Plus,
  Trash2,
  Sparkles,
  Volume2,
  Copy,
  Check,
  UserPlus,
  MessageSquare,
  X,
} from 'lucide-react';
import { FamilyUpdate } from '../types';
import { draftFamilyReply } from '../services/geminiService';
import { AudioInputButton } from './AudioInputButton';

interface FamilyConnectorViewProps {
  highContrast: boolean;
  onReadAloud: (text: string) => void;
}

const LOCAL_STORAGE_KEY = 'silverguard_family_contacts_messages_v2';

export const FamilyConnectorView: React.FC<FamilyConnectorViewProps> = ({
  highContrast,
  onReadAloud,
}) => {
  const [updates, setUpdates] = useState<FamilyUpdate[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    // Default: Empty list or initial prompt (NO fake hardcoded random data)
    return [];
  });

  const [activeUpdate, setActiveUpdate] = useState<FamilyUpdate | null>(
    updates.length > 0 ? updates[0] : null
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSenderName, setNewSenderName] = useState('');
  const [newRelation, setNewRelation] = useState('Beta (Son)');
  const [newMessage, setNewMessage] = useState('');

  const [intention, setIntention] = useState('');
  const [draftReply, setDraftReply] = useState<string | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updates));
    } catch (e) {
      console.error(e);
    }
    if (updates.length > 0 && !activeUpdate) {
      setActiveUpdate(updates[0]);
    }
  }, [updates, activeUpdate]);

  const handleAddFamilyMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSenderName.trim() || !newMessage.trim()) return;

    const newUpdateItem: FamilyUpdate = {
      id: Date.now().toString(),
      senderName: newSenderName.trim(),
      relation: newRelation.trim(),
      message: newMessage.trim(),
      date: 'Just now',
      unread: true,
    };

    const updatedList = [newUpdateItem, ...updates];
    setUpdates(updatedList);
    setActiveUpdate(newUpdateItem);

    // Reset Form
    setNewSenderName('');
    setNewMessage('');
    setIsAddModalOpen(false);

    onReadAloud(`Added family message from ${newSenderName}`);
  };

  const handleRemoveUpdate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = updates.filter((u) => u.id !== id);
    setUpdates(filtered);
    if (activeUpdate?.id === id) {
      setActiveUpdate(filtered.length > 0 ? filtered[0] : null);
    }
  };

  const handleDraft = async () => {
    if (!activeUpdate || !intention.trim() || isDrafting) return;

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
              Family & WhatsApp Updates (Parivar)
            </h2>
            <p className="text-base sm:text-lg font-semibold opacity-90 mt-1">
              Add your real family members and draft warm, loving replies in your own words.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          type="button"
          className="px-6 py-3.5 rounded-2xl font-extrabold text-lg bg-yellow-400 text-slate-950 hover:bg-yellow-300 min-h-[56px] flex items-center gap-2 shadow-lg shrink-0 cursor-pointer"
        >
          <UserPlus className="w-6 h-6" aria-hidden="true" />
          <span>+ Add Real Family Contact / Message</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Family Message Selector List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold">Family Messages:</h3>
            <span className="text-sm font-semibold opacity-80">
              {updates.length} Saved
            </span>
          </div>

          {updates.length === 0 ? (
            <div
              className={`p-6 rounded-3xl border-4 text-center space-y-4 ${
                highContrast
                  ? 'bg-black border-yellow-400 text-yellow-300'
                  : 'bg-rose-50 border-rose-200 text-slate-900'
              }`}
            >
              <Users className="w-12 h-12 mx-auto text-rose-600" aria-hidden="true" />
              <h4 className="text-xl font-extrabold">No Family Details Added Yet</h4>
              <p className="text-base font-medium opacity-90">
                We do not use fake family details! Please enter or speak your real family member’s name (e.g., Rohan - Beta, Pooja - Beti, Aarav - Pota) and their WhatsApp message.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                type="button"
                className="w-full py-3.5 rounded-2xl font-black text-lg bg-rose-700 text-white hover:bg-rose-800 min-h-[52px]"
              >
                + Enter Real Family Member Details
              </button>
            </div>
          ) : (
            updates.map((update) => (
              <div
                key={update.id}
                onClick={() => {
                  setActiveUpdate(update);
                  setDraftReply(null);
                  setIntention('');
                }}
                className={`w-full p-4 rounded-3xl border-4 text-left transition-all min-h-[72px] cursor-pointer relative ${
                  activeUpdate?.id === update.id
                    ? 'bg-rose-600 text-white border-rose-700 ring-4 ring-rose-300 scale-[1.02]'
                    : highContrast
                    ? 'bg-black border-yellow-400 text-white hover:bg-zinc-900'
                    : 'bg-white border-amber-200 text-slate-900 hover:bg-rose-50'
                }`}
              >
                <div className="flex items-center justify-between pr-8">
                  <span className="font-extrabold text-xl">{update.senderName}</span>
                  <span className="text-xs font-bold opacity-80">{update.date}</span>
                </div>
                <p className="text-base font-medium line-clamp-2 mt-1 opacity-90">
                  "{update.message}"
                </p>

                <button
                  onClick={(e) => handleRemoveUpdate(update.id, e)}
                  type="button"
                  className="absolute top-3 right-3 p-2 text-red-500 hover:bg-red-100 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center"
                  title="Remove contact"
                >
                  <Trash2 className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Active Update Details & Reply Assistant */}
        <div className="lg:col-span-2 space-y-6">
          {activeUpdate ? (
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
                    Relation: {activeUpdate.relation}
                  </span>
                  <h3 className="text-2xl font-black">{activeUpdate.senderName}</h3>
                </div>

                <button
                  onClick={() => onReadAloud(activeUpdate.message)}
                  type="button"
                  className="px-4 py-2.5 rounded-xl font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 text-base min-h-[48px] flex items-center gap-2 cursor-pointer"
                >
                  <Volume2 className="w-5 h-5 text-amber-700" aria-hidden="true" />
                  <span>Read Message Aloud</span>
                </button>
              </div>

              <div className="bg-amber-50/90 p-5 rounded-2xl border border-amber-200 text-slate-900 space-y-2">
                <span className="text-xs font-bold text-slate-600 uppercase">
                  Message Received:
                </span>
                <p className="text-xl font-medium leading-relaxed">
                  "{activeUpdate.message}"
                </p>
              </div>

              {/* AI Reply Assistant Box with Audio Input */}
              <div className="pt-4 space-y-3 border-t-2 border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xl font-extrabold">
                    💖 Draft Warm WhatsApp Reply:
                  </h4>
                  <AudioInputButton
                    onTranscript={(text) =>
                      setIntention((prev) => (prev ? `${prev} ${text}` : text))
                    }
                    label="Voice Input (Awaaz Se Bolen)"
                    highContrast={highContrast}
                  />
                </div>

                <input
                  type="text"
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  placeholder="What do you want to say? e.g. 'Tell Rohan I am so proud of him and blessing him always!'"
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
                  className="w-full py-4 rounded-2xl font-black text-xl bg-rose-700 text-white hover:bg-rose-800 disabled:opacity-50 min-h-[60px] shadow-lg flex items-center justify-center gap-2 focus-visible:ring-4 cursor-pointer"
                >
                  {isDrafting ? (
                    <>
                      <Sparkles className="w-6 h-6 animate-spin" aria-hidden="true" />
                      <span>Writing Loving Reply in Your Voice...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" aria-hidden="true" />
                      <span>Draft Warm Text Response</span>
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
                  <p className="text-xl font-medium bg-white p-4 rounded-xl border border-rose-200 leading-relaxed">
                    "{draftReply}"
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={copyReply}
                      type="button"
                      className="flex-1 px-5 py-3 rounded-xl font-black bg-rose-700 text-white hover:bg-rose-800 min-h-[52px] flex items-center justify-center gap-2 text-lg cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-6 h-6" aria-hidden="true" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-6 h-6" aria-hidden="true" />
                          <span>Copy Response for WhatsApp</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onReadAloud(draftReply)}
                      type="button"
                      className="px-5 py-3 rounded-xl font-bold bg-white text-slate-900 border-2 border-slate-300 hover:bg-slate-100 min-h-[52px] flex items-center gap-2 cursor-pointer"
                    >
                      <Volume2 className="w-5 h-5" aria-hidden="true" />
                      <span>Listen</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`rounded-3xl border-4 p-8 text-center space-y-4 ${
                highContrast
                  ? 'bg-black border-yellow-400 text-yellow-300'
                  : 'bg-white border-amber-200 text-slate-900'
              }`}
            >
              <Heart className="w-16 h-16 mx-auto text-rose-500" aria-hidden="true" />
              <h3 className="text-2xl font-black">No Active Family Message Selected</h3>
              <p className="text-lg font-semibold opacity-90 max-w-md mx-auto">
                Tap the yellow "+ Add Real Family Contact / Message" button above to enter your son, daughter, or grandchild's real message!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal to Add Real Family Member or Message */}
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
                : 'bg-white text-slate-900 border-rose-500'
            }`}
          >
            <div className="flex items-center justify-between border-b-2 pb-4 border-slate-200">
              <div className="flex items-center gap-3">
                <UserPlus className="w-8 h-8 text-rose-600" aria-hidden="true" />
                <h3 className="text-2xl font-extrabold">Add Real Family Details</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                type="button"
                className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 min-h-[48px] min-w-[48px] flex items-center justify-center"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleAddFamilyMessage} className="space-y-4">
              <div>
                <label className="block text-lg font-extrabold mb-1">
                  Family Member Name (Naam):
                </label>
                <input
                  type="text"
                  required
                  value={newSenderName}
                  onChange={(e) => setNewSenderName(e.target.value)}
                  placeholder="e.g. Rohan (Son) or Pooja (Beti) or Aarav (Pota)"
                  className="w-full p-4 rounded-2xl border-2 border-slate-300 text-lg font-medium text-slate-900 bg-amber-50/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-lg font-extrabold mb-1">
                  Relationship (Rishta):
                </label>
                <select
                  value={newRelation}
                  onChange={(e) => setNewRelation(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-slate-300 text-lg font-medium text-slate-900 bg-amber-50/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500"
                >
                  <option value="Beta (Son)">Beta (Son)</option>
                  <option value="Beti (Daughter)">Beti (Daughter)</option>
                  <option value="Pota / Poti (Grandchild)">Pota / Poti (Grandchild)</option>
                  <option value="Bahu / Jamai (In-law)">Bahu / Jamai (In-law)</option>
                  <option value="Bhai / Behen (Sibling)">Bhai / Behen (Sibling)</option>
                  <option value="Dost / Neighbor">Dost / Neighbor</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-lg font-extrabold">
                    WhatsApp Message Received:
                  </label>
                  <AudioInputButton
                    onTranscript={(text) =>
                      setNewMessage((prev) => (prev ? `${prev} ${text}` : text))
                    }
                    label="Speak Message"
                    highContrast={highContrast}
                  />
                </div>
                <textarea
                  required
                  rows={3}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type or speak message e.g. 'Good morning Papa Ji! Hope you took your morning BP pill today. Love you!'"
                  className="w-full p-4 rounded-2xl border-2 border-slate-300 text-lg font-medium text-slate-900 bg-amber-50/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500"
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
                  className="flex-1 py-4 rounded-2xl font-black text-lg bg-rose-700 text-white hover:bg-rose-800 min-h-[56px] shadow-lg"
                >
                  Save Real Family Detail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
