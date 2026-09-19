import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  Send,
  Volume2,
  Sparkles,
  Sun,
  Bot,
  User,
  Languages,
  Pill,
  Heart,
  Plus,
  CheckCircle2,
  Check,
  Share2,
  ArrowRight,
  MessageSquare,
  X,
  Users,
  AlertTriangle,
  Clock,
  Bell,
} from 'lucide-react';
import { ChatMessage, MedicationItem, FamilyUpdate, SeniorUserProfile, NavigationTab } from '../types';
import { sendCompanionChatMessage } from '../services/geminiService';
import { AudioInputButton } from './AudioInputButton';
import { VoiceAddMedicationModal } from './VoiceAddMedicationModal';
import { MEDS_LOCAL_STORAGE_KEY, PROFILE_LOCAL_STORAGE_KEY } from './UserProfileView';
import { getSecure, saveSecure } from '../services/cryptoStorage';

import { DOCTOR_PREP_LOCAL_STORAGE_KEY } from './DoctorPrepView';
import { SCAM_CHECKER_LOCAL_STORAGE_KEY } from './ScamCheckerNav';
import { ScamAnalysisResult } from '../types';
import { DoctorAppointmentBookingHelper } from './DoctorAppointmentBookingHelper';

const FAMILY_LOCAL_STORAGE_KEY = 'silverguard_family_contacts_messages_v2';

const defaultProfile: SeniorUserProfile = {
  seniorName: '',
  city: 'India',
  dailyRoutine: {
    wakeupTime: '06:30 AM',
    breakfastTime: '08:30 AM',
    lunchTime: '01:30 PM',
    eveningWalkTime: '05:30 PM',
    dinnerTime: '08:30 PM',
    bedTime: '10:00 PM',
    bpSugarCheckTime: 'Every morning after tea',
    specialNotes: 'Low salt diet',
  },
  emergencyContacts: [],
};

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
  const [selectedLanguage, setSelectedLanguage] = useState<
    'hi-IN' | 'en-IN' | 'ta-IN' | 'te-IN' | 'bn-IN' | 'mr-IN' | 'gu-IN' | 'pa-IN' | 'kn-IN' | 'ml-IN'
  >('hi-IN');

  const [profile, setProfile] = useState<SeniorUserProfile>(defaultProfile);
  const [meds, setMeds] = useState<MedicationItem[]>([]);
  const [familyUpdates, setFamilyUpdates] = useState<FamilyUpdate[]>([]);
  const [doctorSymptoms, setDoctorSymptoms] = useState<string[]>([]);
  const [scamLastCheck, setScamLastCheck] = useState<ScamAnalysisResult | null>(null);
  const isLoadedRef = useRef(false);

  // Load encrypted data safely on initial mount across all 5 app tabs
  useEffect(() => {
    let active = true;
    Promise.all([
      getSecure<SeniorUserProfile>(PROFILE_LOCAL_STORAGE_KEY, defaultProfile),
      getSecure<MedicationItem[]>(MEDS_LOCAL_STORAGE_KEY, []),
      getSecure<FamilyUpdate[]>(FAMILY_LOCAL_STORAGE_KEY, []),
      getSecure<string[]>(DOCTOR_PREP_LOCAL_STORAGE_KEY, []),
      getSecure<ScamAnalysisResult | null>(SCAM_CHECKER_LOCAL_STORAGE_KEY, null),
    ]).then(([p, m, f, d, s]) => {
      if (active) {
        if (p) setProfile(p);
        setMeds(Array.isArray(m) ? m : []);
        setFamilyUpdates(Array.isArray(f) ? f : []);
        setDoctorSymptoms(Array.isArray(d) ? d : []);
        if (s) setScamLastCheck(s);
        isLoadedRef.current = true;
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Re-sync state across all 5 tabs whenever storage or custom silverguard_data_updated event fires
  useEffect(() => {
    const handleSync = () => {
      getSecure<MedicationItem[]>(MEDS_LOCAL_STORAGE_KEY, []).then((parsed) => {
        if (parsed) {
          const safeParsed = Array.isArray(parsed) ? parsed : [];
          setMeds((prev) => (JSON.stringify(prev) === JSON.stringify(safeParsed) ? prev : safeParsed));
        }
      });

      getSecure<SeniorUserProfile>(PROFILE_LOCAL_STORAGE_KEY, defaultProfile).then((parsed) => {
        if (parsed) {
          setProfile((prev) => (JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed));
        }
      });

      getSecure<FamilyUpdate[]>(FAMILY_LOCAL_STORAGE_KEY, []).then((parsed) => {
        if (parsed) {
          const safeParsed = Array.isArray(parsed) ? parsed : [];
          setFamilyUpdates((prev) => (JSON.stringify(prev) === JSON.stringify(safeParsed) ? prev : safeParsed));
        }
      });

      getSecure<string[]>(DOCTOR_PREP_LOCAL_STORAGE_KEY, []).then((parsed) => {
        if (parsed) {
          const safeParsed = Array.isArray(parsed) ? parsed : [];
          setDoctorSymptoms((prev) => (JSON.stringify(prev) === JSON.stringify(safeParsed) ? prev : safeParsed));
        }
      });

      getSecure<ScamAnalysisResult | null>(SCAM_CHECKER_LOCAL_STORAGE_KEY, null).then((parsed) => {
        if (parsed) {
          setScamLastCheck(parsed);
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

  // Save changes securely ONLY after initial load completes
  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveSecure(MEDS_LOCAL_STORAGE_KEY, Array.isArray(meds) ? meds : []);
  }, [meds]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveSecure(FAMILY_LOCAL_STORAGE_KEY, Array.isArray(familyUpdates) ? familyUpdates : []);
  }, [familyUpdates]);

  // Modals for adding medicine & family update from Daily Helper
  const [isAddMedModalOpen, setIsAddMedModalOpen] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('1 tablet');
  const [newMedTimeOfDay, setNewMedTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  const [isAddFamilyMsgOpen, setIsAddFamilyMsgOpen] = useState(false);
  const [familySenderName, setFamilySenderName] = useState('');
  const [familyRelation, setFamilyRelation] = useState('Beta (Son)');
  const [familyMessageText, setFamilyMessageText] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: "Namaste! Main SilverGuard, aapka personal daily AI companion. How are you feeling today? Ask me anything in English, Hindi, Hinglish or your regional language — about daily medicines, suspicious SMS/bills, or family messages!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'Aaj ki dawai schedule batao (Check Pills)',
        'Electricity bill ya SMS scam check karo',
        'Doctor se milne se pehle kya poochun?',
        'Family ko WhatsApp reply draft karo',
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSectionRef = useRef<HTMLDivElement>(null);
  const bookingHelperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Helper to toggle medicine taken
  const toggleMedTaken = (id: string) => {
    setMeds((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextTaken = !m.takenToday;
          const time = nextTaken
            ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : undefined;
          onReadAloud(
            nextTaken
              ? `Marked ${m.name} as taken!`
              : `Marked ${m.name} as not taken yet.`
          );
          return { ...m, takenToday: nextTaken, takenTime: time };
        }
        return m;
      })
    );
  };

  // Helper to add new medicine from Daily Helper
  const handleAddMedFromHelper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    const newPill: MedicationItem = {
      id: Date.now().toString(),
      name: newMedName.trim(),
      dosage: newMedDosage,
      frequency: 'Daily',
      timeOfDay: newMedTimeOfDay,
      instructions: 'Take with water after food',
      takenToday: false,
    };

    setMeds((prev) => [...prev, newPill]);
    setNewMedName('');
    setIsAddMedModalOpen(false);
    onReadAloud(`Added ${newPill.name} to your medication schedule.`);
  };

  // Helper to post a family update/message from Daily Helper
  const handleAddFamilyUpdateFromHelper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familySenderName.trim() || !familyMessageText.trim()) return;

    const newUpdateItem: FamilyUpdate = {
      id: Date.now().toString(),
      senderName: familySenderName.trim(),
      relation: familyRelation.trim(),
      message: familyMessageText.trim(),
      date: 'Just now',
      unread: true,
    };

    setFamilyUpdates((prev) => [newUpdateItem, ...prev]);
    setFamilySenderName('');
    setFamilyMessageText('');
    setIsAddFamilyMsgOpen(false);
    onReadAloud(`Added family message from ${newUpdateItem.senderName}.`);
  };

  // Helper to send 1-click status update to Family
  const safeMeds = Array.isArray(meds) ? meds : [];
  const safeFamilyUpdates = Array.isArray(familyUpdates) ? familyUpdates : [];

  const handleShareMedStatusWithFamily = () => {
    const takenCount = safeMeds.filter((m) => m.takenToday).length;
    const totalCount = safeMeds.length;
    const updateText = `Pranam! Health Update: I have taken ${takenCount} of ${totalCount} prescribed medicines today. Feeling good and active!`;

    const statusItem: FamilyUpdate = {
      id: Date.now().toString(),
      senderName: 'Senior Daily Health Log',
      relation: 'Self Status Update',
      message: updateText,
      date: 'Just now',
      unread: false,
    };

    setFamilyUpdates((prev) => [statusItem, ...(Array.isArray(prev) ? prev : [])]);
    onReadAloud('Shared your medication status to Family Updates!');
  };

  // Calculate missed/pending medications based on time of day and routine
  const pendingMeds = safeMeds.filter((m) => !m.takenToday);

  const getRoutineSlotForMed = (timeOfDay: string) => {
    switch (timeOfDay) {
      case 'morning':
        return `Breakfast (${profile.dailyRoutine.breakfastTime || '08:30 AM'})`;
      case 'afternoon':
        return `Lunch (${profile.dailyRoutine.lunchTime || '01:30 PM'})`;
      case 'evening':
        return `Dinner / Walk (${profile.dailyRoutine.dinnerTime || '08:30 PM'})`;
      case 'bedtime':
        return `Bedtime (${profile.dailyRoutine.bedTime || '10:00 PM'})`;
      default:
        return 'Daily Schedule';
    }
  };

  const detectTargetTab = (text: string): { tab: NavigationTab; label: string } | null => {
    const lower = text.toLowerCase();
    if (lower.includes('prescribed medicine') || lower.includes('dawai') || lower.includes('pill') || lower.includes('medication')) {
      return { tab: 'medications', label: 'Prescribed Medicines' };
    }
    if (lower.includes('scam') || lower.includes('bill safeguard') || lower.includes('khatra') || lower.includes('sms') || lower.includes('fraud')) {
      return { tab: 'scam-checker', label: 'Scam & Bill Safeguard' };
    }
    if (lower.includes('doctor') || lower.includes('appointment') || lower.includes('symptom') || lower.includes('hospital')) {
      return { tab: 'doctor-prep', label: 'Doctor Visit Prep' };
    }
    if (lower.includes('family') || lower.includes('child') || lower.includes('beta') || lower.includes('beti') || lower.includes('message')) {
      return { tab: 'family-social', label: 'Family Updates' };
    }
    if (lower.includes('profile') || lower.includes('routine') || lower.includes('emergency contact') || lower.includes('subah') || lower.includes('wake')) {
      return { tab: 'profile', label: 'Profile & Routine' };
    }
    return null;
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    // Handle direct Tab Jump Commands ONLY for explicit tab chips
    if (text === '💊 Open Prescribed Medicines Tab') {
      onNavigateToTab('medications');
      return;
    }
    if (text === '🛡️ Open Scam & Bill Safeguard Tab') {
      onNavigateToTab('scam-checker');
      return;
    }
    if (text === '❤️ Open Family Updates Tab') {
      onNavigateToTab('family-social');
      return;
    }
    if (text === '👤 Open Profile & Routine Tab') {
      onNavigateToTab('profile');
      return;
    }

    // DOCTOR BOOKING MANDATE: Keep inside Daily Helper only (no tab switching)
    if (text.toLowerCase().includes('book') || text.toLowerCase().includes('appointment') || text.toLowerCase().includes('doctor') || text.toLowerCase().includes('specialist') || text.toLowerCase().includes('ortho') || text.toLowerCase().includes('eye')) {
      bookingHelperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    chatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages
      .slice(-6)
      .map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: m.text }],
      }));

    // Inject rich real-time context from all 5 feature tabs
    const medsDetails = safeMeds.length > 0
      ? safeMeds.map((m) => `${m.name} (${m.dosage}, ${m.timeOfDay}) - Taken today: ${m.takenToday ? 'Yes' : 'No'}`).join('; ')
      : 'No prescribed medicines added yet';

    const scamDetails = scamLastCheck
      ? `Last check: "${scamLastCheck.title}" (Risk: ${scamLastCheck.riskLevel}, Score: ${scamLastCheck.riskScore}/100) - Summary: ${scamLastCheck.simpleSummary}`
      : 'No recent scam/bill check analyzed yet';

    const doctorDetails = doctorSymptoms.length > 0
      ? `Logged health concerns/symptoms: ${doctorSymptoms.join('; ')}`
      : 'No symptoms logged yet';

    const familyDetails = safeFamilyUpdates.length > 0
      ? safeFamilyUpdates.map((f) => `From ${f.senderName} (${f.relation}): "${f.message}" (${f.date})`).join('; ')
      : 'No family updates received yet';

    const profileDetails = `Senior Name: "${profile.seniorName || 'Not specified'}", City: "${profile.city || 'India'}", Wakeup: ${profile.dailyRoutine?.wakeupTime || '06:30 AM'}, Breakfast: ${profile.dailyRoutine?.breakfastTime || '08:30 AM'}, Lunch: ${profile.dailyRoutine?.lunchTime || '01:30 PM'}, Walk: ${profile.dailyRoutine?.eveningWalkTime || '05:30 PM'}, Dinner: ${profile.dailyRoutine?.dinnerTime || '08:30 PM'}, Bedtime: ${profile.dailyRoutine?.bedTime || '10:00 PM'}, Notes: "${profile.dailyRoutine?.specialNotes || 'None'}", Emergency Contacts: ${profile.emergencyContacts?.map((c) => `${c.name} (${c.relation}, ${c.phone})`).join(', ') || 'None'}`;

    const contextPrefix = `[System Real-Time 5-Tab Data Context:
1. 💊 Prescribed Medicines Tab: ${medsDetails}
2. 🛡️ Scam & Bill Safeguard Tab: ${scamDetails}
3. 🩺 Doctor Visit Prep Tab: ${doctorDetails}
4. ❤️ Family Updates Tab: ${familyDetails}
5. 👤 Profile & Routine Tab: ${profileDetails}

MANDATE FOR RESPONSE: If the senior asks a question about medicines, scams/bills, doctor visits/symptoms, family notes, or daily routines/contacts, you MUST start your response by explicitly stating which tab you read (e.g., "💊 Checked your Prescribed Medicines Tab...", "🛡️ Checked your Scam & Bill Safeguard Tab...", "🩺 Checked your Doctor Visit Prep Tab...", "❤️ Checked your Family Updates Tab...", "👤 Checked your Profile & Routine Tab...") and answer directly using this learned tab data in this chat thread!] `;

    history.push({
      role: 'user',
      parts: [{ text: contextPrefix + text.trim() }],
    });

    try {
      const responseObj = await sendCompanionChatMessage(history);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: responseObj.text,
        suggestedActions: responseObj.suggestedActions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      onReadAloud(responseObj.text);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Morning Overview Banner for Indian Seniors */}
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
              Pranam! Today's Daily Summary
            </h2>
            <p className="text-base sm:text-lg font-semibold opacity-90 mt-1">
              Set your doctor-prescribed medicines, daily routine, and 3 emergency contacts anytime in Profile & Routine.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => onNavigateToTab('profile')}
            type="button"
            className="flex-1 md:flex-none px-5 py-3 rounded-2xl font-black bg-amber-700 text-white hover:bg-amber-800 text-base sm:text-lg min-h-[56px] cursor-pointer"
          >
            Profile & Emergency Contacts
          </button>
          <button
            onClick={() => onNavigateToTab('medications')}
            type="button"
            className="flex-1 md:flex-none px-5 py-3 rounded-2xl font-black bg-slate-800 text-white hover:bg-slate-900 text-base sm:text-lg min-h-[56px] cursor-pointer"
          >
            Prescribed Medicines
          </button>
        </div>
      </div>

      {/* Smart Schedule Check: Automatically suggests missed medication checks based on Profile Routine */}
      {meds.length > 0 && pendingMeds.length > 0 && (
        <div
          className={`p-5 sm:p-6 rounded-3xl border-4 shadow-xl space-y-4 ${
            highContrast
              ? 'bg-zinc-950 text-yellow-300 border-yellow-400'
              : 'bg-amber-50 text-slate-900 border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b-2 pb-3 border-amber-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-600 text-white rounded-2xl">
                <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold flex items-center gap-2">
                  <span>Smart Routine Alert: {pendingMeds.length} Pending Pill Check(s)</span>
                </h3>
                <p className="text-xs sm:text-sm font-bold opacity-80">
                  Cross-checked against Profile Routine ({profile.dailyRoutine.breakfastTime} Breakfast / {profile.dailyRoutine.lunchTime} Lunch)
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab('profile')}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-amber-200 text-amber-950 font-bold text-xs hover:bg-amber-300 border border-amber-400 cursor-pointer"
            >
              Edit Routine Times
            </button>
          </div>

          <p className="text-sm sm:text-base font-semibold">
            SilverGuard Daily Helper cross-checked your schedule set in the Profile tab. Please check if you missed any of these pills today:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingMeds.map((med) => (
              <div
                key={med.id}
                className="p-3.5 rounded-2xl bg-white border-2 border-amber-300 text-slate-900 flex flex-col justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 uppercase">
                      Scheduled: {med.timeOfDay} ({getRoutineSlotForMed(med.timeOfDay)})
                    </span>
                  </div>
                  <h4 className="text-lg font-extrabold mt-1">{med.name}</h4>
                  <p className="text-xs font-bold opacity-80">{med.dosage} • {med.instructions}</p>
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-200">
                  <button
                    onClick={() => toggleMedTaken(med.id)}
                    type="button"
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 text-white font-extrabold text-xs sm:text-sm hover:bg-emerald-800 flex items-center justify-center gap-1 cursor-pointer min-h-[40px]"
                  >
                    <Check className="w-4 h-4" />
                    <span>Mark Taken</span>
                  </button>

                  <button
                    onClick={() =>
                      handleSend(
                        `I noticed my ${med.timeOfDay} medicine ${med.name} (${med.dosage}) scheduled around ${getRoutineSlotForMed(med.timeOfDay)} is not marked taken yet. What should I do if I missed it?`
                      )
                    }
                    type="button"
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-100 text-amber-950 font-extrabold text-xs sm:text-sm hover:bg-amber-200 border border-amber-400 flex items-center justify-center gap-1 cursor-pointer min-h-[40px]"
                  >
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    <span>Ask AI Advice</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Daily Doctor Appointment Booking Helper inside Daily Helper */}
      <div ref={bookingHelperRef}>
        <DoctorAppointmentBookingHelper
          highContrast={highContrast}
          onReadAloud={onReadAloud}
        />
      </div>

      {/* Interactive Daily Helper Quick Sync Hub: Family & Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Medications Quick Sync */}
        <div
          className={`p-5 sm:p-6 rounded-3xl border-4 shadow-xl space-y-4 ${
            highContrast
              ? 'bg-zinc-950 text-yellow-300 border-yellow-400'
              : 'bg-emerald-50 text-slate-900 border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b-2 pb-3 border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-700 text-white rounded-2xl">
                <Pill className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold">Today's Medicines</h3>
                <p className="text-xs sm:text-sm font-semibold opacity-80">
                  {meds.filter((m) => m.takenToday).length} of {meds.length} taken today
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddMedModalOpen(true)}
                type="button"
                className="px-3 py-2 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 flex items-center gap-1 cursor-pointer min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Pill</span>
              </button>
            </div>
          </div>

          {meds.length === 0 ? (
            <div className="p-4 rounded-2xl bg-white border-2 border-dashed border-emerald-300 text-center space-y-2">
              <p className="font-bold text-slate-700 text-sm sm:text-base">
                No prescribed medicines set yet.
              </p>
              <button
                onClick={() => setIsAddMedModalOpen(true)}
                type="button"
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-extrabold text-sm hover:bg-emerald-800 cursor-pointer"
              >
                + Add Doctor Prescribed Medicine
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {meds.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-2 ${
                    m.takenToday
                      ? 'bg-emerald-100/80 border-emerald-400 text-emerald-950'
                      : 'bg-white border-emerald-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleMedTaken(m.id)}
                      type="button"
                      className={`p-2 rounded-xl font-bold cursor-pointer transition-colors ${
                        m.takenToday
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-emerald-200'
                      }`}
                      aria-label={`Mark ${m.name} as taken`}
                    >
                      {m.takenToday ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </button>
                    <div>
                      <p className="font-extrabold text-base leading-tight">{m.name}</p>
                      <p className="text-xs font-semibold opacity-80">
                        {m.dosage} • {m.timeOfDay}
                        {m.takenToday && ` • Taken at ${m.takenTime}`}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-full ${
                      m.takenToday
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {m.takenToday ? 'Taken' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex flex-wrap gap-2 items-center justify-between border-t border-emerald-200">
            <button
              onClick={handleShareMedStatusWithFamily}
              disabled={meds.length === 0}
              type="button"
              className="flex-1 px-3 py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-xs sm:text-sm hover:bg-emerald-900 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Status with Family</span>
            </button>
            <button
              onClick={() => onNavigateToTab('medications')}
              type="button"
              className="px-3 py-2.5 rounded-xl bg-white border-2 border-emerald-400 text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-100 flex items-center justify-center gap-1 cursor-pointer min-h-[44px]"
            >
              <span>Full Schedule</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panel 2: Family Updates Quick Sync */}
        <div
          className={`p-5 sm:p-6 rounded-3xl border-4 shadow-xl space-y-4 ${
            highContrast
              ? 'bg-zinc-950 text-yellow-300 border-yellow-400'
              : 'bg-rose-50 text-slate-900 border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b-2 pb-3 border-rose-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-700 text-white rounded-2xl">
                <Heart className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold">Family Updates</h3>
                <p className="text-xs sm:text-sm font-semibold opacity-80">
                  {familyUpdates.length} Messages from Children / Family
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddFamilyMsgOpen(true)}
              type="button"
              className="px-3 py-2 rounded-xl bg-rose-700 text-white font-bold text-sm hover:bg-rose-800 flex items-center gap-1 cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Post Note</span>
            </button>
          </div>

          {familyUpdates.length === 0 ? (
            <div className="p-4 rounded-2xl bg-white border-2 border-dashed border-rose-300 text-center space-y-2">
              <p className="font-bold text-slate-700 text-sm sm:text-base">
                No family updates saved yet.
              </p>
              <button
                onClick={() => setIsAddFamilyMsgOpen(true)}
                type="button"
                className="px-4 py-2 rounded-xl bg-rose-700 text-white font-extrabold text-sm hover:bg-rose-800 cursor-pointer"
              >
                + Add Family Message / Update
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {familyUpdates.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-white border-2 border-rose-200 text-slate-900 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-rose-900">
                      {item.senderName} ({item.relation})
                    </span>
                    <span className="text-xs opacity-70">{item.date}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 line-clamp-2">
                    "{item.message}"
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex flex-wrap gap-2 items-center justify-between border-t border-rose-200">
            <button
              onClick={() =>
                handleSend('Family ko batao main accha hoon aur dawai kha li hai!')
              }
              type="button"
              className="flex-1 px-3 py-2.5 rounded-xl bg-rose-800 text-white font-bold text-xs sm:text-sm hover:bg-rose-900 flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Draft Warm Family Reply</span>
            </button>
            <button
              onClick={() => onNavigateToTab('family-social')}
              type="button"
              className="px-3 py-2.5 rounded-xl bg-white border-2 border-rose-400 text-rose-950 font-bold text-xs sm:text-sm hover:bg-rose-100 flex items-center justify-center gap-1 cursor-pointer min-h-[44px]"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={chatSectionRef}
        className={`rounded-3xl border-4 p-4 sm:p-6 shadow-xl space-y-6 ${
          highContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-white border-amber-200 text-slate-900'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 pb-4 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600 text-white rounded-2xl">
              <Sparkles className="w-7 h-7" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold">
                Ask SilverGuard AI (Poochiye)
              </h3>
              <p className="text-sm sm:text-base font-semibold opacity-80">
                Warm Indian AI guide in simple language
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Picker */}
            <div className="flex items-center gap-1.5 bg-amber-100 p-2 rounded-xl text-amber-950 font-bold text-sm">
              <Languages className="w-5 h-5 text-amber-700 shrink-0" aria-hidden="true" />
              <select
                value={selectedLanguage}
                onChange={(e: any) => setSelectedLanguage(e.target.value)}
                className="bg-transparent font-bold focus:outline-none cursor-pointer"
                title="Select Voice & Recognition Language"
              >
                <option value="hi-IN">Hindi (हिंदी / Hinglish)</option>
                <option value="en-IN">English (India)</option>
                <option value="ta-IN">Tamil (தமிழ்)</option>
                <option value="te-IN">Telugu (తెలుగు)</option>
                <option value="bn-IN">Bengali (বাংলা)</option>
                <option value="mr-IN">Marathi (मराठी)</option>
                <option value="gu-IN">Gujarati (ગુજરાતી)</option>
                <option value="pa-IN">Punjabi (ਪੰਜਾਬੀ)</option>
                <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
                <option value="ml-IN">Malayalam (മലയാളം)</option>
              </select>
            </div>

            <button
              onClick={() =>
                onReadAloud(
                  messages[messages.length - 1]?.text || 'No message to read'
                )
              }
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 text-base min-h-[48px] cursor-pointer"
              aria-label="Read last message aloud"
            >
              <Volume2 className="w-5 h-5" aria-hidden="true" />
              <span className="hidden sm:inline">Suniyen (Listen)</span>
            </button>
          </div>
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
                      {isAsst ? 'SilverGuard Assistant' : 'Aap (You)'}
                    </span>
                    <span className="text-xs sm:text-sm opacity-75">{msg.timestamp}</span>
                  </div>

                  <p className="text-lg sm:text-xl font-medium leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>

                  {/* Quick Action Suggestion Chips */}
                  {msg.suggestedActions && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {msg.suggestedActions.map((action, idx) => {
                        const target = detectTargetTab(action);
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (target) {
                                onNavigateToTab(target.tab);
                              } else {
                                handleSend(action);
                              }
                            }}
                            type="button"
                            className={`px-4 py-2.5 rounded-xl font-bold text-base min-h-[48px] border focus-visible:ring-4 cursor-pointer transition-transform active:scale-95 ${
                              target
                                ? 'bg-amber-600 text-white hover:bg-amber-700 border-amber-800 shadow-md'
                                : 'bg-amber-200 text-amber-950 hover:bg-amber-300 border-amber-400'
                            }`}
                          >
                            {target ? `🚀 ${action}` : `👉 ${action}`}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Read Aloud Button per message */}
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      onClick={() => onReadAloud(msg.text)}
                      type="button"
                      className="text-xs sm:text-sm font-bold flex items-center gap-1.5 opacity-80 hover:opacity-100 p-1 underline cursor-pointer"
                      aria-label="Read this response aloud"
                    >
                      <Volume2 className="w-4 h-4" aria-hidden="true" />
                      <span>Suniyen</span>
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

        {/* Input Bar with Direct Mic Audio Input */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <AudioInputButton
              onTranscript={(text) =>
                setInput((prev) => (prev ? `${prev} ${text}` : text))
              }
              label="Awaaz Se Bolen (Mic Input)"
              language={selectedLanguage}
              highContrast={highContrast}
            />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex-1 flex gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Yahan type karein ya Awaaz button dabayein..."
                className={`flex-1 p-4 sm:p-5 rounded-2xl border-3 font-medium text-lg sm:text-xl focus-visible:outline-none focus-visible:ring-4 ${
                  highContrast
                    ? 'bg-zinc-900 border-yellow-400 text-white placeholder:text-zinc-500'
                    : 'bg-white border-amber-300 text-slate-900 placeholder:text-slate-400'
                }`}
              />

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-8 py-4 sm:py-5 rounded-2xl font-black text-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 min-h-[64px] flex items-center justify-center gap-2 shadow-lg focus-visible:ring-4 cursor-pointer shrink-0"
              >
                <span>Poochiye</span>
                <Send className="w-6 h-6" aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </div>
      {/* Voice Guided Modal to Add Prescribed Medicine directly from Daily Helper */}
      <VoiceAddMedicationModal
        isOpen={isAddMedModalOpen}
        onClose={() => setIsAddMedModalOpen(false)}
        highContrast={highContrast}
        onReadAloud={onReadAloud}
        onMedicationAdded={(newPill) => {
          setMeds((prev) => [newPill, ...prev]);
        }}
      />

      {/* Modal 2: Add Family Message/Update directly from Daily Helper */}
      {isAddFamilyMsgOpen && (
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
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-rose-600" />
                <h3 className="text-2xl font-black">Add Family Message / Update</h3>
              </div>
              <button
                onClick={() => setIsAddFamilyMsgOpen(false)}
                type="button"
                className="p-2 rounded-xl border-2 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddFamilyUpdateFromHelper} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-extrabold mb-1">
                    Family Member Name
                  </label>
                  <input
                    type="text"
                    required
                    value={familySenderName}
                    onChange={(e) => setFamilySenderName(e.target.value)}
                    placeholder="e.g. Rohan or Pooja"
                    className="w-full p-3 rounded-xl border-2 font-bold text-lg bg-white border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-base font-extrabold mb-1">Relation</label>
                  <input
                    type="text"
                    value={familyRelation}
                    onChange={(e) => setFamilyRelation(e.target.value)}
                    placeholder="e.g. Beta (Son) or Poti"
                    className="w-full p-3 rounded-xl border-2 font-bold text-lg bg-white border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-extrabold mb-1">Message Content</label>
                <div className="flex gap-2">
                  <textarea
                    required
                    rows={3}
                    value={familyMessageText}
                    onChange={(e) => setFamilyMessageText(e.target.value)}
                    placeholder="e.g. Papa, scored 2 goals today! Hope you took your medicine!"
                    className="flex-1 p-3 rounded-xl border-2 font-bold text-base bg-white border-slate-300"
                  />
                  <AudioInputButton
                    onTranscript={(t) =>
                      setFamilyMessageText((prev) => (prev ? `${prev} ${t}` : t))
                    }
                    label="Mic"
                    highContrast={highContrast}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddFamilyMsgOpen(false)}
                  className="flex-1 py-3 rounded-xl font-extrabold text-base border-2 border-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-extrabold text-base bg-rose-700 text-white hover:bg-rose-800 cursor-pointer"
                >
                  Save Family Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
