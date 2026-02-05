import type { Note, MidiNote } from './music';
import { midiToNote } from '@/app/utils/music';

/**
 * Names of chord types supported in the lesson system.
 * Starting with basic triads (3-note chords).
 */
export type ChordName =
  | 'major'
  | 'minor'
  | 'diminished'
  | 'augmented';

/**
 * Static information about a chord type.
 * Intervals are represented as semitones from the root.
 */
export interface ChordInfo {
  name: ChordName;
  intervals: number[]; // Semitones from root for each note
  shortName: string; // e.g., "maj", "min", "dim"
  displayName: string; // e.g., "Major", "Minor"
}

/**
 * A specific chord challenge presented to the user.
 * Contains both the abstract chord info and the concrete notes to play.
 */
export interface ChordChallenge {
  chord: ChordInfo;
  rootNote: Note;
  rootMidi: MidiNote;
  notes: Note[]; // All notes in the chord
  midiNotes: MidiNote[]; // MIDI values for all notes
  displayName: string; // e.g., "C Major", "D Minor"
}

/**
 * Record of a single attempt at a challenge.
 */
export interface ChordAttempt {
  playedNotes: Note[];
  correct: boolean;
  timestamp: number;
}

/**
 * Result of a completed challenge (after success or max attempts).
 */
export interface ChordResult {
  challenge: ChordChallenge;
  attempts: ChordAttempt[];
  succeeded: boolean;
  attemptsCount: number;
}

/**
 * Final score for a completed lesson.
 */
export interface ChordLessonScore {
  totalChallenges: number;
  correctCount: number;
  results: ChordResult[];
}

/**
 * All supported chord types with their interval structures.
 * Intervals represent semitones from the root note.
 */
export const CHORDS: Record<ChordName, ChordInfo> = {
  'major': {
    name: 'major',
    intervals: [0, 4, 7], // Root, Major 3rd, Perfect 5th
    shortName: 'maj',
    displayName: 'Major'
  },
  'minor': {
    name: 'minor',
    intervals: [0, 3, 7], // Root, Minor 3rd, Perfect 5th
    shortName: 'min',
    displayName: 'Minor'
  },
  'diminished': {
    name: 'diminished',
    intervals: [0, 3, 6], // Root, Minor 3rd, Diminished 5th
    shortName: 'dim',
    displayName: 'Diminished'
  },
  'augmented': {
    name: 'augmented',
    intervals: [0, 4, 8], // Root, Major 3rd, Augmented 5th
    shortName: 'aug',
    displayName: 'Augmented'
  },
};

/**
 * Calculate all notes in a chord given a root note and chord type
 */
export function calculateChordNotes(
  rootMidi: MidiNote,
  chord: ChordInfo
): { notes: Note[]; midiNotes: MidiNote[] } {
  const notes: Note[] = [];
  const midiNotes: MidiNote[] = [];

  for (const interval of chord.intervals) {
    const noteMidi = Math.max(0, Math.min(127, rootMidi + interval)) as MidiNote;
    midiNotes.push(noteMidi);
    notes.push(midiToNote(noteMidi));
  }

  return { notes, midiNotes };
}

/**
 * Create a formatted display name for a chord challenge
 */
export function getChordDisplayName(rootNote: Note, chord: ChordInfo): string {
  // Extract just the note name without octave (e.g., "C" from "C4")
  const noteName = rootNote.replace(/\d+$/, '');
  return `${noteName} ${chord.displayName}`;
}

/**
 * Check if the played notes match the expected chord.
 * Notes can be played in any order (including arpeggio).
 */
export function checkChordMatch(
  playedMidiNotes: MidiNote[],
  expectedMidiNotes: MidiNote[]
): boolean {
  if (playedMidiNotes.length !== expectedMidiNotes.length) {
    return false;
  }

  // Sort both arrays to compare regardless of order
  const sortedPlayed = [...playedMidiNotes].sort((a, b) => a - b);
  const sortedExpected = [...expectedMidiNotes].sort((a, b) => a - b);

  return sortedPlayed.every((note, index) => note === sortedExpected[index]);
}

/**
 * Generate a pool of chord challenges.
 * Root note is always C4 (MIDI 60).
 */
export function generateChordPool(): ChordChallenge[] {
  const pool: ChordChallenge[] = [];
  const rootMidi: MidiNote = 60; // C4
  const rootNote = midiToNote(rootMidi);

  for (const chord of Object.values(CHORDS)) {
    const { notes, midiNotes } = calculateChordNotes(rootMidi, chord);

    pool.push({
      chord,
      rootNote,
      rootMidi,
      notes,
      midiNotes,
      displayName: getChordDisplayName(rootNote, chord),
    });
  }

  return pool;
}

/**
 * Select N unique random challenges from the pool
 */
export function selectRandomChallenges(
  pool: ChordChallenge[],
  count: number
): ChordChallenge[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
