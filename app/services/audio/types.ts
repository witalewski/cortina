// Base synth preset configuration
export interface BaseSynthPreset {
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
export interface FMSynthPreset extends BaseSynthPreset {
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
export interface MonoSynthPreset extends BaseSynthPreset {
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
export interface SamplerPreset extends BaseSynthPreset {
  synthType: 'sampler';
  sampleMap: Record<string, string>;  // Note name → CDN URL
  // No filterMapping needed - samples are realistic as-is
}

export type SynthPreset = FMSynthPreset | MonoSynthPreset | SamplerPreset;
