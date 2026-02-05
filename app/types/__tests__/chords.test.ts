import {
  CHORDS,
  calculateChordNotes,
  getChordDisplayName,
  checkChordMatch,
  generateChordPool,
  selectRandomChallenges,
} from '../chords';

describe('chords', () => {
  describe('CHORDS constant', () => {
    it('should have 4 chord types defined', () => {
      expect(Object.keys(CHORDS)).toHaveLength(4);
    });

    it('should have correct interval structures', () => {
      expect(CHORDS['major'].intervals).toEqual([0, 4, 7]);
      expect(CHORDS['minor'].intervals).toEqual([0, 3, 7]);
      expect(CHORDS['diminished'].intervals).toEqual([0, 3, 6]);
      expect(CHORDS['augmented'].intervals).toEqual([0, 4, 8]);
    });

    it('should have short names for all chords', () => {
      expect(CHORDS['major'].shortName).toBe('maj');
      expect(CHORDS['minor'].shortName).toBe('min');
      expect(CHORDS['diminished'].shortName).toBe('dim');
      expect(CHORDS['augmented'].shortName).toBe('aug');
    });

    it('should have display names for all chords', () => {
      expect(CHORDS['major'].displayName).toBe('Major');
      expect(CHORDS['minor'].displayName).toBe('Minor');
      expect(CHORDS['diminished'].displayName).toBe('Diminished');
      expect(CHORDS['augmented'].displayName).toBe('Augmented');
    });
  });

  describe('calculateChordNotes', () => {
    const C4_MIDI = 60;

    it('should calculate C major triad correctly', () => {
      const result = calculateChordNotes(C4_MIDI, CHORDS['major']);
      expect(result.midiNotes).toEqual([60, 64, 67]); // C4, E4, G4
      expect(result.notes).toEqual(['C4', 'E4', 'G4']);
    });

    it('should calculate C minor triad correctly', () => {
      const result = calculateChordNotes(C4_MIDI, CHORDS['minor']);
      expect(result.midiNotes).toEqual([60, 63, 67]); // C4, D#4, G4
      expect(result.notes).toEqual(['C4', 'D#4', 'G4']);
    });

    it('should calculate C diminished triad correctly', () => {
      const result = calculateChordNotes(C4_MIDI, CHORDS['diminished']);
      expect(result.midiNotes).toEqual([60, 63, 66]); // C4, D#4, F#4
      expect(result.notes).toEqual(['C4', 'D#4', 'F#4']);
    });

    it('should calculate C augmented triad correctly', () => {
      const result = calculateChordNotes(C4_MIDI, CHORDS['augmented']);
      expect(result.midiNotes).toEqual([60, 64, 68]); // C4, E4, G#4
      expect(result.notes).toEqual(['C4', 'E4', 'G#4']);
    });

    it('should calculate chord from different root notes', () => {
      // G3 major (MIDI 55)
      const g3maj = calculateChordNotes(55, CHORDS['major']);
      expect(g3maj.midiNotes).toEqual([55, 59, 62]); // G3, B3, D4
      expect(g3maj.notes).toEqual(['G3', 'B3', 'D4']);

      // D4 minor (MIDI 62)
      const d4min = calculateChordNotes(62, CHORDS['minor']);
      expect(d4min.midiNotes).toEqual([62, 65, 69]); // D4, F4, A4
      expect(d4min.notes).toEqual(['D4', 'F4', 'A4']);
    });

    it('should clamp to valid MIDI range', () => {
      // Try to go above 127
      const result = calculateChordNotes(125, CHORDS['major']);
      expect(result.midiNotes[0]).toBe(125);
      expect(result.midiNotes[2]).toBe(127); // Clamped

      // Try to go below 0
      const result2 = calculateChordNotes(2, CHORDS['diminished']);
      expect(result2.midiNotes[0]).toBe(2);
      expect(result2.midiNotes[1]).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getChordDisplayName', () => {
    it('should format chord names correctly', () => {
      expect(getChordDisplayName('C4', CHORDS['major'])).toBe('C Major');
      expect(getChordDisplayName('D4', CHORDS['minor'])).toBe('D Minor');
      expect(getChordDisplayName('E3', CHORDS['diminished'])).toBe('E Diminished');
      expect(getChordDisplayName('F#4', CHORDS['augmented'])).toBe('F# Augmented');
    });

    it('should remove octave numbers from root note', () => {
      expect(getChordDisplayName('C4', CHORDS['major'])).toContain('C ');
      expect(getChordDisplayName('C5', CHORDS['major'])).toContain('C ');
      expect(getChordDisplayName('A#3', CHORDS['minor'])).toContain('A# ');
    });
  });

  describe('checkChordMatch', () => {
    it('should return true for exact matches', () => {
      const expected = [60, 64, 67]; // C major
      const played = [60, 64, 67];
      expect(checkChordMatch(played, expected)).toBe(true);
    });

    it('should return true for matches in different order', () => {
      const expected = [60, 64, 67]; // C major
      const played1 = [67, 60, 64]; // Different order
      const played2 = [64, 67, 60]; // Another order
      expect(checkChordMatch(played1, expected)).toBe(true);
      expect(checkChordMatch(played2, expected)).toBe(true);
    });

    it('should return false for wrong notes', () => {
      const expected = [60, 64, 67]; // C major
      const played = [60, 63, 67]; // C minor
      expect(checkChordMatch(played, expected)).toBe(false);
    });

    it('should return false for different number of notes', () => {
      const expected = [60, 64, 67]; // C major
      const played1 = [60, 64]; // Too few
      const played2 = [60, 64, 67, 72]; // Too many
      expect(checkChordMatch(played1, expected)).toBe(false);
      expect(checkChordMatch(played2, expected)).toBe(false);
    });

    it('should return false for empty arrays', () => {
      const expected = [60, 64, 67];
      const played: number[] = [];
      expect(checkChordMatch(played, expected)).toBe(false);
    });

    it('should return true for both empty arrays', () => {
      expect(checkChordMatch([], [])).toBe(true);
    });
  });

  describe('generateChordPool', () => {
    it('should generate 4 challenges (1 root note × 4 chord types)', () => {
      const pool = generateChordPool();
      expect(pool).toHaveLength(4);
    });

    it('should have all 4 chord types for C4 root note', () => {
      const pool = generateChordPool();
      const c4Chords = pool.filter(c => c.rootNote === 'C4');
      expect(c4Chords).toHaveLength(4);

      const chordTypes = c4Chords.map(c => c.chord.name).sort();
      expect(chordTypes).toEqual(['augmented', 'diminished', 'major', 'minor']);
    });

    it('should use only C4 as root note', () => {
      const pool = generateChordPool();
      const rootNotes = new Set(pool.map(c => c.rootNote));

      // Expected: only C4
      expect(rootNotes.size).toBe(1);
      expect(rootNotes).toContain('C4');
    });

    it('should have correct notes for each chord', () => {
      const pool = generateChordPool();

      // Find C4 major
      const c4maj = pool.find(c => c.rootNote === 'C4' && c.chord.name === 'major');
      expect(c4maj?.notes).toEqual(['C4', 'E4', 'G4']);
      expect(c4maj?.midiNotes).toEqual([60, 64, 67]);

      // Find C4 minor
      const c4min = pool.find(c => c.rootNote === 'C4' && c.chord.name === 'minor');
      expect(c4min?.notes).toEqual(['C4', 'D#4', 'G4']);
      expect(c4min?.midiNotes).toEqual([60, 63, 67]);
    });

    it('should have correct display names', () => {
      const pool = generateChordPool();

      const c4maj = pool.find(c => c.rootNote === 'C4' && c.chord.name === 'major');
      expect(c4maj?.displayName).toBe('C Major');

      const c4min = pool.find(c => c.rootNote === 'C4' && c.chord.name === 'minor');
      expect(c4min?.displayName).toBe('C Minor');
    });
  });

  describe('selectRandomChallenges', () => {
    it('should select the requested number of challenges', () => {
      const pool = generateChordPool();
      const selected = selectRandomChallenges(pool, 3);
      expect(selected).toHaveLength(3);
    });

    it('should return unique challenges (no duplicates)', () => {
      const pool = generateChordPool();
      const selected = selectRandomChallenges(pool, 3);

      const uniqueKeys = new Set(
        selected.map(c => `${c.rootNote}-${c.chord.name}`)
      );
      expect(uniqueKeys.size).toBe(3);
    });

    it('should handle requesting more than pool size', () => {
      const pool = generateChordPool();
      const selected = selectRandomChallenges(pool, 100);
      expect(selected).toHaveLength(4); // Pool size
    });

    it('should return different challenges on multiple calls (randomness)', () => {
      const pool = generateChordPool();

      // Run multiple times and collect first challenge
      const firstChallenges = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const selected = selectRandomChallenges(pool, 5);
        firstChallenges.add(`${selected[0].rootNote}-${selected[0].chord.name}`);
      }

      // Should have some variety (not always the same first challenge)
      expect(firstChallenges.size).toBeGreaterThan(1);
    });
  });
});
