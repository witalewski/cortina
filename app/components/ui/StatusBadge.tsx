interface StatusBadgeProps {
  status: 'success' | 'warning';
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const isSuccess = status === 'success';
  
  return (
    <div className={`flex-1 rounded-lg border p-4 ${
      isSuccess
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
    }`}>
      <p className={`font-semibold ${
        isSuccess
          ? 'text-green-700 dark:text-green-400'
          : 'text-amber-700 dark:text-amber-400'
      }`}>
        {isSuccess ? '✓' : '○'} {label}
      </p>
    </div>
  );
}
