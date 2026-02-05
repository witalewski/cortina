'use client';

import { useState, useCallback } from 'react';
import type {
  ChordChallenge,
  ChordAttempt,
  ChordResult,
  ChordLessonScore,
} from '@/app/types/chords';
import { generateChordPool, selectRandomChallenges, checkChordMatch } from '@/app/types/chords';
import { noteToMidi } from '@/app/utils/music';
import type { Note } from '@/app/types/music';

const CHALLENGES_PER_LESSON = 5;
const MAX_ATTEMPTS = 7;
const REVEAL_NAME_AFTER_ATTEMPTS = 3;
const SHOW_HINTS_AFTER_ATTEMPTS = 4;

interface UseChordLessonReturn {
  // Current state
  currentChallenge: ChordChallenge | null;
  challengeIndex: number;
  attempts: number;
  isComplete: boolean;
  score: ChordLessonScore | null;

  // UI state
  shouldRevealName: boolean;
  shouldShowHints: boolean;

  // Actions
  startLesson: () => void;
  submitAnswer: (playedNotes: Note[]) => { correct: boolean; isLastAttempt: boolean };
  moveToNextChallenge: () => void;
  resetLesson: () => void;
}

export function useChordLesson(): UseChordLessonReturn {
  const [challenges, setChallenges] = useState<ChordChallenge[]>([]);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [results, setResults] = useState<ChordResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const currentChallenge = challenges[challengeIndex] || null;
  const shouldRevealName = attempts >= REVEAL_NAME_AFTER_ATTEMPTS;
  const shouldShowHints = attempts >= SHOW_HINTS_AFTER_ATTEMPTS;

  const startLesson = useCallback(() => {
    const pool = generateChordPool();
    const selected = selectRandomChallenges(pool, CHALLENGES_PER_LESSON);
    setChallenges(selected);
    setChallengeIndex(0);
    setAttempts(0);
    setResults([]);
    setIsComplete(false);
  }, []);

  const submitAnswer = useCallback(
    (playedNotes: Note[]): { correct: boolean; isLastAttempt: boolean } => {
      if (!currentChallenge) {
        return { correct: false, isLastAttempt: false };
      }

      const playedMidiNotes = playedNotes.map(note => noteToMidi(note));

      // Check if the played chord matches the expected chord
      const correct = checkChordMatch(playedMidiNotes, currentChallenge.midiNotes);

      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      // Record this attempt
      const attempt: ChordAttempt = {
        playedNotes,
        correct,
        timestamp: Date.now(),
      };

      const isLastAttempt = newAttempts >= MAX_ATTEMPTS || correct;

      // If it's the last attempt (success or max failures), record the result
      if (isLastAttempt) {
        const result: ChordResult = {
          challenge: currentChallenge,
          attempts: [
            ...(results[challengeIndex]?.attempts || []),
            attempt,
          ],
          succeeded: correct,
          attemptsCount: newAttempts,
        };

        setResults((prev) => {
          const updated = [...prev];
          updated[challengeIndex] = result;
          return updated;
        });
      }

      return { correct, isLastAttempt };
    },
    [currentChallenge, attempts, challengeIndex, results]
  );

  const moveToNextChallenge = useCallback(() => {
    const nextIndex = challengeIndex + 1;

    if (nextIndex >= challenges.length) {
      // Lesson complete
      setIsComplete(true);
    } else {
      setChallengeIndex(nextIndex);
      setAttempts(0);
    }
  }, [challengeIndex, challenges.length]);

  const resetLesson = useCallback(() => {
    setChallenges([]);
    setChallengeIndex(0);
    setAttempts(0);
    setResults([]);
    setIsComplete(false);
  }, []);

  // Calculate score
  const score: ChordLessonScore | null = isComplete
    ? {
        totalChallenges: challenges.length,
        correctCount: results.filter((r) => r.succeeded).length,
        results,
      }
    : null;

  return {
    currentChallenge,
    challengeIndex,
    attempts,
    isComplete,
    score,
    shouldRevealName,
    shouldShowHints,
    startLesson,
    submitAnswer,
    moveToNextChallenge,
    resetLesson,
  };
}
