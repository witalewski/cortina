interface LessonProgressProps {
  current: number;
  total: number;
}

export function LessonProgress({ current, total }: LessonProgressProps) {
  return (
    <div className="text-center">
      <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        Challenge {current} of {total}
      </div>
      <div className="mt-2 flex justify-center gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              i < current
                ? 'bg-green-500'
                : i === current
                  ? 'bg-blue-500'
                  : 'bg-zinc-300 dark:bg-zinc-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
