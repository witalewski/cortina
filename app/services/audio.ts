import * as Tone from 'tone';
import type { Note, MidiNote } from '@/app/types/music';

class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await Tone.start();
    
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle'
      },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    }).toDestination();

    this.initialized = true;
  }

  noteOn(note: Note | MidiNote, velocity: number = 0.8): void {
    if (!this.synth) {
      console.warn('Audio engine not initialized');
      return;
    }

    const noteStr = typeof note === 'number' ? this.midiToNote(note) : note;
    const normalizedVelocity = Math.max(0, Math.min(1, velocity));
    
    this.synth.triggerAttack(noteStr, undefined, normalizedVelocity);
  }

  noteOff(note: Note | MidiNote): void {
    if (!this.synth) {
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
    this.synth = null;
    this.initialized = false;
  }
}

export const audioEngine = new AudioEngine();
