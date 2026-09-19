import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneCall,
  X,
  ShieldAlert,
  Volume2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  MapPin,
  Send,
  Plus,
} from 'lucide-react';
import { EmergencyContact, SeniorUserProfile } from '../types';
import { PROFILE_LOCAL_STORAGE_KEY } from './UserProfileView';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  highContrast: boolean;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  highContrast,
}) => {
  const [profile, setProfile] = useState<SeniorUserProfile | null>(null);

  // Calling Agent active state
  const [isCallingAgentActive, setIsCallingAgentActive] = useState(false);
  const [currentContactIndex, setCurrentContactIndex] = useState(0);
  const [callTimer, setCallTimer] = useState(0);
  const [callStatus, setCallStatus] = useState<'dialing' | 'ringing' | 'connected' | 'ended'>('dialing');
  const [simulatedSpeakerText, setSimulatedSpeakerText] = useState<string | null>(null);

  // Quick setup state if fewer than 3 contacts exist
  const [quickC1Name, setQuickC1Name] = useState('Rohan (Beta)');
  const [quickC1Phone, setQuickC1Phone] = useState('+91 9876543210');
  const [quickC2Name, setQuickC2Name] = useState('Pooja (Beti)');
  const [quickC2Phone, setQuickC2Phone] = useState('+91 9876543211');
  const [quickC3Name, setQuickC3Name] = useState('Ramesh (Neighbor)');
  const [quickC3Phone, setQuickC3Phone] = useState('+91 9876543212');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const rolloverTimeoutRef = useRef<any>(null);

  // Load saved profile when modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(PROFILE_LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed: SeniorUserProfile = JSON.parse(saved);
          setProfile(parsed);
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      stopCallingAgent();
    }
  }, [isOpen]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Play realistic phone ringtone sound
  const playRingtoneSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // Standard 440Hz tone
      osc.frequency.setValueAtTime(480, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.error(e);
    }
  };

  const startCallingAgent = (contactsToUse?: EmergencyContact[]) => {
    const list = contactsToUse || profile?.emergencyContacts || [];
    if (list.length === 0) return;

    setIsCallingAgentActive(true);
    setCurrentContactIndex(0);
    setCallTimer(0);
    setCallStatus('ringing');
    setSimulatedSpeakerText(null);

    const firstContact = list[0];
    const msg = `SilverGuard Emergency Calling Agent activated! Dialing Emergency Contact 1: ${firstContact.name} at ${firstContact.phone}. Sending automated SOS audio and GPS location.`;
    speakText(msg);
    playRingtoneSound();

    // Start timer
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setCallTimer((prev) => prev + 1);
      playRingtoneSound();
    }, 2000);

    // Set auto-rollover to next contact after 12 seconds
    scheduleRollover(0, list);
  };

  const scheduleRollover = (index: number, list: EmergencyContact[]) => {
    if (rolloverTimeoutRef.current) clearTimeout(rolloverTimeoutRef.current);

    rolloverTimeoutRef.current = setTimeout(() => {
      const nextIndex = index + 1;
      if (nextIndex < list.length) {
        setCurrentContactIndex(nextIndex);
        setCallStatus('ringing');
        setSimulatedSpeakerText(null);
        const nextContact = list[nextIndex];
        const rolloverMsg = `Contact ${index + 1} did not answer. Automatically rolling over to Emergency Contact ${
          nextIndex + 1
        }: ${nextContact.name} at ${nextContact.phone}.`;
        speakText(rolloverMsg);
        scheduleRollover(nextIndex, list);
      } else {
        // Roll over to National Helpline 112
        setCallStatus('ended');
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        const endMsg = `Calling sequence for all 3 contacts complete. Connecting to National Emergency Helpline 112 now.`;
        speakText(endMsg);
      }
    }, 12000); // 12 second rollover window
  };

  const simulateAnswer = () => {
    if (rolloverTimeoutRef.current) clearTimeout(rolloverTimeoutRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    setCallStatus('connected');
    const contacts = profile?.emergencyContacts || [];
    const activeContact = contacts[currentContactIndex] || { name: 'Emergency Family Member', phone: '' };

    const simulatedReply = `Hello! This is ${activeContact.name}. I just received the SilverGuard Emergency SOS voice call and location alert for Papa Ji! I am driving home right now and will reach in 5 minutes!`;
    setSimulatedSpeakerText(simulatedReply);
    speakText(simulatedReply);
  };

  const stopCallingAgent = () => {
    setIsCallingAgentActive(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (rolloverTimeoutRef.current) clearTimeout(rolloverTimeoutRef.current);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const handleQuickSaveContacts = (e: React.FormEvent) => {
    e.preventDefault();
    const newContacts: EmergencyContact[] = [
      { id: '1', name: quickC1Name, relation: 'Son / Primary Caregiver', phone: quickC1Phone, priority: 1 },
      { id: '2', name: quickC2Name, relation: 'Daughter', phone: quickC2Phone, priority: 2 },
      { id: '3', name: quickC3Name, relation: 'Neighbor / Family Doctor', phone: quickC3Phone, priority: 3 },
    ];

    const updatedProfile: SeniorUserProfile = {
      seniorName: profile?.seniorName || 'Senior Citizen',
      city: profile?.city || 'India',
      dailyRoutine: profile?.dailyRoutine || {
        wakeupTime: '6:30 AM',
        breakfastTime: '8:30 AM',
        lunchTime: '1:30 PM',
        eveningWalkTime: '5:30 PM',
        dinnerTime: '8:30 PM',
        bedTime: '10:00 PM',
      },
      emergencyContacts: newContacts,
    };

    localStorage.setItem(PROFILE_LOCAL_STORAGE_KEY, JSON.stringify(updatedProfile));
    setProfile(updatedProfile);
    startCallingAgent(newContacts);
  };

  if (!isOpen) return null;

  const contactsList = profile?.emergencyContacts || [];
  const activeContact = contactsList[currentContactIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <div
        className={`w-full max-w-3xl rounded-3xl p-6 sm:p-8 border-4 shadow-2xl space-y-6 my-auto ${
          highContrast
            ? 'bg-black text-yellow-300 border-yellow-400'
            : 'bg-white text-slate-900 border-red-600'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 pb-4 border-slate-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 text-white rounded-2xl animate-pulse">
              <ShieldAlert className="w-8 h-8" aria-hidden="true" />
            </div>
            <div>
              <h2 id="emergency-modal-title" className="text-2xl sm:text-3xl font-black">
                SilverGuard AI Emergency Calling Agent
              </h2>
              <p className="text-base sm:text-lg font-bold opacity-90">
                Automated 3-contact emergency calling sequence & location broadcast
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCallingAgent();
              onClose();
            }}
            type="button"
            className="p-3 rounded-2xl bg-slate-200 text-slate-900 hover:bg-slate-300 min-h-[52px] min-w-[52px] flex items-center justify-center cursor-pointer"
            aria-label="Close emergency modal"
          >
            <X className="w-8 h-8" aria-hidden="true" />
          </button>
        </div>

        {/* ACTIVE CALLING AGENT DISPLAY */}
        {isCallingAgentActive && activeContact ? (
          <div className="p-6 rounded-3xl bg-red-950 text-white border-4 border-red-500 shadow-2xl space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-red-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
                <span className="text-lg font-black uppercase text-red-300 tracking-wider">
                  Live Emergency Agent Call in Progress
                </span>
              </div>

              <span className="text-xl font-mono font-bold bg-red-900 px-4 py-1.5 rounded-xl border border-red-700">
                ⏱️ Call Duration: {callTimer}s
              </span>
            </div>

            {/* Currently Dialed Contact Card */}
            <div className="text-center space-y-3 bg-red-900/60 p-6 rounded-2xl border-2 border-red-600">
              <div className="inline-block px-4 py-1 rounded-full bg-yellow-400 text-slate-950 text-sm font-black uppercase">
                Contact #{currentContactIndex + 1} of {contactsList.length}
              </div>

              <h3 className="text-3xl sm:text-4xl font-black">{activeContact.name}</h3>
              <p className="text-xl font-bold text-red-200">{activeContact.relation}</p>
              <p className="text-2xl font-mono font-black text-yellow-300">{activeContact.phone}</p>

              <div className="pt-2">
                <span className="px-5 py-2.5 rounded-xl bg-red-800 text-white font-extrabold text-lg inline-flex items-center gap-2 animate-pulse">
                  <PhoneCall className="w-6 h-6 text-yellow-300" aria-hidden="true" />
                  <span>
                    {callStatus === 'ringing'
                      ? 'Ringing... (Auto-rollover in 12s if no answer)'
                      : callStatus === 'connected'
                      ? 'Call Connected & SOS Message Delivered!'
                      : 'Connecting Call...'}
                  </span>
                </span>
              </div>
            </div>

            {/* Live GPS Broadcast Status */}
            <div className="p-4 rounded-xl bg-black/40 border border-red-800 flex items-center justify-between text-base font-bold">
              <div className="flex items-center gap-2 text-red-300">
                <MapPin className="w-5 h-5 text-yellow-400" aria-hidden="true" />
                <span>Broadcasting Senior GPS Coordinates: New Delhi (Live SOS)</span>
              </div>
              <span className="text-xs font-mono text-emerald-400">STATUS: BROADCASTING</span>
            </div>

            {/* Action Buttons inside Calling Agent */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Native Dial Button */}
              <a
                href={`tel:${activeContact.phone}`}
                className="py-4 px-4 rounded-2xl font-black text-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-lg min-h-[56px]"
              >
                <Phone className="w-6 h-6" aria-hidden="true" />
                <span>Direct Native Call</span>
              </a>

              {/* Simulate Answer Button */}
              <button
                onClick={simulateAnswer}
                type="button"
                className="py-4 px-4 rounded-2xl font-black text-lg bg-yellow-400 text-slate-950 hover:bg-yellow-300 flex items-center justify-center gap-2 shadow-lg min-h-[56px] cursor-pointer"
              >
                <Sparkles className="w-6 h-6 text-slate-950" aria-hidden="true" />
                <span>Simulate Answer</span>
              </button>

              {/* Stop Calling Agent */}
              <button
                onClick={stopCallingAgent}
                type="button"
                className="py-4 px-4 rounded-2xl font-black text-lg bg-red-800 text-white hover:bg-red-900 flex items-center justify-center gap-2 min-h-[56px] cursor-pointer"
              >
                <X className="w-6 h-6" aria-hidden="true" />
                <span>Stop Call Sequence</span>
              </button>
            </div>

            {/* Simulated Speaker Speech Box */}
            {simulatedSpeakerText && (
              <div className="p-4 rounded-2xl bg-amber-100 text-amber-950 border-2 border-yellow-400 space-y-2">
                <div className="flex items-center gap-2 font-black text-lg text-amber-900">
                  <Volume2 className="w-6 h-6 text-amber-700" aria-hidden="true" />
                  <span>Incoming Voice Response from {activeContact.name}:</span>
                </div>
                <p className="text-lg font-extrabold italic">"{simulatedSpeakerText}"</p>
              </div>
            )}
          </div>
        ) : contactsList.length >= 3 ? (
          /* STANDARD CALLING AGENT TRIGGER VIEW WHEN 3+ CONTACTS ARE SAVED */
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-red-50 text-red-950 border-3 border-red-400 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black flex items-center gap-2">
                  <Users className="w-8 h-8 text-red-600" aria-hidden="true" />
                  <span>3 Emergency Family Contacts Configured</span>
                </h3>
                <span className="px-3 py-1 bg-emerald-600 text-white font-black text-sm rounded-xl">
                  READY FOR EMERGENCY
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {contactsList.map((contact, idx) => (
                  <div key={contact.id} className="p-4 bg-white rounded-2xl border-2 border-red-200 text-slate-900">
                    <span className="text-xs font-black uppercase text-red-700">Contact #{idx + 1}</span>
                    <h4 className="text-lg font-black">{contact.name}</h4>
                    <p className="text-sm font-bold text-slate-600">{contact.relation}</p>
                    <p className="text-base font-mono font-black text-red-900 mt-1">{contact.phone}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => startCallingAgent()}
                type="button"
                className="w-full py-5 rounded-2xl font-black text-2xl bg-red-600 text-white hover:bg-red-700 shadow-xl flex items-center justify-center gap-3 cursor-pointer min-h-[64px] animate-pulse"
              >
                <PhoneCall className="w-8 h-8" aria-hidden="true" />
                <span>START EMERGENCY CALLING AGENT NOW</span>
              </button>
            </div>

            {/* Official Indian Helplines Grid */}
            <div className="space-y-3">
              <h4 className="text-xl font-extrabold">National Emergency Helplines (India):</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="tel:112"
                  className="p-4 rounded-2xl bg-red-600 text-white hover:bg-red-700 flex items-center justify-between font-extrabold text-lg min-h-[56px]"
                >
                  <div>
                    <div>112 National Emergency</div>
                    <div className="text-xs font-normal opacity-90">Police, Ambulance, Fire</div>
                  </div>
                  <Phone className="w-6 h-6" aria-hidden="true" />
                </a>

                <a
                  href="tel:14567"
                  className="p-4 rounded-2xl bg-amber-600 text-white hover:bg-amber-700 flex items-center justify-between font-extrabold text-lg min-h-[56px]"
                >
                  <div>
                    <div>14567 Elderline</div>
                    <div className="text-xs font-normal opacity-90">Senior Citizen Support</div>
                  </div>
                  <Phone className="w-6 h-6" aria-hidden="true" />
                </a>

                <a
                  href="tel:1930"
                  className="p-4 rounded-2xl bg-orange-700 text-white hover:bg-orange-800 flex items-center justify-between font-extrabold text-lg min-h-[56px]"
                >
                  <div>
                    <div>1930 Cyber Fraud Helpline</div>
                    <div className="text-xs font-normal opacity-90">Bank & UPI Scam Hotline</div>
                  </div>
                  <Phone className="w-6 h-6" aria-hidden="true" />
                </a>

                <a
                  href="tel:108"
                  className="p-4 rounded-2xl bg-emerald-700 text-white hover:bg-emerald-800 flex items-center justify-between font-extrabold text-lg min-h-[56px]"
                >
                  <div>
                    <div>108 Medical Ambulance</div>
                    <div className="text-xs font-normal opacity-90">Emergency Health Transport</div>
                  </div>
                  <Phone className="w-6 h-6" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* QUICK FORM TO ADD 3 EMERGENCY CONTACTS IF FEWER THAN 3 ARE CONFIGURED */
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-amber-50 border-3 border-amber-400 text-amber-950 font-bold space-y-2">
              <div className="flex items-center gap-2 text-xl font-extrabold text-amber-900">
                <AlertTriangle className="w-7 h-7 text-amber-700" aria-hidden="true" />
                <span>3 Family Emergency Contacts Required</span>
              </div>
              <p className="text-base">
                To launch the Emergency Calling Agent, please confirm or enter at least 3 family emergency phone numbers below (e.g. Son, Daughter, Neighbor).
              </p>
            </div>

            <form onSubmit={handleQuickSaveContacts} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl border-2 border-slate-300 bg-white space-y-2">
                  <label className="block text-base font-extrabold">Contact 1 (Primary):</label>
                  <input
                    type="text"
                    required
                    value={quickC1Name}
                    onChange={(e) => setQuickC1Name(e.target.value)}
                    placeholder="Name e.g. Rohan (Beta)"
                    className="w-full p-3 rounded-xl border border-slate-300 text-base font-bold text-slate-900"
                  />
                  <input
                    type="tel"
                    required
                    value={quickC1Phone}
                    onChange={(e) => setQuickC1Phone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full p-3 rounded-xl border border-slate-300 text-base font-mono font-bold text-slate-900"
                  />
                </div>

                <div className="p-4 rounded-2xl border-2 border-slate-300 bg-white space-y-2">
                  <label className="block text-base font-extrabold">Contact 2 (Secondary):</label>
                  <input
                    type="text"
                    required
                    value={quickC2Name}
                    onChange={(e) => setQuickC2Name(e.target.value)}
                    placeholder="Name e.g. Pooja (Beti)"
                    className="w-full p-3 rounded-xl border border-slate-300 text-base font-bold text-slate-900"
                  />
                  <input
                    type="tel"
                    required
                    value={quickC2Phone}
                    onChange={(e) => setQuickC2Phone(e.target.value)}
                    placeholder="+91 9876543211"
                    className="w-full p-3 rounded-xl border border-slate-300 text-base font-mono font-bold text-slate-900"
                  />
                </div>

                <div className="p-4 rounded-2xl border-2 border-slate-300 bg-white space-y-2">
                  <label className="block text-base font-extrabold">Contact 3 (Neighbor/Doctor):</label>
                  <input
                    type="text"
                    required
                    value={quickC3Name}
                    onChange={(e) => setQuickC3Name(e.target.value)}
                    placeholder="Name e.g. Ramesh (Neighbor)"
                    className="w-full p-3 rounded-xl border border-slate-300 text-base font-bold text-slate-900"
                  />
                  <input
                    type="tel"
                    required
                    value={quickC3Phone}
                    onChange={(e) => setQuickC3Phone(e.target.value)}
                    placeholder="+91 9876543212"
                    className="w-full p-3 rounded-xl border border-slate-300 text-base font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl font-black text-xl bg-red-600 text-white hover:bg-red-700 shadow-xl flex items-center justify-center gap-2 cursor-pointer min-h-[60px]"
              >
                <PhoneCall className="w-7 h-7" aria-hidden="true" />
                <span>Save 3 Emergency Contacts & Launch Agent</span>
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t-2 border-slate-200">
              <h4 className="text-lg font-extrabold">Or Dial National Helplines Directly:</h4>
              <div className="grid grid-cols-2 gap-2">
                <a href="tel:112" className="p-3 bg-red-600 text-white rounded-xl font-bold text-center">
                  📞 112 National Emergency
                </a>
                <a href="tel:14567" className="p-3 bg-amber-600 text-white rounded-xl font-bold text-center">
                  📞 14567 Elderline
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 text-center">
          <button
            onClick={() => {
              stopCallingAgent();
              onClose();
            }}
            type="button"
            className="w-full py-4 rounded-2xl font-extrabold text-xl bg-slate-800 text-white hover:bg-slate-900 min-h-[56px] cursor-pointer"
          >
            Close Emergency Menu
          </button>
        </div>
      </div>
    </div>
  );
};
