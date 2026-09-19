import { describe, it, expect, beforeEach } from 'vitest';
import {
  encryptData,
  decryptData,
  saveSecure,
  getSecure,
  exportAllUserDataGDPR,
  purgeAllUserDataGDPR,
  getOrCreateVaultPass,
} from '../services/cryptoStorage';

describe('Zero-Knowledge Crypto Storage Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates a stable persistent vault pass', () => {
    const pass1 = getOrCreateVaultPass();
    const pass2 = getOrCreateVaultPass();
    expect(pass1).toBeTruthy();
    expect(typeof pass1).toBe('string');
    expect(pass1).toBe(pass2);
  });

  it('encrypts and decrypts a complex medication record with AES-GCM-256', async () => {
    const sampleMed = {
      id: 'med-101',
      name: 'Amlodipine',
      dosage: '5mg',
      frequency: 'Daily',
      timeOfDay: 'morning',
      instructions: 'Take after breakfast with water',
      takenToday: false,
    };

    const encrypted = await encryptData(sampleMed);
    expect(encrypted).toHaveProperty('v', 1);
    expect(encrypted).toHaveProperty('algorithm', 'AES-GCM-256');
    expect(encrypted).toHaveProperty('iv');
    expect(encrypted).toHaveProperty('ciphertext');
    expect(encrypted).toHaveProperty('timestamp');
    expect(encrypted.ciphertext).not.toContain('Amlodipine');

    const decrypted = await decryptData(encrypted);
    expect(decrypted).toEqual(sampleMed);
  });

  it('handles saveSecure and getSecure roundtrip seamlessly', async () => {
    const profile = {
      name: 'Ramesh Sharma',
      city: 'Delhi',
      emergencyContacts: [
        { name: 'Dr. Verma', phone: '9876543210', relation: 'Physician' },
      ],
    };

    const storageKey = 'silverguard_test_profile';
    await saveSecure(storageKey, profile);

    // Verify stored item is encrypted JSON string
    const rawStored = localStorage.getItem(storageKey);
    expect(rawStored).toBeTruthy();
    const parsedRaw = JSON.parse(rawStored!);
    expect(parsedRaw.algorithm).toBe('AES-GCM-256');

    // Verify getSecure transparently decrypts
    const retrieved = await getSecure(storageKey, null);
    expect(retrieved).toEqual(profile);
  });

  it('returns fallback value if key does not exist', async () => {
    const retrieved = await getSecure('non_existent_key', { fallback: true });
    expect(retrieved).toEqual({ fallback: true });
  });

  it('supports GDPR Data Portability export', async () => {
    await saveSecure('silverguard_user_profile_v2', { name: 'Savitri Devi' });
    await saveSecure('silverguard_user_medications_v2', [{ name: 'Crocin 500mg' }]);

    const exportData = await exportAllUserDataGDPR();
    expect(exportData).toHaveProperty('app', 'SilverGuard AI Companion');
    expect(exportData).toHaveProperty('gdprCompliant', true);
    expect(exportData.securityLevel).toContain('AES-GCM-256');
    expect(exportData.userRecords['silverguard_user_profile_v2']).toEqual({ name: 'Savitri Devi' });
  });

  it('supports GDPR Right to Erasure / Purge', async () => {
    await saveSecure('silverguard_user_profile_v2', { name: 'Savitri Devi' });
    expect(localStorage.length).toBeGreaterThan(0);

    purgeAllUserDataGDPR();
    expect(localStorage.length).toBe(0);
  });
});
