'use client';

import { useState } from 'react';
import type { MidiDevice } from '@/app/services/midi';

interface StatusIndicatorProps {
  audioReady: boolean;
  midiInitialized: boolean;
  midiSupported: boolean;
  midiDevices: MidiDevice[];
  midiError: string | null;
  onMidiConnect: () => void;
}

export function StatusIndicator({
  audioReady,
  midiInitialized,
  midiSupported,
  midiDevices,
  midiError,
  onMidiConnect,
}: StatusIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="relative">
        {/* Main compact status */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center gap-3">
            {/* Audio status */}
            <span className="flex items-center gap-1">
              <span className={audioReady ? 'text-green-600 dark:text-green-400' : 'text-zinc-400'}>
                ●
              </span>
              <span className="text-zinc-700 dark:text-zinc-300">
                Audio {audioReady && '✓'}
              </span>
            </span>

            {/* MIDI status */}
            <span className="flex items-center gap-1">
              <span className={midiInitialized ? 'text-green-600 dark:text-green-400' : 'text-zinc-400'}>
                ●
              </span>
              <span className="text-zinc-700 dark:text-zinc-300">
                MIDI {midiInitialized && midiDevices.length > 0 && `${midiDevices.length}`}
              </span>
            </span>

            {/* Expand indicator */}
            {(midiDevices.length > 0 || (!midiInitialized && midiSupported)) && (
              <span className="text-zinc-400 text-[10px]">
                {showDetails ? '▲' : '▼'}
              </span>
            )}
          </div>
        </button>

        {/* Details panel (expands upward) */}
        {showDetails && (
          <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl p-3 min-w-[200px]">
            {/* MIDI devices */}
            {midiInitialized && midiDevices.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
                  MIDI Devices
                </p>
                <ul className="space-y-1">
                  {midiDevices.map((device) => (
                    <li key={device.id} className="text-xs text-zinc-700 dark:text-zinc-300">
                      • {device.name}
                      {device.manufacturer && (
                        <span className="text-zinc-500 dark:text-zinc-500 ml-1">
                          ({device.manufacturer})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* MIDI connect button */}
            {!midiInitialized && midiSupported && (
              <div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                  MIDI not connected
                </p>
                <button
                  onClick={onMidiConnect}
                  className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded w-full"
                >
                  Connect MIDI
                </button>
              </div>
            )}

            {/* MIDI error */}
            {midiError && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                {midiError}
              </p>
            )}

            {/* MIDI not supported */}
            {!midiSupported && (
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                MIDI not supported in this browser
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
