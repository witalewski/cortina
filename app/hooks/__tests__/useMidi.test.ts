import { renderHook, act, waitFor } from '@testing-library/react';
import { useMidi } from '../useMidi';
import { midiService } from '@/app/services/midi';

// Mock the MIDI service
jest.mock('@/app/services/midi', () => ({
  midiService: {
    isSupported: jest.fn(),
    isInitialized: jest.fn(),
    initialize: jest.fn(),
    getDevices: jest.fn(),
    enableDevice: jest.fn(),
    disableDevice: jest.fn(),
    enableAllDevices: jest.fn(),
    onMessage: jest.fn(),
    onDeviceChange: jest.fn(),
    dispose: jest.fn(),
  },
}));

describe('useMidi', () => {
  let mockUnsubscribe: jest.Mock;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribe = jest.fn();
    (midiService.isSupported as jest.Mock).mockReturnValue(false);
    (midiService.isInitialized as jest.Mock).mockReturnValue(false);
    (midiService.getDevices as jest.Mock).mockReturnValue([]);
    (midiService.onMessage as jest.Mock).mockReturnValue(mockUnsubscribe);
    (midiService.onDeviceChange as jest.Mock).mockReturnValue(mockUnsubscribe);
    
    // Suppress console warnings and errors in tests
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useMidi());

    expect(result.current.isSupported).toBe(false);
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.devices).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should detect MIDI support', async () => {
    (midiService.isSupported as jest.Mock).mockReturnValue(true);
    (midiService.initialize as jest.Mock).mockResolvedValue(true);
    (midiService.getDevices as jest.Mock).mockReturnValue([]);

    const { result } = renderHook(() => useMidi());

    await act(async () => {
      await result.current.initialize();
    });

    expect(result.current.isSupported).toBe(true);
  });

  it('should initialize successfully', async () => {
    (midiService.isSupported as jest.Mock).mockReturnValue(true);
    (midiService.initialize as jest.Mock).mockResolvedValue(true);
    (midiService.getDevices as jest.Mock).mockReturnValue([
      { id: 'device1', name: 'MIDI Keyboard', manufacturer: 'Test', enabled: true },
    ]);

    const { result } = renderHook(() => useMidi({ autoEnable: true }));

    await act(async () => {
      await result.current.initialize();
    });

    expect(result.current.isInitialized).toBe(true);
    expect(result.current.devices).toHaveLength(1);
    expect(result.current.error).toBe(null);
    expect(midiService.initialize).toHaveBeenCalledTimes(1);
  });

  it('should auto-enable devices when autoEnable is true', async () => {
    (midiService.isSupported as jest.Mock).mockReturnValue(true);
    (midiService.initialize as jest.Mock).mockResolvedValue(true);
    (midiService.getDevices as jest.Mock).mockReturnValue([]);

    const { result } = renderHook(() => useMidi({ autoEnable: true }));

    await act(async () => {
      await result.current.initialize();
    });

    expect(midiService.enableAllDevices).toHaveBeenCalledTimes(1);
  });

  it('should not auto-enable devices when autoEnable is false', async () => {
    (midiService.isSupported as jest.Mock).mockReturnValue(true);
    (midiService.initialize as jest.Mock).mockResolvedValue(true);
    (midiService.getDevices as jest.Mock).mockReturnValue([]);

    const { result } = renderHook(() => useMidi({ autoEnable: false }));

    await act(async () => {
      await result.current.initialize();
    });

    expect(midiService.enableAllDevices).not.toHaveBeenCalled();
  });

  it('should handle unsupported MIDI', async () => {
    (midiService.isSupported as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => useMidi());

    await act(async () => {
      await result.current.initialize();
    });

    expect(result.current.isInitialized).toBe(false);
    expect(result.current.error).toContain('not supported');
  });

  it('should handle initialization failure', async () => {
    (midiService.isSupported as jest.Mock).mockReturnValue(true);
    (midiService.initialize as jest.Mock).mockResolvedValue(false);

    const { result } = renderHook(() => useMidi());

    await act(async () => {
      await result.current.initialize();
    });

    expect(result.current.isInitialized).toBe(false);
    expect(result.current.error).toBe('Failed to initialize MIDI');
  });

  it('should handle initialization errors', async () => {
    (midiService.isSupported as jest.Mock).mockReturnValue(true);
    (midiService.initialize as jest.Mock).mockRejectedValue(new Error('Permission denied'));

    const { result } = renderHook(() => useMidi());

    await act(async () => {
      await result.current.initialize();
    });

    expect(result.current.isInitialized).toBe(false);
    expect(result.current.error).toBe('Permission denied');
  });

  it('should enable specific device', () => {
    const { result } = renderHook(() => useMidi());

    act(() => {
      result.current.enableDevice('device1');
    });

    expect(midiService.enableDevice).toHaveBeenCalledWith('device1');
  });

  it('should disable specific device', () => {
    const { result } = renderHook(() => useMidi());

    act(() => {
      result.current.disableDevice('device1');
    });

    expect(midiService.disableDevice).toHaveBeenCalledWith('device1');
  });

  it('should refresh devices', () => {
    (midiService.getDevices as jest.Mock).mockReturnValue([
      { id: 'device1', name: 'MIDI Keyboard', manufacturer: 'Test', enabled: true },
    ]);

    const { result } = renderHook(() => useMidi());

    act(() => {
      result.current.refreshDevices();
    });

    expect(result.current.devices).toHaveLength(1);
  });

  it('should subscribe to MIDI messages when initialized', async () => {
    (midiService.isSupported as jest.Mock).mockReturnValue(true);
    (midiService.initialize as jest.Mock).mockResolvedValue(true);
    (midiService.getDevices as jest.Mock).mockReturnValue([]);

    const onNoteOn = jest.fn();
    const onNoteOff = jest.fn();

    const { result } = renderHook(() => useMidi({ onNoteOn, onNoteOff }));

    await act(async () => {
      await result.current.initialize();
    });

    expect(midiService.onMessage).toHaveBeenCalled();
  });

  it('should call onNoteOn callback for note on messages', async () => {
    (midiService.isSupported as jest.Mock).mockReturnValue(true);
    (midiService.initialize as jest.Mock).mockResolvedValue(true);
    (midiService.getDevices as jest.Mock).mockReturnValue([]);

    let messageCallback: (message: { type: string; note: number; velocity: number }) => void = () => {};
    (midiService.onMessage as jest.Mock).mockImplementation((cb) => {
      messageCallback = cb;
      return mockUnsubscribe;
    });

    const onNoteOn = jest.fn();
    const onNoteOff = jest.fn();

    const { result } = renderHook(() => useMidi({ onNoteOn, onNoteOff }));

    await act(async () => {
      await result.current.initialize();
    });

    act(() => {
      messageCallback({ type: 'noteon', note: 60, velocity: 0.8 });
    });

    expect(onNoteOn).toHaveBeenCalledWith(60, 0.8);
  });

  it('should call onNoteOff callback for note off messages', async () => {
    (midiService.isSupported as jest.Mock).mockReturnValue(true);
    (midiService.initialize as jest.Mock).mockResolvedValue(true);
    (midiService.getDevices as jest.Mock).mockReturnValue([]);

    let messageCallback: (message: { type: string; note: number; velocity: number }) => void = () => {};
    (midiService.onMessage as jest.Mock).mockImplementation((cb) => {
      messageCallback = cb;
      return mockUnsubscribe;
    });

    const onNoteOn = jest.fn();
    const onNoteOff = jest.fn();

    const { result } = renderHook(() => useMidi({ onNoteOn, onNoteOff }));

    await act(async () => {
      await result.current.initialize();
    });

    act(() => {
      messageCallback({ type: 'noteoff', note: 60 });
    });

    expect(onNoteOff).toHaveBeenCalledWith(60);
  });

  it('should subscribe to device changes when initialized', async () => {
    (midiService.isSupported as jest.Mock).mockReturnValue(true);
    (midiService.initialize as jest.Mock).mockResolvedValue(true);
    (midiService.getDevices as jest.Mock).mockReturnValue([]);

    const { result } = renderHook(() => useMidi());

    await act(async () => {
      await result.current.initialize();
    });

    expect(midiService.onDeviceChange).toHaveBeenCalled();
  });

  it('should update devices on device change', async () => {
    (midiService.isSupported as jest.Mock).mockReturnValue(true);
    (midiService.initialize as jest.Mock).mockResolvedValue(true);
    (midiService.getDevices as jest.Mock).mockReturnValue([]);

    let deviceChangeCallback: () => void = () => {};
    (midiService.onDeviceChange as jest.Mock).mockImplementation((cb) => {
      deviceChangeCallback = cb;
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useMidi());

    await act(async () => {
      await result.current.initialize();
    });

    // Simulate device connected
    (midiService.getDevices as jest.Mock).mockReturnValue([
      { id: 'device1', name: 'New Device', manufacturer: 'Test', enabled: true },
    ]);

    act(() => {
      deviceChangeCallback();
    });

    await waitFor(() => expect(result.current.devices).toHaveLength(1));

    expect(result.current.devices[0].name).toBe('New Device');
  });

  it('should NOT dispose MIDI service on unmount (persists across navigation)', async () => {
    (midiService.isSupported as jest.Mock).mockReturnValue(true);
    (midiService.initialize as jest.Mock).mockResolvedValue(true);
    (midiService.getDevices as jest.Mock).mockReturnValue([]);

    const { result, unmount } = renderHook(() => useMidi());

    await act(async () => {
      await result.current.initialize();
    });

    unmount();

    // MIDI state persists across navigation - dispose should NOT be called
    expect(midiService.dispose).not.toHaveBeenCalled();
  });

  it('should not dispose if never initialized', () => {
    const { unmount } = renderHook(() => useMidi());

    unmount();

    expect(midiService.dispose).not.toHaveBeenCalled();
  });

  it('should unsubscribe from messages on unmount', async () => {
    (midiService.isSupported as jest.Mock).mockReturnValue(true);
    (midiService.initialize as jest.Mock).mockResolvedValue(true);
    (midiService.getDevices as jest.Mock).mockReturnValue([]);

    const { result, unmount } = renderHook(() => useMidi({ onNoteOn: jest.fn() }));

    await act(async () => {
      await result.current.initialize();
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
