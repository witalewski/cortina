# Lesson System Architecture

This document describes the lesson system used in Learn mode, including the LessonMode state machine, interval types, and how to add new lessons.

## Overview

The lesson system enables interactive music training exercises. The first lesson teaches interval recognition - users listen to two-note intervals and reproduce them on the piano.

**Key Files:**
- `app/(modes)/learn/page.tsx` - Lesson list
- `app/(modes)/learn/lesson-1-intervals/page.tsx` - Intervals lesson
- `app/hooks/useIntervalLesson.ts` - Lesson state management
- `app/hooks/useIntervalPlayback.ts` - Audio playback for intervals
- `app/types/intervals.ts` - Interval types and utilities
- `app/components/learn/` - Lesson UI components

---

## LessonMode Architecture

The LessonMode pattern is the **critical** concept for lesson implementation. It solves the problem of coordinating when the user can interact with the piano vs when the system is providing feedback.

### The Problem It Solves

Without clear mode separation, bugs occur where:
- User plays piano while system is also playing (confusing audio)
- Input events are processed during feedback displays
- MIDI, keyboard, and mouse inputs get out of sync

### The Solution: Single Source of Truth

```typescript
type LessonMode = 'input' | 'output';

// 'input'  - User can play piano (keyboard, MIDI, mouse, touch)
// 'output' - System is playing or showing feedback (user blocked)
```

### Mode Transitions

```
┌─────────────────────────────────────────────────────────────────┐
│                     LESSON FLOW                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Challenge Start ──► OUTPUT (play interval) ──► INPUT (wait)    │
│                                                                  │
│  User plays 2nd note ──► OUTPUT (show feedback)                 │
│                                                                  │
│  If correct:   OUTPUT ──► next challenge ──► OUTPUT (play)...   │
│  If wrong:     OUTPUT ──► replay interval ──► INPUT (retry)     │
│  If max fails: OUTPUT ──► next challenge ──► OUTPUT (play)...   │
│                                                                  │
│  Replay button ──► OUTPUT (play interval) ──► INPUT (wait)      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Pattern

```typescript
// In your lesson page:
const [lessonMode, setLessonMode] = useState<LessonMode>('output');

// Block ALL input at the top of the handler
const handleNotePress = useCallback((note: Note) => {
  if (lessonMode !== 'input') return; // CRITICAL: Block when not in input mode
  
  // ... process note
}, [lessonMode, /* other deps */]);

// Pass same handler to ALL input sources
useKeyboard({ onNoteOn: handleNotePress, enabled: !isComplete });
useMidi({ onNoteOn: handleNotePress });
// Also connect to PianoKeyboard's onNotePress
```

---

## Interval Types

### Core Types (`app/types/intervals.ts`)

```typescript
// Interval names
type IntervalName = 'unison' | 'minor 2nd' | 'major 2nd' | 'minor 3rd' | 
                    'major 3rd' | 'perfect 4th' | 'diminished 5th' | 
                    'perfect 5th' | 'perfect octave';

// Direction of interval (relative to root)
type IntervalDirection = 'ascending' | 'descending' | 'none';

// Interval definition
interface Interval {
  name: IntervalName;
  semitones: number;
  shortName: string;  // e.g., "P5", "m3"
}

// A specific challenge to present to user
interface IntervalChallenge {
  interval: Interval;
  direction: IntervalDirection;
  rootNote: Note;      // e.g., "C4"
  rootMidi: MidiNote;  // e.g., 60
  targetNote: Note;    // e.g., "G4"
  targetMidi: MidiNote; // e.g., 67
  displayName: string; // e.g., "Perfect 5th (ascending)"
}
```

### Available Intervals (INTERVALS constant)

| Interval | Semitones | Short Name | Example (from C4) |
|----------|-----------|------------|-------------------|
| Unison | 0 | U | C4 → C4 |
| Minor 2nd | 1 | m2 | C4 → C#4 / B3 |
| Major 2nd | 2 | M2 | C4 → D4 / Bb3 |
| Minor 3rd | 3 | m3 | C4 → Eb4 / A3 |
| Major 3rd | 4 | M3 | C4 → E4 / Ab3 |
| Perfect 4th | 5 | P4 | C4 → F4 / G3 |
| Diminished 5th | 6 | d5 | C4 → Gb4 / F#3 |
| Perfect 5th | 7 | P5 | C4 → G4 / F3 |
| Perfect Octave | 12 | P8 | C4 → C5 / C3 |

### Utility Functions

```typescript
import { 
  calculateTargetNote, 
  calculateInterval, 
  generateIntervalPool,
  selectRandomChallenges,
  getIntervalDisplayName 
} from '@/app/types/intervals';

// Calculate what note is X semitones away
const target = calculateTargetNote(60, 7, 'ascending'); 
// { midi: 67, note: 'G4' }

// Detect what interval was played
const interval = calculateInterval(60, 67);
// { interval: INTERVALS['perfect 5th'], direction: 'ascending' }

// Generate all possible challenges (17 total)
const pool = generateIntervalPool(60); // rootMidi = C4

// Pick 5 random unique challenges
const challenges = selectRandomChallenges(pool, 5);
```

---

## useIntervalLesson Hook

Manages lesson state, scoring, and progressive hints.

```typescript
const {
  // State
  currentChallenge,   // IntervalChallenge | null
  challengeIndex,     // 0-4 (which of 5 challenges)
  attempts,           // 0-7 (attempts on current challenge)
  isComplete,         // true when all 5 challenges done
  score,              // LessonScore | null (only when complete)
  
  // Progressive hints (based on attempts)
  shouldRevealName,   // true after 3 failed attempts
  shouldShowHints,    // true after 4 failed attempts
  
  // Actions
  startLesson,        // () => void - generates 5 random challenges
  submitAnswer,       // (rootNote, targetNote) => { correct, isLastAttempt }
  moveToNextChallenge, // () => void
  resetLesson,        // () => void
} = useIntervalLesson();
```

### Constants

```typescript
const ROOT_NOTE_MIDI = 60;        // C4 - always start from middle C
const CHALLENGES_PER_LESSON = 5;  // 5 intervals per lesson
const MAX_ATTEMPTS = 7;           // Max tries before moving on
const REVEAL_NAME_THRESHOLD = 3;  // Show interval name after 3 fails
const SHOW_HINTS_THRESHOLD = 4;   // Show visual hints after 4 fails
```

---

## useIntervalPlayback Hook

Plays intervals as two sequential notes.

```typescript
const { isPlaying, playInterval } = useIntervalPlayback({
  playNote,           // From useAudio()
  stopNote,           // From useAudio()
  onNotePlayed,       // Optional: visual feedback callback
});

// Play an interval (blocks until complete)
await playInterval(currentChallenge);
```

### Timing Constants

```typescript
const NOTE_DURATION = 500;       // Each note plays for 0.5s
const GAP_BETWEEN_NOTES = 100;   // 0.1s gap between notes
```

---

## UI Components

### ChallengePrompt

Shows current instruction and inline feedback.

```typescript
<ChallengePrompt
  isPlaying={isPlaying}           // Show "🔊 Listen..."
  attempts={attempts}
  shouldRevealName={shouldRevealName}
  intervalName={challenge.displayName}
  feedbackState={feedbackState}   // 'correct' | 'incorrect' | 'final-fail' | null
  onReplay={handleReplay}
/>
```

### AttemptIndicator

Visual dots showing attempts used.

```typescript
<AttemptIndicator attempts={attempts} maxAttempts={7} />
// Shows: ● ● ● ○ ○ ○ ○  (3 used, 4 remaining)
```

### LessonProgress

Shows challenge progress (1/5, 2/5, etc).

```typescript
<LessonProgress current={challengeIndex + 1} total={5} />
```

### LessonSummary

End-of-lesson score display.

```typescript
<LessonSummary
  score={score}
  onBack={() => router.push('/learn')}
  onRetry={handleRetry}
/>
```

---

## Adding New Lessons

### 1. Create the lesson page

```
app/(modes)/learn/lesson-2-yourlesson/page.tsx
```

### 2. Use LessonMode pattern

```typescript
'use client';

export default function Lesson2Page() {
  const [lessonMode, setLessonMode] = useState<LessonMode>('output');
  
  // Create unified note handler
  const handleNotePress = useCallback((note) => {
    if (lessonMode !== 'input') return; // CRITICAL
    // ... your logic
  }, [lessonMode]);
  
  // Connect to all input sources
  useKeyboard({ onNoteOn: handleNotePress, enabled: true });
  useMidi({ onNoteOn: handleNotePress });
  
  return (
    <PianoKeyboard onNotePress={handleNotePress} />
  );
}
```

### 3. Add to lesson list

Update `app/(modes)/learn/page.tsx`:

```typescript
const lessons = [
  { id: 'lesson-1-intervals', title: 'Intervals', ... },
  { id: 'lesson-2-yourlesson', title: 'Your Lesson', ... },
];
```

### 4. Create custom hooks (optional)

For complex lessons, extract state management:

```typescript
// app/hooks/useYourLesson.ts
export function useYourLesson() {
  // ... lesson-specific state and logic
}
```

---

## Testing

### Unit Tests

- `app/types/__tests__/intervals.test.ts` - Interval utilities (23 tests)
- `app/hooks/__tests__/useIntervalLesson.test.ts` - Lesson state (14 tests)
- `app/hooks/__tests__/useIntervalPlayback.test.ts` - Playback logic (6 tests)

### Manual Testing Checklist

When making lesson changes, verify:

- [ ] Lesson starts with system playing interval (output mode)
- [ ] User can play notes after interval finishes (input mode)
- [ ] MIDI input works
- [ ] Keyboard input works
- [ ] Mouse/touch input works
- [ ] User cannot play during system playback
- [ ] Correct answer advances to next challenge
- [ ] Wrong answer replays interval then enables input
- [ ] Progressive hints appear at correct attempt counts
- [ ] Lesson completes after 5 challenges
- [ ] Score displays correctly

---

## Troubleshooting

### MIDI Input Not Working

1. Ensure `initializeMidi()` is called after audio initialization
2. Verify `lessonMode === 'input'` when user should be able to play
3. Check that `handleNotePress` is passed to `useMidi({ onNoteOn })`

### User Can Play During System Playback

1. Verify `lessonMode` is set to `'output'` before `playInterval()`
2. Check that `handleNotePress` blocks when `lessonMode !== 'input'`
3. Ensure mode transitions happen in correct order

### Notes Playing Twice

1. Check that only ONE input handler calls `playNote()`
2. Don't have both `useKeyboard` and manual `onkeydown` handlers
