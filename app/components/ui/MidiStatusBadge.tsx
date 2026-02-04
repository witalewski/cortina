'use client';

import { useState } from 'react';
import type { MidiDevice } from '@/app/services/midi';

interface MidiStatusBadgeProps {
  isInitialized: boolean;
  isSupported: boolean;
  devices: MidiDevice[];
  error: string | null;
  onConnect: () => void;
}

export function MidiStatusBadge({ 
  isInitialized, 
  isSupported, 
  devices, 
  error,
  onConnect 
}: MidiStatusBadgeProps) {
  const [showDevices, setShowDevices] = useState(false);

  return (
    <div className={`flex-1 rounded-lg border relative ${
      isInitialized
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
    }`}>
      <button
        onClick={() => isInitialized && devices.length > 0 && setShowDevices(!showDevices)}
        className={`w-full p-4 text-left ${isInitialized && devices.length > 0 ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <p className={`font-semibold flex items-center justify-between ${
          isInitialized
            ? 'text-green-700 dark:text-green-400'
            : 'text-amber-700 dark:text-amber-400'
        }`}>
          <span>
            {isInitialized 
              ? `✓ MIDI: ${devices.length} ${devices.length === 1 ? 'device' : 'devices'}` 
              : `○ MIDI: ${isSupported ? 'Not Connected' : 'Not Supported'}`
            }
          </span>
          {isInitialized && devices.length > 0 && (
            <span className="text-xs ml-2">
              {showDevices ? '▲' : '▼'}
            </span>
          )}
        </p>
        {error && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            {error}
          </p>
        )}
      </button>
      {!isInitialized && isSupported && (
        <div className="px-4 pb-4">
          <button
            onClick={onConnect}
            className="text-xs px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded"
          >
            Connect MIDI
          </button>
        </div>
      )}
      {showDevices && devices.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-green-50 dark:bg-green-900/95 border border-green-200 dark:border-green-800 rounded-lg shadow-lg z-50 p-4">
          <ul className="space-y-1">
            {devices.map(device => (
              <li key={device.id} className="text-xs text-green-600 dark:text-green-400">
                • {device.name} {device.manufacturer && `(${device.manufacturer})`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
