import { db } from './db.js';

// Hai giới hạn áp dụng đồng thời: theo tài khoản và trên toàn dịch vụ.
// Dùng transaction SQLite để hai request song song không thể vượt giới hạn.
db.exec(`CREATE TABLE IF NOT EXISTS ai_daily_usage (
  usage_date TEXT NOT NULL,
  principal TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (usage_date, principal)
);`);

function cap(value, fallback) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 && n <= 10000 ? n : fallback;
}
export function aiLimits() {
  return {
    perUser: cap(process.env.AI_USER_DAILY_LIMIT, 8),
    global: cap(process.env.AI_GLOBAL_DAILY_LIMIT, 100)
  };
}
function usage(date, principal) {
  return Number(db.prepare('SELECT used FROM ai_daily_usage WHERE usage_date=? AND principal=?').get(date, principal)?.used ?? 0);
}
export function takeAiCredit(userId, now = new Date()) {
  if (typeof userId !== 'string' || !userId) throw new Error('Missing userId');
  const date = now.toISOString().slice(0, 10);
  const { perUser, global } = aiLimits();
  return db.transaction(() => {
    const user = `user:${userId}`;
    const userUsed = usage(date, user);
    const globalUsed = usage(date, 'global');
    if (userUsed >= perUser || globalUsed >= global) {
      const error = new Error(userUsed >= perUser
        ? 'Bạn đã hết lượt AI trong ngày. Hãy thử lại ngày mai (giờ UTC).'
        : 'Hệ thống đã đạt hạn mức AI dùng chung hôm nay. Vui lòng thử lại ngày mai.');
      error.status = 429;
      throw error;
    }
    const stmt = db.prepare(`INSERT INTO ai_daily_usage(usage_date,principal,used) VALUES (?,?,1)
      ON CONFLICT(usage_date,principal) DO UPDATE SET used=used+1`);
    stmt.run(date, user);
    stmt.run(date, 'global');
    return { remaining: perUser - userUsed - 1, remainingGlobal: global - globalUsed - 1 };
  })();
}
export function remainingCredits(userId, now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  const { perUser, global } = aiLimits();
  return {
    remaining: Math.max(0, perUser - usage(date, `user:${userId}`)),
    globalAvailable: Math.max(0, global - usage(date, 'global')) > 0,
    resetsAt: `${new Date(Date.parse(date + 'T00:00:00Z') + 86400000).toISOString()}`
  };
}
