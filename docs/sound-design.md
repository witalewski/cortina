# Sound Design

This document describes the sound design philosophy and implementation for Cortina's synthesizer.

## Design Principles

1. **Warmth over accuracy** - We're not emulating a real piano, but creating a pleasant, musical sound
2. **Expressiveness** - Velocity affects both volume AND timbre
3. **Spatial realism** - Sound exists "in a room", not "in your head"
4. **Future flexibility** - Architecture allows adding sample-based instruments later

## Current Implementation

The synthesizer uses the `WARM_PIANO_PRESET` configuration defined in `app/services/audio.ts`.

### Signal Chain

```
FMSynth → Filter (lowpass, velocity-controlled) → Reverb → Destination
```

### Components

**1. FM Synthesis**
- Type: `Tone.PolySynth(Tone.FMSynth)`
- Harmonicity: 2 (modulator 2x carrier frequency)
- Modulation index: 12 (controls harmonic richness)
- Oscillators: Sine waves (carrier and modulator)
- Provides rich, evolving harmonics

**2. Envelope**
- Attack: 0.02s (soft, natural onset)
- Decay: 0.7s (fuller sound, gives notes body)
- Sustain: 0.02 (continuous decay like real piano)
- Release: 1s (natural fade-out)
- Modulation envelope: Separate envelope for FM timbre evolution

**3. Lowpass Filter**
- Type: Lowpass, -24dB/octave rolloff
- **Frequency-aware**: Preserves harmonics based on pitch
  - Low notes (C3): 4000-6000Hz cutoff range
  - High notes (C5): 2000-4000Hz cutoff range
  - Linear interpolation between
- **Velocity-dependent**: +2000Hz range from velocity
  - Soft playing → mellow, warm tone
  - Hard playing → bright, cutting tone

**4. Reverb**
- Decay: 1.5s (room simulation)
- Pre-delay: 0.01s
- Wet mix: 15% (subtle, doesn't muddy the sound)
- Creates spatial depth

**5. Velocity Response**
- Curve: Quadratic (vel²)
  - Soft (0.5) → 0.25 actual volume
  - Medium (0.7) → 0.49 actual volume
  - Hard (1.0) → 1.0 actual volume
- Makes soft playing easier to control, mimics real piano dynamics

## Technical Details

### Why These Techniques?

| Problem | Solution | Why it helps |
|---------|----------|--------------|
| Harsh attack | Longer attack time (0.02s) | Real piano hammers don't strike instantly |
| Thin sound | Lowpass filter | Removes harsh digital harmonics |
| Muted bass | Frequency-aware filtering | Low notes preserve more harmonics |
| Static dynamics | Velocity → filter cutoff | Real pianos are brighter when hit harder |
| Robotic feel | FM synthesis + modulation envelope | Harmonics evolve over note duration |
| Sterile sound | Reverb | Piano naturally exists in acoustic space |
| Linear dynamics | Quadratic velocity curve | Natural piano response |

### Frequency-Aware Filtering

Low notes on real pianos are very rich with harmonics. The filter compensates:

```typescript
// Calculate note position (C3=0, C5=1)
const noteRatio = (midiNote - 36) / 36;
const noteRatioClamped = Math.max(0, Math.min(1, noteRatio));

// Interpolate cutoff frequency
const baseCutoff = 4000 - (noteRatioClamped * 2000); // 4000→2000Hz

// Add velocity modulation
const cutoff = baseCutoff + (velocity * 2000);
```

This ensures bass notes stay rich and full while high notes remain clear.

## Architecture

### Preset System

All sound parameters are centralized in the `SynthPreset` interface:

```typescript
interface SynthPreset {
  name: string;
  synth: { /* FM synthesis parameters */ };
  filter: { /* filter configuration */ };
  filterMapping: { /* frequency-aware mapping */ };
  reverb: { /* spatial effects */ };
}
```

Current preset: `WARM_PIANO_PRESET` (exported from `audio.ts`)

**Benefits:**
- All parameters in one place
- Easy to create alternative sounds
- Supports future preset switching
- Self-documenting

### Future Enhancements

**Sample-Based Piano:**
The architecture could be extended with a `SoundSource` interface to support sample-based instruments like `@tonejs/piano` (Salamander Grand Piano) without changing the effects chain or public API.

**Additional Ideas:**
- Per-note detuning for natural variation
- Sustain pedal support
- String resonance simulation
- Alternative presets (electric piano, organ, etc.)

## Result

The synthesizer produces a warm, expressive piano-like sound with:
- ✅ Natural dynamics and velocity response
- ✅ Rich, full bass tones
- ✅ Clear, bright treble
- ✅ Spatial depth from reverb
- ✅ Evolving harmonics from FM synthesis

All achieved using pure synthesis in Tone.js, with no external samples required.
