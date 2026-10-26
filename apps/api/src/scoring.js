/** Pure scoring engine, shared across game modes. The server is authoritative. */
export function calculateAnswerScore({ correct, elapsedSeconds = 0, streak = 0, hinted = false, config = {} }) {
    const base = Math.max(0, Number(config.basePoints ?? 100));
    const penalty = Math.max(0, Number(config.wrongPenalty ?? 0));
    const hintPenalty = hinted ? Math.max(0, Number(config.hintPenalty ?? 15)) : 0;
    const speedBonus = correct && elapsedSeconds <= 5 ? 20 : correct && elapsedSeconds < 15 ? Math.round((15 - elapsedSeconds) * 2) : 0;
    const newStreak = correct ? streak + 1 : 0;
    const streakBonus = correct ? Math.min(30, Math.max(0, newStreak - 1) * 10) : 0;
    return { points: Math.max(-1000, (correct ? base + speedBonus + streakBonus : -penalty) - hintPenalty), newStreak, speedBonus, streakBonus };
}
export function shuffledIds(array) { const a = [...array]; for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
} return a; }
