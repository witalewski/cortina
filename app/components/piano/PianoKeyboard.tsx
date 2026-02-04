'use client';

import { useState } from 'react';
import { PianoKey, type KeyColor } from './PianoKey';
import { midiToNote } from '@/app/utils/music';
import type { Note, MidiNote } from '@/app/types/music';

interface PianoKeyboardProps {
  startNote?: MidiNote;
  numKeys?: number;
  onNotePress?: (note: Note) => void;
  onNoteRelease?: (note: Note) => void;
  pressedNotes?: Set<Note>;
  rotateForMobile?: boolean;
}

interface KeyInfo {
  note: Note;
  midiNote: MidiNote;
  color: KeyColor;
  label?: string;
}

function isBlackKey(midiNote: MidiNote): boolean {
  const noteInOctave = midiNote % 12;
  return [1, 3, 6, 8, 10].includes(noteInOctave); // C#, D#, F#, G#, A#
}

export function PianoKeyboard({
  startNote = 48, // C3
  numKeys = 25,
  onNotePress,
  onNoteRelease,
  pressedNotes: externalPressedNotes,
  rotateForMobile = false, // Rotate 90° for portrait mobile
}: PianoKeyboardProps) {
  const [internalPressedNotes, setInternalPressedNotes] = useState<Set<Note>>(new Set());
  
  const pressedNotes = externalPressedNotes ?? internalPressedNotes;

  const handlePress = (note: Note) => {
    if (!externalPressedNotes) {
      setInternalPressedNotes(prev => new Set(prev).add(note));
    }
    onNotePress?.(note);
  };

  const handleRelease = (note: Note) => {
    if (!externalPressedNotes) {
      setInternalPressedNotes(prev => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      });
    }
    onNoteRelease?.(note);
  };

  // Generate key information
  const keys: KeyInfo[] = [];
  for (let i = 0; i < numKeys; i++) {
    const midiNote = startNote + i;
    const note = midiToNote(midiNote);
    const color = isBlackKey(midiNote) ? 'black' : 'white';
    
    // Add label for C notes only
    const label = note.startsWith('C') && color === 'white' ? note : undefined;
    
    keys.push({ note, midiNote, color, label });
  }

  // Separate white keys for rendering
  const whiteKeys = keys.filter(k => k.color === 'white');

  // Calculate keyboard dimensions for rotation
  const keyboardWidth = whiteKeys.length * 48; // 48px per white key (w-12)
  const keyboardHeight = 160; // approximate height of white keys

  // For rotation: use transform-origin at top-left and offset with margin
  // Center horizontally using viewport width

  return (
    <div 
      className={`relative inline-flex items-start`}
      style={rotateForMobile ? {
        transform: `rotate(90deg)`,
        transformOrigin: 'top left',
        marginLeft: `calc(50vw - ${keyboardHeight / 2}px)`, // Center based on screen width
        width: `${keyboardHeight}px`,
        height: `${keyboardWidth}px`,
      } : undefined}
    >
      {/* White keys */}
      <div className="flex">
        {whiteKeys.map(({ note, color, label }) => (
          <PianoKey
            key={note}
            note={note}
            color={color}
            isPressed={pressedNotes.has(note)}
            onPress={handlePress}
            onRelease={handleRelease}
            label={label}
          />
        ))}
      </div>

      {/* Black keys - positioned absolutely */}
      <div className="absolute top-0 left-0 flex pointer-events-none">
        {keys.map(({ note, color }, index) => {
          if (color === 'black') {
            // Calculate position based on white keys before this black key
            const whiteKeysBefore = keys.slice(0, index).filter(k => k.color === 'white').length;
            const leftOffset = whiteKeysBefore * 48; // 48px = w-12
            
            return (
              <div
                key={note}
                className="absolute pointer-events-auto"
                style={{ left: `${leftOffset}px` }}
              >
                <PianoKey
                  note={note}
                  color={color}
                  isPressed={pressedNotes.has(note)}
                  onPress={handlePress}
                  onRelease={handleRelease}
                />
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
