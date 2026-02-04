import { renderHook, act } from '@testing-library/react';
import { useKeyboard } from '../useKeyboard';

describe('useKeyboard', () => {
  let onNoteOn: jest.Mock;
  let onNoteOff: jest.Mock;

  beforeEach(() => {
    onNoteOn = jest.fn();
    onNoteOff = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should expose keyboard mapping', () => {
    const { result } = renderHook(() => useKeyboard());

    expect(result.current.keyboardMapping).toBeDefined();
    expect(result.current.keyboardMapping['a']).toBe(48); // C3
    expect(result.current.keyboardMapping['k']).toBe(60); // C4 (Middle C)
  });

  it('should trigger note on keydown', () => {
    renderHook(() => useKeyboard({ onNoteOn, onNoteOff, enabled: true }));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      window.dispatchEvent(event);
    });

    expect(onNoteOn).toHaveBeenCalledWith(48, 0.7); // C3 with default velocity
  });

  it('should trigger note off on keyup', () => {
    renderHook(() => useKeyboard({ onNoteOn, onNoteOff, enabled: true }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
    });

    expect(onNoteOff).toHaveBeenCalledWith(48); // C3
  });

  it('should use custom velocity when provided', () => {
    renderHook(() => useKeyboard({ 
      onNoteOn, 
      onNoteOff, 
      enabled: true, 
      defaultVelocity: 0.9 
    }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    });

    expect(onNoteOn).toHaveBeenCalledWith(50, 0.9); // D3 with custom velocity
  });

  it('should ignore repeat events', () => {
    renderHook(() => useKeyboard({ onNoteOn, onNoteOff, enabled: true }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', repeat: false }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', repeat: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', repeat: true }));
    });

    expect(onNoteOn).toHaveBeenCalledTimes(1);
  });

  it('should ignore keys with modifiers', () => {
    renderHook(() => useKeyboard({ onNoteOn, onNoteOff, enabled: true }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', altKey: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', metaKey: true }));
    });

    expect(onNoteOn).not.toHaveBeenCalled();
  });

  it('should not trigger when disabled', () => {
    renderHook(() => useKeyboard({ onNoteOn, onNoteOff, enabled: false }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });

    expect(onNoteOn).not.toHaveBeenCalled();
  });

  it('should handle black keys (sharp notes)', () => {
    renderHook(() => useKeyboard({ onNoteOn, onNoteOff, enabled: true }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' })); // C#3
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' })); // D#3
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 't' })); // F#3
    });

    expect(onNoteOn).toHaveBeenCalledWith(49, 0.7); // C#3
    expect(onNoteOn).toHaveBeenCalledWith(51, 0.7); // D#3
    expect(onNoteOn).toHaveBeenCalledWith(54, 0.7); // F#3
  });

  it('should handle multiple octaves', () => {
    renderHook(() => useKeyboard({ onNoteOn, onNoteOff, enabled: true }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' })); // C3
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' })); // C4
    });

    expect(onNoteOn).toHaveBeenCalledWith(48, 0.7); // C3
    expect(onNoteOn).toHaveBeenCalledWith(60, 0.7); // C4 (Middle C)
  });

  it('should be case insensitive', () => {
    renderHook(() => useKeyboard({ onNoteOn, onNoteOff, enabled: true }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'A' })); // Uppercase
    });

    expect(onNoteOn).toHaveBeenCalledWith(48, 0.7); // C3
  });

  it('should clean up event listeners on unmount', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useKeyboard({ onNoteOn, onNoteOff, enabled: true }));

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should ignore unmapped keys', () => {
    renderHook(() => useKeyboard({ onNoteOn, onNoteOff, enabled: true }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' })); // Unmapped
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Space' }));
    });

    expect(onNoteOn).not.toHaveBeenCalled();
  });

  it('should handle blur event to clear pressed keys', () => {
    renderHook(() => useKeyboard({ onNoteOn, onNoteOff, enabled: true }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      window.dispatchEvent(new Event('blur'));
    });

    // After blur, pressing the same key again should work
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });

    expect(onNoteOn).toHaveBeenCalledTimes(2);
  });
});
