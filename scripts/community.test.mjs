import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

process.env.DB_PATH = ':memory:';
process.env.AI_USER_DAILY_LIMIT = '2';
process.env.AI_GLOBAL_DAILY_LIMIT = '3';
let takeAiCredit, remainingCredits, aiLimits;
before(async () => ({takeAiCredit, remainingCredits, aiLimits} = await import('../apps/api/src/ai-quota.js')));

test('Giới hạn cộng đồng: theo user và toàn hệ thống; không vượt khi gọi tiếp', () => {
  const date = new Date('2026-10-26T08:00:00.000Z');
  assert.equal(aiLimits().perUser, 2);
  assert.equal(takeAiCredit('u1', date).remaining, 1);
  assert.equal(takeAiCredit('u1', date).remaining, 0);
  assert.throws(() => takeAiCredit('u1', date), e => e.status === 429);
  assert.equal(takeAiCredit('u2', date).remainingGlobal, 0);
  assert.throws(() => takeAiCredit('u3', date), e => e.status === 429);
  assert.equal(remainingCredits('u1', date).remaining, 0);
  assert.equal(remainingCredits('u3', date).globalAvailable, false);
});

test('Giới hạn tự đặt lại khi chuyển ngày UTC', () => {
  const date = new Date('2026-10-27T08:00:00.000Z');
  assert.equal(takeAiCredit('u1', date).remaining, 1);
  assert.equal(remainingCredits('u1', date).remaining, 1);
});

test('Cấu hình an toàn: frontend không có khóa, .env không nằm trong Git', () => {
  const gitignore = readFileSync('.gitignore', 'utf8');
  const frontend = readFileSync('apps/web/src/main.jsx', 'utf8');
  const vite = readFileSync('apps/web/vite.config.js', 'utf8');
  assert.match(gitignore, /^\.env$/m);
  assert.doesNotMatch(frontend, /GEMINI_API_KEY|AIza[0-9a-zA-Z_-]{20,}/);
  assert.match(vite, /'\/api'/);
  assert.match(frontend, /Segoe UI|Gemini|Quiz/);
});

test('Cấu hình Gemini do backend quản lý, không nhúng vào ứng dụng React', () => {
  const backend = readFileSync('apps/api/src/ai.js', 'utf8');
  const frontend = readFileSync('apps/web/src/main.jsx', 'utf8');
  assert.match(backend, /process\.env\.GEMINI_API_KEY/);
  assert.doesNotMatch(frontend, /process\.env\.GEMINI_API_KEY|import\.meta\.env\.VITE_GEMINI/);
});
