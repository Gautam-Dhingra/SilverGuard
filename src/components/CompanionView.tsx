import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  Send,
  Volume2,
  Sparkles,
  HelpCircle,
  Sun,
  ShieldCheck,
  RotateCcw,
  Bot,
  User,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { sendCompanionChatMessage } from '../services/geminiService';

interface CompanionViewProps {
  highContrast: boolean;
  fontSize: string;
  onReadAloud: (text: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const CompanionView: React.FC<CompanionViewProps> = ({
  highContrast,
  fontSize,
  onReadAloud,
  onNavigateToTab,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: "Good morning! I am SilverGuard, your personal daily companion. How are you feeling today? You can ask me anything about managing your day, understanding bills, setting reminders, or staying safe online.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'Check my daily pills',
        'Is my latest bill correct?',
        'How do I video call my family?',
        'Tell me a warm joke',
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Format previous messages for AI
    const history = messages
      .slice(-6)
      .map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: m.text }],
      }));

    history.push({
      role: 'user',
      parts: [{ text: text.trim() }],
    });

    try {
      const responseText = await sendCompanionChatMessage(history);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      // Speak AI response for convenience
      onReadAloud(responseText);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Morning Proactive Check-In Banner */}
      <div
        className={`p-6 rounded-3xl border-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          highContrast
            ? 'bg-zinc-950 text-yellow-300 border-yellow-400'
            : 'bg-gradient-to-r from-amber-100 to-amber-50 text-slate-900 border-amber-300'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shrink-0">
            <Sun className="w-10 h-10 animate-spin-slow" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Today's Overview
            </h2>
            <p className="text-base sm:text-lg font-semibold opacity-90 mt-1">
              You have 2 morning medications scheduled for 9:00 AM, and 1 new message from family.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => onNavigateToTab('medications')}
            type="button"
            className="flex-1 md:flex-none px-5 py-3 rounded-2xl font-black bg-amber-700 text-white hover:bg-amber-800 text-base sm:text-lg min-h-[56px]"
          >
            Check Pills
          </button>
          <button
            onClick={() => onNavigateToTab('family-social')}
            type="button"
            className="flex-1 md:flex-none px-5 py-3 rounded-2xl font-black bg-emerald-700 text-white hover:bg-emerald-800 text-base sm:text-lg min-h-[56px]"
          >
            Family Updates
          </button>
        </div>
      </div>

      {/* Main Companion Chat Log */}
      <div
        className={`rounded-3xl border-4 p-4 sm:p-6 shadow-xl space-y-6 ${
          highContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-white border-amber-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between border-b-2 pb-4 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600 text-white rounded-2xl">
              <Sparkles className="w-7 h-7" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold">
                Ask SilverGuard AI
              </h3>
              <p className="text-sm sm:text-base font-semibold opacity-80">
                Warm, patient answers in simple terms
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              onReadAloud(
                messages[messages.length - 1]?.text || 'No message to read'
              )
            }
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 text-base min-h-[48px]"
            aria-label="Read last message aloud"
          >
            <Volume2 className="w-5 h-5" aria-hidden="true" />
            <span className="hidden sm:inline">Read Aloud</span>
          </button>
        </div>

        {/* Message Cards */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {messages.map((msg) => {
            const isAsst = msg.sender === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-3xl border-2 transition-all ${
                  isAsst
                    ? highContrast
                      ? 'bg-zinc-900 border-yellow-400 text-yellow-300'
                      : 'bg-amber-50/90 border-amber-300 text-slate-900'
                    : highContrast
                    ? 'bg-yellow-400 border-yellow-300 text-black ml-auto max-w-2xl'
                    : 'bg-amber-700 text-white border-amber-800 ml-auto max-w-2xl'
                }`}
              >
                <div
                  className={`p-2.5 rounded-2xl shrink-0 h-fit ${
                    isAsst
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-white'
                  }`}
                >
                  {isAsst ? (
                    <Bot className="w-7 h-7" aria-hidden="true" />
                  ) : (
                    <User className="w-7 h-7" aria-hidden="true" />
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base sm:text-lg">
                      {isAsst ? 'SilverGuard Assistant' : 'You'}
                    </span>
                    <span className="text-xs sm:text-sm opacity-75">{msg.timestamp}</span>
                  </div>

                  <p className="text-lg sm:text-xl font-medium leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>

                  {/* Quick Action Suggestion Chips */}
                  {msg.suggestedActions && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {msg.suggestedActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(action)}
                          type="button"
                          className="px-4 py-2.5 rounded-xl font-bold text-base bg-amber-200 text-amber-950 hover:bg-amber-300 min-h-[48px] border border-amber-400 focus-visible:ring-4"
                        >
                          👉 {action}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Read Aloud Button per message */}
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      onClick={() => onReadAloud(msg.text)}
                      type="button"
                      className="text-xs sm:text-sm font-bold flex items-center gap-1.5 opacity-80 hover:opacity-100 p-1 underline"
                      aria-label="Read this response aloud"
                    >
                      <Volume2 className="w-4 h-4" aria-hidden="true" />
                      <span>Listen</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="p-4 rounded-2xl bg-amber-100 text-amber-950 font-bold animate-pulse flex items-center gap-3 text-lg">
              <Sparkles className="w-6 h-6 animate-spin" aria-hidden="true" />
              <span>SilverGuard is thinking and writing a clear answer for you...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex flex-col sm:flex-row gap-3 pt-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question here in plain words..."
            className={`flex-1 p-4 sm:p-5 rounded-2xl border-3 font-medium text-lg sm:text-xl focus-visible:outline-none focus-visible:ring-4 ${
              highContrast
                ? 'bg-zinc-900 border-yellow-400 text-white placeholder:text-zinc-500'
                : 'bg-white border-amber-300 text-slate-900 placeholder:text-slate-400'
            }`}
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-8 py-4 sm:py-5 rounded-2xl font-black text-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 min-h-[64px] flex items-center justify-center gap-2 shadow-lg focus-visible:ring-4"
          >
            <span>Ask AI</span>
            <Send className="w-6 h-6" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
};
