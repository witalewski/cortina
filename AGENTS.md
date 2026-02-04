# AI Agent Instructions for Cortina

## Project Overview
Cortina is a musical skills training application built with Next.js 16, React 19, and TypeScript. The current phase focuses on building an in-browser synthesizer with piano keyboard visualization, controllable via MIDI devices and computer keyboard.

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4
- **Audio**: Tone.js
- **MIDI**: Web MIDI API

### Directory Structure
```
app/
├── page.tsx              # Main synth page
├── layout.tsx            # Root layout
├── components/
│   ├── piano/           # Piano keyboard components
│   └── ui/              # Shared UI components
├── hooks/               # Custom React hooks
│   ├── useAudio.ts      # Audio engine interface
│   ├── useMidi.ts       # MIDI device handling
│   └── useKeyboard.ts   # Computer keyboard input
├── services/            # Core business logic
│   ├── audio.ts         # Tone.js audio engine
│   └── midi.ts          # Web MIDI API wrapper
└── types/               # TypeScript type definitions
    └── music.ts         # Music-related types (Note, Pitch, etc.)
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

### Naming Conventions
- **Components**: PascalCase (e.g., `PianoKeyboard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAudio.ts`)
- **Services**: camelCase (e.g., `audio.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MIDI_NOTE_ON`)
- **Types**: PascalCase (e.g., `MidiMessage`)

### File Organization
```typescript
// 1. Imports (external first, then internal)
import React from 'react';
import { Synth } from 'tone';
import { PianoKey } from '@/components/piano';

// 2. Types/Interfaces
type PianoKeyboardProps = {
  octaves: number;
};

// 3. Constants
const KEYS_PER_OCTAVE = 12;

// 4. Component/Function
export function PianoKeyboard({ octaves }: PianoKeyboardProps) {
  // ...
}
```

## Common Patterns

### Audio Initialization
Always wrap audio initialization in a user gesture:
```typescript
const startAudio = async () => {
  await Tone.start();
  // Initialize synth
};

<button onClick={startAudio}>Start</button>
```

### MIDI Access
Check for browser support before accessing MIDI:
```typescript
if (navigator.requestMIDIAccess) {
  const access = await navigator.requestMIDIAccess();
  // Handle MIDI
} else {
  // Show fallback message
}
```

### Keyboard Event Handling
Prevent key repeat for note triggers:
```typescript
const [pressedKeys, setPressedKeys] = useState(new Set<string>());

const handleKeyDown = (e: KeyboardEvent) => {
  if (pressedKeys.has(e.key)) return; // Already pressed
  setPressedKeys(prev => new Set(prev).add(e.key));
  // Trigger note
};
```

## Anti-Patterns

### ❌ Avoid
- Global audio context without proper initialization
- Playing audio without user gesture (violates browser policies)
- Synchronous MIDI API calls (always async)
- Large monolithic components (split piano, keys, controls)
- Inline styles (use Tailwind classes)

### ✅ Prefer
- Encapsulated audio engine in service layer
- User-initiated audio context start
- Async/await for MIDI operations
- Component composition
- Tailwind utility classes

## Testing Requirements

### Unit Tests
- Test pure functions (note conversions, MIDI parsing)
- Test hooks with `@testing-library/react-hooks`
- Mock Tone.js and Web MIDI API

### Integration Tests
- Test component interactions
- Test keyboard → audio pipeline
- Test MIDI → audio pipeline

### Manual Testing
- Test with actual MIDI devices
- Test in Chrome, Edge, Firefox, Safari
- Test keyboard input responsiveness

## Key Music Concepts

### MIDI Notes
- Middle C (C4) = MIDI note 60
- Each semitone = +1 MIDI note
- Range: 0-127

### Piano Key Layout (25 keys, C3-C5)
- White keys: C, D, E, F, G, A, B (7 per octave)
- Black keys: C#, D#, F#, G#, A# (5 per octave)
- Total: 2 octaves + 1 key = 25 keys

### Keyboard Mapping
- White keys: A S D F G H J K L ; ' [ ]
- Black keys: W E (gap) T Y U (gap) O P

## Development Workflow

1. **Feature Development**: Create branch → Develop → Test → PR
2. **Code Review**: Check types, patterns, tests
3. **Performance**: Monitor audio latency, render performance
4. **Browser Compat**: Test Web MIDI API support

## Resources

- [Tone.js Docs](https://tonejs.github.io/)
- [Web MIDI API Spec](https://webaudio.github.io/web-midi-api/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/)
