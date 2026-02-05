'use client';

import { useCallback, useRef, useState } from 'react';
import type { IntervalChallenge } from '@/app/types/intervals';
import type { Note } from '@/app/types/music';

const NOTE_DURATION = 500; // 0.5 seconds per note
const GAP_BETWEEN_NOTES = 100; // Small gap for clarity

interface UseIntervalPlaybackProps {
  playNote: (note: Note, velocity?: number) => void;
  stopNote: (note: Note) => void;
  onNotePlayed?: (note: Note) => void; // For visual feedback in hint mode
}

interface UseIntervalPlaybackReturn {
  isPlaying: boolean;
  playInterval: (challenge: IntervalChallenge) => Promise<void>;
}

export function useIntervalPlayback({
  playNote,
  stopNote,
  onNotePlayed,
}: UseIntervalPlaybackProps): UseIntervalPlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const playInterval = useCallback(
    async (challenge: IntervalChallenge): Promise<void> => {
      // Prevent overlapping playback
      if (isPlaying) {
        return;
      }

      setIsPlaying(true);

      // Create abort controller for this playback
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // Play first note (root)
        onNotePlayed?.(challenge.rootNote);
        playNote(challenge.rootNote, 0.7);

        await sleep(NOTE_DURATION, abortController.signal);
        stopNote(challenge.rootNote);

        // Small gap between notes
        await sleep(GAP_BETWEEN_NOTES, abortController.signal);

        // Play second note (target)
        onNotePlayed?.(challenge.targetNote);
        playNote(challenge.targetNote, 0.7);

        await sleep(NOTE_DURATION, abortController.signal);
        stopNote(challenge.targetNote);
      } catch {
        // Aborted - stop any playing notes
        stopNote(challenge.rootNote);
        stopNote(challenge.targetNote);
      } finally {
        setIsPlaying(false);
        abortControllerRef.current = null;
      }
    },
    [isPlaying, playNote, stopNote, onNotePlayed]
  );

  return {
    isPlaying,
    playInterval,
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
