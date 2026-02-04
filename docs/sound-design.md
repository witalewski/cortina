# Sound Design

This document describes the sound design philosophy and implementation for Cortina's synthesizer.

## Design Principles

1. **Warmth over accuracy** - We're not emulating real instruments exactly, but creating pleasant, musical sounds
2. **Expressiveness** - Velocity affects both volume AND timbre
3. **Spatial realism** - Sound exists "in a room", not "in your head"
4. **Diverse palette** - Multiple presets for different musical styles
5. **Future flexibility** - Architecture allows adding sample-based instruments later

## Architecture: Multi-Synth System

The synthesizer supports multiple synth types through a preset system:

- **FM Synthesis** (`FMSynth`) - For rich, evolving sounds like piano
- **Mono Synthesis** (`MonoSynth`) - For classic analog sounds with filter envelopes

Each preset specifies its synth type and configuration, allowing diverse sound palettes within one engine.

## Presets

### 1. Warm Piano (FMSynth)

**Goal:** Piano-like warmth and expressiveness without sample-based emulation.

**Signal Chain:**
```
FMSynth → Filter (lowpass, velocity-controlled) → Reverb → Destination
```

**Key Parameters:**
- **FM Synthesis:** Harmonicity 2, Modulation Index 12 for rich harmonics
- **Envelope:** Attack 0.02s, Decay 0.7s, Sustain 0.02, Release 1s
- **Filter:** Frequency-aware (4000-2000Hz), velocity-dependent (+2000Hz)
- **Reverb:** 15% wet, 1.5s decay
- **Velocity curve:** Quadratic (vel²) for natural dynamics

**Frequency-Aware Filtering:**
Low notes need higher cutoffs to preserve harmonics:
```typescript
// C3 (low) → 4000-6000Hz, C5 (high) → 2000-4000Hz
const baseCutoff = 4000 - (noteRatio * 2000);
const cutoff = baseCutoff + (velocity * 2000);
```

### 2. Basic Synth (FMSynth)

**Goal:** Simple, bright, classic synthesizer sound.

**Key Differences:**
- **Oscillator:** Triangle wave (simpler than FM)
- **Lower FM:** Modulation Index 3 (less complex)
- **Higher filter:** 4000-5000Hz (brighter)
- **Less reverb:** 5% wet (drier, more direct)

### 3. Acid Bass (MonoSynth)

**Goal:** TB-303-inspired squelchy bass with filter envelope sweep.

**Signal Chain:**
```
MonoSynth (with filter envelope) → External Filter → Reverb → Destination
```

**Key Parameters:**
- **Oscillator:** Sawtooth (harmonically rich)
- **Filter:** Q=4 (moderate resonance), -24dB rolloff
- **Filter Envelope:** baseFrequency 150Hz, octaves 3.0, decay 0.3s
  - Creates signature "wah" sweep on each note
- **Velocity:** Increases filter envelope sweep (1.2 octave boost)
- **Minimal reverb:** 5% wet (dry, direct sound)

**Why MonoSynth?**
Unlike FMSynth, MonoSynth has a built-in filter envelope that modulates cutoff frequency over time - essential for acid bass "squelch". The envelope sweeps from `baseFrequency` up by `octaves` and back down following ADSR shape.

## Technical Comparisons

| Feature | Warm Piano | Basic Synth | Acid Bass |
|---------|-----------|-------------|-----------|
| Synth Type | FMSynth | FMSynth | MonoSynth |
| Complexity | High FM | Low FM | Filter Envelope |
| Character | Warm, rich | Bright, simple | Squelchy, resonant |
| Filter Technique | Frequency-aware | Static high | Envelope sweep |
| Velocity Target | Filter cutoff | Filter cutoff | Envelope octaves |
| Reverb | 15% (spatial) | 5% (dry) | 5% (dry) |

## Velocity Response

All presets use quadratic velocity curve (vel²):
- Soft (0.5) → 0.25 actual volume
- Medium (0.7) → 0.49 actual volume  
- Hard (1.0) → 1.0 actual volume

This makes soft playing easier to control and mimics real instrument dynamics.

## Preset System Architecture

All parameters centralized in preset interfaces:

```typescript
type SynthPreset = FMSynthPreset | MonoSynthPreset;

interface FMSynthPreset {
  synthType: 'fm';
  synth: { harmonicity, modulationIndex, ... };
  filterMapping: { baseCutoffLow, baseCutoffHigh, velocityCutoffRange };
  // ...
}

interface MonoSynthPreset {
  synthType: 'mono';
  synth: { oscillator, envelope };
  filterEnvelope: { baseFrequency, octaves, ... };
  filterMapping: { velocityOctaveBoost };
  // ...
}
```

**Benefits:**
- Type-safe preset definitions
- Easy to add new presets
- Runtime preset switching
- Self-documenting

## Future Enhancements

- Additional synth types (AMSynth, PluckSynth)
- Sample-based instruments
- Per-note detuning for natural variation
- Sustain pedal support
- Effects per preset (distortion, chorus, etc.)
