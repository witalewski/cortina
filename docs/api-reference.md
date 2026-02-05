# API Reference

## Services

### `audioEngine` (audio.ts)

Singleton Tone.js audio engine with preset-based configuration.

```typescript
import { audioEngine, type SynthPreset, WARM_PIANO_PRESET } from '@/app/services/audio';

// Initialize (requires user gesture)
await audioEngine.initialize();

// Play notes
audioEngine.noteOn('C4', 0.8);      // Note string + velocity
audioEngine.noteOn(60, 0.8);        // MIDI number + velocity
audioEngine.noteOff('C4');

// State checks
audioEngine.isInitialized();        // boolean
audioEngine.getContextState();      // 'running' | 'suspended'

// Cleanup
audioEngine.dispose();
```

**SynthPreset Types:**
```typescript
type SynthPreset = FMSynthPreset | MonoSynthPreset;

interface FMSynthPreset {
  name: string;
  synthType: 'fm';
  synth: {
    harmonicity: number;
    modulationIndex: number;
    oscillator: { type: 'sine' | 'square' | 'sawtooth' | 'triangle' };
    envelope: { attack, decay, sustain, release };
    modulation: { type: 'sine' | 'square' | 'sawtooth' | 'triangle' };
    modulationEnvelope: { attack, decay, sustain, release };
  };
  filter: {
    type: 'lowpass' | 'highpass' | 'bandpass';
    frequency: number;
    Q: number;
    rolloff: -12 | -24 | -48 | -96;
  };
  filterMapping: {
    baseCutoffLow: number;    // Hz - for low notes
    baseCutoffHigh: number;   // Hz - for high notes
    velocityCutoffRange: number; // Hz - velocity modulation
  };
  reverb: {
    decay: number;
    preDelay: number;
    wet: number;
  };
}

interface MonoSynthPreset {
  name: string;
  synthType: 'mono';
  synth: {
    oscillator: { type: 'sine' | 'square' | 'sawtooth' | 'triangle' };
    envelope: { attack, decay, sustain, release };
  };
  filter: {
    type: 'lowpass' | 'highpass' | 'bandpass';
    frequency: number;
    Q: number;
    rolloff: -12 | -24 | -48 | -96;
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
  reverb: {
    decay: number;
    preDelay: number;
    wet: number;
  };
}

interface SamplerPreset extends BaseSynthPreset {
  synthType: 'sampler';
  sampleMap: Record<string, string>; // Note name → CDN URL
}

type SynthPreset = FMSynthPreset | MonoSynthPreset | SamplerPreset;
```

**Available Presets:**
- `WARM_PIANO_PRESET` (FMSynthPreset) - Rich, expressive piano sound
- `BASIC_SYNTH_PRESET` (FMSynthPreset) - Simple, bright synthesizer
- `ACID_BASS_PRESET` (MonoSynthPreset) - TB-303-inspired squelchy bass
- `SAMPLED_PIANO_PRESET` (SamplerPreset) - Realistic acoustic piano with CDN samples

**Preset Switching:**
```typescript
// Instant switching for synth presets
audioEngine.setPreset(ACID_BASS_PRESET);
audioEngine.getPresetName(); // "Acid Bass"

// Async switching for sampler presets (loads samples)
await audioEngine.setPreset(SAMPLED_PIANO_PRESET);
audioEngine.isPresetLoading(); // false when done
```

**Loading State:**
```typescript
// Check if a preset is currently loading
audioEngine.isPresetLoading(); // boolean
```

### `midiService` (midi.ts)

Web MIDI API wrapper with device management.

```typescript
import { midiService } from '@/app/services/midi';

// Initialize (shows permission prompt)
const success = await midiService.initialize();

// Device management
midiService.getDevices();           // MidiDevice[]
midiService.enableDevice(id);
midiService.enableAllDevices();

// Message handling
const unsubscribe = midiService.onMessage((msg) => {
  if (msg.type === 'noteon') playNote(msg.note, msg.velocity);
  if (msg.type === 'noteoff') stopNote(msg.note);
});

// Device change events (connect/disconnect)
const unsubscribe = midiService.onDeviceChange((devices) => {
  console.log('Devices changed:', devices);
});
```

---

## Hooks

### `useAudio()`

React integration for audio engine.

```typescript
const {
  isInitialized,    // boolean
  isInitializing,   // boolean
  error,            // string | null
  initialize,       // () => Promise<boolean>
  playNote,         // (note: Note | MidiNote, velocity?: number) => void
  stopNote,         // (note: Note | MidiNote) => void
} = useAudio();
```

### `useMidi(options)`

React integration for MIDI devices.

```typescript
const {
  isSupported,      // boolean (false in Firefox/Safari)
  isInitialized,    // boolean
  devices,          // MidiDevice[]
  error,            // string | null
  initialize,       // () => Promise<boolean>
  enableDevice,     // (id: string) => void
  refreshDevices,   // () => void
} = useMidi({
  onNoteOn: (note: MidiNote, velocity: number) => {},
  onNoteOff: (note: MidiNote) => {},
  autoEnable: true, // Auto-enable all devices on connect
});
```

### `useKeyboard(options)`

Computer keyboard to MIDI mapping.

```typescript
useKeyboard({
  onNoteOn: (midiNote: MidiNote) => {},
  onNoteOff: (midiNote: MidiNote) => {},
  enabled: boolean,  // Only enable after audio ready
});
```

**Keyboard mapping (25 keys, C3-C5):**
- White keys: `A S D F G H J K L ; '`
- Black keys: `W E T Y U O P [`

---

## Components

### `<PianoKeyboard />`

Main piano keyboard UI component.

```typescript
import { PianoKeyboard } from '@/app/components/piano';

<PianoKeyboard
  startNote={48}                    // MIDI note number (C3)
  numKeys={25}                      // Number of keys to display
  onNotePress={(note: Note) => {}}  // Mouse/touch down
  onNoteRelease={(note: Note) => {}}
  pressedNotes={Set<Note>}          // For visual feedback
/>
```

### `<PianoKey />`

Individual piano key (used internally by PianoKeyboard).

```typescript
import { PianoKey } from '@/app/components/piano';

<PianoKey
  note="C4"                         // Note name
  color="white"                     // 'white' | 'black'
  isPressed={false}                 // Visual pressed state
  onPress={(note: Note) => {}}
  onRelease={(note: Note) => {}}
  label="C4"                        // Optional label on key
/>
```

---

## Types (app/types/music.ts)

```typescript
// Note names
type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
type Octave = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type Note = `${NoteName}${Octave}`;  // e.g., 'C4', 'F#3'

// MIDI
type MidiNote = number;              // 0-127

// Constants
const MIDI_NOTE_ON = 0x90;
const MIDI_NOTE_OFF = 0x80;
const MIDDLE_C_MIDI = 60;
const NOTES_PER_OCTAVE = 12;

// Interfaces
interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
}

interface MidiMessage {
  type: 'noteon' | 'noteoff' | 'controlchange';
  note: MidiNote;
  velocity: number;
  channel: number;
}
```

---

## Interval Types (app/types/intervals.ts)

```typescript
type IntervalName = 'unison' | 'minor 2nd' | 'major 2nd' | 'minor 3rd' | 
                    'major 3rd' | 'perfect 4th' | 'diminished 5th' | 
                    'perfect 5th' | 'perfect octave';

type IntervalDirection = 'ascending' | 'descending' | 'none';

interface Interval {
  name: IntervalName;
  semitones: number;
  shortName: string;
}

interface IntervalChallenge {
  interval: Interval;
  direction: IntervalDirection;
  rootNote: Note;
  rootMidi: MidiNote;
  targetNote: Note;
  targetMidi: MidiNote;
  displayName: string;
}

// INTERVALS constant - all 9 intervals with semitone mappings
const INTERVALS: Record<IntervalName, Interval>;
```

### Interval Utilities

```typescript
import { 
  calculateTargetNote,
  calculateInterval,
  generateIntervalPool,
  selectRandomChallenges,
  getIntervalDisplayName
} from '@/app/types/intervals';

// Calculate target note from root + interval + direction
calculateTargetNote(rootMidi: number, semitones: number, direction: IntervalDirection)
// Returns: { midi: number, note: Note }

// Detect interval from two MIDI notes
calculateInterval(firstMidi: number, secondMidi: number)
// Returns: { interval: Interval, direction: IntervalDirection } | null

// Generate all possible interval challenges (17 total)
generateIntervalPool(rootMidi?: number)
// Returns: IntervalChallenge[]

// Select N unique random challenges from pool
selectRandomChallenges(pool: IntervalChallenge[], count: number)
// Returns: IntervalChallenge[]

// Format interval for display
getIntervalDisplayName(interval: Interval, direction: IntervalDirection)
// Returns: string (e.g., "Perfect 5th (ascending)")
```

---

## Lesson Hooks

### `useIntervalLesson()`

Manages lesson state for interval training.

```typescript
const {
  currentChallenge,      // IntervalChallenge | null
  challengeIndex,        // number (0-4)
  attempts,              // number (0-7)
  isComplete,            // boolean
  score,                 // LessonScore | null
  shouldRevealName,      // boolean (true after 3 fails)
  shouldShowHints,       // boolean (true after 4 fails)
  startLesson,           // () => void
  submitAnswer,          // (rootNote: Note, targetNote: Note) => { correct, isLastAttempt }
  moveToNextChallenge,   // () => void
  resetLesson,           // () => void
} = useIntervalLesson();
```

### `useIntervalPlayback(options)`

Plays intervals as two sequential notes.

```typescript
const {
  isPlaying,             // boolean
  playInterval,          // (challenge: IntervalChallenge) => Promise<void>
} = useIntervalPlayback({
  playNote,              // (note: Note, velocity?: number) => void
  stopNote,              // (note: Note) => void
  onNotePlayed,          // Optional: (note: Note) => void for visual feedback
});
```

---

## Learn Mode Components

### `<LessonCard />`

Card for lesson list page.

```typescript
<LessonCard
  title="Intervals"
  description="Learn to recognize musical intervals"
  href="/learn/lesson-1-intervals"
  status="available" | "locked" | "completed"
/>
```

### `<ChallengePrompt />`

Displays instruction and inline feedback.

```typescript
<ChallengePrompt
  isPlaying={boolean}              // Show "Listen..." state
  attempts={number}
  shouldRevealName={boolean}
  intervalName={string}
  feedbackState={'correct' | 'incorrect' | 'final-fail' | null}
  onReplay={() => void}
/>
```

### `<AttemptIndicator />`

Visual dots for attempt tracking.

```typescript
<AttemptIndicator attempts={number} maxAttempts={number} />
```

### `<LessonProgress />`

Progress indicator (1/5, 2/5, etc).

```typescript
<LessonProgress current={number} total={number} />
```

### `<LessonSummary />`

End-of-lesson score display.

```typescript
<LessonSummary
  score={LessonScore}
  onBack={() => void}
  onRetry={() => void}
/>
```
