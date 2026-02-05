import Link from 'next/link';

interface LessonCardProps {
  title: string;
  description: string;
  href: string;
  number: number;
}

export function LessonCard({ title, description, href, number }: LessonCardProps) {
  return (
    <Link href={href}>
      <div className="group relative overflow-hidden rounded-xl border-2 border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xl font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            {number}
          </div>
          <div className="flex-1">
            <h3 className="mb-2 text-xl font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-400">
              {title}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          </div>
          <div className="text-zinc-400 transition-transform group-hover:translate-x-1 dark:text-zinc-500">
            →
          </div>
        </div>
      </div>
    </Link>
  );
}
