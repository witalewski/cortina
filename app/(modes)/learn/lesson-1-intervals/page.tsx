'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAudioContext } from '@/app/contexts/AudioContext';
import { useMidi } from '@/app/hooks/useMidi';
import { useKeyboard } from '@/app/hooks/useKeyboard';
import { useIntervalLesson } from '@/app/hooks/useIntervalLesson';
import { useIntervalPlayback } from '@/app/hooks/useIntervalPlayback';
import { PianoKeyboard } from '@/app/components/piano';
import { ChallengePrompt } from '@/app/components/learn/ChallengePrompt';
import { AttemptIndicator } from '@/app/components/learn/AttemptIndicator';
import { LessonProgress } from '@/app/components/learn/LessonProgress';
import { LessonSummary } from '@/app/components/learn/LessonSummary';
import { midiToNote, noteToMidi } from '@/app/utils/music';
import type { Note, MidiNote } from '@/app/types/music';
import { calculateInterval } from '@/app/types/intervals';

const PIANO_START_NOTE = 48; // C3
const MAX_ATTEMPTS = 7;
const FEEDBACK_DISPLAY_TIME = 1000; // 1 second

type LessonMode = 'input' | 'output';
type FeedbackState = 'idle' | 'correct' | 'incorrect' | 'final-fail';

export default function Lesson1IntervalsPage() {
  const router = useRouter();
  
  // Core lesson mode - single source of truth for input control
  const [lessonMode, setLessonMode] = useState<LessonMode>('output');
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('idle');
  
  // Visual state
  const [pressedNotes, setPressedNotes] = useState<Set<Note>>(new Set());
  const [playbackHighlightedNotes, setPlaybackHighlightedNotes] = useState<Set<Note>>(new Set());
  
  // Track user's interval input (first and second note)
  const [firstNote, setFirstNote] = useState<Note | null>(null);
  
  // Ref to track if we've played the initial interval for current challenge
  const hasPlayedInitialRef = useRef(false);

  const {
    isInitialized,
    isInitializing,
    error: audioError,
    initialize,
    playNote,
    stopNote,
  } = useAudioContext();

  const {
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
  } = useIntervalLesson();

  // Handle visual feedback during playback (for hints mode)
  const handleNotePlayed = useCallback(
    (note: Note) => {
      if (shouldShowHints) {
        setPlaybackHighlightedNotes((prev) => new Set(prev).add(note));
        setTimeout(() => {
          setPlaybackHighlightedNotes((prev) => {
            const next = new Set(prev);
            next.delete(note);
            return next;
          });
        }, 600);
      }
    },
    [shouldShowHints]
  );

  const { isPlaying, playInterval } = useIntervalPlayback({
    playNote,
    stopNote,
    onNotePlayed: handleNotePlayed,
  });

  // Play interval and return to input mode when done
  const playIntervalThenInput = useCallback(
    async (challenge: typeof currentChallenge) => {
      if (!challenge) return;
      setLessonMode('output');
      await playInterval(challenge);
      setLessonMode('input');
    },
    [playInterval]
  );

  // Handle when user completes an interval (plays 2 notes)
  const handleIntervalCompleted = useCallback(
    (first: Note, second: Note) => {
      if (!currentChallenge) return;

      const firstMidi = noteToMidi(first);
      const secondMidi = noteToMidi(second);
      const { interval, direction } = calculateInterval(firstMidi, secondMidi);
      
      const correct = 
        interval?.name === currentChallenge.interval.name &&
        direction === currentChallenge.direction;
      
      const { isLastAttempt } = submitAnswer(first, second);

      // Switch to output mode and show feedback
      setLessonMode('output');
      setFirstNote(null);

      if (correct) {
        setFeedbackState('correct');
      } else if (isLastAttempt) {
        setFeedbackState('final-fail');
      } else {
        setFeedbackState('incorrect');
      }

      // After feedback display time
      setTimeout(() => {
        setFeedbackState('idle');

        if (correct || isLastAttempt) {
          // Move to next challenge
          hasPlayedInitialRef.current = false;
          moveToNextChallenge();
        } else {
          // Replay interval then return to input mode
          playIntervalThenInput(currentChallenge);
        }
      }, FEEDBACK_DISPLAY_TIME);
    },
    [currentChallenge, submitAnswer, moveToNextChallenge, playIntervalThenInput]
  );

  // Note press handler - completely blocked in output mode
  const handleNotePress = useCallback(
    (note: Note | MidiNote) => {
      // BLOCK ALL INPUT IN OUTPUT MODE
      if (lessonMode !== 'input') return;

      const noteStr = typeof note === 'number' ? midiToNote(note) : note;

      // Play audio
      playNote(note, 0.7);

      // Visual feedback
      setPressedNotes((prev) => new Set(prev).add(noteStr));

      // Interval detection
      if (!firstNote) {
        // First note of interval
        setFirstNote(noteStr);
      } else {
        // Second note - complete the interval
        handleIntervalCompleted(firstNote, noteStr);
      }
    },
    [lessonMode, playNote, firstNote, handleIntervalCompleted]
  );

  const handleNoteRelease = useCallback(
    (note: Note | MidiNote) => {
      const noteStr = typeof note === 'number' ? midiToNote(note) : note;
      stopNote(note);
      setPressedNotes((prev) => {
        const next = new Set(prev);
        next.delete(noteStr);
        return next;
      });
    },
    [stopNote]
  );

  // MIDI input
  const { initialize: initializeMidi } = useMidi({
    onNoteOn: handleNotePress,
    onNoteOff: handleNoteRelease,
    autoEnable: true,
  });

  // Keyboard input - also respects lesson mode
  useKeyboard({
    onNoteOn: handleNotePress,
    onNoteOff: handleNoteRelease,
    enabled: isInitialized && lessonMode === 'input',
    startNote: PIANO_START_NOTE,
  });

  // Start lesson once audio is initialized
  useEffect(() => {
    if (isInitialized && !currentChallenge && !isComplete) {
      startLesson();
    }
  }, [isInitialized, currentChallenge, isComplete, startLesson]);

  // Auto-play interval when new challenge starts
  useEffect(() => {
    if (currentChallenge && !hasPlayedInitialRef.current && !isComplete) {
      hasPlayedInitialRef.current = true;
      // Use async IIFE to handle the async playback
      (async () => {
        await playInterval(currentChallenge);
        setLessonMode('input');
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChallenge, isComplete]);

  const handleReplay = () => {
    if (currentChallenge && lessonMode === 'input') {
      setFirstNote(null); // Reset any partial input
      playIntervalThenInput(currentChallenge);
    }
  };

  const handleQuit = () => {
    router.push('/learn');
  };

  const handleGoBack = () => {
    router.push('/learn');
  };

  const handleStartAudio = async () => {
    const audioSuccess = await initialize();

    if (audioSuccess) {
      await initializeMidi();
    }
  };

  // Combine pressed notes and playback highlighted notes for visual feedback
  const allPressedNotes = new Set([...pressedNotes, ...playbackHighlightedNotes]);

  return (
    <div className="flex w-full justify-center">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-800 md:p-8">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Lesson 1: Intervals
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Listen and repeat the musical intervals
          </p>
        </div>

        {!isInitialized ? (
          <div className="space-y-4 text-center">
            <p className="mb-6 text-zinc-700 dark:text-zinc-300">
              Click the button below to start the lesson
            </p>
            <button
              onClick={handleStartAudio}
              disabled={isInitializing}
              className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isInitializing ? 'Initializing...' : 'Start Lesson'}
            </button>
            {audioError && (
              <p className="mt-4 text-red-600 dark:text-red-400">
                Error: {audioError}
              </p>
            )}
          </div>
        ) : isComplete && score ? (
          <LessonSummary score={score} onGoBack={handleGoBack} />
        ) : currentChallenge ? (
          <>
            {/* Quit button - top right */}
            <button
              onClick={handleQuit}
              className="absolute right-8 top-8 rounded-lg border-2 border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              ← Quit
            </button>

            <div className="space-y-6">
              {/* Progress indicator */}
              <LessonProgress current={challengeIndex + 1} total={5} />

              {/* Challenge prompt */}
              <ChallengePrompt
                intervalName={shouldRevealName ? currentChallenge.displayName : null}
                showHint={shouldShowHints}
                firstNotePlayed={firstNote !== null}
                isPlaying={isPlaying}
                feedbackState={feedbackState}
              />

              {/* Piano keyboard */}
              <div className="flex items-center justify-center">
                <PianoKeyboard
                  startNote={PIANO_START_NOTE}
                  numKeys={25}
                  onNotePress={handleNotePress}
                  onNoteRelease={handleNoteRelease}
                  pressedNotes={allPressedNotes}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <AttemptIndicator current={attempts} max={MAX_ATTEMPTS} />

                <button
                  onClick={handleReplay}
                  disabled={lessonMode === 'output'}
                  className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white shadow-md transition-colors hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {lessonMode === 'output' && isPlaying ? 'Playing...' : '🔊 Replay'}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
