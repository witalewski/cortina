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
