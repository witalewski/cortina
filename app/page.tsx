'use client';

import { useAudio } from '@/app/hooks/useAudio';

export default function Home() {
  const { isInitialized, isInitializing, error, initialize, playNote, stopNote } = useAudio();

  const testNotes = [
    { note: 'C3' as const, label: 'C3 (Low)' },
    { note: 'E3' as const, label: 'E3' },
    { note: 'G3' as const, label: 'G3' },
    { note: 'C4' as const, label: 'C4 (Middle C)' },
    { note: 'E4' as const, label: 'E4' },
    { note: 'G4' as const, label: 'G4' },
    { note: 'C5' as const, label: 'C5 (High)' },
  ];

  const playTestNote = (note: string) => {
    playNote(note as any);
    setTimeout(() => stopNote(note as any), 500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black p-8">
      <main className="w-full max-w-2xl bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Cortina 🎹
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Audio Engine Test UI
          </p>
        </div>

        {!isInitialized ? (
          <div className="text-center space-y-4">
            <p className="text-zinc-700 dark:text-zinc-300 mb-6">
              Click the button below to initialize the audio engine
            </p>
            <button
              onClick={initialize}
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
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <p className="text-green-700 dark:text-green-400 font-semibold">
                ✓ Audio Engine Initialized
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                Test Notes
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Click a button to play a note. Each note will play for 500ms.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {testNotes.map(({ note, label }) => (
                  <button
                    key={note}
                    onClick={() => playTestNote(note)}
                    className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 font-medium rounded-lg transition-colors shadow"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                Sustained Note Test
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Hold the button to sustain the note
              </p>
              <button
                onMouseDown={() => playNote('A4')}
                onMouseUp={() => stopNote('A4')}
                onMouseLeave={() => stopNote('A4')}
                onTouchStart={() => playNote('A4')}
                onTouchEnd={() => stopNote('A4')}
                className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold rounded-lg shadow-lg transition-colors"
              >
                Hold for A4 (440Hz)
              </button>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                If you can hear sounds, Phase 2 is working correctly! 🎉
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
