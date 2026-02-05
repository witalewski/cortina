import { renderHook, act } from '@testing-library/react';
import { useIntervalPlayback } from '../useIntervalPlayback';
import type { IntervalChallenge } from '@/app/types/intervals';
import { INTERVALS } from '@/app/types/intervals';

describe('useIntervalPlayback', () => {
  let mockPlayNote: jest.Mock;
  let mockStopNote: jest.Mock;
  let mockOnNotePlayed: jest.Mock;

  const mockChallenge: IntervalChallenge = {
    interval: INTERVALS['perfect 5th'],
    direction: 'ascending',
    rootNote: 'C4',
    rootMidi: 60,
    targetNote: 'G4',
    targetMidi: 67,
    displayName: 'Perfect 5th (ascending)',
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
      useIntervalPlayback({
        playNote: mockPlayNote,
        stopNote: mockStopNote,
      })
    );

    expect(result.current.isPlaying).toBe(false);
  });

  it('should set isPlaying=true while playing', async () => {
    const { result } = renderHook(() =>
      useIntervalPlayback({
        playNote: mockPlayNote,
        stopNote: mockStopNote,
      })
    );

    act(() => {
      result.current.playInterval(mockChallenge);
    });

    expect(result.current.isPlaying).toBe(true);

    // Advance past all timers
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it('should play root note first, then target note', async () => {
    const { result } = renderHook(() =>
      useIntervalPlayback({
        playNote: mockPlayNote,
        stopNote: mockStopNote,
      })
    );

    act(() => {
      result.current.playInterval(mockChallenge);
    });

    // First note should be played immediately
    expect(mockPlayNote).toHaveBeenCalledWith('C4', 0.7);

    // Run all timers to completion
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    // Verify full sequence
    expect(mockStopNote).toHaveBeenCalledWith('C4');
    expect(mockPlayNote).toHaveBeenCalledWith('G4', 0.7);
    expect(mockStopNote).toHaveBeenCalledWith('G4');
  });

  it('should call onNotePlayed callback for each note', async () => {
    const { result } = renderHook(() =>
      useIntervalPlayback({
        playNote: mockPlayNote,
        stopNote: mockStopNote,
        onNotePlayed: mockOnNotePlayed,
      })
    );

    act(() => {
      result.current.playInterval(mockChallenge);
    });

    // First callback
    expect(mockOnNotePlayed).toHaveBeenCalledWith('C4');

    // Run all timers to completion
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(mockOnNotePlayed).toHaveBeenCalledWith('G4');
    expect(mockOnNotePlayed).toHaveBeenCalledTimes(2);
  });

  it('should not start new playback while already playing', async () => {
    const { result } = renderHook(() =>
      useIntervalPlayback({
        playNote: mockPlayNote,
        stopNote: mockStopNote,
      })
    );

    act(() => {
      result.current.playInterval(mockChallenge);
    });

    const callsAfterFirst = mockPlayNote.mock.calls.length;

    act(() => {
      result.current.playInterval(mockChallenge);
    });

    // Should not have called playNote again
    expect(mockPlayNote.mock.calls.length).toBe(callsAfterFirst);

    // Clean up
    await act(async () => {
      await jest.runAllTimersAsync();
    });
  });

  it('should handle unison interval (same root and target)', async () => {
    const unisonChallenge: IntervalChallenge = {
      interval: INTERVALS['unison'],
      direction: 'none',
      rootNote: 'C4',
      rootMidi: 60,
      targetNote: 'C4',
      targetMidi: 60,
      displayName: 'Unison',
    };

    const { result } = renderHook(() =>
      useIntervalPlayback({
        playNote: mockPlayNote,
        stopNote: mockStopNote,
      })
    );

    act(() => {
      result.current.playInterval(unisonChallenge);
    });

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    // Should play C4 twice (root and target are the same)
    expect(mockPlayNote).toHaveBeenCalledTimes(2);
    expect(mockPlayNote).toHaveBeenNthCalledWith(1, 'C4', 0.7);
    expect(mockPlayNote).toHaveBeenNthCalledWith(2, 'C4', 0.7);
  });
});
