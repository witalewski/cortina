'use client';

import { useEffect, useState, useCallback } from 'react';
import { midiService, type MidiDevice } from '@/app/services/midi';
import type { MidiNote } from '@/app/types/music';

interface UseMidiOptions {
  onNoteOn?: (note: MidiNote, velocity: number) => void;
  onNoteOff?: (note: MidiNote) => void;
  autoEnable?: boolean;
}

export function useMidi({ onNoteOn, onNoteOff, autoEnable = true }: UseMidiOptions = {}) {
  // Sync initial state with midiService (handles remount after navigation)
  const [isSupported, setIsSupported] = useState(() => midiService.isSupported());
  const [isInitialized, setIsInitialized] = useState(() => midiService.isInitialized());
  const [devices, setDevices] = useState<MidiDevice[]>(() => midiService.getDevices());
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    if (!midiService.isSupported()) {
      console.warn('useMidi: Web MIDI API not supported');
      setError('Web MIDI API not supported in this browser. Try Chrome or Edge.');
      return false;
    }

    setIsSupported(true);

    try {
      const success = await midiService.initialize();
      
      if (success) {
        setIsInitialized(true);
        const deviceList = midiService.getDevices();
        setDevices(deviceList);
        
        if (autoEnable) {
          midiService.enableAllDevices();
        }
        
        return true;
      } else {
        setError('Failed to initialize MIDI');
        return false;
      }
    } catch (err) {
      console.error('useMidi: Error during initialization:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize MIDI');
      return false;
    }
  }, [autoEnable]);

  const enableDevice = useCallback((deviceId: string) => {
    midiService.enableDevice(deviceId);
  }, []);

  const disableDevice = useCallback((deviceId: string) => {
    midiService.disableDevice(deviceId);
  }, []);

  const refreshDevices = useCallback(() => {
    setDevices(midiService.getDevices());
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = midiService.onMessage((message) => {
      if (message.type === 'noteon') {
        onNoteOn?.(message.note, message.velocity);
      } else if (message.type === 'noteoff') {
        onNoteOff?.(message.note);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isInitialized, onNoteOn, onNoteOff]);

  // Listen for device changes
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = midiService.onDeviceChange(() => {
      setDevices(midiService.getDevices());
    });

    return () => {
      unsubscribe();
    };
  }, [isInitialized]);

  // Note: We don't dispose midiService on unmount anymore
  // MIDI state should persist across navigation like audio does

  return {
    isSupported,
    isInitialized,
    devices,
    error,
    initialize,
    enableDevice,
    disableDevice,
    refreshDevices,
  };
}
