export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export type Octave = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type Note = `${NoteName}${Octave}`;

export type MidiNote = number; // 0-127

export interface NoteInfo {
  note: Note;
  midiNote: MidiNote;
  frequency: number;
}

export const MIDI_NOTE_ON = 0x90;
export const MIDI_NOTE_OFF = 0x80;
export const MIDDLE_C_MIDI = 60; // C4

export const NOTES_PER_OCTAVE = 12;
