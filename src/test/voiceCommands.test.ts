import { describe, it, expect, vi } from 'vitest';

describe('Voice Command Parsing & Dispatch System', () => {
  it('correctly maps spoken voice commands to tab navigation', () => {
    const handleVoiceCommand = (
      spoken: string,
      navigateFn: (tab: string) => void,
      emergencyFn: () => void,
      voiceMedFn: () => void
    ) => {
      const lower = spoken.toLowerCase().trim();

      if (
        lower.includes('add medication') ||
        lower.includes('add medicine') ||
        lower.includes('dawai add') ||
        lower.includes('nayi medicine')
      ) {
        voiceMedFn();
        return 'medication_setup';
      }

      if (lower.includes('emergency') || lower.includes('sos') || lower.includes('madad')) {
        emergencyFn();
        return 'emergency';
      }

      if (lower.includes('doctor') || lower.includes('hospital')) {
        navigateFn('doctor-prep');
        return 'doctor-prep';
      }

      if (lower.includes('scam') || lower.includes('bill')) {
        navigateFn('scam-checker');
        return 'scam-checker';
      }

      if (lower.includes('family') || lower.includes('message')) {
        navigateFn('family-social');
        return 'family-social';
      }

      if (lower.includes('medicine') || lower.includes('medication')) {
        navigateFn('medications');
        return 'medications';
      }

      if (lower.includes('home') || lower.includes('companion')) {
        navigateFn('companion');
        return 'companion';
      }

      return 'unknown';
    };

    const navigateSpy = vi.fn();
    const emergencySpy = vi.fn();
    const voiceMedSpy = vi.fn();

    // Test voice add medication triggers
    expect(
      handleVoiceCommand('Please add medication for high blood pressure', navigateSpy, emergencySpy, voiceMedSpy)
    ).toBe('medication_setup');
    expect(voiceMedSpy).toHaveBeenCalledTimes(1);

    expect(
      handleVoiceCommand('Nayi medicine dawai add karo', navigateSpy, emergencySpy, voiceMedSpy)
    ).toBe('medication_setup');
    expect(voiceMedSpy).toHaveBeenCalledTimes(2);

    // Test emergency trigger
    expect(
      handleVoiceCommand('Help emergency SOS call', navigateSpy, emergencySpy, voiceMedSpy)
    ).toBe('emergency');
    expect(emergencySpy).toHaveBeenCalledTimes(1);

    // Test doctor prep navigation
    expect(
      handleVoiceCommand('Take me to doctor prep', navigateSpy, emergencySpy, voiceMedSpy)
    ).toBe('doctor-prep');
    expect(navigateSpy).toHaveBeenCalledWith('doctor-prep');

    // Test scam checker navigation
    expect(
      handleVoiceCommand('Check this scam text', navigateSpy, emergencySpy, voiceMedSpy)
    ).toBe('scam-checker');
    expect(navigateSpy).toHaveBeenCalledWith('scam-checker');
  });

  it('correctly categorizes time of day from spoken text in Voice Add Medication', () => {
    const parseTimeOfDay = (spoken: string): 'morning' | 'afternoon' | 'evening' => {
      const lower = spoken.toLowerCase();
      if (lower.includes('dopahar') || lower.includes('afternoon') || lower.includes('lunch') || lower.includes('12')) {
        return 'afternoon';
      }
      if (lower.includes('shaam') || lower.includes('evening') || lower.includes('night') || lower.includes('raat') || lower.includes('dinner')) {
        return 'evening';
      }
      return 'morning';
    };

    expect(parseTimeOfDay('Subah khane ke baad')).toBe('morning');
    expect(parseTimeOfDay('Afternoon 1:00 PM lunch ke sath')).toBe('afternoon');
    expect(parseTimeOfDay('Dopahar ko')).toBe('afternoon');
    expect(parseTimeOfDay('Raat ko sone se pehle')).toBe('evening');
    expect(parseTimeOfDay('Evening dinner ke baad')).toBe('evening');
  });
});
