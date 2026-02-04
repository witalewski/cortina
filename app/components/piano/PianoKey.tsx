'use client';

import type { Note } from '@/app/types/music';

export type KeyColor = 'white' | 'black';

interface PianoKeyProps {
  note: Note;
  color: KeyColor;
  isPressed: boolean;
  onPress: (note: Note) => void;
  onRelease: (note: Note) => void;
  label?: string;
}

export function PianoKey({
  note,
  color,
  isPressed,
  onPress,
  onRelease,
  label,
}: PianoKeyProps) {
  const handleMouseDown = () => onPress(note);
  const handleMouseUp = () => onRelease(note);
  const handleMouseLeave = () => {
    if (isPressed) onRelease(note);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    onPress(note);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    onRelease(note);
  };

  const baseClasses = 'relative transition-all duration-75 select-none cursor-pointer';
  
  const whiteKeyClasses = `
    ${baseClasses}
    w-12 h-40 
    border border-zinc-300 dark:border-zinc-600
    ${isPressed 
      ? 'bg-zinc-300 dark:bg-zinc-600 scale-95' 
      : 'bg-white dark:bg-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-200'
    }
    shadow-md
  `;

  const blackKeyClasses = `
    ${baseClasses}
    w-8 h-24
    -ml-4 -mr-4
    z-10
    ${isPressed 
      ? 'bg-zinc-600 dark:bg-zinc-500 scale-95' 
      : 'bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700'
    }
    shadow-lg
  `;

  return (
    <div
      className={color === 'white' ? whiteKeyClasses : blackKeyClasses}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {label && (
        <div className={`
          absolute bottom-2 left-1/2 -translate-x-1/2
          text-xs font-medium
          ${color === 'white' 
            ? 'text-zinc-400 dark:text-zinc-600' 
            : 'text-zinc-400 dark:text-zinc-500'
          }
        `}>
          {label}
        </div>
      )}
    </div>
  );
}
