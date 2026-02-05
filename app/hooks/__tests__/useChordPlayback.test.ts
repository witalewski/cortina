import { renderHook, act } from '@testing-library/react';
import { useChordPlayback } from '../useChordPlayback';
import type { ChordChallenge } from '@/app/types/chords';
import { CHORDS } from '@/app/types/chords';

describe('useChordPlayback', () => {
  let mockPlayNote: jest.Mock;
  let mockStopNote: jest.Mock;
  let mockOnNotePlayed: jest.Mock;

  const mockChallenge: ChordChallenge = {
    chord: CHORDS['major'],
    rootNote: 'C4',
    rootMidi: 60,
    notes: ['C4', 'E4', 'G4'],
    midiNotes: [60, 64, 67],
    displayName: 'C Major',
  };

  beforeEach(() => {
    mockPlayNote = jest.fn();
    mockStopNote = jest.fn();
    mockOnNotePlayed = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start with isPlaying=false', () => {
    const { result } = renderHook(() =>
      useChordPlayback({
        playNote: mockPlayNote,
        stopNote: mockStopNote,
      })
    );

    expect(result.current.isPlaying).toBe(false);
  });

  it('should set isPlaying=true while playing', async () => {
    const { result } = renderHook(() =>
      useChordPlayback({
        playNote: mockPlayNote,
        stopNote: mockStopNote,
      })
    );

    act(() => {
      result.current.playChord(mockChallenge);
    });

    expect(result.current.isPlaying).toBe(true);

    // Advance past all timers
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it('should play all notes in the chord as an arpeggio', async () => {
    const { result } = renderHook(() =>
      useChordPlayback({
        playNote: mockPlayNote,
        stopNote: mockStopNote,
      })
    );

    act(() => {
      result.current.playChord(mockChallenge);
    });

    // First note should be played immediately
    expect(mockPlayNote).toHaveBeenCalledWith('C4', 0.7);

    // Run all timers to completion
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    // Verify all notes were played
    expect(mockPlayNote).toHaveBeenCalledWith('C4', 0.7);
    expect(mockPlayNote).toHaveBeenCalledWith('E4', 0.7);
    expect(mockPlayNote).toHaveBeenCalledWith('G4', 0.7);
    expect(mockPlayNote).toHaveBeenCalledTimes(3);

    // Verify all notes were stopped
    expect(mockStopNote).toHaveBeenCalledWith('C4');
    expect(mockStopNote).toHaveBeenCalledWith('E4');
    expect(mockStopNote).toHaveBeenCalledWith('G4');
    expect(mockStopNote).toHaveBeenCalledTimes(3);
  });

  it('should call onNotePlayed callback for each note', async () => {
    const { result } = renderHook(() =>
      useChordPlayback({
        playNote: mockPlayNote,
        stopNote: mockStopNote,
        onNotePlayed: mockOnNotePlayed,
      })
    );

    act(() => {
      result.current.playChord(mockChallenge);
    });

    // First callback
    expect(mockOnNotePlayed).toHaveBeenCalledWith('C4');

    // Run all timers to completion
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(mockOnNotePlayed).toHaveBeenCalledWith('C4');
    expect(mockOnNotePlayed).toHaveBeenCalledWith('E4');
    expect(mockOnNotePlayed).toHaveBeenCalledWith('G4');
    expect(mockOnNotePlayed).toHaveBeenCalledTimes(3);
  });

  it('should not start new playback while already playing', async () => {
    const { result } = renderHook(() =>
      useChordPlayback({
        playNote: mockPlayNote,
        stopNote: mockStopNote,
      })
    );

    act(() => {
      result.current.playChord(mockChallenge);
    });

    const callsAfterFirst = mockPlayNote.mock.calls.length;

    act(() => {
      result.current.playChord(mockChallenge);
    });

    // Should not have called playNote again
    expect(mockPlayNote.mock.calls.length).toBe(callsAfterFirst);

    // Clean up
    await act(async () => {
      await jest.runAllTimersAsync();
    });
  });

  it('should play notes in sequence', async () => {
    const { result } = renderHook(() =>
      useChordPlayback({
        playNote: mockPlayNote,
        stopNote: mockStopNote,
      })
    );

    act(() => {
      result.current.playChord(mockChallenge);
    });

    // First note should be played immediately
    expect(mockPlayNote).toHaveBeenCalledWith('C4', 0.7);

    // Run all timers to completion
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    // Verify notes were played in correct order
    expect(mockPlayNote).toHaveBeenNthCalledWith(1, 'C4', 0.7);
    expect(mockPlayNote).toHaveBeenNthCalledWith(2, 'E4', 0.7);
    expect(mockPlayNote).toHaveBeenNthCalledWith(3, 'G4', 0.7);
    expect(mockPlayNote).toHaveBeenCalledTimes(3);
  });

  it('should handle chords with different numbers of notes', async () => {
    // Test with a different chord type
    const minorChallenge: ChordChallenge = {
      chord: CHORDS['minor'],
      rootNote: 'D4',
      rootMidi: 62,
      notes: ['D4', 'F4', 'A4'],
      midiNotes: [62, 65, 69],
      displayName: 'D Minor',
    };

    const { result } = renderHook(() =>
      useChordPlayback({
        playNote: mockPlayNote,
        stopNote: mockStopNote,
      })
    );

    act(() => {
      result.current.playChord(minorChallenge);
    });

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    // Should play all 3 notes
    expect(mockPlayNote).toHaveBeenCalledWith('D4', 0.7);
    expect(mockPlayNote).toHaveBeenCalledWith('F4', 0.7);
    expect(mockPlayNote).toHaveBeenCalledWith('A4', 0.7);
    expect(mockPlayNote).toHaveBeenCalledTimes(3);
  });
});
