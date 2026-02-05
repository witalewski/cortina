import type { LessonScore } from '@/app/types/intervals';

interface LessonSummaryProps {
  score: LessonScore;
  onGoBack: () => void;
}

export function LessonSummary({ score, onGoBack }: LessonSummaryProps) {
  const percentage = Math.round((score.correctCount / score.totalChallenges) * 100);
  
  // Find the interval with the most attempts (struggling interval)
  const strugglingInterval = score.results
    .filter((r) => !r.succeeded || r.attemptsCount >= 4)
    .sort((a, b) => b.attemptsCount - a.attemptsCount)[0];

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border-2 border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Lesson Complete! 🎉
        </h2>
        <div className="mt-4">
          <div className="text-6xl font-bold text-blue-600 dark:text-blue-400">
            {score.correctCount}/{score.totalChallenges}
          </div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {percentage}% correct
          </div>
        </div>
      </div>

      {/* Results breakdown */}
      <div className="mb-6 space-y-2">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          Results
        </h3>
        {score.results.map((result, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900"
          >
            <span className="text-sm text-zinc-900 dark:text-zinc-50">
              {result.challenge.displayName}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                {result.attemptsCount} {result.attemptsCount === 1 ? 'attempt' : 'attempts'}
              </span>
              <span className="text-lg">
                {result.succeeded ? '✓' : '✗'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Struggling interval hint */}
      {strugglingInterval && (
        <div className="mb-6 rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-950/30">
          <p className="text-sm text-zinc-900 dark:text-zinc-50">
            <span className="font-semibold">💪 Keep practicing:</span> You might
            want to spend more time on{' '}
            <span className="font-semibold">
              {strugglingInterval.challenge.displayName}
            </span>
            .
          </p>
        </div>
      )}

      <button
        onClick={onGoBack}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
      >
        Go Back to Lessons
      </button>
    </div>
  );
}
