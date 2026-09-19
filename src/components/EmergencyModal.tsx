import React from 'react';
import { Phone, X, ShieldAlert, HeartHandshake, UserCheck } from 'lucide-react';

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
  if (!isOpen) return null;

  const contacts = [
    {
      name: 'Emergency Services (911)',
      relation: 'Immediate Medical or Safety Help',
      phone: '911',
      color: 'bg-red-600 text-white hover:bg-red-700',
    },
    {
      name: 'Sarah Miller (Daughter)',
      relation: 'Primary Family Caregiver',
      phone: '(555) 234-5678',
      color: 'bg-emerald-700 text-white hover:bg-emerald-800',
    },
    {
      name: 'Dr. Robert Chen',
      relation: 'Primary Care Physician',
      phone: '(555) 876-5432',
      color: 'bg-blue-700 text-white hover:bg-blue-800',
    },
    {
      name: 'John Adams (Neighbor)',
      relation: 'Nearby Trusted Friend',
      phone: '(555) 345-6789',
      color: 'bg-amber-700 text-white hover:bg-amber-800',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
    >
      <div
        className={`w-full max-w-2xl rounded-3xl p-6 sm:p-8 border-4 shadow-2xl space-y-6 ${
          highContrast
            ? 'bg-black text-yellow-300 border-yellow-400'
            : 'bg-white text-slate-900 border-red-500'
        }`}
      >
        <div className="flex items-center justify-between border-b-2 pb-4 border-slate-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 text-white rounded-2xl">
              <ShieldAlert className="w-8 h-8" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="emergency-modal-title"
                className="text-2xl sm:text-3xl font-extrabold"
              >
                Emergency & Trusted Contacts
              </h2>
              <p className="text-base sm:text-lg font-semibold opacity-90">
                Tap any contact below to make a direct call
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-3 rounded-2xl bg-slate-200 text-slate-900 hover:bg-slate-300 focus-visible:ring-4 focus-visible:ring-slate-400 min-h-[56px] min-w-[56px] flex items-center justify-center"
            aria-label="Close emergency contacts dialog"
          >
            <X className="w-8 h-8" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4">
          {contacts.map((c, idx) => (
            <a
              key={idx}
              href={`tel:${c.phone}`}
              className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl min-h-[72px] font-bold text-lg sm:text-xl transition-all shadow-md focus-visible:ring-4 focus-visible:ring-amber-500 border-2 border-transparent ${c.color}`}
            >
              <div>
                <div className="text-xl sm:text-2xl">{c.name}</div>
                <div className="text-sm sm:text-base font-normal opacity-90">{c.relation}</div>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl">
                <Phone className="w-6 h-6 animate-bounce" aria-hidden="true" />
                <span>{c.phone}</span>
              </div>
            </a>
          ))}
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            type="button"
            className="w-full py-4 rounded-2xl font-extrabold text-xl bg-slate-800 text-white hover:bg-slate-900 focus-visible:ring-4 min-h-[60px]"
          >
            Close Emergency Menu
          </button>
        </div>
      </div>
    </div>
  );
};
