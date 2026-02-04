'use client';

import { useEffect, useState } from 'react';
import { audioEngine, WARM_PIANO_PRESET, BASIC_SYNTH_PRESET, ACID_BASS_PRESET, type SynthPreset } from '@/app/services/audio';
import type { Note, MidiNote } from '@/app/types/music';

export function useAudio() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presetName, setPresetName] = useState(audioEngine.getPresetName());

  const initialize = async () => {
    if (isInitialized || isInitializing) return true;

    setIsInitializing(true);
    setError(null);

    try {
      await audioEngine.initialize();
      setIsInitialized(true);
      setPresetName(audioEngine.getPresetName());
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize audio');
      console.error('Audio initialization error:', err);
      return false;
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

  const setPreset = async (preset: SynthPreset) => {
    try {
      await audioEngine.setPreset(preset);
      setPresetName(preset.name);
    } catch (err) {
      console.error('Failed to set preset:', err);
    }
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
    presetName,
    initialize,
    playNote,
    stopNote,
    setPreset,
    presets: { WARM_PIANO_PRESET, BASIC_SYNTH_PRESET, ACID_BASS_PRESET },
  };
}
