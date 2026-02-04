# Code Patterns & Conventions

## TypeScript

- Use strict mode
- Prefer explicit types over inference for public APIs
- Use `type` for object shapes, `interface` for extensible contracts
- Export types from dedicated `types/` directory

## React

- Use functional components with hooks
- Prefer named exports over default exports for components
- Keep components small and focused (< 150 lines)
- Use composition over prop drilling
- Mark client components with `'use client';` at top

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `PianoKeyboard.tsx` |
| Hooks | camelCase with `use` prefix | `useAudio.ts` |
| Services | camelCase | `audio.ts` |
| Constants | UPPER_SNAKE_CASE | `MIDI_NOTE_ON` |
| Types | PascalCase | `MidiMessage` |

## File Organization

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

## Anti-Patterns to Avoid

| ❌ Avoid | ✅ Prefer |
|----------|----------|
| Global audio context without proper initialization | Encapsulated audio engine in service layer (singleton) |
| Playing audio without user gesture | User-initiated audio context start |
| Synchronous MIDI API calls | Async/await for MIDI operations |
| Large monolithic components | Component composition |
| Inline styles | Tailwind utility classes |
| Assuming MIDI works in all browsers | Browser feature detection with graceful fallbacks |
| Not handling `event.repeat` for keyboard input | Using `event.repeat` for key repeat prevention |
| Hooks that don't return success/failure from initialize | Boolean returns from async initialization functions |

## State Management Pattern

Use shared `Set<Note>` state for visual feedback across all input methods:

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

## Hook Initialization Pattern

Hooks that initialize resources should return `boolean` for success/failure:

```typescript
const initialize = async (): Promise<boolean> => {
  try {
    await doInit();
    return true;
  } catch {
    return false;
  }
};

// Callers can chain:
const audioOk = await initializeAudio();
if (audioOk) await initializeMidi();
```

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

## Development Workflow

1. **Feature Development**: Create branch → Develop → Test → PR
2. **Code Review**: Check types, patterns, tests
3. **Testing**: Run `npm test` before commit
4. **Browser Testing**: Always test MIDI in Chrome/Edge
5. **Commit Messages**: Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`)
