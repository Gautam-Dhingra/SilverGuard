import { describe, it, expect } from 'vitest';
import {
  handleCompanionChat,
  handleScamAndBillAnalysis,
  handleDoctorVisitPrep,
  handleFamilyReplyDraft,
} from '../services/aiServerHandler';

describe('Server-Side AI Handler & Fallback System', () => {
  it('returns safe, reassuring fallback responses for medication chat queries', async () => {
    const result = await handleCompanionChat([
      {
        role: 'user',
        parts: [{ text: 'What medicine dose should I take for headache?' }],
      },
    ]);

    expect(result.success).toBe(true);
    expect(result.text).toContain('consult your doctor or pharmacist');
    expect(result.suggestedActions).toBeDefined();
    expect(result.suggestedActions?.length).toBeGreaterThan(0);
  });

  it('provides relevant context-aware suggestion chips for scam topics', async () => {
    const result = await handleCompanionChat([
      {
        role: 'user',
        parts: [{ text: 'Received suspicious SMS asking for bank OTP' }],
      },
    ]);

    expect(result.success).toBe(true);
    expect(result.suggestedActions).toContain('🛡️ Open Scam & Bill Safeguard Tab');
  });

  it('provides relevant suggestion chips for doctor appointment topics', async () => {
    const result = await handleCompanionChat([
      {
        role: 'user',
        parts: [{ text: 'I want to book an eye specialist doctor appointment' }],
      },
    ]);

    expect(result.success).toBe(true);
    expect(result.suggestedActions).toContain('🩺 Open Doctor Visit Prep Tab');
    expect(result.suggestedActions).toContain('👁️ Book Eye Specialist Appointment');
  });

  it('evaluates phishing SMS with gift card demand as high risk in scam analyzer', async () => {
    const phishingText =
      'URGENT: IRS Tax Department. You owe $5,000 back taxes. Pay via Target Gift Card or warrant issued!';

    const result = await handleScamAndBillAnalysis(phishingText);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.riskScore).toBeGreaterThanOrEqual(75);
    expect(result.data.riskLevel).toBe('high_risk');
    expect(result.data.redFlags.length).toBeGreaterThan(0);
    expect(result.data.recommendedSteps).toBeDefined();
    expect(result.data.simpleSummary).toBeDefined();
  });

  it('evaluates safe electricity bill without penalty fees properly', async () => {
    const billText =
      'Monthly electricity bill for Consumer #99812: Total amount $42.50 due by 25th of next month.';

    const result = await handleScamAndBillAnalysis(billText);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.riskScore).toBeLessThan(70);
  });

  it('generates structured doctor appointment questions from symptoms and medications', async () => {
    const result = await handleDoctorVisitPrep(
      ['Knee joint stiffness and mild morning dizziness'],
      ['Amlodipine 5mg', 'Metformin 500mg']
    );

    expect(result.success).toBe(true);
    expect(result.data.questionsList.length).toBeGreaterThan(0);
    expect(result.data.summary).toBeDefined();
    expect(result.data.keyPointsForDoctor.length).toBeGreaterThan(0);
  });

  it('drafts warm, affectionate family message response from senior voice intention', async () => {
    const result = await handleFamilyReplyDraft(
      'Hi Grandma, Bobby won the spelling bee competition today!',
      'Tell Bobby I am so proud of him and love him lots'
    );

    expect(result.success).toBe(true);
    expect(result.data.draftedReply).toBeDefined();
    expect(result.data.draftedReply.length).toBeGreaterThan(10);
    expect(result.data.draftedReply).toContain('proud');
  });
});
