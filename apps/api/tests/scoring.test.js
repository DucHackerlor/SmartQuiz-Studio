import { describe, it, expect } from 'vitest';
import { calculateAnswerScore } from '../src/scoring.js';
describe('Scoring Engine', () => {
    it('thuong toc do cho cau tra loi dung', () => { expect(calculateAnswerScore({ correct: true, elapsedSeconds: 3, config: { basePoints: 100 } }).points).toBe(120); });
    it('tinh phat sai va hint', () => { expect(calculateAnswerScore({ correct: false, hinted: true, config: { wrongPenalty: 20, hintPenalty: 15 } }).points).toBe(-35); });
    it('thuong streak va khong vuot 30', () => { expect(calculateAnswerScore({ correct: true, streak: 10, elapsedSeconds: 20 }).streakBonus).toBe(30); });
    it('reset streak neu tra loi sai', () => { expect(calculateAnswerScore({ correct: false, streak: 5 }).newStreak).toBe(0); });
});
