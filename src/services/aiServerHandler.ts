import { GoogleGenAI } from '@google/genai';

// Initialize GoogleGenAI lazily or with process.env.GEMINI_API_KEY
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set in environment variables.');
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
}

export const SENIOR_COMPANION_SYSTEM_PROMPT = `
You are "SilverGuard", a loving, warm, patient, and ultra-clear AI daily companion for senior citizens and grandparents.
Your primary goals:
1. Speak in warm, respectful, friendly, and easy-to-understand language (5th-grade reading level). Avoid tech jargon, acronyms, or confusing terms.
2. Be encouraging and patient. Always reassure the user that they are doing great.
3. Keep sentences reasonably concise, clear, and direct. Break complex explanations into 2-3 simple bullet points.
4. When asked about technology, medicine, bills, or online safety, emphasize safety, calm assurance, and step-by-step guidance.
5. Anticipate needs: offer clear next steps or helpful actions when appropriate.
`;

export async function handleCompanionChat(messages: { role: 'user' | 'model'; parts: { text: string }[] }[]) {
  try {
    const ai = getGeminiClient();
    
    // Convert conversation to prompt structure or system instruction
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: SENIOR_COMPANION_SYSTEM_PROMPT }] },
        ...messages.map(m => ({
          role: m.role,
          parts: m.parts
        }))
      ],
      config: {
        temperature: 0.7,
        maxOutputTokens: 600
      }
    });

    return {
      success: true,
      text: response.text || "I'm right here with you! Could you please ask that again?"
    };
  } catch (error: any) {
    console.error('Companion Chat Error:', error);
    return {
      success: false,
      text: "I am having a little trouble connecting right now, but don't worry! Everything is safe. Please try asking again in a moment.",
      error: error.message
    };
  }
}

export async function handleScamAndBillAnalysis(inputContent: string) {
  try {
    const ai = getGeminiClient();

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
    console.error('Scam Analysis Error:', error);
    return {
      success: false,
      error: error.message,
      fallbackData: {
        riskLevel: 'caution',
        riskScore: 50,
        title: 'Needs Gentle Caution',
        simpleSummary: 'We could not analyze this automatically right now, but as a rule of thumb: never share your password, PIN, or banking details over text or unexpected calls.',
        redFlags: ['Unverified sender or urgent demand for money'],
        recommendedSteps: [
          'Do not click any web links in the message.',
          'Call your trusted family member or the official company phone number on your card.',
          'Take a deep breath — legitimate organizations will never rush you.'
        ]
      }
    };
  }
}

export async function handleDoctorVisitPrep(symptomsAndConcerns: string[], currentMedications: string[]) {
  try {
    const ai = getGeminiClient();

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
    console.error('Doctor Prep Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function handleFamilyReplyDraft(originalMessage: string, seniorIntention: string) {
  try {
    const ai = getGeminiClient();

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
    console.error('Family Reply Draft Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
