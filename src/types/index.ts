export type FontSizeOption = 'normal' | 'large' | 'xlarge';

export type NavigationTab =
  | 'companion'
  | 'scam-checker'
  | 'medications'
  | 'doctor-prep'
  | 'family-social'
  | 'profile'
  | 'test-cases';

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  priority: number; // 1, 2, 3...
  isPrimary?: boolean;
}

export interface UserDailyRoutine {
  wakeupTime: string;
  breakfastTime: string;
  lunchTime: string;
  eveningWalkTime: string;
  dinnerTime: string;
  bedTime: string;
  bpSugarCheckTime?: string;
  specialNotes?: string;
}

export interface SeniorUserProfile {
  seniorName: string;
  city: string;
  dailyRoutine: UserDailyRoutine;
  emergencyContacts: EmergencyContact[]; // Must store at least 3
}

export interface TestCaseScenario {
  id: string;
  category:
    | 'Scam & Security'
    | 'Doctor Prep'
    | 'Family Reply'
    | 'Companion Chat'
    | 'Voice & Accessibility'
    | 'Emergency Calling Agent';
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

export interface DoctorAppointment {
  id: string;
  doctorSpecialty: string; // e.g. Eye Specialist, Orthopedic, General Physician
  doctorName?: string;
  date: string; // e.g. 2026-09-20 / Tomorrow
  time: string; // e.g. 10:30 AM
  travelMethod: 'cab' | 'self_or_family';
  cabDetails?: {
    bookedTime: string; // e.g. 10:00 AM
    pickupStatus: string;
    cabProvider: string;
  };
  accompanyingPerson?: string; // e.g. Son (Beta), Daughter, Spouse, Caregiver, Going Alone
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface VoiceCommandHelp {
  command: string;
  description: string;
  examples: string[];
}
