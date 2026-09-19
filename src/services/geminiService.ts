import { ScamAnalysisResult } from '../types';

export async function sendCompanionChatMessage(messages: { role: 'user' | 'model'; parts: { text: string }[] }[]) {
  try {
    const res = await fetch('/api/ai/companion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });
    
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    return {
      text: data.text || "I am right here with you! Could you please repeat that?",
      suggestedActions: Array.isArray(data.suggestedActions) ? data.suggestedActions : []
    };
  } catch (error: any) {
    console.error('Client Chat API Error:', error);
    // Graceful fallback response
    return {
      text: "I am right here with you! Everything is safe and secure. Please ask again or select one of the quick options above.",
      suggestedActions: [
        'Aaj ki prescription medicines check karo',
        'Family message reply draft karo',
        'Mera daily routine kya hai?'
      ]
    };
  }
}

export async function analyzeScamOrBillContent(content: string): Promise<ScamAnalysisResult> {
  try {
    const res = await fetch('/api/ai/analyze-scam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (!res.ok) {
      throw new Error(`Server error ${res.status}`);
    }

    const data = await res.json();
    if (data.data) {
      return data.data;
    }
    if (data.fallbackData) {
      return data.fallbackData;
    }
    throw new Error(data.error || 'Invalid analysis response');
  } catch (error: any) {
    console.error('Client Scam Analysis API Error:', error);
    // Fallback heuristic for safety
    const isUrgentOrMoney = /urgent|wire|gift card|password|ssn|social security|bank|suspend|locked/i.test(content);
    return {
      riskLevel: isUrgentOrMoney ? 'high_risk' : 'caution',
      riskScore: isUrgentOrMoney ? 85 : 45,
      title: isUrgentOrMoney ? 'Warning: Potential Scam Identified' : 'Gentle Caution Advised',
      simpleSummary: 'This message asks for urgent attention or sensitive details. Legitimate institutions will never pressure you or ask for passwords via text.',
      redFlags: [
        'Creates artificial urgency ("act within 24 hours")',
        'Asks for personal or account verification'
      ],
      recommendedSteps: [
        'Do not click any web links or call numbers provided inside the message.',
        'Contact your bank or family member directly using a trusted number.',
        'Remember: You are in control and do not need to rush.'
      ],
      safeReplyDraft: 'Please do not text me. I will call the official phone number directly.'
    };
  }
}

export async function generateDoctorPrepSheet(symptoms: string[], medications: string[]) {
  try {
    const res = await fetch('/api/ai/doctor-prep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, medications })
    });

    if (!res.ok) {
      throw new Error(`Server status ${res.status}`);
    }

    const data = await res.json();
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error('Doctor prep failed');
  } catch (error: any) {
    console.error('Client Doctor Prep API Error:', error);
    return {
      summary: 'Doctor Visit Summary & Question Guide prepared for your visit.',
      keyPointsForDoctor: [
        `Main symptoms/concerns noted: ${symptoms.join(', ') || 'General health checkup'}`,
        `Current medications list: ${medications.join(', ') || 'None specified'}`
      ],
      medicationsSummary: 'Review current dosages, check for side effects, and verify if any refills are needed.',
      questionsList: [
        'Are there any side effects I should watch out for with my current medication?',
        'What lifestyle or dietary changes can help improve my symptoms?',
        'When should I schedule my next follow-up appointment?'
      ]
    };
  }
}

export async function draftFamilyReply(originalMessage: string, seniorIntention: string) {
  try {
    const res = await fetch('/api/ai/family-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalMessage, seniorIntention })
    });

    if (!res.ok) {
      throw new Error(`Server status ${res.status}`);
    }

    const data = await res.json();
    if (data.success && data.data) {
      return data.data.draftedReply;
    }
    throw new Error('Family reply failed');
  } catch (error: any) {
    console.error('Client Family Reply API Error:', error);
    return `Thank you so much for your message! ${seniorIntention}. Sending lots of love!`;
  }
}
