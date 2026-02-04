import * as Tone from 'tone';
import type { Note, MidiNote } from '@/app/types/music';

class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private filter: Tone.Filter | null = null;
  private reverb: Tone.Reverb | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await Tone.start();
    
    // Create filter (lowpass to remove harsh highs)
    this.filter = new Tone.Filter({
      type: 'lowpass',
      frequency: 3000, // Will be modulated per-note by velocity
      Q: 1,
      rolloff: -24
    });

    // Create reverb for spatial realism
    this.reverb = new Tone.Reverb({
      decay: 1.5,
      preDelay: 0.01
    });

    this.synth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 2,
      modulationIndex: 12,
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.02,
        decay: 0.7,
        sustain: 0.02,
        release: 1
      },
      modulation: {
        type: 'sine'
      },
      modulationEnvelope: {
        attack: 0.01,
        decay: 0.4,
        sustain: 0.1,
        release: 0.5
      }
    }).connect(this.filter);

    // Signal chain: Synth → Filter → Reverb (wet 0.15) → Destination
    this.filter.connect(this.reverb);
    this.reverb.toDestination();
    // Also send dry signal to destination
    this.filter.toDestination();
    
    // Set reverb wet/dry mix (15% wet, reduced from 20% for clarity)
    this.reverb.wet.value = 0.15;

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
    // Soft playing is easier, hard playing requires more force
    const velocityCurved = normalizedVelocity * normalizedVelocity;
    
    // Velocity-dependent filter cutoff (soft = mellow, hard = bright)
    const baseCutoff = 2000;  // Hz - raised from 1500 for more clarity
    const cutoffRange = 3000; // Hz - max at 5000Hz for brighter sound
    const cutoff = baseCutoff + (normalizedVelocity * cutoffRange);
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
