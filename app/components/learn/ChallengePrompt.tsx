interface ChallengePromptProps {
  intervalName: string | null;
  showHint: boolean;
  firstNotePlayed: boolean;
}

export function ChallengePrompt({
  intervalName,
  showHint,
  firstNotePlayed,
}: ChallengePromptProps) {
  return (
    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6 text-center dark:border-blue-900/50 dark:bg-blue-950/30">
      <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {intervalName ? `Play the ${intervalName}` : 'Repeat this interval'}
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {firstNotePlayed
          ? 'Now play the second note'
          : 'Start by playing the first note (C4)'}
      </p>
      {showHint && (
        <p className="mt-3 text-xs italic text-blue-600 dark:text-blue-400">
          💡 Watch the highlighted keys when you replay the interval
        </p>
      )}
    </div>
  );
}
