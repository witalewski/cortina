export default function LearnPage() {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white/90 p-8 shadow-2xl backdrop-blur dark:bg-zinc-900/80">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Learn Mode
      </h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-300">
        This is where the Cortina course content will live. We will add guided
        lessons, exercises, and progress tracking here as the curriculum takes
        shape.
      </p>
      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        For now, use Play mode to explore the synth while we build out the
        learning path.
      </p>
    </div>
  );
}
