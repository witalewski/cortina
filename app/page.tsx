'use client';

import { useState, useCallback } from 'react';
import { useAudio } from '@/app/hooks/useAudio';
import { useMidi } from '@/app/hooks/useMidi';
import { useKeyboard } from '@/app/hooks/useKeyboard';
import { PianoKeyboard } from '@/app/components/piano';
import type { Note, MidiNote } from '@/app/types/music';

export default function Home() {
  const [pressedNotes, setPressedNotes] = useState<Set<Note>>(new Set());
  const [showMidiDevices, setShowMidiDevices] = useState(false);
  
  const { isInitialized, isInitializing, error, initialize, playNote, stopNote } = useAudio();

  const handleNotePress = useCallback((note: Note | MidiNote) => {
    playNote(note);
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
    console.log('handleStartClick: Starting...');
    const audioSuccess = await initialize();
    console.log('handleStartClick: Audio initialized:', audioSuccess);
    
    if (audioSuccess) {
      console.log('handleStartClick: Attempting MIDI initialization...');
      // Always try to initialize MIDI if the browser might support it
      const midiSuccess = await initializeMidi();
      console.log('handleStartClick: MIDI initialized:', midiSuccess);
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
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-green-700 dark:text-green-400 font-semibold">
                  ✓ Audio Engine Ready
                </p>
              </div>
              
              <div className={`flex-1 rounded-lg border relative ${
                midiInitialized
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              }`}>
                <button
                  onClick={() => midiInitialized && midiDevices.length > 0 && setShowMidiDevices(!showMidiDevices)}
                  className={`w-full p-4 text-left ${midiInitialized && midiDevices.length > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <p className={`font-semibold flex items-center justify-between ${
                    midiInitialized
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}>
                    <span>
                      {midiInitialized 
                        ? `✓ MIDI: ${midiDevices.length} ${midiDevices.length === 1 ? 'device' : 'devices'}` 
                        : `○ MIDI: ${midiSupported ? 'Not Connected' : 'Not Supported'}`
                      }
                    </span>
                    {midiInitialized && midiDevices.length > 0 && (
                      <span className="text-xs ml-2">
                        {showMidiDevices ? '▲' : '▼'}
                      </span>
                    )}
                  </p>
                  {midiError && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      {midiError}
                    </p>
                  )}
                </button>
                {!midiInitialized && midiSupported && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={initializeMidi}
                      className="text-xs px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded"
                    >
                      Connect MIDI
                    </button>
                  </div>
                )}
                {showMidiDevices && midiDevices.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-green-50 dark:bg-green-900/95 border border-green-200 dark:border-green-800 rounded-lg shadow-lg z-50 p-4">
                    <ul className="space-y-1">
                      {midiDevices.map(device => (
                        <li key={device.id} className="text-xs text-green-600 dark:text-green-400">
                          • {device.name} {device.manufacturer && `(${device.manufacturer})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

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

function midiToNote(midiNote: MidiNote): Note {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = noteNames[midiNote % 12];
  return `${noteName}${octave}` as Note;
}
