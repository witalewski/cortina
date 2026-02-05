interface ChallengePromptProps {
  intervalName: string | null;
  showHint: boolean;
  firstNotePlayed: boolean;
  isPlaying: boolean;
  feedbackState: 'idle' | 'correct' | 'incorrect' | 'final-fail';
}

export function ChallengePrompt({
  intervalName,
  showHint,
  firstNotePlayed,
  isPlaying,
  feedbackState,
}: ChallengePromptProps) {
  // Feedback state takes priority
  if (feedbackState === 'correct') {
    return (
      <div className="rounded-lg border-2 border-green-500 bg-green-50 p-6 text-center dark:border-green-700 dark:bg-green-950/30">
        <h2 className="mb-2 text-2xl font-bold text-green-900 dark:text-green-100">
          🎉 Correct!
        </h2>
        <p className="text-sm text-green-700 dark:text-green-300">
          Well done!
        </p>
      </div>
    );
  }

  if (feedbackState === 'incorrect') {
    return (
      <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-6 text-center dark:border-orange-700 dark:bg-orange-950/30">
        <h2 className="mb-2 text-2xl font-bold text-orange-900 dark:text-orange-100">
          🎵 Not quite
        </h2>
        <p className="text-sm text-orange-700 dark:text-orange-300">
          Listen again and try once more
        </p>
      </div>
    );
  }

  if (feedbackState === 'final-fail') {
    return (
      <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-6 text-center dark:border-blue-700 dark:bg-blue-950/30">
        <h2 className="mb-2 text-2xl font-bold text-blue-900 dark:text-blue-100">
          💪 Keep practicing
        </h2>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          You&apos;ll get it next time!
        </p>
      </div>
    );
  }

  // Normal state
  return (
    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6 text-center dark:border-blue-900/50 dark:bg-blue-950/30">
      <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {isPlaying ? (
          '🔊 Listen...'
        ) : intervalName ? (
          `Play the ${intervalName}`
        ) : (
          'Repeat this interval'
        )}
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {isPlaying ? (
          'Wait for the interval to finish playing'
        ) : firstNotePlayed ? (
          'Now play the second note'
        ) : (
          'Start by playing the first note (C4)'
        )}
      </p>
      {showHint && !isPlaying && (
        <p className="mt-3 text-xs italic text-blue-600 dark:text-blue-400">
          💡 Watch the highlighted keys when you replay the interval
        </p>
      )}
    </div>
  );
}
