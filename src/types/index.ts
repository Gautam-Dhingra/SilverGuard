export type FontSizeOption = 'normal' | 'large' | 'xlarge';

export type NavigationTab =
  | 'companion'
  | 'scam-checker'
  | 'medications'
  | 'doctor-prep'
  | 'family-social'
  | 'test-cases';

export interface TestCaseScenario {
  id: string;
  category: 'Scam & Security' | 'Doctor Prep' | 'Family Reply' | 'Companion Chat' | 'Voice & Accessibility';
  title: string;
  targetTab: NavigationTab;
  description: string;
  sampleInput: string;
  expectedOutcome: string;
  verificationSteps: string[];
}

export interface AccessibilitySettings {
  fontSize: FontSizeOption;
  highContrast: boolean;
  ttsEnabled: boolean;
  voiceNavActive: boolean;
  speechRate: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
  isSimplified?: boolean;
}

export interface ScamAnalysisResult {
  riskLevel: 'safe' | 'caution' | 'high_risk';
  riskScore: number; // 0-100
  title: string;
  simpleSummary: string;
  redFlags: string[];
  recommendedSteps: string[];
  safeReplyDraft?: string;
  isOfficialOrgImpersonation?: boolean;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'bedtime';
  instructions: string;
  takenToday: boolean;
  takenTime?: string;
  aiTip?: string;
  refillNeeded?: boolean;
}

export interface DoctorVisitPrep {
  id: string;
  appointmentDate: string;
  doctorName: string;
  specialty: string;
  symptomsAndConcerns: string[];
  questionsToAsk: string[];
  generatedSummarySheet?: {
    summary: string;
    keyPointsForDoctor: string[];
    medicationsSummary: string;
    questionsList: string[];
  };
}

export interface FamilyUpdate {
  id: string;
  senderName: string;
  relation: string;
  message: string;
  date: string;
  photoUrl?: string;
  unread: boolean;
  aiDraftedReply?: string;
}

export interface VoiceCommandHelp {
  command: string;
  description: string;
  examples: string[];
}
