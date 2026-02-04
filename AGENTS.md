# AI Agent Instructions for Cortina

## Project Overview
Cortina is a musical skills training application built with Next.js 16, React 19, and TypeScript. The synthesizer module is complete with piano keyboard visualization, controllable via MIDI devices and computer keyboard.

### Current Status ✅
- **Synthesizer**: Fully functional with Tone.js audio engine
- **Piano UI**: 25-key interactive keyboard (C3-C5)
- **MIDI Input**: Web MIDI API integration (Chrome/Edge only)
- **Keyboard Input**: Computer keyboard mapping
- **Testing**: Jest with 16+ unit tests

### Future Plans
- Musical training exercises
- Note recognition games
- Rhythm training
- Progress tracking

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4
- **Audio**: Tone.js v15
- **MIDI**: Web MIDI API
- **Testing**: Jest + React Testing Library

### Directory Structure
```
app/
├── page.tsx                    # Main synth page with all inputs
├── layout.tsx                  # Root layout with fonts
├── globals.css                 # Global styles
├── components/
│   └── piano/
│       ├── PianoKey.tsx        # Individual key (white/black)
│       ├── PianoKeyboard.tsx   # 25-key keyboard layout
│       └── index.ts            # Barrel export
├── hooks/
│   ├── useAudio.ts             # Audio engine React interface
│   ├── useMidi.ts              # MIDI device management
│   └── useKeyboard.ts          # Computer keyboard input
├── services/
│   ├── audio.ts                # Tone.js singleton engine
│   ├── midi.ts                 # Web MIDI API wrapper
│   └── __tests__/
│       └── audio.test.ts       # Audio service tests
└── types/
    └── music.ts                # Note, MidiNote, constants
```

## Existing Code Inventory

### Services (Singleton Pattern)

#### `audio.ts` - Audio Engine
```typescript
import { audioEngine } from '@/app/services/audio';

// Initialize (requires user gesture)
await audioEngine.initialize();

// Play notes
audioEngine.noteOn('C4', 0.8);      // Note string + velocity
audioEngine.noteOn(60, 0.8);        // MIDI number + velocity
audioEngine.noteOff('C4');

// State checks
audioEngine.isInitialized();
audioEngine.getContextState();       // 'running' | 'suspended'
audioEngine.dispose();
```

#### `midi.ts` - MIDI Service
```typescript
import { midiService } from '@/app/services/midi';

// Initialize (shows permission prompt)
const success = await midiService.initialize();

// Device management
midiService.getDevices();           // Returns MidiDevice[]
midiService.enableDevice(id);
midiService.enableAllDevices();

// Message handling
const unsubscribe = midiService.onMessage((msg) => {
  if (msg.type === 'noteon') playNote(msg.note, msg.velocity);
  if (msg.type === 'noteoff') stopNote(msg.note);
});
```

### Hooks

#### `useAudio()` - Audio React Integration
```typescript
const {
  isInitialized,    // boolean
  isInitializing,   // boolean
  error,            // string | null
  initialize,       // () => Promise<boolean>
  playNote,         // (note, velocity?) => void
  stopNote,         // (note) => void
} = useAudio();
```

#### `useMidi(options)` - MIDI React Integration
```typescript
const {
  isSupported,      // boolean (false in Firefox/Safari)
  isInitialized,    // boolean
  devices,          // MidiDevice[]
  error,            // string | null
  initialize,       // () => Promise<boolean>
  enableDevice,     // (id) => void
  refreshDevices,   // () => void
} = useMidi({
  onNoteOn: (note, velocity) => {},
  onNoteOff: (note) => {},
  autoEnable: true,
});
```

#### `useKeyboard(options)` - Keyboard Input
```typescript
useKeyboard({
  onNoteOn: (midiNote) => {},
  onNoteOff: (midiNote) => {},
  enabled: isAudioInitialized,  // Only enable after audio ready
});

// Keyboard mapping (25 keys, C3-C5):
// White: A S D F G H J K L ; '
// Black: W E T Y U O P [
```

### Components

#### `<PianoKeyboard />` - Main Piano UI
```typescript
<PianoKeyboard
  startNote={48}              // MIDI note number (C3)
  numKeys={25}                // Number of keys to display
  onNotePress={(note) => {}}  // Called on mouse/touch down
  onNoteRelease={(note) => {}}
  pressedNotes={pressedNotes} // Set<Note> for visual feedback
/>
```

#### `<PianoKey />` - Individual Key
```typescript
<PianoKey
  note="C4"
  color="white"               // 'white' | 'black'
  isPressed={false}
  onPress={(note) => {}}
  onRelease={(note) => {}}
  label="C4"                  // Optional label
/>
```

### Types (`app/types/music.ts`)
```typescript
type NoteName = 'C' | 'C#' | 'D' | ... | 'B';
type Octave = 0 | 1 | 2 | ... | 8;
type Note = `${NoteName}${Octave}`;  // e.g., 'C4', 'F#3'
type MidiNote = number;              // 0-127

const MIDI_NOTE_ON = 0x90;
const MIDI_NOTE_OFF = 0x80;
const MIDDLE_C_MIDI = 60;
const NOTES_PER_OCTAVE = 12;
```

## Code Style and Conventions

### TypeScript
- Use strict mode
- Prefer explicit types over inference for public APIs
- Use `type` for object shapes, `interface` for extensible contracts
- Export types from dedicated `types/` directory

### React
- Use functional components with hooks
- Prefer named exports over default exports for components
- Keep components small and focused (< 150 lines)
- Use composition over prop drilling
- Mark client components with `'use client';` at top

### Naming Conventions
- **Components**: PascalCase (e.g., `PianoKeyboard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAudio.ts`)
- **Services**: camelCase (e.g., `audio.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MIDI_NOTE_ON`)
- **Types**: PascalCase (e.g., `MidiMessage`)

### File Organization
```typescript
// 1. 'use client'; directive (if needed)
'use client';

// 2. Imports (external first, then internal)
import { useState, useCallback } from 'react';
import { PianoKey } from '@/app/components/piano';

// 3. Types/Interfaces
type Props = { ... };

// 4. Constants
const KEYS_PER_OCTAVE = 12;

// 5. Component/Function
export function PianoKeyboard({ ... }: Props) { ... }
```

## Important Lessons Learned

### Audio Initialization
**Always** wrap audio initialization in a user gesture. Browsers block audio without interaction:
```typescript
// ✅ Correct - triggered by button click
const handleStart = async () => {
  await Tone.start();
  await audioEngine.initialize();
};
<button onClick={handleStart}>Start</button>

// ❌ Wrong - will be blocked
useEffect(() => {
  audioEngine.initialize(); // Browser will block this
}, []);
```

### MIDI Browser Support
Web MIDI API only works in **Chrome and Edge**. Safari and Firefox don't support it:
```typescript
// Always check support first
if (!navigator.requestMIDIAccess) {
  setError('Web MIDI not supported. Use Chrome or Edge.');
  return;
}

// Then request access (shows permission prompt)
const access = await navigator.requestMIDIAccess();
```

### Keyboard Key Repeat Prevention
Use `event.repeat` property - it's more reliable than tracking pressed keys:
```typescript
const handleKeyDown = (event: KeyboardEvent) => {
  // ✅ Best approach - use browser's repeat flag
  if (event.repeat) {
    event.preventDefault();
    return;
  }
  
  // Also keep a ref as backup
  if (pressedKeysRef.current.has(event.key)) return;
  
  pressedKeysRef.current.add(event.key);
  playNote(keyToMidi[event.key]);
};
```

### Hook Initialization Return Values
Hooks that initialize resources should return `boolean` for success/failure:
```typescript
// ✅ Correct
const initialize = async (): Promise<boolean> => {
  try {
    await doInit();
    return true;
  } catch {
    return false;
  }
};

// Then callers can chain:
const audioOk = await initializeAudio();
if (audioOk) await initializeMidi();
```

### Pressed Notes State Management
Use a shared `Set<Note>` state for visual feedback across all input methods:
```typescript
const [pressedNotes, setPressedNotes] = useState<Set<Note>>(new Set());

const handleNotePress = useCallback((note: Note | MidiNote) => {
  playNote(note);
  const noteStr = typeof note === 'number' ? midiToNote(note) : note;
  setPressedNotes(prev => new Set(prev).add(noteStr));
}, [playNote]);

// Pass to keyboard for visual feedback
<PianoKeyboard pressedNotes={pressedNotes} ... />
```

## Anti-Patterns

### ❌ Avoid
- Global audio context without proper initialization
- Playing audio without user gesture (violates browser policies)
- Synchronous MIDI API calls (always async)
- Large monolithic components (split piano, keys, controls)
- Inline styles (use Tailwind classes)
- Assuming MIDI works in all browsers
- Not handling `event.repeat` for keyboard input
- Hooks that don't return success/failure from initialize

### ✅ Prefer
- Encapsulated audio engine in service layer (singleton)
- User-initiated audio context start
- Async/await for MIDI operations
- Component composition
- Tailwind utility classes
- Browser feature detection with graceful fallbacks
- Using `event.repeat` for key repeat prevention
- Boolean returns from async initialization functions

## Testing

### Commands
```bash
npm test           # Run all tests
npm test:watch     # Watch mode
npm run dev        # Start dev server (port 3000)
npm run build      # Production build
npm run lint       # ESLint
```

### Unit Testing Approach
Mock external dependencies (Tone.js, Web MIDI API):
```typescript
jest.mock('tone', () => ({
  start: jest.fn().mockResolvedValue(undefined),
  PolySynth: jest.fn(() => ({
    triggerAttack: jest.fn(),
    triggerRelease: jest.fn(),
    toDestination: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
  })),
  context: { state: 'running' },
}));
```

### Manual Testing Checklist
- [ ] Audio plays on button/key press
- [ ] Visual feedback on piano keys
- [ ] MIDI device connects (Chrome/Edge)
- [ ] Computer keyboard input works
- [ ] No stuck notes on key release
- [ ] No key repeat issues on long press
- [ ] Graceful error handling

## Key Music Concepts

### MIDI Notes
- Middle C (C4) = MIDI note 60
- Each semitone = +1 MIDI note
- Range: 0-127
- MIDI note to Note: `octave = floor(midi / 12) - 1`

### Piano Key Layout (25 keys, C3-C5)
- White keys: C, D, E, F, G, A, B (7 per octave)
- Black keys: C#, D#, F#, G#, A# (5 per octave)
- Total: 2 octaves + 1 key = 25 keys

### Computer Keyboard Mapping
```
Black keys:  W  E     T  Y  U     O  P  [
            C# D#    F# G# A#    C# D# F#
White keys: A  S  D  F  G  H  J  K  L  ;  '
            C  D  E  F  G  A  B  C  D  E  F
            |------ Octave 3 ------|-- Octave 4 --|
```

## Development Workflow

1. **Feature Development**: Create branch → Develop → Test → PR
2. **Code Review**: Check types, patterns, tests
3. **Testing**: Run `npm test` before commit
4. **Browser Testing**: Always test MIDI in Chrome/Edge
5. **Commit Messages**: Use conventional commits (`feat:`, `fix:`, `docs:`)

## Resources

- [Tone.js Docs](https://tonejs.github.io/)
- [Web MIDI API Spec](https://webaudio.github.io/web-midi-api/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/)
- [Jest Testing](https://jestjs.io/)
