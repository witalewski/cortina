'use client';

import { useEffect, useState } from 'react';
import { audioEngine } from '@/app/services/audio';
import type { Note, MidiNote } from '@/app/types/music';

export function useAudio() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = async () => {
    if (isInitialized || isInitializing) return;

    setIsInitializing(true);
    setError(null);

    try {
      await audioEngine.initialize();
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize audio');
      console.error('Audio initialization error:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  const playNote = (note: Note | MidiNote, velocity?: number) => {
    if (!isInitialized) {
      console.warn('Audio not initialized');
      return;
    }
    audioEngine.noteOn(note, velocity);
  };

  const stopNote = (note: Note | MidiNote) => {
    if (!isInitialized) return;
    audioEngine.noteOff(note);
  };

  useEffect(() => {
    return () => {
      if (isInitialized) {
        audioEngine.dispose();
      }
    };
  }, [isInitialized]);

  return {
    isInitialized,
    isInitializing,
    error,
    initialize,
    playNote,
    stopNote,
  };
}
