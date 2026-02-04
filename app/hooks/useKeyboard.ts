'use client';

import { useEffect, useCallback, useRef } from 'react';
import type { Note, MidiNote } from '@/app/types/music';

interface KeyboardMapping {
  [key: string]: MidiNote;
}

// Keyboard layout for 25 keys (C3 to C5)
// Bottom row (white keys): A S D F G H J K L ; ' for C D E F G A B C D E F
// Top row (black keys): W E T Y U O P [ for C# D# F# G# A# C# D# F#
const KEYBOARD_TO_MIDI: KeyboardMapping = {
  // Octave 3 (C3-B3)
  'a': 48,  // C3
  'w': 49,  // C#3
  's': 50,  // D3
  'e': 51,  // D#3
  'd': 52,  // E3
  'f': 53,  // F3
  't': 54,  // F#3
  'g': 55,  // G3
  'y': 56,  // G#3
  'h': 57,  // A3
  'u': 58,  // A#3
  'j': 59,  // B3
  
  // Octave 4 (C4-B4)
  'k': 60,  // C4 (Middle C)
  'o': 61,  // C#4
  'l': 62,  // D4
  'p': 63,  // D#4
  ';': 64,  // E4
  "'": 65,  // F4
  '[': 66,  // F#4
  
  // Octave 5 (C5-G5)
  ']': 67,  // G5 - only if we need more keys
};

interface UseKeyboardOptions {
  onNoteOn?: (note: Note | MidiNote) => void;
  onNoteOff?: (note: Note | MidiNote) => void;
  enabled?: boolean;
}

export function useKeyboard({
  onNoteOn,
  onNoteOff,
  enabled = true,
}: UseKeyboardOptions = {}) {
  const pressedKeysRef = useRef<Set<string>>(new Set());

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
    const midiNote = KEYBOARD_TO_MIDI[key];

    if (midiNote !== undefined) {
      // Double-check not already pressed (belt and suspenders)
      if (pressedKeysRef.current.has(key)) {
        event.preventDefault();
        return;
      }
      
      pressedKeysRef.current.add(key);
      event.preventDefault();
      onNoteOn?.(midiNote);
    }
  }, [enabled, onNoteOn]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const key = event.key.toLowerCase();
    const midiNote = KEYBOARD_TO_MIDI[key];

    if (midiNote !== undefined) {
      pressedKeysRef.current.delete(key);
      event.preventDefault();
      onNoteOff?.(midiNote);
    }
  }, [enabled, onNoteOff]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      // Clear all pressed keys on unmount
      pressedKeysRef.current.clear();
    };
  }, [enabled, handleKeyDown, handleKeyUp]);

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
    keyboardMapping: KEYBOARD_TO_MIDI,
  };
}
