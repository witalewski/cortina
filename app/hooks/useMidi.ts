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
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [devices, setDevices] = useState<MidiDevice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    console.log('useMidi: Starting initialization...');
    
    if (!midiService.isSupported()) {
      console.warn('useMidi: Web MIDI API not supported');
      setError('Web MIDI API not supported in this browser. Try Chrome or Edge.');
      return false;
    }

    console.log('useMidi: Web MIDI API is supported');
    setIsSupported(true);

    try {
      console.log('useMidi: Requesting MIDI access...');
      const success = await midiService.initialize();
      console.log('useMidi: Initialize result:', success);
      
      if (success) {
        setIsInitialized(true);
        const deviceList = midiService.getDevices();
        console.log('useMidi: Found devices:', deviceList);
        setDevices(deviceList);
        
        if (autoEnable) {
          console.log('useMidi: Auto-enabling all devices');
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

  useEffect(() => {
    return () => {
      if (isInitialized) {
        midiService.dispose();
      }
    };
  }, [isInitialized]);

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
