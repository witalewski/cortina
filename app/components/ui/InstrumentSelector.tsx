'use client';

import { useState } from 'react';
import type { SynthPreset } from '@/app/services/audio';

interface Preset {
  preset: SynthPreset;
  category: 'synth' | 'sampled';
}

interface InstrumentSelectorProps {
  currentPresetName: string;
  isLoading: boolean;
  presets: Preset[];
  onPresetChange: (preset: SynthPreset) => void;
}

export function InstrumentSelector({ 
  currentPresetName, 
  isLoading, 
  presets,
  onPresetChange 
}: InstrumentSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const synthPresets = presets.filter(p => p.category === 'synth');
  const sampledPresets = presets.filter(p => p.category === 'sampled');

  const handlePresetSelect = (preset: SynthPreset) => {
    onPresetChange(preset);
    setShowDropdown(false);
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
        🎹 Instrument
      </label>
      <div className="relative">
        <button
          onClick={() => !isLoading && setShowDropdown(!showDropdown)}
          disabled={isLoading}
          className={`w-full px-4 py-2 text-left bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg font-medium ${
            isLoading 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-zinc-50 dark:hover:bg-zinc-600 cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-zinc-900 dark:text-zinc-100">
              {isLoading ? 'Loading...' : currentPresetName}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {isLoading ? '⟳' : '▼'}
            </span>
          </div>
        </button>

        {isLoading && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            Loading samples (~3MB)...
          </p>
        )}

        {showDropdown && !isLoading && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-lg z-50 overflow-hidden">
            {synthPresets.length > 0 && (
              <>
                <div className="p-2 border-b border-zinc-200 dark:border-zinc-600">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 px-2">SYNTHS</p>
                </div>
                {synthPresets.map(({ preset }) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset)}
                    className={`w-full px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-600 ${
                      currentPresetName === preset.name ? 'bg-blue-100 dark:bg-blue-900/40 font-semibold' : ''
                    }`}
                  >
                    <span className="text-zinc-900 dark:text-zinc-100">{preset.name}</span>
                    {currentPresetName === preset.name && <span className="ml-2">✓</span>}
                  </button>
                ))}
              </>
            )}

            {sampledPresets.length > 0 && (
              <>
                <div className="p-2 border-t border-zinc-200 dark:border-zinc-600">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 px-2">SAMPLED</p>
                </div>
                {sampledPresets.map(({ preset }) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset)}
                    className={`w-full px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-600 ${
                      currentPresetName === preset.name ? 'bg-blue-100 dark:bg-blue-900/40 font-semibold' : ''
                    }`}
                  >
                    <span className="text-zinc-900 dark:text-zinc-100">{preset.name}</span>
                    {currentPresetName === preset.name && <span className="ml-2">✓</span>}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
