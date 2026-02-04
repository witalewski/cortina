'use client';

import { useState } from 'react';
import { PianoKey, type KeyColor } from './PianoKey';
import type { Note, MidiNote } from '@/app/types/music';

interface PianoKeyboardProps {
  startNote?: MidiNote;
  numKeys?: number;
  onNotePress?: (note: Note) => void;
  onNoteRelease?: (note: Note) => void;
  pressedNotes?: Set<Note>;
}

interface KeyInfo {
  note: Note;
  midiNote: MidiNote;
  color: KeyColor;
  label?: string;
}

function midiToNote(midiNote: MidiNote): Note {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = noteNames[midiNote % 12];
  return `${noteName}${octave}` as Note;
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

  // Separate white and black keys for proper layering
  const whiteKeys = keys.filter(k => k.color === 'white');
  const blackKeys = keys.filter(k => k.color === 'black');

  return (
    <div className="relative inline-flex items-start">
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
        {keys.map(({ note, midiNote, color }, index) => {
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
