'use client';

import { useState, useCallback, useRef } from 'react';
import type { Note } from '@/app/types/music';

/**
 * Hook wrapper that integrates with note press callbacks
 */
export function useIntervalDetectionWithCallback(
  onIntervalDetected: (firstNote: Note, secondNote: Note) => void,
  enabled: boolean
): {
  onNotePress: (note: Note) => void;
  firstNote: Note | null;
  reset: () => void;
} {
  const [firstNote, setFirstNote] = useState<Note | null>(null);
  const processingRef = useRef(false);

  const onNotePress = useCallback(
    (note: Note) => {
      if (!enabled || processingRef.current) return;

      if (!firstNote) {
        setFirstNote(note);
      } else {
        processingRef.current = true;
        onIntervalDetected(firstNote, note);

        setTimeout(() => {
          setFirstNote(null);
          processingRef.current = false;
        }, 100);
      }
    },
    [firstNote, enabled, onIntervalDetected]
  );

  const reset = useCallback(() => {
    setFirstNote(null);
    processingRef.current = false;
  }, []);

  return {
    onNotePress,
    firstNote,
    reset,
  };
}
