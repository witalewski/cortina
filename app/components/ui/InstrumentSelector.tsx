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
    <div className="inline-flex items-center gap-2">
      <div className="relative">
        <button
          onClick={() => !isLoading && setShowDropdown(!showDropdown)}
          disabled={isLoading}
          className={`px-3 py-1.5 text-sm text-left bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg ${
            isLoading 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-zinc-50 dark:hover:bg-zinc-600 cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-zinc-900 dark:text-zinc-100">
              {isLoading ? 'Loading...' : currentPresetName}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400 text-xs">
              {isLoading ? '⟳' : '▼'}
            </span>
          </div>
        </button>

        {isLoading && (
          <p className="absolute top-full left-0 mt-1 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
            Loading samples (~3MB)...
          </p>
        )}

        {showDropdown && !isLoading && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-lg z-50 overflow-hidden min-w-[180px]">
            {sampledPresets.length > 0 && (
              <>
                <div className="px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-600">
                  <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Sampled</p>
                </div>
                {sampledPresets.map(({ preset }) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset)}
                    className={`w-full px-3 py-1.5 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-600 ${
                      currentPresetName === preset.name ? 'bg-blue-100 dark:bg-blue-900/40 font-semibold' : ''
                    }`}
                  >
                    <span className="text-zinc-900 dark:text-zinc-100">{preset.name}</span>
                    {currentPresetName === preset.name && <span className="ml-2 text-xs">✓</span>}
                  </button>
                ))}
              </>
            )}

            {synthPresets.length > 0 && (
              <>
                <div className="px-3 py-1.5 border-t border-zinc-200 dark:border-zinc-600">
                  <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Synths</p>
                </div>
                {synthPresets.map(({ preset }) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset)}
                    className={`w-full px-3 py-1.5 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-600 ${
                      currentPresetName === preset.name ? 'bg-blue-100 dark:bg-blue-900/40 font-semibold' : ''
                    }`}
                  >
                    <span className="text-zinc-900 dark:text-zinc-100">{preset.name}</span>
                    {currentPresetName === preset.name && <span className="ml-2 text-xs">✓</span>}
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
