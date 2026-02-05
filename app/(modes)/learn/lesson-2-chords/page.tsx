'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAudioContext } from '@/app/contexts/AudioContext';
import { useMidi } from '@/app/hooks/useMidi';
import { useKeyboard } from '@/app/hooks/useKeyboard';
import { useChordLesson } from '@/app/hooks/useChordLesson';
import { useChordPlayback } from '@/app/hooks/useChordPlayback';
import { PianoKeyboard } from '@/app/components/piano';
import { ChordChallengePrompt } from '@/app/components/learn/ChordChallengePrompt';
import { AttemptIndicator } from '@/app/components/learn/AttemptIndicator';
import { LessonProgress } from '@/app/components/learn/LessonProgress';
import { ChordLessonSummary } from '@/app/components/learn/ChordLessonSummary';
import { midiToNote } from '@/app/utils/music';
import type { Note, MidiNote } from '@/app/types/music';

const PIANO_START_NOTE = 48; // C3
const MAX_ATTEMPTS = 7;
const FEEDBACK_DISPLAY_TIME = 1000; // 1 second

type LessonMode = 'input' | 'output';
type FeedbackState = 'idle' | 'correct' | 'incorrect' | 'final-fail';

export default function Lesson2ChordsPage() {
  const router = useRouter();

  // Core lesson mode - single source of truth for input control
  const [lessonMode, setLessonMode] = useState<LessonMode>('output');
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('idle');

  // Visual state
  const [pressedNotes, setPressedNotes] = useState<Set<Note>>(new Set());
  const [playbackHighlightedNotes, setPlaybackHighlightedNotes] = useState<Set<Note>>(new Set());

  // Track user's chord input (all notes played)
  const [playedNotes, setPlayedNotes] = useState<Note[]>([]);

  // Ref to track if we've played the initial chord for current challenge
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
  } = useChordLesson();

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
        }, 500);
      }
    },
    [shouldShowHints]
  );

  const { isPlaying, playChord } = useChordPlayback({
    playNote,
    stopNote,
    onNotePlayed: handleNotePlayed,
  });

  // Play chord and return to input mode when done
  const playChordThenInput = useCallback(
    async (challenge: typeof currentChallenge) => {
      if (!challenge) return;
      setLessonMode('output');
      await playChord(challenge);
      setLessonMode('input');
    },
    [playChord]
  );

  // Handle when user completes a chord (plays all required notes)
  const handleChordCompleted = useCallback(
    (notes: Note[]) => {
      if (!currentChallenge) return;

      const { correct, isLastAttempt } = submitAnswer(notes);

      // Switch to output mode and show feedback
      setLessonMode('output');
      setPlayedNotes([]);

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
          // Replay chord then return to input mode
          playChordThenInput(currentChallenge);
        }
      }, FEEDBACK_DISPLAY_TIME);
    },
    [currentChallenge, submitAnswer, moveToNextChallenge, playChordThenInput]
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

      // Chord detection - add note to played notes
      const updatedPlayedNotes = [...playedNotes, noteStr];
      setPlayedNotes(updatedPlayedNotes);

      // Check if we've played all required notes
      if (currentChallenge && updatedPlayedNotes.length === currentChallenge.notes.length) {
        handleChordCompleted(updatedPlayedNotes);
      }
    },
    [lessonMode, playNote, playedNotes, currentChallenge, handleChordCompleted]
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

  // Auto-play chord when new challenge starts
  useEffect(() => {
    if (currentChallenge && !hasPlayedInitialRef.current && !isComplete) {
      hasPlayedInitialRef.current = true;
      // Use async IIFE to handle the async playback
      (async () => {
        await playChord(currentChallenge);
        setLessonMode('input');
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChallenge, isComplete]);

  const handleReplay = () => {
    if (currentChallenge && lessonMode === 'input') {
      setPlayedNotes([]); // Reset any partial input
      playChordThenInput(currentChallenge);
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
            Lesson 2: Basic Chords
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Listen and repeat arpeggiated chords
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
          <ChordLessonSummary score={score} onGoBack={handleGoBack} />
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
              <ChordChallengePrompt
                chordName={shouldRevealName ? currentChallenge.displayName : null}
                showHint={shouldShowHints}
                notesPlayedCount={playedNotes.length}
                totalNotes={currentChallenge.notes.length}
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
