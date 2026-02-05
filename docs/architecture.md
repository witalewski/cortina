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
         Apply velocity curve (vel²)
                    ↓
    Calculate frequency-dependent filter cutoff
                    ↓
           Tone.js PolySynth (FMSynth)
                    ↓
        Lowpass Filter (velocity-controlled)
                    ↓
              Reverb (15% wet)
                    ↓
            Web Audio API
                    ↓
               Speaker
```

**Signal chain details:**
- **FMSynth**: Frequency modulation synthesis for rich harmonics
- **Filter**: Lowpass, frequency-aware (low notes 4000-6000Hz, high notes 2000-4000Hz)
- **Reverb**: Room simulation (decay 1.5s, 15% wet)
- **Velocity curve**: Quadratic (vel²) for natural dynamics

## Design Decisions

### Singleton Services
Audio and MIDI services use singleton pattern to ensure single instance across the app. This prevents multiple audio contexts and MIDI connections.

### Preset-Based Sound Design
Audio engine uses a `SynthPreset` configuration system:
- All synth parameters in one exportable object
- Easy to create alternative sounds
- Supports future preset switching

See `docs/sound-design.md` for details on current sound design.

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

## Learn Mode Architecture

Learn mode provides interactive music training exercises. The key architectural concept is the **LessonMode** state machine.

### Directory Structure (Learn Mode)

```
app/
├── (modes)/learn/
│   ├── page.tsx                    # Lesson list
│   └── lesson-1-intervals/
│       └── page.tsx                # Intervals lesson
├── components/learn/
│   ├── index.ts                    # Barrel export
│   ├── ChallengePrompt.tsx         # Instruction/feedback display
│   ├── AttemptIndicator.tsx        # Visual attempt counter
│   ├── LessonProgress.tsx          # 1/5, 2/5, etc.
│   ├── LessonSummary.tsx           # End-of-lesson score
│   └── LessonCard.tsx              # Lesson list item
├── hooks/
│   ├── useIntervalLesson.ts        # Lesson state management
│   └── useIntervalPlayback.ts      # Interval audio playback
└── types/
    └── intervals.ts                # Interval types & utilities
```

### LessonMode State Machine

The LessonMode is the single source of truth for input control:

```
type LessonMode = 'input' | 'output';
```

- **INPUT mode**: User can play piano (keyboard, MIDI, mouse, touch)
- **OUTPUT mode**: System is playing or showing feedback (all input blocked)

```
┌─────────────────────────────────────────────────────────────────┐
│                     STATE TRANSITIONS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Challenge Start]                                               │
│       ↓                                                          │
│  OUTPUT ──(play interval)──► INPUT ──(user plays 2nd note)──►   │
│       ↑                                                          │
│       │                  ┌──────────────────────────────┐        │
│       │                  │  OUTPUT (show feedback)      │        │
│       │                  └──────────────────────────────┘        │
│       │                           │                              │
│       │         correct/max fails │          wrong               │
│       │                  ↓        │             │                │
│       │         [Next Challenge]  └──(replay)───┘                │
│       │                  │                                       │
│       └──────────────────┘                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Implementation Pattern

```typescript
// All input goes through one handler
const handleNotePress = useCallback((note: Note) => {
  if (lessonMode !== 'input') return; // CRITICAL: Block when not in input mode
  // ... process note
}, [lessonMode]);

// Connect to ALL input sources
useKeyboard({ onNoteOn: handleNotePress });
useMidi({ onNoteOn: handleNotePress });
<PianoKeyboard onNotePress={handleNotePress} />
```

This ensures consistent behavior across all input methods.

### Progressive Hints

Lessons support progressive difficulty reduction:
- Attempts 1-3: No hints
- Attempts 4+: Reveal interval name
- Attempts 5+: Show visual key highlights

See [docs/lessons.md](./lessons.md) for full lesson system documentation.
