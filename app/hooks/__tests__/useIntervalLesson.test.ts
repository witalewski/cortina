import { renderHook, act } from '@testing-library/react';
import { useIntervalLesson } from '../useIntervalLesson';

describe('useIntervalLesson', () => {
  describe('initial state', () => {
    it('should start with no current challenge', () => {
      const { result } = renderHook(() => useIntervalLesson());
      
      expect(result.current.currentChallenge).toBeNull();
      expect(result.current.challengeIndex).toBe(0);
      expect(result.current.attempts).toBe(0);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.score).toBeNull();
    });

    it('should not reveal name or show hints initially', () => {
      const { result } = renderHook(() => useIntervalLesson());
      
      expect(result.current.shouldRevealName).toBe(false);
      expect(result.current.shouldShowHints).toBe(false);
    });
  });

  describe('startLesson', () => {
    it('should generate 5 challenges', () => {
      const { result } = renderHook(() => useIntervalLesson());
      
      act(() => {
        result.current.startLesson();
      });

      expect(result.current.currentChallenge).not.toBeNull();
      expect(result.current.challengeIndex).toBe(0);
    });

    it('should reset state when starting a new lesson', () => {
      const { result } = renderHook(() => useIntervalLesson());
      
      // Start and progress
      act(() => {
        result.current.startLesson();
      });
      act(() => {
        result.current.submitAnswer('C4', 'G4'); // Some answer
        result.current.moveToNextChallenge();
      });
      
      // Start new lesson
      act(() => {
        result.current.startLesson();
      });

      expect(result.current.challengeIndex).toBe(0);
      expect(result.current.attempts).toBe(0);
    });
  });

  describe('submitAnswer', () => {
    it('should increment attempts on wrong answer', () => {
      const { result } = renderHook(() => useIntervalLesson());
      
      act(() => {
        result.current.startLesson();
      });

      const initialAttempts = result.current.attempts;
      
      act(() => {
        // Submit a likely wrong answer (random notes)
        result.current.submitAnswer('C4', 'C4'); // Unison - may or may not match
      });

      expect(result.current.attempts).toBe(initialAttempts + 1);
    });

    it('should return correct=true when answer matches', () => {
      const { result } = renderHook(() => useIntervalLesson());
      
      act(() => {
        result.current.startLesson();
      });

      const challenge = result.current.currentChallenge!;
      
      let response: { correct: boolean; isLastAttempt: boolean };
      act(() => {
        // Submit the correct answer
        response = result.current.submitAnswer(challenge.rootNote, challenge.targetNote);
      });

      expect(response!.correct).toBe(true);
    });

    it('should return isLastAttempt=true after 7 attempts', () => {
      const { result } = renderHook(() => useIntervalLesson());
      
      act(() => {
        result.current.startLesson();
      });

      // Submit 6 wrong answers
      for (let i = 0; i < 6; i++) {
        act(() => {
          result.current.submitAnswer('A0', 'B0'); // Definitely wrong interval
        });
      }

      // 7th attempt should be last
      let response: { correct: boolean; isLastAttempt: boolean };
      act(() => {
        response = result.current.submitAnswer('A0', 'B0');
      });

      expect(response!.isLastAttempt).toBe(true);
      expect(result.current.attempts).toBe(7);
    });
  });

  describe('progressive hints', () => {
    it('should reveal name after 3 attempts', () => {
      const { result } = renderHook(() => useIntervalLesson());
      
      act(() => {
        result.current.startLesson();
      });

      expect(result.current.shouldRevealName).toBe(false);

      // Make 3 wrong attempts
      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current.submitAnswer('A0', 'B0');
        });
      }

      expect(result.current.shouldRevealName).toBe(true);
    });

    it('should show hints after 4 attempts', () => {
      const { result } = renderHook(() => useIntervalLesson());
      
      act(() => {
        result.current.startLesson();
      });

      expect(result.current.shouldShowHints).toBe(false);

      // Make 4 wrong attempts
      for (let i = 0; i < 4; i++) {
        act(() => {
          result.current.submitAnswer('A0', 'B0');
        });
      }

      expect(result.current.shouldShowHints).toBe(true);
    });
  });

  describe('moveToNextChallenge', () => {
    it('should advance to next challenge', () => {
      const { result } = renderHook(() => useIntervalLesson());
      
      act(() => {
        result.current.startLesson();
      });

      const firstChallenge = result.current.currentChallenge;

      act(() => {
        result.current.submitAnswer('C4', 'C4'); // Any answer
        result.current.moveToNextChallenge();
      });

      expect(result.current.challengeIndex).toBe(1);
      expect(result.current.attempts).toBe(0); // Reset for new challenge
      // Challenge should change (different object)
      expect(result.current.currentChallenge).not.toBe(firstChallenge);
    });

    it('should mark lesson complete after 5 challenges', () => {
      const { result } = renderHook(() => useIntervalLesson());
      
      act(() => {
        result.current.startLesson();
      });

      // Complete all 5 challenges
      for (let i = 0; i < 5; i++) {
        const challenge = result.current.currentChallenge!;
        act(() => {
          result.current.submitAnswer(challenge.rootNote, challenge.targetNote);
          result.current.moveToNextChallenge();
        });
      }

      expect(result.current.isComplete).toBe(true);
    });
  });

  describe('score calculation', () => {
    it('should calculate correct count', () => {
      const { result } = renderHook(() => useIntervalLesson());
      
      act(() => {
        result.current.startLesson();
      });

      // Answer 3 correctly, 2 incorrectly (max attempts)
      for (let i = 0; i < 5; i++) {
        const challenge = result.current.currentChallenge!;
        act(() => {
          if (i < 3) {
            // Correct answer
            result.current.submitAnswer(challenge.rootNote, challenge.targetNote);
          } else {
            // Max out attempts with wrong answers
            for (let j = 0; j < 7; j++) {
              result.current.submitAnswer('A0', 'B0');
            }
          }
          result.current.moveToNextChallenge();
        });
      }

      expect(result.current.score?.correctCount).toBe(3);
      expect(result.current.score?.totalChallenges).toBe(5);
    });

    it('should track results per challenge', () => {
      const { result } = renderHook(() => useIntervalLesson());
      
      act(() => {
        result.current.startLesson();
      });

      // Complete all challenges correctly on first try
      for (let i = 0; i < 5; i++) {
        const challenge = result.current.currentChallenge!;
        act(() => {
          result.current.submitAnswer(challenge.rootNote, challenge.targetNote);
          result.current.moveToNextChallenge();
        });
      }

      expect(result.current.score?.results).toHaveLength(5);
      result.current.score?.results.forEach(r => {
        expect(r.succeeded).toBe(true);
        expect(r.attemptsCount).toBe(1);
      });
    });
  });

  describe('resetLesson', () => {
    it('should clear all state', () => {
      const { result } = renderHook(() => useIntervalLesson());
      
      act(() => {
        result.current.startLesson();
      });

      // Progress through some challenges
      act(() => {
        result.current.submitAnswer('C4', 'C4');
        result.current.moveToNextChallenge();
      });

      act(() => {
        result.current.resetLesson();
      });

      expect(result.current.currentChallenge).toBeNull();
      expect(result.current.challengeIndex).toBe(0);
      expect(result.current.attempts).toBe(0);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.score).toBeNull();
    });
  });
});
