# Sound Design

This document describes the sound design philosophy and implementation for Cortina's synthesizer.

## Design Principles

1. **Warmth over accuracy** - We're not emulating real instruments exactly, but creating pleasant, musical sounds
2. **Expressiveness** - Velocity affects both volume AND timbre
3. **Spatial realism** - Sound exists "in a room", not "in your head"
4. **Diverse palette** - Multiple presets for different musical styles
5. **Hybrid approach** - Mix of synthesis and sampled instruments for flexibility

## Architecture: Multi-Synth System

The synthesizer supports multiple sound sources through a preset system:

- **FM Synthesis** (`FMSynth`) - For rich, evolving sounds like piano
- **Mono Synthesis** (`MonoSynth`) - For classic analog sounds with filter envelopes
- **Sampled Instruments** (`Sampler`) - For realistic acoustic sounds with lazy loading

Each preset specifies its source type and configuration, allowing diverse sound palettes within one engine.

## Default Instrument

**Sampled Piano** is the default instrument, providing realistic acoustic piano sound immediately on load. The samples (~3MB) download automatically when the audio engine initializes, and are cached by the browser for subsequent visits.

## Presets

### 1. Sampled Piano (Sampler) - DEFAULT

**Goal:** Realistic acoustic piano sound using actual piano recordings.

**Signal Chain:**
```
Sampled Piano (18 samples) → Subtle Filter → Moderate Reverb → Output
```

**Key Features:**
- Real piano samples from tonejs-instrument-piano-mp3 CDN
- 18 strategically placed samples (C, E, G across 6 octaves)
- Tone.js pitch-shifts between sampled notes for seamless playback
- ~3MB download size, browser-cached
- Minimal processing preserves natural piano sound
- Single-velocity layer with velocity response

**Why It Works:**
- Authentic piano timbre and resonance
- Natural attack and decay characteristics
- Realistic sustain and release
- Browser caching eliminates repeated downloads

### 2. Warm Piano (FMSynth)

**Goal:** Piano-like warmth and expressiveness using synthesis.

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

### 4. Sampled Piano (Sampler)

**Goal:** Realistic acoustic piano sound using real instrument samples.

**Signal Chain:**
```
Sampler → Filter (subtle) → Reverb → Destination
```

**Key Parameters:**
- **Sample Source:** CDN-hosted piano samples (tonejs-instrument-piano-mp3)
- **Sample Strategy:** Every 3rd note (C, E, G) - Tone.js pitch-shifts between
- **Download Size:** ~2-3MB on first load (cached by browser afterward)
- **Filter:** Very subtle (8000Hz cutoff) - samples already sound realistic
- **Reverb:** 12% wet for moderate room ambience
- **Loading:** Asynchronous with UI indicator during download

**Sample Mapping:**
18 carefully selected notes from C1-G6 provide full keyboard coverage. Tone.js automatically pitch-shifts intermediate notes for seamless playback.

**Why Sampler?**
Sampled instruments provide the most realistic sound but require downloading audio files. We use lazy loading - samples only download when the user selects this instrument. Browser caching ensures samples only download once per device.

## Technical Comparisons

| Feature | Warm Piano | Basic Synth | Acid Bass | Sampled Piano |
|---------|-----------|-------------|-----------|---------------|
| Source Type | FMSynth | FMSynth | MonoSynth | Sampler |
| Complexity | High FM | Low FM | Filter Envelope | Real samples |
| Character | Warm, rich | Bright, simple | Squelchy, resonant | Realistic acoustic |
| Filter Technique | Frequency-aware | Static high | Envelope sweep | Minimal (bypass) |
| Velocity Target | Filter cutoff | Filter cutoff | Envelope octaves | Sample playback |
| Reverb | 15% (spatial) | 5% (dry) | 5% (dry) | 12% (room) |
| Download Size | 0 bytes | 0 bytes | 0 bytes | ~3MB (cached) |
| Loading Time | Instant | Instant | Instant | 1-3 seconds |

## Velocity Response

All presets use quadratic velocity curve (vel²):
- Soft (0.5) → 0.25 actual volume
- Medium (0.7) → 0.49 actual volume  
- Hard (1.0) → 1.0 actual volume

This makes soft playing easier to control and mimics real instrument dynamics.

## Preset System Architecture

All parameters centralized in preset interfaces:

```typescript
type SynthPreset = FMSynthPreset | MonoSynthPreset | SamplerPreset;

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

interface SamplerPreset {
  synthType: 'sampler';
  sampleMap: Record<string, string>; // Note → CDN URL
  // No filterMapping - samples are realistic as-is
}
```

**Benefits:**
- Type-safe preset definitions
- Easy to add new presets
- Runtime preset switching with async loading support
- Self-documenting

## Lazy Loading for Sampled Instruments

Sampled instruments use asynchronous loading to avoid blocking app startup:

1. **User selects sampled instrument** → UI shows loading indicator
2. **Sampler creates audio nodes** → Begins downloading samples from CDN
3. **Browser caches files** → Subsequent loads are instant
4. **Loading completes** → UI updates, instrument ready to play

This ensures synthesized instruments work instantly while sampled instruments load on demand.

## Future Enhancements

- Additional synth types (AMSynth, PluckSynth)
- More sampled instruments (guitar, strings, brass)
- Multi-velocity layer sampling
- Per-note detuning for natural variation
- Sustain pedal support
- Effects per preset (distortion, chorus, etc.)
