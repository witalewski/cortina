'use client';

import { useEffect, useCallback, useRef, useMemo } from 'react';
import type { Note, MidiNote } from '@/app/types/music';

interface KeyboardMapping {
  [key: string]: MidiNote;
}

// Key positions for 25-key layout (relative offsets from start note)
// Bottom row (white keys): A S D F G H J K L ; ' for C D E F G A B C D E F
// Top row (black keys): W E T Y U O P [ for C# D# F# G# A# C# D# F#
const KEY_TO_OFFSET: Record<string, number> = {
  // First octave (white keys)
  'a': 0,   // C
  'w': 1,   // C#
  's': 2,   // D
  'e': 3,   // D#
  'd': 4,   // E
  'f': 5,   // F
  't': 6,   // F#
  'g': 7,   // G
  'y': 8,   // G#
  'h': 9,   // A
  'u': 10,  // A#
  'j': 11,  // B
  
  // Second octave
  'k': 12,  // C (Middle C when startNote=48)
  'o': 13,  // C#
  'l': 14,  // D
  'p': 15,  // D#
  ';': 16,  // E
  "'": 17,  // F
  '[': 18,  // F#
  
  // Third partial octave
  ']': 19,  // G
};

interface UseKeyboardOptions {
  onNoteOn?: (note: Note | MidiNote, velocity?: number) => void;
  onNoteOff?: (note: Note | MidiNote) => void;
  enabled?: boolean;
  defaultVelocity?: number;
  startNote?: MidiNote; // Dynamic starting note (default C3 = 48)
}

export function useKeyboard({
  onNoteOn,
  onNoteOff,
  enabled = true,
  defaultVelocity = 0.7,
  startNote = 48, // Default to C3
}: UseKeyboardOptions = {}) {
  const pressedKeysRef = useRef<Set<string>>(new Set());

  // Generate keyboard mapping based on current startNote
  const keyboardMapping = useMemo(() => {
    const mapping: KeyboardMapping = {};
    for (const [key, offset] of Object.entries(KEY_TO_OFFSET)) {
      mapping[key] = (startNote + offset) as MidiNote;
    }
    return mapping;
  }, [startNote]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Ignore key repeat events (browser's built-in repeat)
    if (event.repeat) {
      event.preventDefault();
      return;
    }
    
    // Ignore if modifier keys are pressed (Ctrl, Alt, Cmd)
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    
    // Ignore if typing in an input field
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    const key = event.key.toLowerCase();
    const midiNote = keyboardMapping[key];

    if (midiNote !== undefined) {
      // Double-check not already pressed (belt and suspenders)
      if (pressedKeysRef.current.has(key)) {
        event.preventDefault();
        return;
      }
      
      pressedKeysRef.current.add(key);
      event.preventDefault();
      onNoteOn?.(midiNote, defaultVelocity);
    }
  }, [enabled, onNoteOn, defaultVelocity, keyboardMapping]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const key = event.key.toLowerCase();
    const midiNote = keyboardMapping[key];

    if (midiNote !== undefined) {
      pressedKeysRef.current.delete(key);
      event.preventDefault();
      onNoteOff?.(midiNote);
    }
  }, [enabled, onNoteOff, keyboardMapping]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, handleKeyDown, handleKeyUp]);

  // Clear pressed keys on unmount or when disabled
  useEffect(() => {
    const keysRef = pressedKeysRef;
    
    if (!enabled) {
      keysRef.current.clear();
    }
    
    return () => {
      keysRef.current.clear();
    };
  }, [enabled]);

  // Clear pressed keys when losing focus
  useEffect(() => {
    if (!enabled) return;

    const handleBlur = () => {
      pressedKeysRef.current.clear();
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [enabled]);

  return {
    keyboardMapping,
  };
}
