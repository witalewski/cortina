'use client';

import { useState, useCallback } from 'react';
import { useAudio } from '@/app/hooks/useAudio';
import { useMidi } from '@/app/hooks/useMidi';
import { useKeyboard } from '@/app/hooks/useKeyboard';
import { PianoKeyboard } from '@/app/components/piano';
import { StatusBadge } from '@/app/components/ui/StatusBadge';
import { MidiStatusBadge } from '@/app/components/ui/MidiStatusBadge';
import { InstrumentSelector } from '@/app/components/ui/InstrumentSelector';
import { midiToNote } from '@/app/utils/music';
import type { Note, MidiNote } from '@/app/types/music';

export default function Home() {
  const [pressedNotes, setPressedNotes] = useState<Set<Note>>(new Set());
  
  const { isInitialized, isInitializing, error, initialize, playNote, stopNote, setPreset, presetName, isLoadingPreset, presets } = useAudio();

  const handleNotePress = useCallback((note: Note | MidiNote, velocity?: number) => {
    playNote(note, velocity);
    // Track pressed notes for visual feedback
    const noteStr = typeof note === 'number' ? midiToNote(note) : note;
    setPressedNotes(prev => new Set(prev).add(noteStr));
  }, [playNote]);

  const handleNoteRelease = useCallback((note: Note | MidiNote) => {
    stopNote(note);
    const noteStr = typeof note === 'number' ? midiToNote(note) : note;
    setPressedNotes(prev => {
      const next = new Set(prev);
      next.delete(noteStr);
      return next;
    });
  }, [stopNote]);

  const {
    isSupported: midiSupported,
    isInitialized: midiInitialized,
    devices: midiDevices,
    error: midiError,
    initialize: initializeMidi,
  } = useMidi({
    onNoteOn: handleNotePress,
    onNoteOff: handleNoteRelease,
    autoEnable: true,
  });

  // Computer keyboard input
  useKeyboard({
    onNoteOn: handleNotePress,
    onNoteOff: handleNoteRelease,
    enabled: isInitialized,
  });

  const handleStartClick = async () => {
    const audioSuccess = await initialize();
    
    if (audioSuccess) {
      // Always try to initialize MIDI if the browser might support it
      await initializeMidi();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black p-8">
      <main className="w-full max-w-4xl bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Cortina 🎹
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Musical Skills Training App
          </p>
        </div>

        {!isInitialized ? (
          <div className="text-center space-y-4">
            <p className="text-zinc-700 dark:text-zinc-300 mb-6">
              Click the button below to initialize the audio engine
            </p>
            <button
              onClick={handleStartClick}
              disabled={isInitializing}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-lg transition-colors text-lg"
            >
              {isInitializing ? 'Initializing...' : 'Start Audio Engine'}
            </button>
            {error && (
              <p className="text-red-600 dark:text-red-400 mt-4">
                Error: {error}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status boxes in single row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <StatusBadge 
                status="success" 
                label="Audio Engine Ready" 
              />
              
              <MidiStatusBadge
                isInitialized={midiInitialized}
                isSupported={midiSupported}
                devices={midiDevices}
                error={midiError}
                onConnect={initializeMidi}
              />
            </div>

            {/* Instrument selector dropdown */}
            <InstrumentSelector
              currentPresetName={presetName}
              isLoading={isLoadingPreset}
              presets={[
                { preset: presets.WARM_PIANO_PRESET, category: 'synth' },
                { preset: presets.BASIC_SYNTH_PRESET, category: 'synth' },
                { preset: presets.ACID_BASS_PRESET, category: 'synth' },
                { preset: presets.SAMPLED_PIANO_PRESET, category: 'sampled' },
              ]}
              onPresetChange={setPreset}
            />

            <div className="flex justify-center py-8">
              <PianoKeyboard
                startNote={48}
                numKeys={25}
                onNotePress={handleNotePress}
                onNoteRelease={handleNoteRelease}
                pressedNotes={pressedNotes}
              />
            </div>

            <div className="text-center text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p className="font-semibold">How to Play:</p>
              <p>🖱️ Click piano keys with your mouse</p>
              {midiInitialized && <p>🎹 Play with your MIDI keyboard</p>}
              <p>⌨️ Use computer keyboard:</p>
              <div className="flex justify-center gap-8 mt-2 text-xs font-mono">
                <div>
                  <p className="text-zinc-500 dark:text-zinc-500 mb-1">White keys</p>
                  <p className="bg-zinc-100 dark:bg-zinc-700 px-3 py-1 rounded">A S D F G H J K L ; &apos;</p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-500 mb-1">Black keys</p>
                  <p className="bg-zinc-100 dark:bg-zinc-700 px-3 py-1 rounded">W E T Y U O P [</p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                Range: C3 to C5 (25 keys)
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
