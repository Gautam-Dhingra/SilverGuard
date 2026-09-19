import React, { useState, useEffect } from 'react';
import {
  User,
  Clock,
  Pill,
  PhoneCall,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Save,
  Volume2,
  Heart,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import {
  SeniorUserProfile,
  EmergencyContact,
  UserDailyRoutine,
  MedicationItem,
} from '../types';
import { AudioInputButton } from './AudioInputButton';

interface UserProfileViewProps {
  highContrast: boolean;
  onReadAloud: (text: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const PROFILE_LOCAL_STORAGE_KEY = 'silverguard_user_profile_v2';
export const MEDS_LOCAL_STORAGE_KEY = 'silverguard_user_medications_v2';

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  highContrast,
  onReadAloud,
  onNavigateToTab,
}) => {
  // Load profile from localStorage
  const [profile, setProfile] = useState<SeniorUserProfile>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return {
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
        specialNotes: 'Low salt diet, 30 min gentle walk',
      },
      emergencyContacts: [], // Requires at least 3
    };
  });

  // Load medicines from localStorage
  const [meds, setMeds] = useState<MedicationItem[]>(() => {
    try {
      const saved = localStorage.getItem(MEDS_LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return []; // DO NOT auto-recommend medicines! Must be user-provided.
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states for new emergency contact
  const [cName, setCName] = useState('');
  const [cRelation, setCRelation] = useState('Beta (Son)');
  const [cPhone, setCPhone] = useState('+91 ');

  // Form states for new medicine
  const [mName, setMName] = useState('');
  const [mDosage, setMDosage] = useState('1 tablet');
  const [mTime, setMTime] = useState<'morning' | 'afternoon' | 'evening' | 'bedtime'>('morning');
  const [mInstructions, setMInstructions] = useState('Take with water after food');

  useEffect(() => {
    try {
      const serialized = JSON.stringify(profile);
      const stored = localStorage.getItem(PROFILE_LOCAL_STORAGE_KEY);
      if (stored !== serialized) {
        localStorage.setItem(PROFILE_LOCAL_STORAGE_KEY, serialized);
        setTimeout(() => window.dispatchEvent(new Event('silverguard_data_updated')), 0);
      }
    } catch (e) {
      console.error(e);
    }
  }, [profile]);

  useEffect(() => {
    try {
      const serialized = JSON.stringify(meds);
      const stored = localStorage.getItem(MEDS_LOCAL_STORAGE_KEY);
      if (stored !== serialized) {
        localStorage.setItem(MEDS_LOCAL_STORAGE_KEY, serialized);
        setTimeout(() => window.dispatchEvent(new Event('silverguard_data_updated')), 0);
      }
    } catch (e) {
      console.error(e);
    }
  }, [meds]);

  const handleSaveProfile = () => {
    if (profile.emergencyContacts.length < 3) {
      alert('Please save at least THREE (3) family emergency contacts to ensure your Emergency Calling Agent can reach your family!');
      return;
    }
    setSavedSuccess(true);
    onReadAloud('Profile, daily routine, and emergency contacts saved successfully!');
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const addEmergencyContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cPhone.trim()) return;

    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      name: cName.trim(),
      relation: cRelation.trim(),
      phone: cPhone.trim(),
      priority: profile.emergencyContacts.length + 1,
    };

    setProfile((prev) => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, newContact],
    }));

    setCName('');
    setCPhone('+91 ');
    onReadAloud(`Added emergency contact ${newContact.name}`);
  };

  const removeContact = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter((c) => c.id !== id),
    }));
  };

  const addMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim()) return;

    const newMed: MedicationItem = {
      id: Date.now().toString(),
      name: mName.trim(),
      dosage: mDosage.trim(),
      frequency: 'Daily',
      timeOfDay: mTime,
      instructions: mInstructions.trim(),
      takenToday: false,
    };

    setMeds((prev) => [...prev, newMed]);
    setMName('');
    onReadAloud(`Saved medicine ${newMed.name} to your schedule.`);
  };

  const removeMed = (id: string) => {
    setMeds((prev) => prev.filter((m) => m.id !== id));
  };

  const updateRoutine = (key: keyof UserDailyRoutine, val: string) => {
    setProfile((prev) => ({
      ...prev,
      dailyRoutine: {
        ...prev.dailyRoutine,
        [key]: val,
      },
    }));
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
          highContrast
            ? 'bg-zinc-950 text-yellow-300 border-yellow-400'
            : 'bg-gradient-to-r from-amber-800 to-amber-900 text-white border-amber-600'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-4 bg-amber-500 text-slate-950 rounded-2xl shrink-0">
            <User className="w-10 h-10" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              My Profile, Routine & Emergency Contacts
            </h2>
            <p className="text-base sm:text-lg font-semibold opacity-90 mt-1">
              SilverGuard NEVER recommends medicines on its own. Please share your real medicines, daily routine, and at least 3 family emergency contacts!
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          type="button"
          className="px-8 py-4 rounded-2xl font-black text-xl bg-yellow-400 text-slate-950 hover:bg-yellow-300 min-h-[60px] flex items-center gap-3 shadow-lg shrink-0 cursor-pointer"
        >
          <Save className="w-6 h-6" aria-hidden="true" />
          <span>Save Profile Details</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center gap-3 animate-bounce shadow-lg">
          <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
          <span>Profile, Prescribed Medicines & Emergency Contacts Saved!</span>
        </div>
      )}

      {/* SECTION 1: Personal Info & Emergency Contacts (At least 3 Required) */}
      <div
        className={`rounded-3xl border-4 p-6 sm:p-8 shadow-xl space-y-6 ${
          highContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-white border-rose-300 text-slate-900'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 pb-4 border-slate-200">
          <div className="flex items-center gap-3">
            <PhoneCall className="w-8 h-8 text-rose-600" aria-hidden="true" />
            <div>
              <h3 className="text-2xl font-black">
                1. Family Emergency Contacts (At Least 3 Required)
              </h3>
              <p className="text-base font-bold opacity-80">
                Your AI Calling Agent will dial these 3 contacts sequentially during emergency SOS calls.
              </p>
            </div>
          </div>

          <span
            className={`px-4 py-2 rounded-2xl font-black text-lg ${
              profile.emergencyContacts.length >= 3
                ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-400'
                : 'bg-rose-100 text-rose-900 border-2 border-rose-400 animate-pulse'
            }`}
          >
            {profile.emergencyContacts.length >= 3
              ? `✅ ${profile.emergencyContacts.length} Contacts Set`
              : `⚠️ ${profile.emergencyContacts.length}/3 Contacts Set (Need ${
                  3 - profile.emergencyContacts.length
                } More)`}
          </span>
        </div>

        {profile.emergencyContacts.length < 3 && (
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-950 font-bold text-lg flex items-start gap-3">
            <AlertTriangle className="w-7 h-7 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-extrabold text-xl">Action Required:</p>
              <p>
                Please save at least 3 family emergency phone numbers (e.g., Son Rohan, Daughter Pooja, Neighbor Ramesh) so the Emergency Calling Agent can reach your family if you trigger an SOS alert.
              </p>
            </div>
          </div>
        )}

        {/* Existing Contacts List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {profile.emergencyContacts.map((contact, index) => (
            <div
              key={contact.id}
              className="p-5 rounded-2xl border-3 border-rose-300 bg-rose-50/80 text-slate-900 space-y-2 relative shadow-md"
            >
              <div className="flex items-center justify-between pr-8">
                <span className="px-3 py-1 bg-rose-700 text-white rounded-xl text-xs font-black uppercase">
                  Priority #{index + 1} Call
                </span>
                <button
                  onClick={() => removeContact(contact.id)}
                  type="button"
                  className="p-1.5 text-red-600 hover:bg-red-200 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                  title="Remove contact"
                >
                  <Trash2 className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <h4 className="text-xl font-extrabold">{contact.name}</h4>
              <p className="text-base font-bold text-rose-900">
                {contact.relation}
              </p>
              <p className="text-lg font-mono font-black text-slate-900 bg-white p-2 rounded-xl border border-rose-200">
                📞 {contact.phone}
              </p>
            </div>
          ))}
        </div>

        {/* Form to Add Emergency Contact */}
        <form onSubmit={addEmergencyContact} className="p-5 rounded-2xl border-2 border-slate-300 bg-amber-50/50 space-y-4">
          <h4 className="text-xl font-extrabold flex items-center gap-2">
            <Plus className="w-6 h-6 text-rose-600" aria-hidden="true" />
            <span>Add Emergency Contact #{profile.emergencyContacts.length + 1}</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-base font-extrabold mb-1">Name (Naam):</label>
              <input
                type="text"
                required
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                placeholder="e.g. Rohan Sharma"
                className="w-full p-3.5 rounded-xl border-2 border-slate-300 text-lg font-medium text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-base font-extrabold mb-1">Relation (Rishta):</label>
              <select
                value={cRelation}
                onChange={(e) => setCRelation(e.target.value)}
                className="w-full p-3.5 rounded-xl border-2 border-slate-300 text-lg font-medium text-slate-900 bg-white"
              >
                <option value="Beta (Son)">Beta (Son)</option>
                <option value="Beti (Daughter)">Beti (Daughter)</option>
                <option value="Pota / Poti (Grandchild)">Pota / Poti (Grandchild)</option>
                <option value="Neighbor / Family Friend">Neighbor / Family Friend</option>
                <option value="Family Doctor">Family Doctor</option>
              </select>
            </div>

            <div>
              <label className="block text-base font-extrabold mb-1">Phone Number (+91):</label>
              <input
                type="tel"
                required
                value={cPhone}
                onChange={(e) => setCPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full p-3.5 rounded-xl border-2 border-slate-300 text-lg font-mono font-bold text-slate-900 bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl font-black text-lg bg-rose-700 text-white hover:bg-rose-800 min-h-[52px] shadow-md cursor-pointer"
          >
            + Add This Emergency Contact
          </button>
        </form>
      </div>

      {/* SECTION 2: Doctor-Prescribed Medicines (No auto-recommendation) */}
      <div
        className={`rounded-3xl border-4 p-6 sm:p-8 shadow-xl space-y-6 ${
          highContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-white border-amber-300 text-slate-900'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 pb-4 border-slate-200">
          <div className="flex items-center gap-3">
            <Pill className="w-8 h-8 text-amber-600" aria-hidden="true" />
            <div>
              <h3 className="text-2xl font-black">
                2. Doctor-Prescribed Medicine Information
              </h3>
              <p className="text-base font-bold opacity-80">
                SilverGuard ONLY tracks medicines you provide. We never suggest or prescribe medicines.
              </p>
            </div>
          </div>

          <span className="px-4 py-2 rounded-2xl bg-amber-100 text-amber-950 font-black text-lg border-2 border-amber-300">
            {meds.length} Medicines Prescribed
          </span>
        </div>

        {meds.length === 0 ? (
          <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-300 text-slate-900 space-y-3 text-center">
            <Pill className="w-12 h-12 text-amber-600 mx-auto" aria-hidden="true" />
            <h4 className="text-xl font-black">No Medicines Entered Yet</h4>
            <p className="text-base font-semibold max-w-lg mx-auto opacity-90">
              Please enter your official doctor's prescription details (Medicine name, dosage, time of day) below so we can help you keep track of your daily routine safely.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meds.map((med) => (
              <div
                key={med.id}
                className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/80 text-slate-900 space-y-2 relative"
              >
                <div className="flex items-center justify-between pr-8">
                  <span className="px-3 py-1 bg-amber-700 text-white rounded-xl text-xs font-black uppercase">
                    {med.timeOfDay}
                  </span>
                  <button
                    onClick={() => removeMed(med.id)}
                    type="button"
                    className="p-1.5 text-red-600 hover:bg-red-200 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                    title="Remove medicine"
                  >
                    <Trash2 className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                <h4 className="text-xl font-extrabold">{med.name}</h4>
                <p className="text-base font-bold opacity-90">{med.dosage}</p>
                <p className="text-sm font-medium bg-white p-2.5 rounded-xl border border-amber-200">
                  👉 {med.instructions}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Form to Add Prescribed Medicine */}
        <form onSubmit={addMedication} className="p-5 rounded-2xl border-2 border-slate-300 bg-amber-50/50 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-extrabold flex items-center gap-2">
              <Plus className="w-6 h-6 text-amber-600" aria-hidden="true" />
              <span>Add Prescribed Medicine</span>
            </h4>
            <AudioInputButton
              onTranscript={(text) => setMName((prev) => (prev ? `${prev} ${text}` : text))}
              label="Speak Medicine Name"
              highContrast={highContrast}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-base font-extrabold mb-1">Medicine Name:</label>
              <input
                type="text"
                required
                value={mName}
                onChange={(e) => setMName(e.target.value)}
                placeholder="e.g. Telmisartan 40mg or Metformin"
                className="w-full p-3.5 rounded-xl border-2 border-slate-300 text-lg font-medium text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-base font-extrabold mb-1">Dosage:</label>
              <input
                type="text"
                value={mDosage}
                onChange={(e) => setMDosage(e.target.value)}
                placeholder="e.g. 1 tablet after food"
                className="w-full p-3.5 rounded-xl border-2 border-slate-300 text-lg font-medium text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-base font-extrabold mb-1">Time of Day:</label>
              <select
                value={mTime}
                onChange={(e: any) => setMTime(e.target.value)}
                className="w-full p-3.5 rounded-xl border-2 border-slate-300 text-lg font-medium text-slate-900 bg-white"
              >
                <option value="morning">Morning (Subah)</option>
                <option value="afternoon">Afternoon (Dopahar)</option>
                <option value="evening">Evening (Shaam)</option>
                <option value="bedtime">Bedtime (Raat)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-base font-extrabold mb-1">Doctor Instructions / Notes:</label>
            <input
              type="text"
              value={mInstructions}
              onChange={(e) => setMInstructions(e.target.value)}
              placeholder="e.g. Take with warm water after breakfast"
              className="w-full p-3.5 rounded-xl border-2 border-slate-300 text-lg font-medium text-slate-900 bg-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl font-black text-lg bg-amber-600 text-white hover:bg-amber-700 min-h-[52px] shadow-md cursor-pointer"
          >
            + Add Prescribed Medicine
          </button>
        </form>
      </div>

      {/* SECTION 3: Daily Routine Schedule */}
      <div
        className={`rounded-3xl border-4 p-6 sm:p-8 shadow-xl space-y-6 ${
          highContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-white border-blue-300 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-3 border-b-2 pb-4 border-slate-200">
          <Clock className="w-8 h-8 text-blue-600" aria-hidden="true" />
          <div>
            <h3 className="text-2xl font-black">
              3. Daily Routine Schedule (Din Charya)
            </h3>
            <p className="text-base font-bold opacity-80">
              Set your preferred daily times so SilverGuard AI can assist you with reminders.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-base font-extrabold mb-1">🌅 Wake Up Time:</label>
            <input
              type="text"
              value={profile.dailyRoutine.wakeupTime}
              onChange={(e) => updateRoutine('wakeupTime', e.target.value)}
              className="w-full p-3.5 rounded-xl border-2 border-slate-300 text-lg font-bold text-slate-900 bg-blue-50/50"
            />
          </div>

          <div>
            <label className="block text-base font-extrabold mb-1">☕ Breakfast & Tea Time:</label>
            <input
              type="text"
              value={profile.dailyRoutine.breakfastTime}
              onChange={(e) => updateRoutine('breakfastTime', e.target.value)}
              className="w-full p-3.5 rounded-xl border-2 border-slate-300 text-lg font-bold text-slate-900 bg-blue-50/50"
            />
          </div>

          <div>
            <label className="block text-base font-extrabold mb-1">🍛 Lunch Time:</label>
            <input
              type="text"
              value={profile.dailyRoutine.lunchTime}
              onChange={(e) => updateRoutine('lunchTime', e.target.value)}
              className="w-full p-3.5 rounded-xl border-2 border-slate-300 text-lg font-bold text-slate-900 bg-blue-50/50"
            />
          </div>

          <div>
            <label className="block text-base font-extrabold mb-1">🚶 Evening Walk / Tea:</label>
            <input
              type="text"
              value={profile.dailyRoutine.eveningWalkTime}
              onChange={(e) => updateRoutine('eveningWalkTime', e.target.value)}
              className="w-full p-3.5 rounded-xl border-2 border-slate-300 text-lg font-bold text-slate-900 bg-blue-50/50"
            />
          </div>

          <div>
            <label className="block text-base font-extrabold mb-1">🍲 Dinner Time:</label>
            <input
              type="text"
              value={profile.dailyRoutine.dinnerTime}
              onChange={(e) => updateRoutine('dinnerTime', e.target.value)}
              className="w-full p-3.5 rounded-xl border-2 border-slate-300 text-lg font-bold text-slate-900 bg-blue-50/50"
            />
          </div>

          <div>
            <label className="block text-base font-extrabold mb-1">😴 Bedtime:</label>
            <input
              type="text"
              value={profile.dailyRoutine.bedTime}
              onChange={(e) => updateRoutine('bedTime', e.target.value)}
              className="w-full p-3.5 rounded-xl border-2 border-slate-300 text-lg font-bold text-slate-900 bg-blue-50/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-base font-extrabold mb-1">🩺 BP / Sugar Routine Notes:</label>
          <input
            type="text"
            value={profile.dailyRoutine.bpSugarCheckTime || ''}
            onChange={(e) => updateRoutine('bpSugarCheckTime', e.target.value)}
            placeholder="e.g. Check Blood Pressure every Monday morning"
            className="w-full p-3.5 rounded-xl border-2 border-slate-300 text-lg font-bold text-slate-900 bg-blue-50/50"
          />
        </div>

        <button
          onClick={handleSaveProfile}
          type="button"
          className="w-full py-4 rounded-2xl font-black text-xl bg-blue-700 text-white hover:bg-blue-800 min-h-[60px] shadow-lg flex items-center justify-center gap-3 cursor-pointer"
        >
          <Save className="w-6 h-6" aria-hidden="true" />
          <span>Save All Profile, Routine & Emergency Contact Settings</span>
        </button>
      </div>
    </div>
  );
};
