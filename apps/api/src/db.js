import { DatabaseSync } from 'node:sqlite';
// SQLite tích hợp trong Node.js >=22.13: không cần better-sqlite3 hoặc biên dịch native addon.
class Database extends DatabaseSync {
    pragma(value) {
        // Values below are constants from this app, never received from users.
        return this.exec(`PRAGMA ${value}`);
    }
    transaction(fn) {
        return (...args) => {
            this.exec('BEGIN IMMEDIATE');
            try {
                const result = fn(...args);
                this.exec('COMMIT');
                return result;
            } catch (error) {
                this.exec('ROLLBACK');
                throw error;
            }
        };
    }
}
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filepath = process.env.DB_PATH || path.resolve(__dirname, '../data/smartquiz.sqlite');
if (filepath !== ':memory:')
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
export const db = new Database(filepath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS quizzes (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', questions TEXT NOT NULL, config TEXT NOT NULL, public INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')),
 FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS attempts (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL, quiz_id TEXT NOT NULL, mode TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'in_progress',
 answers TEXT NOT NULL DEFAULT '{}', hint_ids TEXT NOT NULL DEFAULT '[]', question_order TEXT NOT NULL, option_order TEXT NOT NULL DEFAULT '{}',
 score INTEGER NOT NULL DEFAULT 0, correct_count INTEGER NOT NULL DEFAULT 0, streak INTEGER NOT NULL DEFAULT 0,
 started_at TEXT NOT NULL, deadline_at TEXT, finished_at TEXT,
 FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);
CREATE INDEX IF NOT EXISTS idx_quizzes_user ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz ON attempts(quiz_id);
`);
const demoAuthor = 'demo-author-0000';
if (!db.prepare('SELECT id FROM users WHERE id=?').get(demoAuthor)) {
    db.prepare('INSERT INTO users (id,name,email,password_hash) VALUES (?,?,?,?)').run(demoAuthor, 'Quizora Team', 'demo@quizora.local', '!not-loginable!');
}
const samples = [
    ['React Hook nào dùng để tạo state trong function component?', 'useState', 'useRoute', 'usePage', 'useRender', 'useState giúp lưu và cập nhật state.', 'Tên Hook chứa từ state.'],
    ['Phương thức HTTP nào thường dùng để lấy dữ liệu?', 'GET', 'POST', 'PUT', 'DELETE', 'GET được sử dụng để truy xuất tài nguyên.', 'Nghĩ đến một thao tác đọc.'],
    ['React useEffect thường được dùng để làm gì?', 'Thực hiện side effect', 'Tạo database', 'Cài Node.js', 'Định nghĩa CSS', 'useEffect giúp đồng bộ component với hệ thống bên ngoài.', 'Liên quan đến side effect.'],
    ['Mã trạng thái HTTP 404 có ý nghĩa gì?', 'Không tìm thấy tài nguyên', 'Thành công', 'Lỗi xác thực', 'Tạo mới thành công', '404 là Not Found.', 'Có một con số rất hay gặp khi URL sai.'],
    ['Định dạng phổ biến cho REST API là gì?', 'JSON', 'PNG', 'MP3', 'EXE', 'JSON thuận tiện cho việc trao đổi dữ liệu có cấu trúc.', 'Là định dạng dựa trên object và array.'],
    ['Cơ sở dữ liệu SQL lưu dữ liệu chủ yếu theo dạng nào?', 'Các bảng có quan hệ', 'File video', 'Ảnh động', 'Trang HTML', 'SQL database tổ chức dữ liệu dưới các bảng.', 'Nghĩ đến row và column.'],
    ['JWT thường được dùng để làm gì?', 'Xác thực yêu cầu API', 'Nén hình ảnh', 'Vẽ biểu đồ', 'Tạo CSS', 'JWT là một cơ chế biểu diễn thông tin xác thực dưới dạng token.', 'Nó hay xuất hiện trong Authorization header.'],
    ['Props trong React là gì?', 'Dữ liệu truyền từ component cha', 'Loại cơ sở dữ liệu', 'Công cụ build', 'Một HTTP method', 'Props được truyền cho component như tham số đầu vào.', 'Dữ liệu được truyền từ bên ngoài component.'],
    ['CSS Flexbox thường dùng để làm gì?', 'Sắp xếp bố cục linh hoạt', 'Gửi email', 'Thao tác SQL', 'Mã hóa mật khẩu', 'Flexbox giúp bố trí phần tử trên một trục.', 'Nghĩ đến display: flex.'],
    ['Git dùng để làm gì?', 'Quản lý phiên bản mã nguồn', 'Chỉnh sửa ảnh', 'Chạy backend', 'Tạo API key', 'Git theo dõi sự thay đổi của các file trong dự án.', 'Liên quan đến commit và branch.']
];
const demoId = 'demo-quiz-react-web-101';
if (!db.prepare('SELECT id FROM quizzes WHERE id=?').get(demoId)) {
    const questions = samples.map(([text, a, b, c, d, explanation, hint], i) => ({ id: `demo-q-${i + 1}`, text, options: [{ id: 'a', text: a }, { id: 'b', text: b }, { id: 'c', text: c }, { id: 'd', text: d }], correctOptionId: 'a', explanation, hint, difficulty: i < 4 ? 'easy' : 'medium' }));
    db.prepare('INSERT INTO quizzes(id,user_id,title,description,questions,config,public) VALUES (?,?,?,?,?,?,1)').run(demoId, demoAuthor, 'React & Web Development', '10 câu hỏi làm quen React, API và nền tảng Web.', JSON.stringify(questions), JSON.stringify({ timeLimit: 0, basePoints: 100, wrongPenalty: 0, hintPenalty: 15, shuffle: true, maxAttempts: 0 }));
}
export const uid = () => randomUUID();
export const parseJson = (str, fallback) => { try {
    return JSON.parse(str);
}
catch {
    return fallback;
} };
export const quizFromRow = row => row ? { ...row, public: !!row.public, questions: parseJson(row.questions, []), config: parseJson(row.config, {}) } : null;
export const attemptFromRow = row => row ? { ...row, answers: parseJson(row.answers, {}), hint_ids: parseJson(row.hint_ids, []), question_order: parseJson(row.question_order, []), option_order: parseJson(row.option_order, {}) } : null;
