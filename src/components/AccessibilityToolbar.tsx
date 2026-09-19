import React from 'react';
import { Type, Eye, Volume2, HelpCircle, Sun, Moon } from 'lucide-react';
import { AccessibilitySettings, FontSizeOption } from '../types';

interface AccessibilityToolbarProps {
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  onReadAloudPage: () => void;
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({
  settings,
  onUpdateSettings,
  onReadAloudPage,
}) => {
  const { fontSize, highContrast } = settings;

  const cycleFontSize = () => {
    if (fontSize === 'normal') onUpdateSettings({ fontSize: 'large' });
    else if (fontSize === 'large') onUpdateSettings({ fontSize: 'xlarge' });
    else onUpdateSettings({ fontSize: 'normal' });
  };

  const getFontSizeLabel = () => {
    if (fontSize === 'normal') return 'Text: Normal';
    if (fontSize === 'large') return 'Text: Large';
    return 'Text: Extra Large';
  };

  return (
    <div
      role="region"
      aria-label="Accessibility controls toolbar"
      className={`border-b-2 py-2 px-4 ${
        highContrast
          ? 'bg-zinc-950 text-white border-yellow-400'
          : 'bg-amber-100/50 text-slate-800 border-amber-200'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
          <span>Accessibility Bar:</span>
        </div>

        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Text Size Cycle Button */}
          <button
            onClick={cycleFontSize}
            type="button"
            className={`flex items-center gap-2 min-h-[48px] px-3.5 py-2 rounded-lg font-bold border-2 text-base transition-all focus-visible:ring-4 ${
              highContrast
                ? 'border-yellow-400 bg-black text-yellow-300 hover:bg-yellow-900/40'
                : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100'
            }`}
            aria-label={`Current font size is ${fontSize}. Click to change text size.`}
          >
            <Type className="w-5 h-5" aria-hidden="true" />
            <span>{getFontSizeLabel()}</span>
          </button>

          {/* High Contrast Toggle Button */}
          <button
            onClick={() => onUpdateSettings({ highContrast: !highContrast })}
            type="button"
            className={`flex items-center gap-2 min-h-[48px] px-3.5 py-2 rounded-lg font-bold border-2 text-base transition-all focus-visible:ring-4 ${
              highContrast
                ? 'border-yellow-400 bg-yellow-400 text-black hover:bg-yellow-300'
                : 'border-amber-400 bg-white text-slate-900 hover:bg-amber-50'
            }`}
            aria-label={
              highContrast
                ? 'Disable high contrast dark yellow theme'
                : 'Enable high contrast dark yellow theme'
            }
          >
            {highContrast ? (
              <Sun className="w-5 h-5 text-black" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5 text-amber-700" aria-hidden="true" />
            )}
            <span>{highContrast ? 'Standard Theme' : 'High Contrast'}</span>
          </button>

          {/* Read Page Aloud Trigger */}
          <button
            onClick={onReadAloudPage}
            type="button"
            className={`flex items-center gap-2 min-h-[48px] px-3.5 py-2 rounded-lg font-bold border-2 text-base transition-all focus-visible:ring-4 ${
              highContrast
                ? 'border-yellow-400 bg-zinc-900 text-yellow-300 hover:bg-zinc-800'
                : 'border-amber-400 bg-amber-600 text-white hover:bg-amber-700'
            }`}
            aria-label="Read active screen content aloud using voice synthesis"
          >
            <Volume2 className="w-5 h-5" aria-hidden="true" />
            <span>Read Page Aloud</span>
          </button>
        </div>
      </div>
    </div>
  );
};
