interface AttemptIndicatorProps {
  current: number;
  max: number;
  failed?: boolean;
}

export function AttemptIndicator({ current, max, failed }: AttemptIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Attempt:
      </span>
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i < current
                ? failed
                  ? 'bg-red-500'
                  : 'bg-blue-500'
                : 'bg-zinc-300 dark:bg-zinc-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
