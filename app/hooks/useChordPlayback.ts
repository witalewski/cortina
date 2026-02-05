'use client';

import { useCallback, useRef, useState } from 'react';
import type { ChordChallenge } from '@/app/types/chords';
import type { Note } from '@/app/types/music';

const NOTE_DURATION = 400; // 0.4 seconds per note (slightly faster for arpeggios)
const GAP_BETWEEN_NOTES = 100; // Small gap for clarity

interface UseChordPlaybackProps {
  playNote: (note: Note, velocity?: number) => void;
  stopNote: (note: Note) => void;
  onNotePlayed?: (note: Note) => void; // For visual feedback in hint mode
}

interface UseChordPlaybackReturn {
  isPlaying: boolean;
  playChord: (challenge: ChordChallenge) => Promise<void>;
}

export function useChordPlayback({
  playNote,
  stopNote,
  onNotePlayed,
}: UseChordPlaybackProps): UseChordPlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const playChord = useCallback(
    async (challenge: ChordChallenge): Promise<void> => {
      // Prevent overlapping playback
      if (isPlaying) {
        return;
      }

      setIsPlaying(true);

      // Create abort controller for this playback
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // Play each note in the chord as an arpeggio
        for (let i = 0; i < challenge.notes.length; i++) {
          const note = challenge.notes[i];

          // Notify for visual feedback
          onNotePlayed?.(note);

          // Play the note
          playNote(note, 0.7);

          // Wait for note duration
          await sleep(NOTE_DURATION, abortController.signal);
          stopNote(note);

          // Small gap between notes (except after the last note)
          if (i < challenge.notes.length - 1) {
            await sleep(GAP_BETWEEN_NOTES, abortController.signal);
          }
        }
      } catch {
        // Aborted - stop any playing notes
        challenge.notes.forEach(note => stopNote(note));
      } finally {
        setIsPlaying(false);
        abortControllerRef.current = null;
      }
    },
    [isPlaying, playNote, stopNote, onNotePlayed]
  );

  return {
    isPlaying,
    playChord,
  };
}

// Helper: Abortable sleep
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('Aborted'));
      });
    }
  });
}
