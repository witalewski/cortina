# Acid Bass Preset Implementation Plan

## Goal
Create an "Acid Bass" preset inspired by the Roland TB-303 sound - the iconic squelchy, resonant bass synthesizer used in acid house music. We're not aiming for exact emulation, but capturing the essence of the acid aesthetic with Tone.js.

## Key TB-303 Sound Characteristics
1. **Sawtooth or square waveform** - raw, harmonically rich
2. **Resonant lowpass filter** - high Q creates the "squelch"
3. **Filter envelope sweep** - the signature "wah" movement
4. **Short, punchy envelope** - decay-focused, minimal sustain
5. **Accent** - velocity increases filter intensity

## Technical Challenge
Our current architecture uses `FMSynth` wrapped in `PolySynth`, which lacks a filter envelope. The TB-303 sound fundamentally requires filter cutoff modulation over time.

**Solution**: Tone.js `MonoSynth` has a built-in filter envelope with `baseFrequency` and `octaves` parameters - perfect for acid bass.

## Architectural Decision
We need to choose between:

**Option A: Multiple synth types in AudioEngine**
- Extend SynthPreset to specify synth type (FMSynth vs MonoSynth)
- AudioEngine creates appropriate synth based on preset
- More flexible, supports diverse sounds
- More complex code

**Option B: Keep single synth type, simulate filter envelope**
- Use Tone.js automation to manually sweep filter on noteOn
- Less accurate but simpler
- Maintains current architecture

**Recommended: Option A** - The acid sound fundamentally needs a filter envelope. Supporting multiple synth types makes the preset system genuinely flexible for future sounds.

---

## Implementation Plan

### Phase 1: Extend Preset System Architecture
- [ ] Add `synthType` field to SynthPreset interface ('fm' | 'mono')
- [ ] Add MonoSynth-specific config (filterEnvelope with baseFrequency, octaves)
- [ ] Keep backward compatibility for existing FM presets

### Phase 2: Update AudioEngine
- [ ] Refactor synth creation to handle multiple types
- [ ] For MonoSynth: use PolySynth<MonoSynth> wrapper
- [ ] Update noteOn/noteOff to work with both synth types
- [ ] Update setPreset() to recreate correct synth type

### Phase 3: Create Acid Bass Preset
- [ ] Sawtooth oscillator
- [ ] High resonance filter (Q: 6-8)
- [ ] Filter envelope: low baseFrequency (~100Hz), high octaves (3-4)
- [ ] Short punchy amplitude envelope
- [ ] Velocity mapped to filter envelope intensity
- [ ] Minimal/no reverb (dry, direct sound)

### Phase 4: Testing & Tuning
- [ ] Verify preset switching between FM and Mono types works
- [ ] Tune acid parameters by ear
- [ ] Test velocity response
- [ ] Update tests for new architecture

### Phase 5: Documentation
- [ ] Update sound-design.md with acid preset details
- [ ] Update api-reference.md with new preset interface
- [ ] Document synth type architecture decision

---

## Acid Bass Preset Draft Parameters

```typescript
const ACID_BASS_PRESET: SynthPreset = {
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
    Q: 8,           // High resonance for squelch
    rolloff: -24    // Steep 4-pole like TB-303
  },
  filterEnvelope: {
    attack: 0.005,
    decay: 0.3,
    sustain: 0.2,
    release: 0.1,
    baseFrequency: 150,  // Low starting point
    octaves: 3.5         // Wide sweep range
  },
  filterMapping: {
    // Velocity increases filter envelope intensity
    velocityOctaveBoost: 1.5  // Harder hit = more squelch
  },
  reverb: {
    decay: 0.5,
    preDelay: 0.01,
    wet: 0.05  // Very dry - acid bass is direct
  }
};
```

---

## Design Decisions (User Input)

- **Polyphony**: Yes - keep playable, use PolySynth<MonoSynth>
- **Distortion**: No - keep signal chain simple for now
- **Glide/Portamento**: No - not implementing slide

This keeps architectural changes minimal while still achieving the acid filter envelope sound.

---

## Questions for User

~~1. **Polyphony**: TB-303 is monophonic. Should Acid Bass preset be mono (one note at a time) or allow polyphony? Mono is more authentic but polyphony is more playable.~~

~~2. **Distortion**: Classic acid often adds distortion for extra bite. Should we add a distortion effect to the signal chain (would need to extend architecture)?~~

~~3. **Glide/Portamento**: TB-303 has signature "slide" between notes. Add portamento option to the preset? (Tone.js MonoSynth supports this)~~
