import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccessibilityToolbar } from '../components/AccessibilityToolbar';
import { AccessibilitySettings } from '../types';

describe('Accessibility Toolbar Component', () => {
  const defaultSettings: AccessibilitySettings = {
    fontSize: 'normal',
    highContrast: false,
    ttsEnabled: true,
    voiceNavActive: true,
    speechRate: 0.9,
  };

  it('renders accessibility controls properly', () => {
    const updateSpy = vi.fn();
    const readSpy = vi.fn();

    render(
      <AccessibilityToolbar
        settings={defaultSettings}
        onUpdateSettings={updateSpy}
        onReadAloudPage={readSpy}
      />
    );

    expect(screen.getByLabelText(/Accessibility controls toolbar/i)).toBeTruthy();
    expect(screen.getByText(/Text: Normal/i)).toBeTruthy();
    expect(screen.getByText(/High Contrast/i)).toBeTruthy();
    expect(screen.getByText(/Read Page Aloud/i)).toBeTruthy();
  });

  it('cycles font sizes upon clicking the text size button', () => {
    const updateSpy = vi.fn();
    const readSpy = vi.fn();

    render(
      <AccessibilityToolbar
        settings={defaultSettings}
        onUpdateSettings={updateSpy}
        onReadAloudPage={readSpy}
      />
    );

    const textSizeBtn = screen.getByText(/Text: Normal/i).closest('button');
    expect(textSizeBtn).toBeTruthy();
    fireEvent.click(textSizeBtn!);

    expect(updateSpy).toHaveBeenCalledWith({ fontSize: 'large' });
  });

  it('toggles high contrast mode upon clicking contrast button', () => {
    const updateSpy = vi.fn();
    const readSpy = vi.fn();

    render(
      <AccessibilityToolbar
        settings={defaultSettings}
        onUpdateSettings={updateSpy}
        onReadAloudPage={readSpy}
      />
    );

    const contrastBtn = screen.getByText(/High Contrast/i).closest('button');
    expect(contrastBtn).toBeTruthy();
    fireEvent.click(contrastBtn!);

    expect(updateSpy).toHaveBeenCalledWith({ highContrast: true });
  });

  it('triggers text to speech read-aloud handler', () => {
    const updateSpy = vi.fn();
    const readSpy = vi.fn();

    render(
      <AccessibilityToolbar
        settings={defaultSettings}
        onUpdateSettings={updateSpy}
        onReadAloudPage={readSpy}
      />
    );

    const readBtn = screen.getByText(/Read Page Aloud/i).closest('button');
    expect(readBtn).toBeTruthy();
    fireEvent.click(readBtn!);

    expect(readSpy).toHaveBeenCalledTimes(1);
  });
});
