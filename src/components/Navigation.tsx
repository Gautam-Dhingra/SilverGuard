import React from 'react';
import {
  MessageCircleHeart,
  ShieldAlert,
  Pill,
  Stethoscope,
  Users,
  User,
  FlaskConical,
} from 'lucide-react';
import { NavigationTab } from '../types';

interface NavigationProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  highContrast: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  highContrast,
}) => {
  const tabs: {
    id: NavigationTab;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    shortcutKey: string;
  }[] = [
    {
      id: 'companion',
      label: 'Daily Helper',
      sublabel: 'Ask AI & Chat',
      icon: MessageCircleHeart,
      shortcutKey: '1',
    },
    {
      id: 'scam-checker',
      label: 'Scam & Safeguard',
      sublabel: 'Messages & Bills',
      icon: ShieldAlert,
      shortcutKey: '2',
    },
    {
      id: 'medications',
      label: 'Medications',
      sublabel: 'Pills & Schedule',
      icon: Pill,
      shortcutKey: '3',
    },
    {
      id: 'doctor-prep',
      label: 'Doctor Prep',
      sublabel: 'Prepare Questions',
      icon: Stethoscope,
      shortcutKey: '4',
    },
    {
      id: 'family-social',
      label: 'Family Updates',
      sublabel: 'Messages & Replies',
      icon: Users,
      shortcutKey: '5',
    },
    {
      id: 'profile',
      label: 'Profile & Routine',
      sublabel: '3 Emergency Contacts',
      icon: User,
      shortcutKey: '6',
    },
    {
      id: 'test-cases',
      label: 'Test Cases',
      sublabel: 'Evaluator Sandbox',
      icon: FlaskConical,
      shortcutKey: '7',
    },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Main application navigation"
      className={`border-b-4 sticky top-0 z-30 transition-colors ${
        highContrast
          ? 'bg-black text-white border-yellow-400'
          : 'bg-white text-slate-900 border-amber-200 shadow-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div
          role="tablist"
          aria-label="Senior companion navigation options"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 py-2.5"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            let activeStyles = '';
            if (highContrast) {
              activeStyles = isActive
                ? 'bg-yellow-400 text-black border-yellow-400 ring-4 ring-yellow-300 font-extrabold scale-[1.02]'
                : 'bg-zinc-900 text-yellow-300 border-zinc-700 hover:bg-zinc-800 hover:border-yellow-400';
            } else {
              activeStyles = isActive
                ? 'bg-amber-600 text-white border-amber-700 ring-4 ring-amber-300 font-extrabold shadow-md scale-[1.02]'
                : 'bg-amber-50/80 text-slate-800 border-amber-200 hover:bg-amber-100 hover:border-amber-400';
            }

            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                type="button"
                className={`min-h-[64px] sm:min-h-[72px] px-3 py-2.5 rounded-2xl border-3 flex flex-col items-center justify-center text-center transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500 cursor-pointer ${activeStyles}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" aria-hidden="true" />
                  <span className="text-base sm:text-lg tracking-tight leading-tight">
                    {tab.label}
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-semibold opacity-90 mt-0.5 hidden xs:block">
                  {tab.sublabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
