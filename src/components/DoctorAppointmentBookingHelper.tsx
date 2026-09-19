import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Car,
  User,
  CheckCircle2,
  Stethoscope,
  ChevronRight,
  RotateCcw,
  Volume2,
  Share2,
  Sparkles,
  Bot,
  Send,
  Trash2,
} from 'lucide-react';
import { DoctorAppointment } from '../types';
import { AudioInputButton } from './AudioInputButton';
import { getSecure, saveSecure } from '../services/cryptoStorage';

export const APPOINTMENTS_LOCAL_STORAGE_KEY = 'silverguard_doctor_appointments_v1';

interface DoctorAppointmentBookingHelperProps {
  highContrast: boolean;
  onReadAloud: (text: string) => void;
  onAppointmentBooked?: (appointment: DoctorAppointment) => void;
}

type BookingStep = 'specialty' | 'schedule' | 'travel' | 'accompany' | 'confirmed';

export const DoctorAppointmentBookingHelper: React.FC<DoctorAppointmentBookingHelperProps> = ({
  highContrast,
  onReadAloud,
  onAppointmentBooked,
}) => {
  const [currentStep, setCurrentStep] = useState<BookingStep>('specialty');
  const [specialty, setSpecialty] = useState<string>('');
  const [customSpecialty, setCustomSpecialty] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [customDate, setCustomDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customTime, setCustomTime] = useState<string>('');
  const [needCab, setNeedCab] = useState<boolean | null>(null);
  const [accompanyingPerson, setAccompanyingPerson] = useState<string>('');
  const [customAccompany, setCustomAccompany] = useState<string>('');
  const [bookedAppointment, setBookedAppointment] = useState<DoctorAppointment | null>(null);
  const [savedAppointments, setSavedAppointments] = useState<DoctorAppointment[]>([]);
  const [copiedShare, setCopiedShare] = useState(false);

  // Load existing appointments securely
  useEffect(() => {
    getSecure<DoctorAppointment[]>(APPOINTMENTS_LOCAL_STORAGE_KEY, []).then((saved) => {
      if (Array.isArray(saved)) {
        setSavedAppointments(saved);
      }
    });
  }, []);

  const doctorOptions = [
    { label: '👁️ Eye Specialist (Ophthalmologist)', value: 'Eye Specialist (Ophthalmologist)' },
    { label: '🦴 Orthopedic (Bone & Knee Doctor)', value: 'Orthopedic (Bone & Knee Doctor)' },
    { label: '🩺 General Physician (Family Doctor)', value: 'General Physician (Family Doctor)' },
    { label: '🦷 Dentist (Teeth Specialist)', value: 'Dentist (Teeth Specialist)' },
    { label: '🫀 Cardiologist (Heart Specialist)', value: 'Cardiologist (Heart Specialist)' },
  ];

  const dateQuickOptions = [
    { label: 'Today', value: new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) },
    {
      label: 'Tomorrow',
      value: new Date(Date.now() + 86400000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
    },
    {
      label: 'Day After Tomorrow',
      value: new Date(Date.now() + 172800000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
    },
  ];

  const timeQuickOptions = ['09:30 AM', '11:00 AM', '02:30 PM', '05:00 PM', '07:00 PM'];

  const accompanyOptions = [
    'Son (Beta)',
    'Daughter (Beti)',
    'Spouse / Partner',
    'Family Helper / Caregiver',
    'Going Alone',
  ];

  const handleSelectSpecialty = (value: string) => {
    setSpecialty(value);
    setCurrentStep('schedule');
    onReadAloud(`Selected doctor: ${value}. Now please choose appointment date and time.`);
  };

  const handleCustomSpecialtySubmit = () => {
    if (customSpecialty.trim()) {
      handleSelectSpecialty(customSpecialty.trim());
      setCustomSpecialty('');
    }
  };

  const handleScheduleSubmit = (dateVal?: string, timeVal?: string) => {
    const finalDate = dateVal || selectedDate || customDate || 'Tomorrow';
    const finalTime = timeVal || selectedTime || customTime || '11:00 AM';

    setSelectedDate(finalDate);
    setSelectedTime(finalTime);
    setCurrentStep('travel');
    onReadAloud(`Appointment scheduled for ${finalDate} at ${finalTime}. How will you travel to the doctor? Do you need a cab?`);
  };

  const handleTravelChoice = (wantsCab: boolean) => {
    setNeedCab(wantsCab);
    if (wantsCab) {
      // Direct booking with cab
      finalizeAppointment({
        wantsCab: true,
        accompany: 'Cab Driver Pickup',
      });
    } else {
      // Ask who will go with them
      setCurrentStep('accompany');
      onReadAloud(`No cab needed. Who will be going with you to the doctor appointment?`);
    }
  };

  const calculateCabPickupTime = (timeStr: string) => {
    try {
      // Parse time e.g. "11:00 AM" or "02:30 PM"
      const parts = timeStr.split(' ');
      if (parts.length === 2) {
        let [hrsStr, minsStr] = parts[0].split(':');
        let hrs = parseInt(hrsStr, 10);
        const mins = parseInt(minsStr, 10);
        const ampm = parts[1].toUpperCase();

        if (ampm === 'PM' && hrs < 12) hrs += 12;
        if (ampm === 'AM' && hrs === 12) hrs = 0;

        let totalMins = hrs * 60 + mins - 30; // 30 mins before
        if (totalMins < 0) totalMins += 24 * 60;

        const newHrs24 = Math.floor(totalMins / 60);
        const newMins = totalMins % 60;

        const finalAmpm = newHrs24 >= 12 ? 'PM' : 'AM';
        let finalHrs = newHrs24 % 12;
        if (finalHrs === 0) finalHrs = 12;

        const paddedHrs = finalHrs < 10 ? `0${finalHrs}` : `${finalHrs}`;
        const paddedMins = newMins < 10 ? `0${newMins}` : `${newMins}`;

        return `${paddedHrs}:${paddedMins} ${finalAmpm}`;
      }
    } catch {
      // fallback
    }
    return '30 mins before appointment';
  };

  const finalizeAppointment = (overrides?: { wantsCab?: boolean; accompany?: string }) => {
    const isCabNeeded = overrides?.wantsCab !== undefined ? overrides.wantsCab : needCab ?? false;
    const accompanying = overrides?.accompany || accompanyingPerson || customAccompany || 'Family Member';

    const dateStr = selectedDate || customDate || 'Tomorrow';
    const timeStr = selectedTime || customTime || '11:00 AM';

    const newAppointment: DoctorAppointment = {
      id: Date.now().toString(),
      doctorSpecialty: specialty || 'General Physician',
      date: dateStr,
      time: timeStr,
      travelMethod: isCabNeeded ? 'cab' : 'self_or_family',
      cabDetails: isCabNeeded
        ? {
            bookedTime: calculateCabPickupTime(timeStr),
            pickupStatus: 'Doorstep Pickup Confirmed',
            cabProvider: 'Uber Senior Assist / Ola Prime',
          }
        : undefined,
      accompanyingPerson: isCabNeeded ? undefined : accompanying,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };

    setBookedAppointment(newAppointment);
    setCurrentStep('confirmed');

    const updatedList = [newAppointment, ...savedAppointments];
    setSavedAppointments(updatedList);
    saveSecure(APPOINTMENTS_LOCAL_STORAGE_KEY, updatedList);

    if (onAppointmentBooked) {
      onAppointmentBooked(newAppointment);
    }

    const readText = isCabNeeded
      ? `Success! Your appointment with ${newAppointment.doctorSpecialty} is booked for ${newAppointment.date} at ${newAppointment.time}. A cab is also booked for pickup at ${newAppointment.cabDetails?.bookedTime}.`
      : `Success! Your appointment with ${newAppointment.doctorSpecialty} is booked for ${newAppointment.date} at ${newAppointment.time}. Accompanied by: ${newAppointment.accompanyingPerson}.`;

    onReadAloud(readText);
  };

  const handleReset = () => {
    setCurrentStep('specialty');
    setSpecialty('');
    setCustomSpecialty('');
    setSelectedDate('');
    setCustomDate('');
    setSelectedTime('');
    setCustomTime('');
    setNeedCab(null);
    setAccompanyingPerson('');
    setCustomAccompany('');
    setBookedAppointment(null);
  };

  const handleDeleteSavedAppointment = (id: string) => {
    const filtered = savedAppointments.filter((a) => a.id !== id);
    setSavedAppointments(filtered);
    saveSecure(APPOINTMENTS_LOCAL_STORAGE_KEY, filtered);
  };

  const handleShareDetails = () => {
    if (!bookedAppointment) return;
    const shareText = `🏥 Doctor Appointment Booked:\n• Doctor: ${bookedAppointment.doctorSpecialty}\n• Schedule: ${bookedAppointment.date} at ${bookedAppointment.time}\n• Travel: ${
      bookedAppointment.travelMethod === 'cab'
        ? `Cab booked for ${bookedAppointment.cabDetails?.bookedTime} pickup`
        : `Going with ${bookedAppointment.accompanyingPerson}`
    }\n(Booked via SilverGuard AI Companion)`;

    navigator.clipboard.writeText(shareText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 3000);
  };

  return (
    <div
      className={`rounded-3xl border-4 p-5 sm:p-6 shadow-xl space-y-6 ${
        highContrast ? 'bg-zinc-950 border-yellow-400 text-yellow-300' : 'bg-amber-50/70 border-amber-300 text-slate-900'
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-amber-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shrink-0 shadow-md">
            <Bot className="w-8 h-8" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black">Daily Doctor Booking Assistant</h3>
            <p className="text-sm sm:text-base font-semibold opacity-90">
              Interactive 3-step assistant to book doctor visits, schedules & cab transport.
            </p>
          </div>
        </div>

        {currentStep !== 'specialty' && (
          <button
            onClick={handleReset}
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-amber-200 text-amber-950 hover:bg-amber-300 border border-amber-400 min-h-[44px] cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            Start Over
          </button>
        )}
      </div>

      {/* STEP 1: Select Doctor Specialty */}
      {currentStep === 'specialty' && (
        <div className="space-y-5 animate-fade-in">
          <div className="p-4 rounded-2xl bg-white border-2 border-amber-300 shadow-sm flex items-start gap-3">
            <Stethoscope className="w-7 h-7 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-lg font-bold text-slate-900">
                Step 1: Which doctor do you need an appointment with?
              </p>
              <p className="text-sm font-medium text-slate-600">
                (Aapko kis tarah ke doctor ko dikhana hai?)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {doctorOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelectSpecialty(opt.value)}
                type="button"
                className={`p-4 rounded-2xl border-2 font-bold text-left text-base sm:text-lg flex items-center justify-between gap-3 transition-transform active:scale-95 cursor-pointer min-h-[60px] ${
                  highContrast
                    ? 'bg-zinc-900 border-yellow-400 text-white hover:bg-zinc-800'
                    : 'bg-white border-amber-300 text-slate-900 hover:bg-amber-100 shadow-sm'
                }`}
              >
                <span>{opt.label}</span>
                <ChevronRight className="w-5 h-5 shrink-0 text-amber-600" />
              </button>
            ))}
          </div>

          {/* Custom Doctor Specialty Input */}
          <div className="pt-2">
            <label className="block text-sm font-bold mb-1 opacity-90">
              Or Speak/Type Custom Specialist Name or Hospital:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customSpecialty}
                onChange={(e) => setCustomSpecialty(e.target.value)}
                placeholder="e.g. Skin Specialist (Dermatologist) or AIIMS OPD"
                className={`flex-1 px-4 py-3 rounded-2xl border-2 font-bold text-base ${
                  highContrast ? 'bg-black border-yellow-400 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <AudioInputButton
                onTranscript={(text) => setCustomSpecialty(text)}
                label="Voice"
                highContrast={highContrast}
              />
              <button
                onClick={handleCustomSpecialtySubmit}
                type="button"
                className="px-5 py-3 rounded-2xl font-bold bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Select Date & Time Schedule */}
      {currentStep === 'schedule' && (
        <div className="space-y-5 animate-fade-in">
          <div className="p-4 rounded-2xl bg-white border-2 border-amber-300 shadow-sm flex items-start gap-3">
            <Calendar className="w-7 h-7 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-lg font-bold text-slate-900">
                Step 2: When is your appointment with {specialty}?
              </p>
              <p className="text-sm font-medium text-slate-600">
                (Aap kis din aur time par doctor visit karna chahte hain?)
              </p>
            </div>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-base font-extrabold mb-2 text-amber-900">Select Date:</label>
            <div className="flex flex-wrap gap-2.5">
              {dateQuickOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setSelectedDate(opt.value)}
                  type="button"
                  className={`px-4 py-3 rounded-2xl font-bold text-base border-2 min-h-[50px] cursor-pointer ${
                    selectedDate === opt.value
                      ? 'bg-amber-600 text-white border-amber-800 shadow-md'
                      : 'bg-white text-slate-900 border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  📅 {opt.label} ({opt.value})
                </button>
              ))}
            </div>
          </div>

          {/* Time Slot Selector */}
          <div>
            <label className="block text-base font-extrabold mb-2 text-amber-900">Select Preferred Time Slot:</label>
            <div className="flex flex-wrap gap-2.5">
              {timeQuickOptions.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  type="button"
                  className={`px-4 py-3 rounded-2xl font-bold text-base border-2 min-h-[50px] cursor-pointer ${
                    selectedTime === time
                      ? 'bg-amber-600 text-white border-amber-800 shadow-md'
                      : 'bg-white text-slate-900 border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  ⏰ {time}
                </button>
              ))}
            </div>
          </div>

          {/* Manual / Voice Override */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold mb-1 opacity-80">Custom Date:</label>
              <input
                type="text"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                placeholder="e.g. 25th Sept or Next Monday"
                className="w-full px-4 py-2.5 rounded-xl border-2 font-bold text-sm bg-white border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 opacity-80">Custom Time:</label>
              <input
                type="text"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                placeholder="e.g. 04:15 PM"
                className="w-full px-4 py-2.5 rounded-xl border-2 font-bold text-sm bg-white border-slate-300"
              />
            </div>
          </div>

          <button
            onClick={() => handleScheduleSubmit()}
            disabled={!selectedDate && !customDate && !selectedTime && !customTime}
            type="button"
            className="w-full py-4 rounded-2xl font-extrabold text-lg bg-amber-600 text-white hover:bg-amber-700 shadow-lg disabled:opacity-50 cursor-pointer"
          >
            Confirm Schedule & Proceed to Travel Step 👉
          </button>
        </div>
      )}

      {/* STEP 3: Travel Choice (Cab vs Self/Family) */}
      {currentStep === 'travel' && (
        <div className="space-y-5 animate-fade-in">
          <div className="p-4 rounded-2xl bg-white border-2 border-amber-300 shadow-sm flex items-start gap-3">
            <Car className="w-7 h-7 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-lg font-bold text-slate-900">
                Step 3: How will you travel to the doctor appointment?
              </p>
              <p className="text-sm font-medium text-slate-600">
                Do you need us to book a doorstep pickup cab for you?
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleTravelChoice(true)}
              type="button"
              className="p-5 rounded-3xl border-3 border-emerald-500 bg-emerald-50 text-emerald-950 hover:bg-emerald-100 text-left space-y-2 cursor-pointer shadow-md transition-transform active:scale-95"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black">🚕 YES, Book a Cab</span>
                <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold">Auto Pickup</span>
              </div>
              <p className="text-sm font-semibold text-emerald-900">
                We will schedule an auto cab pickup at your doorstep for <strong>{calculateCabPickupTime(selectedTime || '11:00 AM')}</strong> (30 mins before your {selectedTime || 'appointment'}).
              </p>
            </button>

            <button
              onClick={() => handleTravelChoice(false)}
              type="button"
              className="p-5 rounded-3xl border-3 border-blue-500 bg-blue-50 text-blue-950 hover:bg-blue-100 text-left space-y-2 cursor-pointer shadow-md transition-transform active:scale-95"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black">🚗 NO Cab Needed</span>
                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">Self / Family</span>
              </div>
              <p className="text-sm font-semibold text-blue-900">
                I will go on my own or with a family member in our own vehicle.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3b: Ask Who Will Accompany (If No Cab) */}
      {currentStep === 'accompany' && (
        <div className="space-y-5 animate-fade-in">
          <div className="p-4 rounded-2xl bg-white border-2 border-amber-300 shadow-sm flex items-start gap-3">
            <User className="w-7 h-7 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-lg font-bold text-slate-900">
                Who will be going with you to the doctor appointment?
              </p>
              <p className="text-sm font-medium text-slate-600">
                (Aapke sath doctor ke paas kaun ja raha hai?)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accompanyOptions.map((person) => (
              <button
                key={person}
                onClick={() => {
                  setAccompanyingPerson(person);
                  finalizeAppointment({ wantsCab: false, accompany: person });
                }}
                type="button"
                className="p-4 rounded-2xl border-2 border-amber-300 bg-white hover:bg-amber-100 font-bold text-base text-left flex items-center justify-between min-h-[56px] cursor-pointer"
              >
                <span>👤 {person}</span>
                <ChevronRight className="w-5 h-5 text-amber-700" />
              </button>
            ))}
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold mb-1 opacity-80">Or Speak / Type Custom Accompanying Person:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customAccompany}
                onChange={(e) => setCustomAccompany(e.target.value)}
                placeholder="e.g. Neighbor Uncle Ramesh or Caregiver Sunita"
                className="flex-1 px-4 py-3 rounded-2xl border-2 border-slate-300 font-bold text-base bg-white"
              />
              <AudioInputButton
                onTranscript={(text) => setCustomAccompany(text)}
                label="Voice"
                highContrast={highContrast}
              />
              <button
                onClick={() => finalizeAppointment({ wantsCab: false, accompany: customAccompany || 'Family Member' })}
                type="button"
                className="px-5 py-3 rounded-2xl font-bold bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Confirmed Appointment Card */}
      {currentStep === 'confirmed' && bookedAppointment && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 rounded-3xl bg-emerald-600 text-white border-4 border-emerald-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-200 shrink-0" />
              <div>
                <span className="px-3 py-1 bg-emerald-800 text-emerald-100 rounded-full text-xs font-black uppercase tracking-wider">
                  Confirmed
                </span>
                <h4 className="text-2xl sm:text-3xl font-black mt-1">Doctor Appointment Booked!</h4>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/50">
              <div>
                <p className="text-xs font-bold text-emerald-200 uppercase">Doctor Specialist:</p>
                <p className="text-xl font-extrabold text-white">🩺 {bookedAppointment.doctorSpecialty}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-emerald-200 uppercase">Schedule (Date & Time):</p>
                <p className="text-xl font-extrabold text-white">
                  📅 {bookedAppointment.date} at {bookedAppointment.time}
                </p>
              </div>

              <div className="sm:col-span-2 border-t border-emerald-700/50 pt-2 mt-1">
                <p className="text-xs font-bold text-emerald-200 uppercase">Travel & Logistics:</p>
                {bookedAppointment.travelMethod === 'cab' ? (
                  <div className="bg-amber-400 text-slate-950 p-3 rounded-xl mt-1 font-bold text-base flex items-center justify-between">
                    <span>🚕 Doorstep Cab Pickup: {bookedAppointment.cabDetails?.bookedTime}</span>
                    <span className="text-xs px-2 py-0.5 bg-black text-amber-300 rounded font-black">Booked</span>
                  </div>
                ) : (
                  <p className="text-lg font-bold text-white mt-0.5">
                    🚗 Going via Self / Family Vehicle — Accompanied by: <strong>{bookedAppointment.accompanyingPerson}</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                onClick={() =>
                  onReadAloud(
                    `Doctor appointment confirmed! ${bookedAppointment.doctorSpecialty} on ${bookedAppointment.date} at ${bookedAppointment.time}.`
                  )
                }
                type="button"
                className="px-4 py-2.5 rounded-xl bg-white text-slate-950 font-bold hover:bg-emerald-100 flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Volume2 className="w-5 h-5" />
                Read Aloud
              </button>

              <button
                onClick={handleShareDetails}
                type="button"
                className="px-4 py-2.5 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-900 flex items-center gap-2 cursor-pointer border border-emerald-500"
              >
                <Share2 className="w-5 h-5" />
                {copiedShare ? 'Copied Share Snippet!' : 'Share with Family'}
              </button>

              <button
                onClick={handleReset}
                type="button"
                className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black hover:bg-amber-400 flex items-center gap-2 cursor-pointer ml-auto"
              >
                <RotateCcw className="w-5 h-5" />
                Book Another Visit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List of Previously Saved Doctor Appointments */}
      {savedAppointments.length > 0 && (
        <div className="pt-4 border-t-2 border-amber-200 space-y-3">
          <h4 className="text-lg font-black flex items-center gap-2 text-amber-900">
            <Calendar className="w-5 h-5 text-amber-700" />
            Your Scheduled Doctor Visits ({savedAppointments.length}):
          </h4>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {savedAppointments.map((appt) => (
              <div
                key={appt.id}
                className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  highContrast ? 'bg-zinc-900 border-yellow-400 text-white' : 'bg-white border-amber-200 text-slate-900 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-200 text-amber-950 font-black text-xs">
                      {appt.doctorSpecialty}
                    </span>
                    <span className="font-extrabold text-base">
                      {appt.date} @ {appt.time}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-1">
                    Travel: {appt.travelMethod === 'cab' ? `🚕 Cab pickup @ ${appt.cabDetails?.bookedTime}` : `🚗 Going with ${appt.accompanyingPerson}`}
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteSavedAppointment(appt.id)}
                  type="button"
                  title="Remove Appointment"
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer self-end sm:self-center"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
