# Sound Design

This document describes the sound design goals, techniques, and implementation plan for Cortina's synthesizer.

## Goals

Transform the synthesizer from a "robotic, thin, metallic" sound to a warmer, more piano-like tone using pure synthesis techniques in Tone.js.

### Design Principles

1. **Warmth over accuracy** - We're not emulating a real piano, but creating a pleasant, musical sound
2. **Expressiveness** - Velocity should affect both volume AND timbre
3. **Spatial realism** - Sound should exist "in a room", not "in your head"
4. **Incremental improvement** - Each change should be audible and testable
5. **Future flexibility** - Architecture should allow adding sample-based instruments later

## Current Implementation

As of initial implementation:
- **Synth**: `Tone.PolySynth(Tone.Synth)` with triangle oscillator
- **Envelope**: attack 0.005, decay 0.1, sustain 0.3, release 1
- **Signal chain**: Synth → Destination (no processing)

### Known Issues
- Thin sound (no filtering)
- Harsh/clicking attack
- No spatial effects
- Static timbre regardless of velocity

---

## Implementation Plan

### Phase 1: Improve Envelope (warmth + realism)
- [x] Adjust attack to 0.02s (softens initial transient, removes click)
- [x] Increase decay to 0.3s (more natural fade-in to sustain)
- [x] Lower sustain to 0.15 (pianos don't sustain at full volume)
- [x] Keep release at 1s (already good)

**Expected result**: Softer, less harsh attack; more natural note evolution
**Status**: ✅ Complete

### Phase 2: Velocity Support (expressiveness)
- [ ] Verify velocity is properly passed through from all input sources
- [ ] Ensure MIDI velocity (0-127) is normalized to 0-1 range
- [ ] Verify keyboard input sends reasonable default velocity
- [ ] Test that volume responds to velocity

**Expected result**: Playing dynamics affect volume

### Phase 3: Add Lowpass Filter + Velocity-Dependent Timbre
- [ ] Add `Tone.Filter` to signal chain (lowpass, base cutoff ~1500Hz)
- [ ] Implement dynamic cutoff based on velocity (soft = mellow, hard = bright)
- [ ] Formula: cutoff = baseCutoff + (velocity * cutoffRange)
- [ ] This mimics how real pianos get brighter when hit harder

**Expected result**: Warmer base tone; harder playing reveals more brightness

### Phase 4: Switch to FMSynth (richer harmonics)
- [x] Replace `Tone.Synth` with `Tone.FMSynth` in PolySynth
- [x] Configure harmonicity ~2 and modulationIndex ~10
- [x] Add modulationEnvelope for dynamic timbre (bright attack → mellow sustain)

**Expected result**: Richer harmonic content, more complex timbre
**Status**: ✅ Complete

### Phase 5: Add Room Ambience (spatial realism)
- [x] Add `Tone.Reverb` with subtle settings (decay 1.5s, wet 0.2)
- [x] Simulate piano in a room rather than "in your head"
- [x] Keep it subtle to avoid muddiness

**Expected result**: Sound sits in a space, less "sterile"
**Status**: ✅ Complete

### Phase 6: Refactor for Extensibility
- [ ] Extract synth configuration into a `SynthPreset` type
- [ ] Create preset objects (e.g., `WARM_PIANO_PRESET`)
- [ ] Allow future swapping of entire sound source (prepares for samples)

### Phase 7: Documentation
- [ ] Document final parameter choices in this file
- [ ] Update architecture.md with audio pipeline changes
- [ ] Update api-reference.md if public API changes

---

## Technical Reference

### Target Signal Chain
```
FMSynth → Filter (lowpass, velocity-controlled) → Reverb → Destination
```

### Why These Techniques?

| Problem | Solution | Why it helps |
|---------|----------|--------------|
| Harsh attack | Longer attack time | Real piano hammers don't strike instantly |
| No dynamics | Velocity support | Expressiveness through playing intensity |
| Thin sound | Lowpass filter | Removes harsh digital harmonics |
| Static dynamics | Velocity → filter cutoff | Real pianos are brighter when hit harder |
| Static timbre | FM synthesis | Harmonics evolve over note duration |
| Sterile feel | Reverb | Piano naturally exists in acoustic space |

### Velocity-Dependent Timbre

Real pianos exhibit velocity-dependent brightness:
- **Soft playing (pp)**: Mellow, warm tone (fewer high harmonics)
- **Hard playing (ff)**: Bright, cutting tone (more high harmonics)

Implementation approach:
```typescript
// On each noteOn, calculate filter cutoff from velocity
const baseCutoff = 1500;  // Hz - mellow base tone
const cutoffRange = 3000; // Hz - how much brighter at max velocity
const cutoff = baseCutoff + (velocity * cutoffRange);
// Result: soft (vel=0.2) → 2100Hz, hard (vel=1.0) → 4500Hz
```

### Architecture for Future Sample Support

The `AudioEngine` will be refactored to support swappable sound sources:

```typescript
interface SoundSource {
  noteOn(note: Note, velocity: number): void;
  noteOff(note: Note): void;
  connect(destination: Tone.ToneAudioNode): void;
  dispose(): void;
}
```

This allows adding `@tonejs/piano` (Salamander Grand Piano samples) as an alternative without changing the effects chain or public API.

---

## Out of Scope (for now)

- Sample-based piano (@tonejs/piano)
- Per-note detuning
- Sustain pedal behavior
- String resonance / sympathetic vibration

---

## Changelog

*This section will be updated as phases are completed.*

| Date | Phase | Changes |
|------|-------|---------|
| 2026-02-04 | Phase 1 | Improved envelope: attack 0.02s, decay 0.7s, sustain 0.02, release 1s - softer attack, longer decay for fuller sound with continuous decay |
| 2026-02-04 | Phase 2 | Added velocity support: keyboard input passes velocity (0.7 default), MIDI velocity normalized 0-127→0-1 |
| 2026-02-04 | Phase 3 | Added lowpass filter + velocity-dependent cutoff: frequency-aware (low notes 4000-6000Hz, high notes 2000-4000Hz) for richer bass |
| 2026-02-04 | Phase 4 | Switched to FMSynth: harmonicity 2, modulationIndex 12, with modulationEnvelope - richer, more complex harmonics |
| 2026-02-04 | Phase 5 | Added reverb: decay 1.5s, wet 0.15 - spatial realism, sound sits in a room |
| 2026-02-04 | Tweaks | Quadratic velocity curve (vel²); frequency-dependent filter for rich bass; adjusted FM/reverb for clarity |
