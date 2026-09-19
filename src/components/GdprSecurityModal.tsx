import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  X,
  Server,
  FileCheck,
} from 'lucide-react';
import {
  exportAllUserDataGDPR,
  purgeAllUserDataGDPR,
} from '../services/cryptoStorage';

interface GdprSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  highContrast?: boolean;
}

export const GdprSecurityModal: React.FC<GdprSecurityModalProps> = ({
  isOpen,
  onClose,
  highContrast = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllUserDataGDPR();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `silverguard-gdpr-data-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error exporting data');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePurgeData = () => {
    if (
      window.confirm(
        'GDPR Article 17 Data Erasure Notice:\n\nAre you sure you want to permanently shred and delete all your encrypted profile details, emergency contacts, medical routines, and notes from this device?\n\nThis action is irreversible.'
      )
    ) {
      purgeAllUserDataGDPR();
      alert('All personal data has been cryptographically shredded and purged.');
      onClose();
      window.location.reload();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gdpr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
    >
      <div
        className={`w-full max-w-3xl rounded-3xl border-4 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6 ${
          highContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-white border-amber-400 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b-2 pb-4 border-amber-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shrink-0">
              <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden="true" />
            </div>
            <div>
              <h2 id="gdpr-modal-title" className="text-2xl sm:text-3xl font-black">
                GDPR & Zero-Knowledge Security Center
              </h2>
              <p className="text-sm sm:text-base font-extrabold text-emerald-700">
                AES-GCM 256-bit Client-Side End-to-End Encryption Active
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-2.5 rounded-xl border-2 hover:bg-rose-100 text-slate-900 border-slate-300 min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer"
            aria-label="Close Security Center"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Status Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 space-y-1">
            <div className="flex items-center gap-2 font-black text-base">
              <Lock className="w-5 h-5 text-emerald-700" />
              <span>AES-256 E2EE</span>
            </div>
            <p className="text-xs font-bold text-emerald-900">
              Hardware-accelerated WebCrypto key derivation on your browser.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-300 text-blue-950 space-y-1">
            <div className="flex items-center gap-2 font-black text-base">
              <Server className="w-5 h-5 text-blue-700" />
              <span>Zero-Knowledge</span>
            </div>
            <p className="text-xs font-bold text-blue-900">
              Database admins and server hosts cannot view your unencrypted files.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-1">
            <div className="flex items-center gap-2 font-black text-base">
              <FileCheck className="w-5 h-5 text-amber-700" />
              <span>GDPR Compliant</span>
            </div>
            <p className="text-xs font-bold text-amber-900">
              EU Regulation 2016/679 data portability & erasure tools built-in.
            </p>
          </div>
        </div>

        {/* GDPR Action Buttons */}
        <div className="space-y-3 pt-2">
          <h3 className="text-lg font-black text-slate-900">GDPR Compliance Controls:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleExportData}
              disabled={isExporting}
              type="button"
              className="py-3.5 px-5 rounded-2xl font-black text-base bg-blue-700 text-white hover:bg-blue-800 flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 min-h-[52px]"
            >
              <Download className="w-5 h-5" />
              <span>Export My Data (GDPR Art. 20)</span>
            </button>

            <button
              onClick={handlePurgeData}
              type="button"
              className="py-3.5 px-5 rounded-2xl font-black text-base bg-rose-700 text-white hover:bg-rose-800 flex items-center justify-center gap-2 shadow-md cursor-pointer min-h-[52px]"
            >
              <Trash2 className="w-5 h-5" />
              <span>Permanently Shred Data (GDPR Art. 17)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
