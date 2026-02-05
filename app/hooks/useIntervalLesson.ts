'use client';

import { useState, useCallback } from 'react';
import type {
  IntervalChallenge,
  ChallengeAttempt,
  ChallengeResult,
  LessonScore,
} from '@/app/types/intervals';
import { generateIntervalPool, selectRandomChallenges, calculateInterval } from '@/app/types/intervals';
import { noteToMidi } from '@/app/utils/music';
import type { Note } from '@/app/types/music';

const ROOT_NOTE_MIDI = 60; // C4
const CHALLENGES_PER_LESSON = 5;
const MAX_ATTEMPTS = 7;
const REVEAL_NAME_AFTER_ATTEMPTS = 3;
const SHOW_HINTS_AFTER_ATTEMPTS = 4;

interface UseIntervalLessonReturn {
  // Current state
  currentChallenge: IntervalChallenge | null;
  challengeIndex: number;
  attempts: number;
  isComplete: boolean;
  score: LessonScore | null;
  
  // UI state
  shouldRevealName: boolean;
  shouldShowHints: boolean;
  
  // Actions
  startLesson: () => void;
  submitAnswer: (firstNote: Note, secondNote: Note) => { correct: boolean; isLastAttempt: boolean };
  moveToNextChallenge: () => void;
  resetLesson: () => void;
}

export function useIntervalLesson(): UseIntervalLessonReturn {
  const [challenges, setChallenges] = useState<IntervalChallenge[]>([]);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [results, setResults] = useState<ChallengeResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const currentChallenge = challenges[challengeIndex] || null;
  const shouldRevealName = attempts >= REVEAL_NAME_AFTER_ATTEMPTS;
  const shouldShowHints = attempts >= SHOW_HINTS_AFTER_ATTEMPTS;

  const startLesson = useCallback(() => {
    const pool = generateIntervalPool(ROOT_NOTE_MIDI);
    const selected = selectRandomChallenges(pool, CHALLENGES_PER_LESSON);
    setChallenges(selected);
    setChallengeIndex(0);
    setAttempts(0);
    setResults([]);
    setIsComplete(false);
  }, []);

  const submitAnswer = useCallback(
    (firstNote: Note, secondNote: Note): { correct: boolean; isLastAttempt: boolean } => {
      if (!currentChallenge) {
        return { correct: false, isLastAttempt: false };
      }

      const firstMidi = noteToMidi(firstNote);
      const secondMidi = noteToMidi(secondNote);
      
      const { interval: playedInterval, direction: playedDirection } = calculateInterval(
        firstMidi,
        secondMidi
      );

      // Check if the played interval matches the expected challenge
      const correct =
        playedInterval?.name === currentChallenge.interval.name &&
        playedDirection === currentChallenge.direction;

      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      // Record this attempt
      const attempt: ChallengeAttempt = {
        playedNotes: [firstNote, secondNote],
        correct,
        timestamp: Date.now(),
      };

      const isLastAttempt = newAttempts >= MAX_ATTEMPTS || correct;

      // If it's the last attempt (success or max failures), record the result
      if (isLastAttempt) {
        const result: ChallengeResult = {
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
  const score: LessonScore | null = isComplete
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
