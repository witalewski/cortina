/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// Mock Tone.js
jest.mock('tone', () => {
  const mockSynth = {
    triggerAttack: jest.fn(),
    triggerRelease: jest.fn(),
    toDestination: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
  };

  const mockPolySynth = jest.fn(() => mockSynth);

  return {
    start: jest.fn().mockResolvedValue(undefined),
    PolySynth: mockPolySynth,
    Synth: jest.fn(),
    context: {
      state: 'running',
    },
  };
});

describe('AudioEngine', () => {
  let mockSynth: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Reset the singleton instance
    const { audioEngine } = require('../audio');
    (audioEngine as any).synth = null;
    (audioEngine as any).initialized = false;
    
    // Get fresh mockSynth reference
    const Tone = require('tone');
    mockSynth = new Tone.PolySynth();
  });

  describe('initialize', () => {
    it('should start Tone.js and create synth', async () => {
      const { audioEngine } = require('../audio');
      const Tone = require('tone');
      
      // Clear the beforeEach mock call
      Tone.PolySynth.mockClear();
      
      await audioEngine.initialize();

      expect(Tone.start).toHaveBeenCalledTimes(1);
      expect(Tone.PolySynth).toHaveBeenCalledTimes(1);
      expect(audioEngine.isInitialized()).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      const { audioEngine } = require('../audio');
      const Tone = require('tone');
      
      // Clear the beforeEach mock call
      Tone.PolySynth.mockClear();
      
      await audioEngine.initialize();
      await audioEngine.initialize();

      expect(Tone.start).toHaveBeenCalledTimes(1);
      expect(Tone.PolySynth).toHaveBeenCalledTimes(1);
    });

    it('should return running context state', () => {
      const { audioEngine } = require('../audio');
      expect(audioEngine.getContextState()).toBe('running');
    });
  });

  describe('noteOn', () => {
    beforeEach(async () => {
      const { audioEngine } = require('../audio');
      await audioEngine.initialize();
      mockSynth = (audioEngine as any).synth;
    });

    it('should trigger attack with Note string', () => {
      const { audioEngine } = require('../audio');
      audioEngine.noteOn('C4', 0.8);

      expect(mockSynth.triggerAttack).toHaveBeenCalledWith('C4', undefined, 0.8);
    });

    it('should convert MIDI note to Note string', () => {
      const { audioEngine } = require('../audio');
      audioEngine.noteOn(60, 0.8); // MIDI 60 = C4

      expect(mockSynth.triggerAttack).toHaveBeenCalledWith('C4', undefined, 0.8);
    });

    it('should handle different MIDI notes correctly', () => {
      const { audioEngine } = require('../audio');
      const testCases = [
        { midi: 48, expected: 'C3' },
        { midi: 60, expected: 'C4' },
        { midi: 61, expected: 'C#4' },
        { midi: 62, expected: 'D4' },
        { midi: 72, expected: 'C5' },
      ];

      testCases.forEach(({ midi, expected }) => {
        mockSynth.triggerAttack.mockClear();
        audioEngine.noteOn(midi);
        expect(mockSynth.triggerAttack).toHaveBeenCalledWith(
          expected,
          undefined,
          expect.any(Number)
        );
      });
    });

    it('should clamp velocity to 0-1 range', () => {
      const { audioEngine } = require('../audio');
      audioEngine.noteOn('C4', 1.5);
      expect(mockSynth.triggerAttack).toHaveBeenCalledWith('C4', undefined, 1);

      audioEngine.noteOn('C4', -0.5);
      expect(mockSynth.triggerAttack).toHaveBeenCalledWith('C4', undefined, 0);
    });

    it('should use default velocity if not provided', () => {
      const { audioEngine } = require('../audio');
      audioEngine.noteOn('C4');
      expect(mockSynth.triggerAttack).toHaveBeenCalledWith('C4', undefined, 0.8);
    });

    it('should warn if not initialized', () => {
      const { audioEngine } = require('../audio');
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      (audioEngine as any).synth = null;

      audioEngine.noteOn('C4');

      expect(consoleSpy).toHaveBeenCalledWith('Audio engine not initialized');
      expect(mockSynth.triggerAttack).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('noteOff', () => {
    beforeEach(async () => {
      const { audioEngine } = require('../audio');
      await audioEngine.initialize();
      mockSynth = (audioEngine as any).synth;
    });

    it('should trigger release with Note string', () => {
      const { audioEngine } = require('../audio');
      audioEngine.noteOff('C4');

      expect(mockSynth.triggerRelease).toHaveBeenCalledWith('C4');
    });

    it('should convert MIDI note to Note string', () => {
      const { audioEngine } = require('../audio');
      audioEngine.noteOff(60);

      expect(mockSynth.triggerRelease).toHaveBeenCalledWith('C4');
    });

    it('should not trigger if not initialized', () => {
      const { audioEngine } = require('../audio');
      (audioEngine as any).synth = null;

      audioEngine.noteOff('C4');

      expect(mockSynth.triggerRelease).not.toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('should dispose synth and reset state', async () => {
      const { audioEngine } = require('../audio');
      await audioEngine.initialize();
      mockSynth = (audioEngine as any).synth;

      audioEngine.dispose();

      expect(mockSynth.dispose).toHaveBeenCalledTimes(1);
      expect(audioEngine.isInitialized()).toBe(false);
      expect((audioEngine as any).synth).toBeNull();
    });
  });

  describe('MIDI to Note conversion edge cases', () => {
    beforeEach(async () => {
      const { audioEngine } = require('../audio');
      await audioEngine.initialize();
      mockSynth = (audioEngine as any).synth;
    });

    it('should handle all 12 chromatic notes', () => {
      const { audioEngine } = require('../audio');
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      
      notes.forEach((note, index) => {
        mockSynth.triggerAttack.mockClear();
        audioEngine.noteOn(60 + index); // C4 to B4
        expect(mockSynth.triggerAttack).toHaveBeenCalledWith(
          `${note}4`,
          undefined,
          expect.any(Number)
        );
      });
    });

    it('should handle low MIDI notes', () => {
      const { audioEngine } = require('../audio');
      audioEngine.noteOn(0); // C-1
      expect(mockSynth.triggerAttack).toHaveBeenCalledWith('C-1', undefined, 0.8);
    });

    it('should handle high MIDI notes', () => {
      const { audioEngine } = require('../audio');
      audioEngine.noteOn(127); // G9
      expect(mockSynth.triggerAttack).toHaveBeenCalledWith('G9', undefined, 0.8);
    });
  });
});
