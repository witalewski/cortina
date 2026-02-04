import * as Tone from 'tone';
import type { Note, MidiNote } from '@/app/types/music';
import { midiToNote, noteToMidi } from '@/app/utils/music';
import type { SynthPreset } from './types';
import { SAMPLED_PIANO_PRESET } from './presets';

export class AudioEngine {
  private synth: Tone.PolySynth | Tone.Sampler | null = null;
  private filter: Tone.Filter | null = null;
  private reverb: Tone.Reverb | null = null;
  private initialized = false;
  private currentPreset: SynthPreset = SAMPLED_PIANO_PRESET;
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
