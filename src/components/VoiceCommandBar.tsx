import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceCommandBarProps {
  isListening: boolean;
  transcript: string;
  lastCommand: string | null;
  onToggleListening: () => void;
  highContrast: boolean;
  isSupported: boolean;
}

export const VoiceCommandBar: React.FC<VoiceCommandBarProps> = ({
  isListening,
  transcript,
  lastCommand,
  onToggleListening,
  highContrast,
  isSupported,
}) => {
  if (!isSupported) return null;

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });

  // Position nicely near bottom-right on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialX = Math.max(16, window.innerWidth - 92);
      const initialY = Math.max(16, window.innerHeight - 96);
      setPosition({ x: initialX, y: initialY });
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!position) return;
    setIsDragging(false);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 0) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      setIsDragging(true);
    }
    const newX = Math.min(Math.max(12, dragRef.current.posX + dx), window.innerWidth - 80);
    const newY = Math.min(Math.max(12, dragRef.current.posY + dy), window.innerHeight - 80);
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleClick = () => {
    if (!isDragging) {
      if (!isListening) {
        // Find and focus active/primary input or textarea on the page
        let targetEl = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
        if (
          !targetEl ||
          (targetEl.tagName !== 'INPUT' && targetEl.tagName !== 'TEXTAREA') ||
          targetEl.readOnly ||
          targetEl.disabled
        ) {
          const pageInputs = Array.from(
            document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
              'main input[type="text"], main input:not([type]), main textarea, main input[type="search"]'
            )
          );
          const visibleInput = pageInputs.find(
            (el) => el.offsetWidth > 0 && el.offsetHeight > 0 && !el.disabled && !el.readOnly
          );
          if (visibleInput) {
            visibleInput.focus();
            visibleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
      onToggleListening();
    }
  };

  return (
    <div
      style={
        position
          ? { left: `${position.x}px`, top: `${position.y}px` }
          : { right: '24px', bottom: '24px' }
      }
      className="fixed z-50 touch-none select-none"
      title={
        isListening
          ? 'Voice assistant active — Tap mic to stop'
          : 'Tap mic to talk (Drag icon anywhere on screen)'
      }
    >
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        aria-label={isListening ? 'Stop listening for voice' : 'Start listening for voice'}
        className={`relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 shadow-2xl transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-4 cursor-grab active:cursor-grabbing ${
          isListening
            ? highContrast
              ? 'bg-yellow-400 text-black border-yellow-300 ring-8 ring-yellow-400/50'
              : 'bg-rose-600 text-white border-white ring-8 ring-rose-500/40'
            : highContrast
            ? 'bg-yellow-400 text-black border-black hover:bg-yellow-300'
            : 'bg-amber-600 text-white border-amber-200 hover:bg-amber-500 shadow-amber-600/30'
        }`}
      >
        {/* Pulsing ring indicator when active */}
        {isListening && (
          <span className="absolute -inset-2 rounded-full border-4 border-amber-400 animate-ping opacity-75 pointer-events-none" />
        )}

        {isListening ? (
          <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-bounce" aria-hidden="true" />
        ) : (
          <MicOff className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden="true" />
        )}
      </button>
    </div>
  );
};

