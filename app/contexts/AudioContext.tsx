'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { audioEngine, WARM_PIANO_PRESET, BASIC_SYNTH_PRESET, ACID_BASS_PRESET, SAMPLED_PIANO_PRESET, type SynthPreset } from '@/app/services/audio';
import type { Note, MidiNote } from '@/app/types/music';

interface AudioContextValue {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  presetName: string;
  isLoadingPreset: boolean;
  initialize: () => Promise<boolean>;
  playNote: (note: Note | MidiNote, velocity?: number) => void;
  stopNote: (note: Note | MidiNote) => void;
  setPreset: (preset: SynthPreset) => Promise<void>;
  presets: {
    WARM_PIANO_PRESET: SynthPreset;
    BASIC_SYNTH_PRESET: SynthPreset;
    ACID_BASS_PRESET: SynthPreset;
    SAMPLED_PIANO_PRESET: SynthPreset;
  };
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presetName, setPresetName] = useState(audioEngine.getPresetName());
  const [isLoadingPreset, setIsLoadingPreset] = useState(false);

  const initialize = useCallback(async () => {
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
  }, [isInitialized, isInitializing]);

  const playNote = useCallback((note: Note | MidiNote, velocity?: number) => {
    if (!isInitialized) {
      console.warn('Audio not initialized');
      return;
    }
    audioEngine.noteOn(note, velocity);
  }, [isInitialized]);

  const stopNote = useCallback((note: Note | MidiNote) => {
    if (!isInitialized) return;
    audioEngine.noteOff(note);
  }, [isInitialized]);

  const setPreset = useCallback(async (preset: SynthPreset) => {
    setIsLoadingPreset(true);
    try {
      await audioEngine.setPreset(preset);
      setPresetName(preset.name);
    } catch (err) {
      console.error('Failed to set preset:', err);
    } finally {
      setIsLoadingPreset(false);
    }
  }, []);

  const value: AudioContextValue = {
    isInitialized,
    isInitializing,
    error,
    presetName,
    isLoadingPreset,
    initialize,
    playNote,
    stopNote,
    setPreset,
    presets: {
      WARM_PIANO_PRESET,
      BASIC_SYNTH_PRESET,
      ACID_BASS_PRESET,
      SAMPLED_PIANO_PRESET,
    },
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudioContext() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within AudioProvider');
  }
  return context;
}
