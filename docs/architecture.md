# Architecture

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16 |
| UI | React | 19 |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS | 4 |
| Audio | Tone.js | 15 |
| MIDI | Web MIDI API | Native |
| Testing | Jest + React Testing Library | - |

## Directory Structure

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

## System Overview

### Data Flow

```
User Input → Hook → Service → Audio Output
    ↓
  Visual Feedback (pressedNotes state)
```

### Input Sources

1. **Mouse/Touch** → PianoKeyboard component → callbacks
2. **MIDI Device** → useMidi hook → Web MIDI API
3. **Computer Keyboard** → useKeyboard hook → DOM events

### Audio Pipeline

```
Note Event → audioEngine.noteOn(note, velocity)
                    ↓
              Tone.js PolySynth
                    ↓
              Web Audio API
                    ↓
                 Speaker
```

## Design Decisions

### Singleton Services
Audio and MIDI services use singleton pattern to ensure single instance across the app. This prevents multiple audio contexts and MIDI connections.

### Hook Abstraction
React hooks wrap services to provide:
- React state management
- Lifecycle handling (cleanup on unmount)
- Consistent API for components

### Component Composition
Piano keyboard is split into:
- `PianoKey` - individual key rendering and interaction
- `PianoKeyboard` - layout logic and key arrangement

This allows future customization (different key sizes, layouts, etc).
