import * as Tone from 'tone';
import type { Note, MidiNote } from '@/app/types/music';

// Synth preset configuration
interface SynthPreset {
  name: string;
  synth: {
    harmonicity: number;
    modulationIndex: number;
    oscillator: { type: string };
    envelope: {
      attack: number;
      decay: number;
      sustain: number;
      release: number;
    };
    modulation: { type: string };
    modulationEnvelope: {
      attack: number;
      decay: number;
      sustain: number;
      release: number;
    };
  };
  filter: {
    type: 'lowpass' | 'highpass' | 'bandpass';
    frequency: number;
    Q: number;
    rolloff: -12 | -24 | -48 | -96;
  };
  filterMapping: {
    baseCutoffLow: number;  // Hz - for low notes (C3)
    baseCutoffHigh: number; // Hz - for high notes (C5)
    velocityCutoffRange: number; // Hz - velocity adds brightness
  };
  reverb: {
    decay: number;
    preDelay: number;
    wet: number;
  };
}

// Warm piano preset - current optimized sound
const WARM_PIANO_PRESET: SynthPreset = {
  name: 'Warm Piano',
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

class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private filter: Tone.Filter | null = null;
  private reverb: Tone.Reverb | null = null;
  private initialized = false;
  private currentPreset: SynthPreset = WARM_PIANO_PRESET;

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

    // Create synth from preset
    this.synth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: preset.synth.harmonicity,
      modulationIndex: preset.synth.modulationIndex,
      oscillator: preset.synth.oscillator,
      envelope: preset.synth.envelope,
      modulation: preset.synth.modulation,
      modulationEnvelope: preset.synth.modulationEnvelope
    }).connect(this.filter);

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
    const midiNote = typeof note === 'number' ? note : this.noteToMidi(noteStr);
    const normalizedVelocity = Math.max(0, Math.min(1, velocity));
    
    // Apply velocity curve (quadratic) for more natural response
    // Soft playing is easier, hard playing requires more force
    const velocityCurved = normalizedVelocity * normalizedVelocity;
    
    // Frequency-dependent filter cutoff for richer low notes
    // Low notes (e.g., C3/48) need higher cutoffs to preserve harmonics
    // High notes (e.g., C5/72) can have lower cutoffs
    const noteRatio = (midiNote - 36) / 36; // C3=0, C5=1
    const noteRatioClamped = Math.max(0, Math.min(1, noteRatio));
    
    // Get filter mapping from preset
    const { baseCutoffLow, baseCutoffHigh, velocityCutoffRange } = this.currentPreset.filterMapping;
    const baseCutoff = baseCutoffLow - (noteRatioClamped * (baseCutoffLow - baseCutoffHigh));
    
    // Velocity modulation
    const cutoff = baseCutoff + (normalizedVelocity * velocityCutoffRange);
    this.filter.frequency.setValueAtTime(cutoff, Tone.now());
    
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
export type { SynthPreset };
export { WARM_PIANO_PRESET };
