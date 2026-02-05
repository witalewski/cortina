import { LessonCard } from '@/app/components/learn/LessonCard';

export default function LearnPage() {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white/90 p-8 shadow-2xl backdrop-blur dark:bg-zinc-900/80">
      <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Learn Mode
      </h1>
      <p className="mb-8 text-zinc-600 dark:text-zinc-300">
        Choose a lesson to start your musical training journey.
      </p>
      
      <div className="space-y-4">
        <LessonCard
          number={1}
          title="Intervals"
          description="Learn to recognize and play musical intervals. Practice perfect 4ths, 5ths, octaves, thirds, and more."
          href="/learn/lesson-1-intervals"
        />
      </div>
    </div>
  );
}
