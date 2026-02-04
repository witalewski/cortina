import type { FMSynthPreset, MonoSynthPreset, SamplerPreset } from './types';

// Warm piano preset - current optimized sound
export const WARM_PIANO_PRESET: FMSynthPreset = {
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
export const BASIC_SYNTH_PRESET: FMSynthPreset = {
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
export const ACID_BASS_PRESET: MonoSynthPreset = {
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
export const SAMPLED_PIANO_PRESET: SamplerPreset = {
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
