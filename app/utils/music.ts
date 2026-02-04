import type { Note, MidiNote } from '@/app/types/music';

/**
 * Convert a MIDI note number (0-127) to a note string (e.g., "C4", "A#3")
 * @param midiNote MIDI note number (0-127)
 * @returns Note string in format "NoteName + Octave"
 */
export function midiToNote(midiNote: MidiNote): Note {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = noteNames[midiNote % 12];
  return `${noteName}${octave}` as Note;
}

/**
 * Convert a note string (e.g., "C4", "A#3") to a MIDI note number (0-127)
 * @param note Note string in format "NoteName + Octave"
 * @returns MIDI note number, or 60 (C4) if parsing fails
 */
export function noteToMidi(note: Note): MidiNote {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const match = note.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return 60; // Default to C4 if parsing fails
  
  const [, noteName, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);
  const noteIndex = noteNames.indexOf(noteName);
  
  return ((octave + 1) * 12 + noteIndex) as MidiNote;
}

/**
 * Calculate the optimal starting note (always a C) for a given MIDI note
 * to display a 25-key keyboard range (2 octaves).
 * 
 * @param midiNote - The MIDI note that should be visible
 * @returns The MIDI note number of the starting C (clamped to valid range)
 * 
 * @example
 * getOptimalStartNote(45) // A2 → returns 36 (C2)
 * getOptimalStartNote(35) // B1 → returns 24 (C1)
 * getOptimalStartNote(62) // D5 → returns 60 (C4)
 */
export function getOptimalStartNote(midiNote: MidiNote): MidiNote {
  // Find the C note at the start of the octave containing this note
  // C notes: C0=12, C1=24, C2=36, C3=48, C4=60, C5=72...
  const startNote = Math.floor(midiNote / 12) * 12;
  
  // Clamp to C0 (12) minimum and C5 (72) maximum
  // (C5 allows range up to C7/96 with 25 keys)
  const minStart = 12; // C0
  const maxStart = 72; // C5 (so range extends to C7)
  
  return Math.max(minStart, Math.min(maxStart, startNote)) as MidiNote;
}
