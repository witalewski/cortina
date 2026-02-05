'use client';

import { useState, useCallback } from 'react';
import { useAudio } from '@/app/hooks/useAudio';
import { useMidi } from '@/app/hooks/useMidi';
import { useKeyboard } from '@/app/hooks/useKeyboard';
import { useMobilePortrait } from '@/app/hooks/useMobilePortrait';
import { PianoKeyboard } from '@/app/components/piano';
import { StatusIndicator } from '@/app/components/ui/StatusIndicator';
import { InstrumentSelector } from '@/app/components/ui/InstrumentSelector';
import { midiToNote, getOptimalStartNote } from '@/app/utils/music';
import type { Note, MidiNote } from '@/app/types/music';

export default function PlayPage() {
  const [pressedNotes, setPressedNotes] = useState<Set<Note>>(new Set());
  const [startNote, setStartNote] = useState<MidiNote>(48); // Default: C3
  const isMobilePortrait = useMobilePortrait();

  const {
    isInitialized,
    isInitializing,
    error,
    initialize,
    playNote,
    stopNote,
    setPreset,
    presetName,
    isLoadingPreset,
    presets,
  } = useAudio();

  const handleNotePress = useCallback(
    (
      note: Note | MidiNote,
      velocity?: number,
      source: 'midi' | 'keyboard' | 'click' = 'keyboard',
    ) => {
      playNote(note, velocity);

      // Track pressed notes for visual feedback
      const noteStr = typeof note === 'number' ? midiToNote(note) : note;
      setPressedNotes((prev) => new Set(prev).add(noteStr));

      // Only adjust range for MIDI input
      if (source === 'midi') {
        const midiNote = typeof note === 'number' ? note : 0; // We'll only get numbers from MIDI

        // Check if note is outside current range
        const currentEnd = startNote + 24; // 25 keys (0-24 offset)
        if (midiNote < startNote || midiNote > currentEnd) {
          const newStart = getOptimalStartNote(midiNote);
          setStartNote(newStart);
        }
      }
    },
    [playNote, startNote],
  );

  const handleNoteRelease = useCallback(
    (note: Note | MidiNote) => {
      stopNote(note);
      const noteStr = typeof note === 'number' ? midiToNote(note) : note;
      setPressedNotes((prev) => {
        const next = new Set(prev);
        next.delete(noteStr);
        return next;
      });
    },
    [stopNote],
  );

  // MIDI input - mark as MIDI source
  const handleMidiNoteOn = useCallback(
    (note: MidiNote, velocity: number) => {
      handleNotePress(note, velocity, 'midi');
    },
    [handleNotePress],
  );

  // Keyboard/click input - don't adjust range
  const handleLocalNotePress = useCallback(
    (note: Note | MidiNote, velocity?: number) => {
      handleNotePress(note, velocity, 'keyboard');
    },
    [handleNotePress],
  );

  const {
    isSupported: midiSupported,
    isInitialized: midiInitialized,
    devices: midiDevices,
    error: midiError,
    initialize: initializeMidi,
  } = useMidi({
    onNoteOn: handleMidiNoteOn,
    onNoteOff: handleNoteRelease,
    autoEnable: true,
  });

  // Computer keyboard input - follows visible range
  useKeyboard({
    onNoteOn: handleLocalNotePress,
    onNoteOff: handleNoteRelease,
    enabled: isInitialized,
    startNote,
  });

  const handleStartClick = async () => {
    const audioSuccess = await initialize();

    if (audioSuccess) {
      // Always try to initialize MIDI if the browser might support it
      await initializeMidi();
    }
  };

  return (
    <div className="flex w-full justify-center">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-800 md:p-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Cortina 🎹
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Musical Skills Training App
          </p>
        </div>

        {!isInitialized ? (
          <div className="space-y-4 text-center">
            <p className="mb-6 text-zinc-700 dark:text-zinc-300">
              Click the button below to initialize the audio engine
            </p>
            <button
              onClick={handleStartClick}
              disabled={isInitializing}
              className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isInitializing ? 'Initializing...' : 'Start Audio Engine'}
            </button>
            {error && (
              <p className="mt-4 text-red-600 dark:text-red-400">
                Error: {error}
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Compact instrument selector - top-right corner */}
            <div className="absolute right-8 top-8">
              <InstrumentSelector
                currentPresetName={presetName}
                isLoading={isLoadingPreset}
                presets={[
                  { preset: presets.SAMPLED_PIANO_PRESET, category: 'sampled' },
                  { preset: presets.WARM_PIANO_PRESET, category: 'synth' },
                  { preset: presets.BASIC_SYNTH_PRESET, category: 'synth' },
                  { preset: presets.ACID_BASS_PRESET, category: 'synth' },
                ]}
                onPresetChange={setPreset}
              />
            </div>

            <div
              className={`space-y-8 ${
                isMobilePortrait
                  ? 'flex min-h-[60vh] flex-col items-center justify-center'
                  : ''
              }`}
            >
              <div className="flex items-center justify-center">
                <PianoKeyboard
                  startNote={startNote}
                  numKeys={25}
                  onNotePress={handleLocalNotePress}
                  onNoteRelease={handleNoteRelease}
                  pressedNotes={pressedNotes}
                  rotateForMobile={isMobilePortrait}
                />
              </div>

              {/* Hide computer keyboard instructions on mobile portrait */}
              {!isMobilePortrait && (
                <div className="space-y-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
                  <p className="font-semibold">How to Play:</p>
                  <p>🖱️ Click piano keys with your mouse</p>
                  {midiInitialized && <p>🎹 Play with your MIDI keyboard</p>}
                  <p>⌨️ Use computer keyboard:</p>
                  <div className="mt-2 flex justify-center gap-8 text-xs font-mono">
                    <div>
                      <p className="mb-1 text-zinc-500 dark:text-zinc-500">
                        White keys
                      </p>
                      <p className="rounded bg-zinc-100 px-3 py-1 dark:bg-zinc-700">
                        A S D F G H J K L ; &apos;
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-zinc-500 dark:text-zinc-500">
                        Black keys
                      </p>
                      <p className="rounded bg-zinc-100 px-3 py-1 dark:bg-zinc-700">
                        W E T Y U O P [
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                    Range: {midiToNote(startNote)} to{' '}
                    {midiToNote((startNote + 24) as MidiNote)}
                  </p>
                </div>
              )}

              {/* Simplified mobile instructions */}
              {isMobilePortrait && (
                <div className="text-center text-xs text-zinc-500 dark:text-zinc-500">
                  <p>
                    Tap keys to play • Range: {midiToNote(startNote)} -{' '}
                    {midiToNote((startNote + 24) as MidiNote)}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Compact status indicator - fixed bottom-right */}
      {isInitialized && (
        <StatusIndicator
          audioReady={isInitialized}
          midiInitialized={midiInitialized}
          midiSupported={midiSupported}
          midiDevices={midiDevices}
          midiError={midiError}
          onMidiConnect={initializeMidi}
        />
      )}
    </div>
  );
}
