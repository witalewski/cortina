import * as Tone from 'tone';
import type { Note, MidiNote } from '@/app/types/music';
import { midiToNote, noteToMidi } from '@/app/utils/music';

// Base synth preset configuration
interface BaseSynthPreset {
  name: string;
  filter: {
    type: 'lowpass' | 'highpass' | 'bandpass';
    frequency: number;
    Q: number;
    rolloff: -12 | -24 | -48 | -96;
  };
  reverb: {
    decay: number;
    preDelay: number;
    wet: number;
  };
}

// FM synth preset (for Warm Piano, Basic Synth)
interface FMSynthPreset extends BaseSynthPreset {
  synthType: 'fm';
  synth: {
    harmonicity: number;
    modulationIndex: number;
    oscillator: { type: 'sine' | 'square' | 'sawtooth' | 'triangle' };
    envelope: {
      attack: number;
      decay: number;
      sustain: number;
      release: number;
    };
    modulation: { type: 'sine' | 'square' | 'sawtooth' | 'triangle' };
    modulationEnvelope: {
      attack: number;
      decay: number;
      sustain: number;
      release: number;
    };
  };
  filterMapping: {
    baseCutoffLow: number;  // Hz - for low notes (C3)
    baseCutoffHigh: number; // Hz - for high notes (C5)
    velocityCutoffRange: number; // Hz - velocity adds brightness
  };
}

// Mono synth preset (for Acid Bass)
interface MonoSynthPreset extends BaseSynthPreset {
  synthType: 'mono';
  synth: {
    oscillator: { type: 'sine' | 'square' | 'sawtooth' | 'triangle' };
    envelope: {
      attack: number;
      decay: number;
      sustain: number;
      release: number;
    };
  };
  filterEnvelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
    baseFrequency: number;  // Hz - starting filter cutoff
    octaves: number;        // Range to sweep (in octaves)
  };
  filterMapping: {
    velocityOctaveBoost: number;  // Velocity increases envelope sweep
  };
}

// Sampler preset (for Sampled Piano)
interface SamplerPreset extends BaseSynthPreset {
  synthType: 'sampler';
  sampleMap: Record<string, string>;  // Note name → CDN URL
  // No filterMapping needed - samples are realistic as-is
}

type SynthPreset = FMSynthPreset | MonoSynthPreset | SamplerPreset;

// Warm piano preset - current optimized sound
const WARM_PIANO_PRESET: FMSynthPreset = {
  name: 'Warm Piano',
  synthType: 'fm',
  synth: {
    harmonicity: 2,
    modulationIndex: 12,
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.02,
      decay: 0.7,
      sustain: 0.02,
      release: 1
    },
    modulation: { type: 'sine' },
    modulationEnvelope: {
      attack: 0.01,
      decay: 0.4,
      sustain: 0.1,
      release: 0.5
    }
  },
  filter: {
    type: 'lowpass',
    frequency: 3000,
    Q: 1,
    rolloff: -24
  },
  filterMapping: {
    baseCutoffLow: 4000,
    baseCutoffHigh: 2000,
    velocityCutoffRange: 2000
  },
  reverb: {
    decay: 1.5,
    preDelay: 0.01,
    wet: 0.15
  }
};

// Basic synth preset - simple, bright, classic synth sound
const BASIC_SYNTH_PRESET: FMSynthPreset = {
  name: 'Basic Synth',
  synthType: 'fm',
  synth: {
    harmonicity: 1,
    modulationIndex: 3,
    oscillator: { type: 'triangle' },
    envelope: {
      attack: 0.005,
      decay: 0.3,
      sustain: 0.3,
      release: 0.5
    },
    modulation: { type: 'square' },
    modulationEnvelope: {
      attack: 0.005,
      decay: 0.2,
      sustain: 0,
      release: 0.3
    }
  },
  filter: {
    type: 'lowpass',
    frequency: 4000,
    Q: 1,
    rolloff: -12
  },
  filterMapping: {
    baseCutoffLow: 5000,
    baseCutoffHigh: 4000,
    velocityCutoffRange: 1000
  },
  reverb: {
    decay: 0.8,
    preDelay: 0.005,
    wet: 0.05
  }
};

// Acid bass preset - TB-303 inspired squelchy bass
const ACID_BASS_PRESET: MonoSynthPreset = {
  name: 'Acid Bass',
  synthType: 'mono',
  synth: {
    oscillator: { type: 'sawtooth' },
    envelope: {
      attack: 0.005,
      decay: 0.2,
      sustain: 0.2,
      release: 0.1
    }
  },
  filter: {
    type: 'lowpass',
    frequency: 300,
    Q: 4,  // Reduced from 8 for mellower sound
    rolloff: -24
  },
  filterEnvelope: {
    attack: 0.005,
    decay: 0.3,
    sustain: 0.2,
    release: 0.1,
    baseFrequency: 150,
    octaves: 3.0  // Reduced from 3.5 for less extreme sweep
  },
  filterMapping: {
    velocityOctaveBoost: 1.2  // Reduced from 1.5 for smoother velocity response
  },
  reverb: {
    decay: 0.5,
    preDelay: 0.01,
    wet: 0.05
  }
};

// Sampled piano preset - Real piano samples from CDN
// Using every 3rd note (C, E, G#) to minimize download size (~2-3MB)
// Tone.js pitch-shifts between sampled notes for seamless playback
const CDN_BASE = 'https://cdn.jsdelivr.net/npm/tonejs-instrument-piano-mp3@1.0.0';
const SAMPLED_PIANO_PRESET: SamplerPreset = {
  name: 'Sampled Piano',
  synthType: 'sampler',
  sampleMap: {
    'C1': `${CDN_BASE}/C1.mp3`,
    'E1': `${CDN_BASE}/E1.mp3`,
    'G1': `${CDN_BASE}/G1.mp3`,
    'C2': `${CDN_BASE}/C2.mp3`,
    'E2': `${CDN_BASE}/E2.mp3`,
    'G2': `${CDN_BASE}/G2.mp3`,
    'C3': `${CDN_BASE}/C3.mp3`,
    'E3': `${CDN_BASE}/E3.mp3`,
    'G3': `${CDN_BASE}/G3.mp3`,
    'C4': `${CDN_BASE}/C4.mp3`,
    'E4': `${CDN_BASE}/E4.mp3`,
    'G4': `${CDN_BASE}/G4.mp3`,
    'C5': `${CDN_BASE}/C5.mp3`,
    'E5': `${CDN_BASE}/E5.mp3`,
    'G5': `${CDN_BASE}/G5.mp3`,
    'C6': `${CDN_BASE}/C6.mp3`,
    'E6': `${CDN_BASE}/E6.mp3`,
    'G6': `${CDN_BASE}/G6.mp3`,
  },
  filter: {
    type: 'lowpass',
    frequency: 8000,  // Very high - samples already sound good
    Q: 0.5,           // Minimal resonance
    rolloff: -12
  },
  reverb: {
    decay: 1.2,
    preDelay: 0.01,
    wet: 0.12  // Moderate room ambience
  }
};

class AudioEngine {
  private synth: Tone.PolySynth | Tone.Sampler | null = null;
  private filter: Tone.Filter | null = null;
  private reverb: Tone.Reverb | null = null;
  private initialized = false;
  private currentPreset: SynthPreset = WARM_PIANO_PRESET;
  private isLoadingPreset = false;

  private createSynth(preset: SynthPreset): Tone.PolySynth | Tone.Sampler {
    if (preset.synthType === 'fm') {
      return new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: preset.synth.harmonicity,
        modulationIndex: preset.synth.modulationIndex,
        oscillator: preset.synth.oscillator,
        envelope: preset.synth.envelope,
        modulation: preset.synth.modulation,
        modulationEnvelope: preset.synth.modulationEnvelope
      });
    } else if (preset.synthType === 'mono') {
      // mono synth type
      return new Tone.PolySynth(Tone.MonoSynth, {
        oscillator: preset.synth.oscillator,
        envelope: preset.synth.envelope,
        filter: {
          type: preset.filter.type,
          Q: preset.filter.Q,
          rolloff: preset.filter.rolloff
        },
        filterEnvelope: {
          attack: preset.filterEnvelope.attack,
          decay: preset.filterEnvelope.decay,
          sustain: preset.filterEnvelope.sustain,
          release: preset.filterEnvelope.release,
          baseFrequency: preset.filterEnvelope.baseFrequency,
          octaves: preset.filterEnvelope.octaves
        }
      });
    } else {
      // sampler type
      return new Tone.Sampler({
        urls: preset.sampleMap,
        release: 1,
        baseUrl: ''  // URLs are already complete
      });
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await Tone.start();
    
    const preset = this.currentPreset;
    
    // Create filter from preset
    this.filter = new Tone.Filter({
      type: preset.filter.type,
      frequency: preset.filter.frequency,
      Q: preset.filter.Q,
      rolloff: preset.filter.rolloff
    });

    // Create reverb from preset
    this.reverb = new Tone.Reverb({
      decay: preset.reverb.decay,
      preDelay: preset.reverb.preDelay
    });

    // Create synth from preset (type-specific)
    this.synth = this.createSynth(preset).connect(this.filter);

    // Signal chain: Synth → Filter → Reverb (wet 0.15) → Destination
    this.filter.connect(this.reverb);
    this.reverb.toDestination();
    // Also send dry signal to destination
    this.filter.toDestination();
    
    // Set reverb wet/dry mix from preset
    this.reverb.wet.value = preset.reverb.wet;

    this.initialized = true;
  }

  noteOn(note: Note | MidiNote, velocity: number = 0.8): void {
    if (!this.synth || !this.filter || !this.reverb) {
      console.warn('Audio engine not initialized');
      return;
    }

    // Don't play notes while preset is loading
    if (this.isLoadingPreset) {
      console.warn('Preset is still loading');
      return;
    }

    // For samplers, check if samples are loaded
    if (this.synth instanceof Tone.Sampler && !this.synth.loaded) {
      console.warn('Sampler samples not yet loaded');
      return;
    }

    const noteStr = typeof note === 'number' ? midiToNote(note) : note;
    const normalizedVelocity = Math.max(0, Math.min(1, velocity));
    
    // Apply velocity curve (quadratic) for more natural response
    const velocityCurved = normalizedVelocity * normalizedVelocity;
    
    // Handle preset-specific behavior
    if (this.currentPreset.synthType === 'fm') {
      // FM synth: frequency-dependent filter cutoff
      const midiNote = typeof note === 'number' ? note : noteToMidi(noteStr);
      const noteRatio = (midiNote - 36) / 36;
      const noteRatioClamped = Math.max(0, Math.min(1, noteRatio));
      
      const { baseCutoffLow, baseCutoffHigh, velocityCutoffRange } = this.currentPreset.filterMapping;
      const baseCutoff = baseCutoffLow - (noteRatioClamped * (baseCutoffLow - baseCutoffHigh));
      const cutoff = baseCutoff + (normalizedVelocity * velocityCutoffRange);
      
      this.filter.frequency.setValueAtTime(cutoff, Tone.now());
    } else if (this.currentPreset.synthType === 'mono') {
      // MonoSynth: velocity affects filter envelope octaves
      const { velocityOctaveBoost } = this.currentPreset.filterMapping;
      const baseOctaves = this.currentPreset.filterEnvelope.octaves;
      const octaves = baseOctaves + (normalizedVelocity * velocityOctaveBoost);
      
      // Update filter envelope octaves for this note
      // Note: PolySynth shares voice settings, so this affects all voices
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.synth as any).set({ filterEnvelope: { octaves } });
    }
    // Sampler: no special filter handling needed - samples sound good as-is
    
    this.synth.triggerAttack(noteStr, undefined, velocityCurved);
  }

  noteOff(note: Note | MidiNote): void {
    if (!this.synth || !this.filter || !this.reverb) {
      console.warn('Audio engine not initialized');
      return;
    }

    const noteStr = typeof note === 'number' ? midiToNote(note) : note;
    this.synth.triggerRelease(noteStr);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getContextState(): string {
    return Tone.context.state;
  }

  getPresetName(): string {
    return this.currentPreset.name;
  }

  isPresetLoading(): boolean {
    return this.isLoadingPreset;
  }

  async setPreset(preset: SynthPreset): Promise<void> {
    if (!this.initialized) {
      this.currentPreset = preset;
      return;
    }

    // Set loading state
    this.isLoadingPreset = true;

    // Dispose current audio nodes
    this.synth?.dispose();
    this.filter?.dispose();
    this.reverb?.dispose();

    // Update preset
    this.currentPreset = preset;

    // Recreate audio nodes with new preset
    this.filter = new Tone.Filter({
      type: preset.filter.type,
      frequency: preset.filter.frequency,
      Q: preset.filter.Q,
      rolloff: preset.filter.rolloff
    });

    this.reverb = new Tone.Reverb({
      decay: preset.reverb.decay,
      preDelay: preset.reverb.preDelay
    });

    // Create synth based on preset type
    const newSynth = this.createSynth(preset);

    // If it's a Sampler, wait for samples to load BEFORE connecting
    if (preset.synthType === 'sampler' && newSynth instanceof Tone.Sampler) {
      await newSynth.loaded;
    }

    // Now connect after loading is complete
    this.synth = newSynth.connect(this.filter);

    // Reconnect signal chain
    this.filter.connect(this.reverb);
    this.reverb.toDestination();
    this.filter.toDestination();
    this.reverb.wet.value = preset.reverb.wet;

    // Clear loading state
    this.isLoadingPreset = false;
  }

  dispose(): void {
    this.synth?.dispose();
    this.filter?.dispose();
    this.reverb?.dispose();
    this.synth = null;
    this.filter = null;
    this.reverb = null;
    this.initialized = false;
  }
}

export const audioEngine = new AudioEngine();
export type { SynthPreset, FMSynthPreset, MonoSynthPreset, SamplerPreset };
export { WARM_PIANO_PRESET, BASIC_SYNTH_PRESET, ACID_BASS_PRESET, SAMPLED_PIANO_PRESET };
