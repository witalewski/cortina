import { useEffect } from 'react';

interface FeedbackOverlayProps {
  show: boolean;
  type: 'correct' | 'incorrect' | 'final-fail';
  onComplete?: () => void;
}

const FEEDBACK_DURATION = 1500; // 1.5 seconds

const FEEDBACK_CONFIG = {
  correct: {
    emoji: '🎉',
    title: 'Correct!',
    message: 'Well done!',
    bgColor: 'bg-green-500/95',
    textColor: 'text-white',
  },
  incorrect: {
    emoji: '🎵',
    title: 'Not quite',
    message: 'Try again!',
    bgColor: 'bg-orange-500/95',
    textColor: 'text-white',
  },
  'final-fail': {
    emoji: '💪',
    title: 'Keep practicing',
    message: "You'll get it next time!",
    bgColor: 'bg-blue-500/95',
    textColor: 'text-white',
  },
};

export function FeedbackOverlay({ show, type, onComplete }: FeedbackOverlayProps) {
  useEffect(() => {
    if (!show) return;
    
    const timer = setTimeout(() => {
      onComplete?.();
    }, FEEDBACK_DURATION);

    return () => clearTimeout(timer);
  }, [show, onComplete]);

  if (!show) return null;

  const config = FEEDBACK_CONFIG[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`${config.bgColor} ${config.textColor} animate-[fadeIn_0.2s_ease-out] rounded-2xl px-12 py-8 text-center shadow-2xl`}
      >
        <div className="mb-4 text-6xl">{config.emoji}</div>
        <h3 className="mb-2 text-3xl font-bold">{config.title}</h3>
        <p className="text-lg opacity-90">{config.message}</p>
      </div>
    </div>
  );
}
