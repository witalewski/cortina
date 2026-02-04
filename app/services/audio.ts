import * as Tone from 'tone';
import type { Note, MidiNote } from '@/app/types/music';

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

type SynthPreset = FMSynthPreset | MonoSynthPreset;

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
    Q: 8,
    rolloff: -24
  },
  filterEnvelope: {
    attack: 0.005,
    decay: 0.3,
    sustain: 0.2,
    release: 0.1,
    baseFrequency: 150,
    octaves: 3.5
  },
  filterMapping: {
    velocityOctaveBoost: 1.5
  },
  reverb: {
    decay: 0.5,
    preDelay: 0.01,
    wet: 0.05
  }
};

class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private filter: Tone.Filter | null = null;
  private reverb: Tone.Reverb | null = null;
  private initialized = false;
  private currentPreset: SynthPreset = WARM_PIANO_PRESET;

  private createSynth(preset: SynthPreset): Tone.PolySynth {
    if (preset.synthType === 'fm') {
      return new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: preset.synth.harmonicity,
        modulationIndex: preset.synth.modulationIndex,
        oscillator: preset.synth.oscillator,
        envelope: preset.synth.envelope,
        modulation: preset.synth.modulation,
        modulationEnvelope: preset.synth.modulationEnvelope
      });
    } else {
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

    const noteStr = typeof note === 'number' ? this.midiToNote(note) : note;
    const normalizedVelocity = Math.max(0, Math.min(1, velocity));
    
    // Apply velocity curve (quadratic) for more natural response
    const velocityCurved = normalizedVelocity * normalizedVelocity;
    
    // Handle preset-specific behavior
    if (this.currentPreset.synthType === 'fm') {
      // FM synth: frequency-dependent filter cutoff
      const midiNote = typeof note === 'number' ? note : this.noteToMidi(noteStr);
      const noteRatio = (midiNote - 36) / 36;
      const noteRatioClamped = Math.max(0, Math.min(1, noteRatio));
      
      const { baseCutoffLow, baseCutoffHigh, velocityCutoffRange } = this.currentPreset.filterMapping;
      const baseCutoff = baseCutoffLow - (noteRatioClamped * (baseCutoffLow - baseCutoffHigh));
      const cutoff = baseCutoff + (normalizedVelocity * velocityCutoffRange);
      
      this.filter.frequency.setValueAtTime(cutoff, Tone.now());
    } else {
      // MonoSynth: velocity affects filter envelope octaves
      const { velocityOctaveBoost } = this.currentPreset.filterMapping;
      const baseOctaves = this.currentPreset.filterEnvelope.octaves;
      const octaves = baseOctaves + (normalizedVelocity * velocityOctaveBoost);
      
      // Update filter envelope octaves for this note
      // Note: PolySynth shares voice settings, so this affects all voices
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.synth as any).set({ filterEnvelope: { octaves } });
    }
    
    this.synth.triggerAttack(noteStr, undefined, velocityCurved);
  }

  noteOff(note: Note | MidiNote): void {
    if (!this.synth || !this.filter || !this.reverb) {
      console.warn('Audio engine not initialized');
      return;
    }

    const noteStr = typeof note === 'number' ? this.midiToNote(note) : note;
    this.synth.triggerRelease(noteStr);
  }

  private midiToNote(midiNote: MidiNote): Note {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const noteName = noteNames[midiNote % 12];
    return `${noteName}${octave}` as Note;
  }

  private noteToMidi(note: Note): MidiNote {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const match = note.match(/^([A-G]#?)(-?\d+)$/);
    if (!match) return 60; // Default to C4 if parsing fails
    
    const [, noteName, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);
    const noteIndex = noteNames.indexOf(noteName);
    
    return ((octave + 1) * 12 + noteIndex) as MidiNote;
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

  async setPreset(preset: SynthPreset): Promise<void> {
    if (!this.initialized) {
      this.currentPreset = preset;
      return;
    }

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
    this.synth = this.createSynth(preset).connect(this.filter);

    // Reconnect signal chain
    this.filter.connect(this.reverb);
    this.reverb.toDestination();
    this.filter.toDestination();
    this.reverb.wet.value = preset.reverb.wet;
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
export type { SynthPreset, FMSynthPreset, MonoSynthPreset };
export { WARM_PIANO_PRESET, BASIC_SYNTH_PRESET, ACID_BASS_PRESET };
