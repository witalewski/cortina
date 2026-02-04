# Music Theory Reference

## MIDI Notes

### Basics

- **Range**: 0-127 (128 notes total)
- **Middle C (C4)** = MIDI note 60
- **Each semitone** = +1 MIDI note
- **Each octave** = +12 MIDI notes

### Conversion Formulas

```typescript
// MIDI to Note name
const midiToNote = (midi: number): Note => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNames[midi % 12];
  return `${noteName}${octave}` as Note;
};

// Note to MIDI
const noteToMidi = (note: Note): number => {
  const match = note.match(/^([A-G]#?)(\d)$/);
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const [, noteName, octave] = match;
  return noteNames.indexOf(noteName) + (parseInt(octave) + 1) * 12;
};
```

### Common MIDI Values

| Note | MIDI | Description |
|------|------|-------------|
| C3 | 48 | Start of our 25-key range |
| C4 | 60 | Middle C |
| A4 | 69 | Concert pitch (440 Hz) |
| C5 | 72 | End of our 25-key range |

---

## Piano Key Layout

### Our 25-Key Range (C3-C5)

```
Octave 3                    Octave 4                    Octave 5
┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐ ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐ ┌─┐
│ │█│ │█│ │ │█│ │█│ │█│ │ │ │█│ │█│ │ │█│ │█│ │█│ │ │ │
│ │█│ │█│ │ │█│ │█│ │█│ │ │ │█│ │█│ │ │█│ │█│ │█│ │ │ │
│ └┬┘ └┬┘ │ └┬┘ └┬┘ └┬┘ │ │ └┬┘ └┬┘ │ └┬┘ └┬┘ └┬┘ │ │ │
│C │D │E │F │G │A │B │C │D │E │F │G │A │B │C │
└──┴──┴──┴──┴──┴──┴──┘ └──┴──┴──┴──┴──┴──┘ └──┘
```

### Key Types per Octave

- **White keys**: C, D, E, F, G, A, B (7 per octave)
- **Black keys**: C#, D#, F#, G#, A# (5 per octave)
- **Total**: 12 keys per octave

### Black Key Positioning

Black keys are positioned relative to white keys:
- C# between C and D
- D# between D and E
- F# between F and G
- G# between G and A
- A# between A and B

Note: No black key between E-F or B-C (these are natural half-steps).

---

## Computer Keyboard Mapping

### Layout

```
Black keys:  W  E     T  Y  U     O  P  [
            C# D#    F# G# A#    C# D# F#
            (3) (3)  (3)(3)(3)   (4)(4)(4)

White keys: A  S  D  F  G  H  J  K  L  ;  '
            C  D  E  F  G  A  B  C  D  E  F
            |------- Octave 3 ------|-- Oct 4 --|
```

### MIDI Mapping Table

| Key | Note | MIDI |
|-----|------|------|
| A | C3 | 48 |
| W | C#3 | 49 |
| S | D3 | 50 |
| E | D#3 | 51 |
| D | E3 | 52 |
| F | F3 | 53 |
| T | F#3 | 54 |
| G | G3 | 55 |
| Y | G#3 | 56 |
| H | A3 | 57 |
| U | A#3 | 58 |
| J | B3 | 59 |
| K | C4 | 60 |
| O | C#4 | 61 |
| L | D4 | 62 |
| P | D#4 | 63 |
| ; | E4 | 64 |
| ' | F4 | 65 |
| [ | F#4 | 66 |

---

## MIDI Protocol Basics

### Message Types

| Status Byte | Type | Description |
|-------------|------|-------------|
| 0x90 | Note On | Key pressed |
| 0x80 | Note Off | Key released |
| 0xB0 | Control Change | Knob/slider moved |

### Message Structure

```
[Status Byte] [Data Byte 1] [Data Byte 2]
     │              │              │
     │              │              └── Velocity (0-127)
     │              └── Note Number (0-127)
     └── Message type + channel
```

### Note On vs Note Off

- **Note On** with velocity > 0: Start playing note
- **Note On** with velocity = 0: Stop playing note (alternative to Note Off)
- **Note Off**: Stop playing note

```typescript
// Common pattern in MIDI handling
if (status === 0x90 && velocity > 0) {
  // Note On
  playNote(note, velocity);
} else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
  // Note Off
  stopNote(note);
}
```

---

## Velocity

- **Range**: 0-127
- **0**: Silent (or note off)
- **64**: Medium (mezzo-forte)
- **127**: Maximum (fortissimo)

### Velocity to Volume Mapping

```typescript
// Linear mapping (simple)
const volume = velocity / 127;

// Logarithmic mapping (more natural)
const volume = Math.pow(velocity / 127, 2);
```

Our synth uses normalized velocity (0-1) passed to Tone.js.
