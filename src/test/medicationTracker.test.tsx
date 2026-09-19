import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MedicationTracker } from '../components/MedicationTracker';
import { saveSecure } from '../services/cryptoStorage';
import { MEDS_LOCAL_STORAGE_KEY } from '../components/UserProfileView';
import { MedicationItem } from '../types';

describe('Medication Tracker Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders medication schedule with empty state message when no meds logged', async () => {
    const readSpy = vi.fn();

    render(
      <MedicationTracker
        highContrast={false}
        onReadAloud={readSpy}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Dawai Schedule/i)).toBeTruthy();
    });
  });

  it('loads and displays prescribed medicines securely', async () => {
    const testMeds: MedicationItem[] = [
      {
        id: 'test-1',
        name: 'Metformin 500mg',
        dosage: '1 tablet',
        frequency: 'Daily',
        timeOfDay: 'morning',
        instructions: 'Take after breakfast',
        takenToday: false,
      },
    ];

    await saveSecure(MEDS_LOCAL_STORAGE_KEY, testMeds);

    const readSpy = vi.fn();
    render(
      <MedicationTracker
        highContrast={false}
        onReadAloud={readSpy}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Metformin 500mg/i)).toBeTruthy();
      expect(screen.getByText(/Take after breakfast/i)).toBeTruthy();
    });
  });

  it('toggles medication taken status upon button click', async () => {
    const testMeds: MedicationItem[] = [
      {
        id: 'test-2',
        name: 'Telmisartan 40mg',
        dosage: '1 tablet',
        frequency: 'Daily',
        timeOfDay: 'morning',
        instructions: 'Morning with water',
        takenToday: false,
      },
    ];

    await saveSecure(MEDS_LOCAL_STORAGE_KEY, testMeds);

    const readSpy = vi.fn();
    render(
      <MedicationTracker
        highContrast={false}
        onReadAloud={readSpy}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Telmisartan 40mg/i)).toBeTruthy();
    });

    const markBtn = screen.getByText(/Tap to Mark as Taken/i).closest('button');
    expect(markBtn).toBeTruthy();
    fireEvent.click(markBtn!);

    await waitFor(() => {
      expect(screen.getByText(/Taken/i)).toBeTruthy();
    });
  });
});
