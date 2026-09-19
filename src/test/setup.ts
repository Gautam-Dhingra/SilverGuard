import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

// Polyfill Web Crypto in test environment if needed
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  // @ts-ignore
  globalThis.crypto = webcrypto;
}

// Polyfill SpeechSynthesis
if (typeof window !== 'undefined') {
  if (!('speechSynthesis' in window)) {
    // @ts-ignore
    window.speechSynthesis = {
      speak: () => {},
      cancel: () => {},
      pause: () => {},
      resume: () => {},
      getVoices: () => [],
      speaking: false,
      paused: false,
      pending: false,
    };
  }

  // @ts-ignore
  if (!window.SpeechSynthesisUtterance) {
    // @ts-ignore
    window.SpeechSynthesisUtterance = class {
      text: string = '';
      rate: number = 1;
      pitch: number = 1;
      volume: number = 1;
      lang: string = 'en-US';
      onend: any = null;
      onerror: any = null;
      constructor(text?: string) {
        if (text) this.text = text;
      }
    };
  }
}

afterEach(() => {
  cleanup();
});
