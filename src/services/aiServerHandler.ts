import { GoogleGenAI } from '@google/genai';

export const SENIOR_COMPANION_SYSTEM_PROMPT = `
You are "SilverGuard", a loving, warm, patient, and ultra-clear AI daily companion for senior citizens and Indian grandparents (Dada-Dadi & Nana-Nani).
Your primary goals:
1. Speak in warm, respectful, friendly, and easy-to-understand language (5th-grade reading level, English, Hindi, or Hinglish). Avoid tech jargon, acronyms, or confusing terms.
2. CRITICAL MEDICAL SAFETY MANDATE: You MUST NEVER prescribe, recommend, suggest, or invent medicines or dosages on your own without user-provided prescription details or direct doctor guidance. If a senior asks "What medicine should I take?", kindly explain that you are an AI companion, ask for their doctor's prescription details, and urge them to consult their MBBS doctor or pharmacist.
3. Be encouraging and patient. Always reassure the user that they are doing great.
4. Keep sentences reasonably concise, clear, and direct. Break complex explanations into 2-3 simple bullet points.
5. When asked about technology, medicine schedule, bills, or online safety, emphasize safety, calm assurance, and step-by-step guidance.
`;

export async function handleCompanionChat(messages: { role: 'user' | 'model'; parts: { text: string }[] }[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  const lastUserMsg = messages.length > 0 ? messages[messages.length - 1].parts[0]?.text || '' : '';

  const getFallbackSuggestions = (userText: string) => {
    const lower = userText.toLowerCase();
    if (lower.includes('pill') || lower.includes('dawai') || lower.includes('medicine') || lower.includes('dose') || lower.includes('missed')) {
      return [
        'Aaj ki dawai schedule check karo',
        'Missed medicine safety guidance',
        'Family ko status update bhejo',
      ];
    }
    if (lower.includes('scam') || lower.includes('bill') || lower.includes('bank') || lower.includes('sms') || lower.includes('fraud')) {
      return [
        'Is SMS alert safe or scam?',
        'What are main scam red flags?',
        'Who to call if suspicious?',
      ];
    }
    if (lower.includes('doctor') || lower.includes('hospital') || lower.includes('appointment')) {
      return [
        'Doctor visit question checklist',
        'Medication side effects to ask doctor',
        'How to explain symptoms clearly',
      ];
    }
    return [
      'Aaj ki prescription medicines check karo',
      'Family message reply draft karo',
      'Mera daily routine kya hai?',
    ];
  };

  if (!apiKey) {
    const text = `I am right here with you! ${
      lastUserMsg.toLowerCase().includes('pill') || lastUserMsg.toLowerCase().includes('dose') || lastUserMsg.toLowerCase().includes('medication')
        ? 'Regarding your medication: always consult your doctor or pharmacist before changing your dosage. I am here to help you keep track of your schedule safely.'
        : 'I am here to help you read messages, check bills, organize doctor questions, or chat. You are doing great!'
    }`;
    return {
      success: true,
      text,
      suggestedActions: getFallbackSuggestions(lastUserMsg),
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${SENIOR_COMPANION_SYSTEM_PROMPT}\n\nIMPORTANT FORMAT REQUIREMENT: Respond in JSON format containing:\n1. "text": Your clear, warm, 2-3 sentence response in simple English/Hindi/Hinglish.\n2. "suggestedActions": An array of 3 short follow-up suggestion chips (e.g. ["Check morning pills", "Ask about side effects", "Send update to family"]).\n\nExample JSON structure:\n{\n  "text": "Your warm response here...",\n  "suggestedActions": ["Option 1", "Option 2", "Option 3"]\n}`
            }
          ]
        },
        ...messages.map(m => ({
          role: m.role,
          parts: m.parts
        }))
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 700
      }
    });

    const rawText = response.text || '';
    try {
      const parsed = JSON.parse(rawText);
      return {
        success: true,
        text: parsed.text || rawText || "I'm right here with you! Could you please ask that again?",
        suggestedActions: Array.isArray(parsed.suggestedActions) && parsed.suggestedActions.length > 0
          ? parsed.suggestedActions
          : getFallbackSuggestions(lastUserMsg)
      };
    } catch {
      return {
        success: true,
        text: rawText || "I'm right here with you! Could you please ask that again?",
        suggestedActions: getFallbackSuggestions(lastUserMsg)
      };
    }
  } catch (error: any) {
    console.warn('Companion Chat API warning (falling back gracefully):', error.message || error);
    return {
      success: true,
      text: "I am right here with you! Everything is safe and secure. Please ask me any questions about your day, pills, or family!",
      suggestedActions: getFallbackSuggestions(lastUserMsg)
    };
  }
}

export async function handleScamAndBillAnalysis(inputContent: string) {
  const isUrgentOrMoney = /urgent|wire|gift card|password|ssn|social security|bank|suspend|locked|warrant|irs|target|code/i.test(inputContent);
  const isBill = /bill|statement|charge|surcharge|fee|utility|electric|due|total/i.test(inputContent);

  const fallbackData = {
    riskLevel: isUrgentOrMoney ? 'high_risk' : 'caution',
    riskScore: isUrgentOrMoney ? 85 : 45,
    title: isUrgentOrMoney ? 'Warning: High Scam Risk Identified' : (isBill ? 'Notice: Bill Statement Review Needed' : 'Needs Gentle Caution'),
    simpleSummary: isUrgentOrMoney
      ? 'This message demands urgent action or sensitive gift card/bank details. Legitimate institutions like the IRS or banks will never pressure you or ask for gift cards via text.'
      : 'This statement mentions fees or charges. Please verify unexpectedly high fees directly with your official provider customer care before paying.',
    redFlags: isUrgentOrMoney ? [
      'Creates artificial urgency or arrest threats',
      'Requests non-standard payment methods (e.g. gift cards)'
    ] : [
      'Unexpected administrative or usage surcharges'
    ],
    recommendedSteps: [
      'Do not click any web links or call phone numbers provided inside the message.',
      'Contact your trusted family member or call the official phone number on your card.',
      'Take a deep breath — legitimate organizations will never rush or threaten you.'
    ],
    safeReplyDraft: 'Please do not text me. I will call the official customer support line directly.',
    isOfficialOrgImpersonation: isUrgentOrMoney
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: true,
      data: fallbackData
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
Analyze the following text, email, SMS, message, script, or bill provided by a senior citizen to evaluate if it is a SCAM/FRAUD or a LEGITIMATE DOCUMENT/BILL, and explain it simply.

Content to analyze:
"""
${inputContent}
"""

Return a strict JSON object with this exact structure:
{
  "riskLevel": "safe" | "caution" | "high_risk",
  "riskScore": number between 0 and 100 (where 0 is completely safe and 100 is definite dangerous scam),
  "title": "Short clear headline (e.g. High Scam Risk: Suspicious Bank Alert or Safe Bill: Monthly Utility Statement)",
  "simpleSummary": "A 2-3 sentence explanation in warm, simple, 5th-grade English explaining what this message or bill is really saying.",
  "redFlags": ["List of 2-4 warning signs identified, or empty array if safe"],
  "recommendedSteps": ["3-4 clear step-by-step actions the senior should take right now (e.g., Do NOT click links, Call official phone number on back of card)"],
  "safeReplyDraft": "A polite, safe response text draft if needed, or null",
  "isOfficialOrgImpersonation": boolean
}
Do NOT include markdown wrapping around JSON if possible, just raw JSON.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const text = response.text || '{}';
    const jsonResult = JSON.parse(text);
    return {
      success: true,
      data: jsonResult
    };
  } catch (error: any) {
    console.warn('Scam Analysis API warning (falling back gracefully):', error.message || error);
    return {
      success: true,
      data: fallbackData
    };
  }
}

export async function handleDoctorVisitPrep(symptomsAndConcerns: string[], currentMedications: string[]) {
  const fallbackData = {
    summary: 'Doctor Visit Summary & Question Guide prepared for your appointment.',
    keyPointsForDoctor: [
      `Main symptoms/concerns noted: ${symptomsAndConcerns.join(', ') || 'General health checkup'}`,
      `Current medications list: ${currentMedications.join(', ') || 'None specified'}`
    ],
    medicationsSummary: 'Review current dosages, check for side effects (such as dizziness or stiffness), and verify if any refills are needed.',
    questionsList: [
      'Are there any side effects I should watch out for with my current medications?',
      'What lifestyle or dietary changes can help improve my symptoms?',
      'When should I schedule my next follow-up appointment?'
    ]
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: true,
      data: fallbackData
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
A senior citizen is preparing for an upcoming doctor's appointment.
Health Concerns / Symptoms noted by user: ${JSON.stringify(symptomsAndConcerns)}
Current Medications: ${JSON.stringify(currentMedications)}

Generate a helpful, simple Doctor Visit Checklist & Summary Sheet.

Return JSON format with structure:
{
  "summary": "Warm, encouraging 2-sentence summary of the appointment goal.",
  "keyPointsForDoctor": ["3-4 concise points to explain clearly to the doctor"],
  "medicationsSummary": "A clear 2-sentence overview of current medications to review for side effects or refills",
  "questionsList": ["4 key questions the senior should ask their doctor during the visit"]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    });

    const jsonResult = JSON.parse(response.text || '{}');
    return {
      success: true,
      data: jsonResult
    };
  } catch (error: any) {
    console.warn('Doctor Prep API warning (falling back gracefully):', error.message || error);
    return {
      success: true,
      data: fallbackData
    };
  }
}

export async function handleFamilyReplyDraft(originalMessage: string, seniorIntention: string) {
  const fallbackData = {
    draftedReply: `Thank you so much for your message! ${seniorIntention}. Sending lots of love!`,
    explanation: 'A warm, affectionate response that expresses your feelings clearly.'
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: true,
      data: fallbackData
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
A senior citizen wants to reply to a family member's message.
Family message received: "${originalMessage}"
What senior wants to say: "${seniorIntention}"

Draft a warm, loving, clear text message response they can send. Keep it natural, friendly, and easy to read.

Return JSON:
{
  "draftedReply": "The text message reply",
  "explanation": "A short note explaining why this is a sweet reply"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5
      }
    });

    const jsonResult = JSON.parse(response.text || '{}');
    return {
      success: true,
      data: jsonResult
    };
  } catch (error: any) {
    console.warn('Family Reply Draft API warning (falling back gracefully):', error.message || error);
    return {
      success: true,
      data: fallbackData
    };
  }
}
