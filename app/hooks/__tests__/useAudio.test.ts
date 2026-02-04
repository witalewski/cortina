import { renderHook, act, waitFor } from '@testing-library/react';
import { useAudio } from '../useAudio';
import { audioEngine, WARM_PIANO_PRESET, BASIC_SYNTH_PRESET } from '@/app/services/audio';

// Mock the audio service
jest.mock('@/app/services/audio', () => ({
  audioEngine: {
    initialize: jest.fn(),
    noteOn: jest.fn(),
    noteOff: jest.fn(),
    setPreset: jest.fn(),
    getPresetName: jest.fn(() => 'Sampled Piano'),
    dispose: jest.fn(),
  },
  WARM_PIANO_PRESET: { name: 'Warm Piano', synthType: 'fm' },
  BASIC_SYNTH_PRESET: { name: 'Basic Synth', synthType: 'fm' },
  ACID_BASS_PRESET: { name: 'Acid Bass', synthType: 'mono' },
  SAMPLED_PIANO_PRESET: { name: 'Sampled Piano', synthType: 'sampler' },
}));

describe('useAudio', () => {
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Suppress console warnings and errors in tests
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useAudio());

    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isInitializing).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.presetName).toBe('Sampled Piano');
    expect(result.current.isLoadingPreset).toBe(false);
  });

  it('should initialize audio engine successfully', async () => {
    (audioEngine.initialize as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAudio());

    let initResult: boolean = false;
    await act(async () => {
      initResult = await result.current.initialize();
    });

    expect(initResult).toBe(true);
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.isInitializing).toBe(false);
    expect(result.current.error).toBe(null);
    expect(audioEngine.initialize).toHaveBeenCalledTimes(1);
  });

  it('should handle initialization errors', async () => {
    const error = new Error('Audio initialization failed');
    (audioEngine.initialize as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useAudio());

    let initResult: boolean = false;
    await act(async () => {
      initResult = await result.current.initialize();
    });

    expect(initResult).toBe(false);
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isInitializing).toBe(false);
    expect(result.current.error).toBe('Audio initialization failed');
  });

  it('should not reinitialize if already initialized', async () => {
    (audioEngine.initialize as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.initialize();
    });

    jest.clearAllMocks();

    await act(async () => {
      await result.current.initialize();
    });

    expect(audioEngine.initialize).not.toHaveBeenCalled();
  });

  it('should not reinitialize if already initializing', async () => {
    (audioEngine.initialize as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => useAudio());

    // Start first initialization
    act(() => {
      result.current.initialize();
    });

    expect(result.current.isInitializing).toBe(true);

    // Try to initialize again while first is in progress
    await act(async () => {
      const secondResult = await result.current.initialize();
      expect(secondResult).toBe(true);
    });

    // Should only have called initialize once
    await waitFor(() => expect(result.current.isInitialized).toBe(true));
    expect(audioEngine.initialize).toHaveBeenCalledTimes(1);
  });

  it('should play note when initialized', async () => {
    (audioEngine.initialize as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.initialize();
    });

    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    act(() => {
      result.current.playNote('C4', 0.8);
    });

    expect(audioEngine.noteOn).toHaveBeenCalledWith('C4', 0.8);
  });

  it('should not play note when not initialized', () => {
    const { result } = renderHook(() => useAudio());

    act(() => {
      result.current.playNote('C4', 0.8);
    });

    expect(audioEngine.noteOn).not.toHaveBeenCalled();
  });

  it('should stop note when initialized', async () => {
    (audioEngine.initialize as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.initialize();
    });

    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    act(() => {
      result.current.stopNote('C4');
    });

    expect(audioEngine.noteOff).toHaveBeenCalledWith('C4');
  });

  it('should not stop note when not initialized', () => {
    const { result } = renderHook(() => useAudio());

    act(() => {
      result.current.stopNote('C4');
    });

    expect(audioEngine.noteOff).not.toHaveBeenCalled();
  });

  it('should set preset and update preset name', async () => {
    (audioEngine.setPreset as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.setPreset(BASIC_SYNTH_PRESET);
    });

    expect(audioEngine.setPreset).toHaveBeenCalledWith(BASIC_SYNTH_PRESET);
    expect(result.current.presetName).toBe('Basic Synth');
    expect(result.current.isLoadingPreset).toBe(false);
  });

  it('should track loading state when setting preset', async () => {
    (audioEngine.setPreset as jest.Mock).mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 50))
    );

    const { result } = renderHook(() => useAudio());

    act(() => {
      result.current.setPreset(BASIC_SYNTH_PRESET);
    });

    // Should be loading immediately
    expect(result.current.isLoadingPreset).toBe(true);

    // Wait for preset to load
    await waitFor(() => expect(result.current.isLoadingPreset).toBe(false));
    expect(result.current.presetName).toBe('Basic Synth');
  });

  it('should handle preset loading errors', async () => {
    const error = new Error('Failed to load samples');
    (audioEngine.setPreset as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.setPreset(BASIC_SYNTH_PRESET);
    });

    // Should clear loading state even on error
    expect(result.current.isLoadingPreset).toBe(false);
  });

  it('should dispose audio engine on unmount', async () => {
    (audioEngine.initialize as jest.Mock).mockResolvedValue(undefined);

    const { result, unmount } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.initialize();
    });

    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    unmount();

    expect(audioEngine.dispose).toHaveBeenCalledTimes(1);
  });

  it('should not dispose if never initialized', () => {
    const { unmount } = renderHook(() => useAudio());

    unmount();

    expect(audioEngine.dispose).not.toHaveBeenCalled();
  });

  it('should expose all presets', () => {
    const { result } = renderHook(() => useAudio());

    expect(result.current.presets).toEqual({
      WARM_PIANO_PRESET,
      BASIC_SYNTH_PRESET,
      ACID_BASS_PRESET: expect.any(Object),
      SAMPLED_PIANO_PRESET: expect.any(Object),
    });
  });
});
