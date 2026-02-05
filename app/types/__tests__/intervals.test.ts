import {
  INTERVALS,
  calculateTargetNote,
  calculateInterval,
  getIntervalDisplayName,
  generateIntervalPool,
  selectRandomChallenges,
} from '../intervals';

describe('intervals', () => {
  describe('INTERVALS constant', () => {
    it('should have 9 intervals defined', () => {
      expect(Object.keys(INTERVALS)).toHaveLength(9);
    });

    it('should have correct semitone values', () => {
      expect(INTERVALS['unison'].semitones).toBe(0);
      expect(INTERVALS['minor 2nd'].semitones).toBe(1);
      expect(INTERVALS['major 2nd'].semitones).toBe(2);
      expect(INTERVALS['minor 3rd'].semitones).toBe(3);
      expect(INTERVALS['major 3rd'].semitones).toBe(4);
      expect(INTERVALS['perfect 4th'].semitones).toBe(5);
      expect(INTERVALS['diminished 5th'].semitones).toBe(6);
      expect(INTERVALS['perfect 5th'].semitones).toBe(7);
      expect(INTERVALS['perfect octave'].semitones).toBe(12);
    });

    it('should have short names for all intervals', () => {
      expect(INTERVALS['unison'].shortName).toBe('P1');
      expect(INTERVALS['perfect 5th'].shortName).toBe('P5');
      expect(INTERVALS['minor 3rd'].shortName).toBe('m3');
      expect(INTERVALS['major 3rd'].shortName).toBe('M3');
    });
  });

  describe('calculateTargetNote', () => {
    const C4_MIDI = 60;

    it('should return same note for unison', () => {
      const result = calculateTargetNote(C4_MIDI, INTERVALS['unison'], 'none');
      expect(result.targetMidi).toBe(60);
      expect(result.targetNote).toBe('C4');
    });

    it('should calculate ascending intervals correctly', () => {
      // Perfect 5th up from C4 = G4 (67)
      const p5 = calculateTargetNote(C4_MIDI, INTERVALS['perfect 5th'], 'ascending');
      expect(p5.targetMidi).toBe(67);
      expect(p5.targetNote).toBe('G4');

      // Major 3rd up from C4 = E4 (64)
      const m3 = calculateTargetNote(C4_MIDI, INTERVALS['major 3rd'], 'ascending');
      expect(m3.targetMidi).toBe(64);
      expect(m3.targetNote).toBe('E4');

      // Perfect octave up from C4 = C5 (72)
      const p8 = calculateTargetNote(C4_MIDI, INTERVALS['perfect octave'], 'ascending');
      expect(p8.targetMidi).toBe(72);
      expect(p8.targetNote).toBe('C5');
    });

    it('should calculate descending intervals correctly', () => {
      // Perfect 5th down from C4 = F3 (53)
      const p5 = calculateTargetNote(C4_MIDI, INTERVALS['perfect 5th'], 'descending');
      expect(p5.targetMidi).toBe(53);
      expect(p5.targetNote).toBe('F3');

      // Perfect octave down from C4 = C3 (48)
      const p8 = calculateTargetNote(C4_MIDI, INTERVALS['perfect octave'], 'descending');
      expect(p8.targetMidi).toBe(48);
      expect(p8.targetNote).toBe('C3');
    });

    it('should clamp to valid MIDI range', () => {
      // Try to go below 0
      const result = calculateTargetNote(5, INTERVALS['perfect octave'], 'descending');
      expect(result.targetMidi).toBe(0);

      // Try to go above 127
      const result2 = calculateTargetNote(120, INTERVALS['perfect octave'], 'ascending');
      expect(result2.targetMidi).toBe(127);
    });
  });

  describe('calculateInterval', () => {
    it('should detect unison', () => {
      const result = calculateInterval(60, 60);
      expect(result.interval?.name).toBe('unison');
      expect(result.direction).toBe('none');
    });

    it('should detect ascending intervals', () => {
      // C4 to G4 = perfect 5th ascending
      const p5 = calculateInterval(60, 67);
      expect(p5.interval?.name).toBe('perfect 5th');
      expect(p5.direction).toBe('ascending');

      // C4 to E4 = major 3rd ascending
      const m3 = calculateInterval(60, 64);
      expect(m3.interval?.name).toBe('major 3rd');
      expect(m3.direction).toBe('ascending');
    });

    it('should detect descending intervals', () => {
      // C4 to F3 = perfect 5th descending
      const p5 = calculateInterval(60, 53);
      expect(p5.interval?.name).toBe('perfect 5th');
      expect(p5.direction).toBe('descending');

      // C4 to C3 = perfect octave descending
      const p8 = calculateInterval(60, 48);
      expect(p8.interval?.name).toBe('perfect octave');
      expect(p8.direction).toBe('descending');
    });

    it('should return null for unknown intervals', () => {
      // 9 semitones = major 6th (not in our pool)
      const result = calculateInterval(60, 69);
      expect(result.interval).toBeNull();
      expect(result.direction).toBe('ascending');
    });
  });

  describe('getIntervalDisplayName', () => {
    it('should format unison without direction', () => {
      const result = getIntervalDisplayName(INTERVALS['unison'], 'none');
      expect(result).toBe('Unison');
    });

    it('should format intervals with direction', () => {
      expect(getIntervalDisplayName(INTERVALS['perfect 5th'], 'ascending'))
        .toBe('Perfect 5th (ascending)');
      expect(getIntervalDisplayName(INTERVALS['minor 3rd'], 'descending'))
        .toBe('Minor 3rd (descending)');
    });

    it('should capitalize first letter', () => {
      const result = getIntervalDisplayName(INTERVALS['major 3rd'], 'ascending');
      expect(result).toMatch(/^Major/);
    });
  });

  describe('generateIntervalPool', () => {
    it('should generate 17 challenges (1 unison + 8 intervals × 2 directions)', () => {
      const pool = generateIntervalPool(60);
      expect(pool).toHaveLength(17);
    });

    it('should have exactly one unison (direction: none)', () => {
      const pool = generateIntervalPool(60);
      const unisons = pool.filter(c => c.interval.name === 'unison');
      expect(unisons).toHaveLength(1);
      expect(unisons[0].direction).toBe('none');
    });

    it('should have ascending and descending for non-unison intervals', () => {
      const pool = generateIntervalPool(60);
      const p5s = pool.filter(c => c.interval.name === 'perfect 5th');
      expect(p5s).toHaveLength(2);
      expect(p5s.map(c => c.direction).sort()).toEqual(['ascending', 'descending']);
    });

    it('should use C4 (60) as default root note', () => {
      const pool = generateIntervalPool();
      expect(pool[0].rootMidi).toBe(60);
      expect(pool[0].rootNote).toBe('C4');
    });

    it('should calculate correct target notes', () => {
      const pool = generateIntervalPool(60);
      
      // Find ascending perfect 5th
      const p5up = pool.find(
        c => c.interval.name === 'perfect 5th' && c.direction === 'ascending'
      );
      expect(p5up?.targetMidi).toBe(67);
      expect(p5up?.targetNote).toBe('G4');

      // Find descending perfect octave
      const p8down = pool.find(
        c => c.interval.name === 'perfect octave' && c.direction === 'descending'
      );
      expect(p8down?.targetMidi).toBe(48);
      expect(p8down?.targetNote).toBe('C3');
    });
  });

  describe('selectRandomChallenges', () => {
    it('should select the requested number of challenges', () => {
      const pool = generateIntervalPool(60);
      const selected = selectRandomChallenges(pool, 5);
      expect(selected).toHaveLength(5);
    });

    it('should return unique challenges (no duplicates)', () => {
      const pool = generateIntervalPool(60);
      const selected = selectRandomChallenges(pool, 5);
      
      const uniqueKeys = new Set(
        selected.map(c => `${c.interval.name}-${c.direction}`)
      );
      expect(uniqueKeys.size).toBe(5);
    });

    it('should handle requesting more than pool size', () => {
      const pool = generateIntervalPool(60);
      const selected = selectRandomChallenges(pool, 100);
      expect(selected).toHaveLength(17); // Pool size
    });

    it('should return different challenges on multiple calls (randomness)', () => {
      const pool = generateIntervalPool(60);
      
      // Run multiple times and collect first challenge
      const firstChallenges = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const selected = selectRandomChallenges(pool, 5);
        firstChallenges.add(`${selected[0].interval.name}-${selected[0].direction}`);
      }
      
      // Should have some variety (not always the same first challenge)
      expect(firstChallenges.size).toBeGreaterThan(1);
    });
  });
});
