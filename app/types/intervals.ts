import type { Note, MidiNote } from './music';
import { midiToNote } from '@/app/utils/music';

/**
 * Names of musical intervals supported in the lesson system.
 * These cover common intervals from unison to perfect octave.
 */
export type IntervalName = 
  | 'unison'
  | 'minor 2nd'
  | 'major 2nd'
  | 'minor 3rd'
  | 'major 3rd'
  | 'perfect 4th'
  | 'diminished 5th'
  | 'perfect 5th'
  | 'perfect octave';

/**
 * Direction of an interval relative to the root note.
 * - 'ascending': target note is higher than root
 * - 'descending': target note is lower than root  
 * - 'none': used only for unison (same note)
 */
export type IntervalDirection = 'ascending' | 'descending' | 'none';

/**
 * Static information about a musical interval.
 */
export interface IntervalInfo {
  name: IntervalName;
  semitones: number;
  shortName: string; // e.g., "P5", "M3", "m3"
}

/**
 * A specific interval challenge presented to the user.
 * Contains both the abstract interval info and the concrete notes to play.
 */
export interface IntervalChallenge {
  interval: IntervalInfo;
  direction: IntervalDirection;
  rootNote: Note;
  rootMidi: MidiNote;
  targetNote: Note;
  targetMidi: MidiNote;
  displayName: string; // e.g., "Perfect 5th (ascending)"
}

/**
 * Record of a single attempt at a challenge.
 */
export interface ChallengeAttempt {
  playedNotes: [Note, Note];
  correct: boolean;
  timestamp: number;
}

/**
 * Result of a completed challenge (after success or max attempts).
 */
export interface ChallengeResult {
  challenge: IntervalChallenge;
  attempts: ChallengeAttempt[];
  succeeded: boolean;
  attemptsCount: number;
}

/**
 * Final score for a completed lesson.
 */
export interface LessonScore {
  totalChallenges: number;
  correctCount: number;
  results: ChallengeResult[];
}

/**
 * All supported intervals with their semitone distances.
 * Key: interval name, Value: interval info including semitones and short notation
 */
export const INTERVALS: Record<IntervalName, IntervalInfo> = {
  'unison': { name: 'unison', semitones: 0, shortName: 'P1' },
  'minor 2nd': { name: 'minor 2nd', semitones: 1, shortName: 'm2' },
  'major 2nd': { name: 'major 2nd', semitones: 2, shortName: 'M2' },
  'minor 3rd': { name: 'minor 3rd', semitones: 3, shortName: 'm3' },
  'major 3rd': { name: 'major 3rd', semitones: 4, shortName: 'M3' },
  'perfect 4th': { name: 'perfect 4th', semitones: 5, shortName: 'P4' },
  'diminished 5th': { name: 'diminished 5th', semitones: 6, shortName: 'd5' },
  'perfect 5th': { name: 'perfect 5th', semitones: 7, shortName: 'P5' },
  'perfect octave': { name: 'perfect octave', semitones: 12, shortName: 'P8' },
};

/**
 * Calculate the target note given a root note, interval, and direction
 */
export function calculateTargetNote(
  rootMidi: MidiNote,
  interval: IntervalInfo,
  direction: IntervalDirection
): { targetNote: Note; targetMidi: MidiNote } {
  let targetMidi: number;
  
  if (direction === 'ascending') {
    targetMidi = rootMidi + interval.semitones;
  } else if (direction === 'descending') {
    targetMidi = rootMidi - interval.semitones;
  } else {
    // 'none' - unison
    targetMidi = rootMidi;
  }
  
  // Clamp to valid MIDI range
  targetMidi = Math.max(0, Math.min(127, targetMidi));
  
  return {
    targetNote: midiToNote(targetMidi as MidiNote),
    targetMidi: targetMidi as MidiNote,
  };
}

/**
 * Create a formatted display name for an interval challenge
 */
export function getIntervalDisplayName(
  interval: IntervalInfo,
  direction: IntervalDirection
): string {
  const capitalizedName = interval.name.charAt(0).toUpperCase() + interval.name.slice(1);
  
  if (direction === 'none') {
    return capitalizedName;
  }
  
  return `${capitalizedName} (${direction})`;
}

/**
 * Calculate the interval between two MIDI notes
 * Returns the interval info and direction
 */
export function calculateInterval(
  firstMidi: MidiNote,
  secondMidi: MidiNote
): { interval: IntervalInfo | null; direction: IntervalDirection } {
  const semitones = Math.abs(secondMidi - firstMidi);
  const direction: IntervalDirection = 
    secondMidi > firstMidi ? 'ascending' : 
    secondMidi < firstMidi ? 'descending' : 'none';
  
  // Find matching interval
  const interval = Object.values(INTERVALS).find(int => int.semitones === semitones) || null;
  
  return { interval, direction };
}

/**
 * Generate the pool of 15 possible interval challenges (8 intervals × directions - unison)
 * Root note is always C4 (MIDI 60)
 */
export function generateIntervalPool(rootMidi: MidiNote = 60): IntervalChallenge[] {
  const pool: IntervalChallenge[] = [];
  const rootNote = midiToNote(rootMidi);
  
  for (const interval of Object.values(INTERVALS)) {
    // Unison has no direction
    if (interval.name === 'unison') {
      const { targetNote, targetMidi } = calculateTargetNote(rootMidi, interval, 'none');
      pool.push({
        interval,
        direction: 'none',
        rootNote,
        rootMidi,
        targetNote,
        targetMidi,
        displayName: getIntervalDisplayName(interval, 'none'),
      });
    } else {
      // All other intervals have ascending and descending variants
      for (const direction of ['ascending', 'descending'] as IntervalDirection[]) {
        const { targetNote, targetMidi } = calculateTargetNote(rootMidi, interval, direction);
        pool.push({
          interval,
          direction,
          rootNote,
          rootMidi,
          targetNote,
          targetMidi,
          displayName: getIntervalDisplayName(interval, direction),
        });
      }
    }
  }
  
  return pool;
}

/**
 * Select N unique random challenges from the pool
 */
export function selectRandomChallenges(
  pool: IntervalChallenge[],
  count: number
): IntervalChallenge[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
