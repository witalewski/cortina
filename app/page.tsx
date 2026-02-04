'use client';

import { useAudio } from '@/app/hooks/useAudio';
import { PianoKeyboard } from '@/app/components/piano';

export default function Home() {
  const { isInitialized, isInitializing, error, initialize, playNote, stopNote } = useAudio();

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
                ✓ Audio Engine Ready
              </p>
            </div>

            <div className="flex justify-center py-8">
              <PianoKeyboard
                startNote={48}
                numKeys={25}
                onNotePress={playNote}
                onNoteRelease={stopNote}
              />
            </div>

            <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
              <p>Click the piano keys to play notes</p>
              <p className="mt-1">25 keys from C3 to C5</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
