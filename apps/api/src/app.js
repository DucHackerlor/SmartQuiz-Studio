import './config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { z, ZodError } from 'zod';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { db, uid, quizFromRow, attemptFromRow } from './db.js';
import { generateQuestions, imageToText, validateQuestionPayload, demoGenerate } from './ai.js';
import { geminiModel } from './gemini-settings.js';
import { aiProvider, groqModel, isAiConfigured } from './ai-provider.js';
import { takeAiCredit, remainingCredits } from './ai-quota.js';
import { calculateAnswerScore, shuffledIds } from './scoring.js';
export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: [...new Set([...(process.env.WEB_ORIGIN || 'http://localhost:5173').split(','), 'http://localhost:5173', 'http://127.0.0.1:5173'])], credentials: false }));
app.use(express.json({ limit: '500kb' }));
const api = express.Router();
app.use('/api', api);
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 25, standardHeaders: 'draft-7', legacyHeaders: false });
const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });
const signupSchema = z.object({ name: z.string().trim().min(2).max(60), email: z.string().email().max(120), password: z.string().min(8).max(100) });
const jwtSecret = process.env.JWT_SECRET || 'LOCAL-DEV-ONLY-SECRET-CHANGE-IN-ENV';
const token = user => jwt.sign({ sub: user.id, name: user.name }, jwtSecret, { expiresIn: '7d' });
const bad = (status, message) => { const e = new Error(message); e.status = status; throw e; };
const wrap = fn => (req, res, next) => Promise.resolve().then(() => fn(req, res, next)).catch(next);
function auth(req, res, next) {
    try {
        const t = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
        if (!t)
            return res.status(401).json({ error: 'Bạn cần đăng nhập.' });
        const decoded = jwt.verify(t, jwtSecret);
        const u = db.prepare('SELECT id,name,email FROM users WHERE id=?').get(decoded.sub);
        if (!u)
            return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ.' });
        req.user = u;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Phiên đã hết hạn. Hãy đăng nhập lại.' });
    }
}
const configSchema = z.object({ timeLimit: z.coerce.number().int().min(0).max(3600).default(0), basePoints: z.coerce.number().int().min(10).max(1000).default(100), wrongPenalty: z.coerce.number().int().min(0).max(100).default(0), hintPenalty: z.coerce.number().int().min(0).max(100).default(15), shuffle: z.boolean().default(true), maxAttempts: z.coerce.number().int().min(0).max(100).default(0) });
const quizSchema = z.object({ title: z.string().trim().min(3).max(120), description: z.string().max(700).default(''), questions: z.array(z.unknown()).min(1).max(30), config: configSchema, public: z.boolean().default(false) });
const modes = ['classic', 'chicken', 'millionaire', 'race', 'matching'];
const safeQuestion = q => ({ id: q.id, text: q.text, options: q.options.map(o => ({ id: o.id, text: o.text })), difficulty: q.difficulty });
const toSummary = q => ({ id: q.id, title: q.title, description: q.description, public: q.public, questionCount: q.questions.length, created_at: q.created_at, user_id: q.user_id });
function getQuiz(id) { return quizFromRow(db.prepare('SELECT * FROM quizzes WHERE id=?').get(id)); }
function assertAllowed(q, u, owner = false) { if (!q)
    bad(404, 'Không tìm thấy bộ quiz.'); if (owner ? q.user_id !== u.id : (!q.public && q.user_id !== u.id))
    bad(403, 'Bạn không có quyền truy cập bộ quiz này.'); }
function getAttempt(id, userId) { const at = attemptFromRow(db.prepare('SELECT * FROM attempts WHERE id=? AND user_id=?').get(id, userId)); if (!at)
    bad(404, 'Không tìm thấy lượt làm bài.'); return at; }
function attemptView(at, quiz) { const done = Object.keys(at.answers); const questions = at.question_order.map(id => quiz.questions.find(q => q.id === id)).filter(Boolean).map(q => ({ ...safeQuestion(q), options: (at.option_order[q.id] || q.options.map(o => o.id)).map(id => q.options.find(o => o.id === id)).filter(Boolean) })); return { id: at.id, quizId: quiz.id, title: quiz.title, mode: at.mode, status: at.status, startedAt: at.started_at, deadlineAt: at.deadline_at, score: at.score, correctCount: at.correct_count, total: questions.length, answeredIds: done, hintIds: at.hint_ids, questions, answers: at.status === 'completed' ? at.answers : undefined, config: quiz.config }; }
function finaliseIfNeeded(at, quiz, force = false) { if (at.status === 'completed')
    return at; const expired = at.deadline_at && Date.now() >= Date.parse(at.deadline_at); if (force || expired || Object.keys(at.answers).length >= at.question_order.length) {
    db.prepare("UPDATE attempts SET status='completed',finished_at=? WHERE id=?").run(new Date().toISOString(), at.id);
    return getAttempt(at.id, at.user_id);
} return at; }
api.get('/health', (req, res) => res.json({ ok: true, service: 'SmartQuiz API', aiConfigured: isAiConfigured(), aiMode: process.env.AI_MODE === 'demo' ? 'demo' : 'real', aiProvider: aiProvider(), aiModel: aiProvider() === 'groq' ? groqModel() : geminiModel(), sharedAi: true }));
api.get('/ai/usage', auth, (req, res) => res.json({ ...remainingCredits(req.user.id), sharedAi: true }));
api.post('/auth/register', authLimiter, wrap(async (req, res) => { const d = signupSchema.parse(req.body); const email = d.email.toLowerCase(); if (db.prepare('SELECT id FROM users WHERE email=?').get(email))
    bad(409, 'Email này đã được sử dụng.'); const id = uid(); db.prepare('INSERT INTO users(id,name,email,password_hash) VALUES (?,?,?,?)').run(id, d.name, email, await bcrypt.hash(d.password, 11)); const user = { id, name: d.name, email }; res.status(201).json({ token: token(user), user }); }));
api.post('/auth/login', authLimiter, wrap(async (req, res) => { const d = z.object({ email: z.string().email(), password: z.string() }).parse(req.body); const u = db.prepare('SELECT * FROM users WHERE email=?').get(d.email.trim().toLowerCase()); if (!u || !(await bcrypt.compare(d.password, u.password_hash)))
    bad(401, 'Email hoặc mật khẩu không chính xác.'); const user = { id: u.id, name: u.name, email: u.email }; res.json({ token: token(user), user }); }));
api.get('/auth/me', auth, (req, res) => res.json({ user: req.user }));
api.get('/quizzes', auth, (req, res) => { const rows = db.prepare('SELECT * FROM quizzes WHERE user_id=? ORDER BY created_at DESC').all(req.user.id); res.json({ quizzes: rows.map(r => toSummary(quizFromRow(r))) }); });
api.get('/discover', auth, (req, res) => { const rows = db.prepare('SELECT * FROM quizzes WHERE public=1 ORDER BY created_at DESC LIMIT 30').all(); res.json({ quizzes: rows.map(r => toSummary(quizFromRow(r))) }); });
api.get('/quizzes/:id', auth, wrap((req, res) => { const q = getQuiz(req.params.id); assertAllowed(q, req.user); const isOwner = q.user_id === req.user.id; res.json({ quiz: { ...toSummary(q), config: q.config, questions: isOwner ? q.questions : q.questions.map(safeQuestion), isOwner } }); }));
api.post('/quizzes', auth, wrap((req, res) => { const d = quizSchema.parse(req.body); const questions = validateQuestionPayload(d.questions).map(q => ({ ...q, id: uid() })); const id = uid(); db.prepare('INSERT INTO quizzes(id,user_id,title,description,questions,config,public) VALUES (?,?,?,?,?,?,?)').run(id, req.user.id, d.title, d.description, JSON.stringify(questions), JSON.stringify(d.config), d.public ? 1 : 0); res.status(201).json({ id, quiz: toSummary(getQuiz(id)) }); }));
api.patch('/quizzes/:id', auth, wrap((req, res) => { const q = getQuiz(req.params.id); assertAllowed(q, req.user, true); const d = quizSchema.parse(req.body); if (db.prepare('SELECT 1 FROM attempts WHERE quiz_id=? LIMIT 1').get(q.id))
    bad(409, 'Quiz đã có lượt làm bài, không thể ghi đè đáp án. Hãy tạo một bộ quiz mới để giữ kết quả cũ.'); const questions = validateQuestionPayload(d.questions).map(q => ({ ...q, id: q.id || uid() })); db.prepare('UPDATE quizzes SET title=?,description=?,questions=?,config=?,public=? WHERE id=?').run(d.title, d.description, JSON.stringify(questions), JSON.stringify(d.config), d.public ? 1 : 0, q.id); res.json({ quiz: toSummary(getQuiz(q.id)) }); }));
api.delete('/quizzes/:id', auth, wrap((req, res) => { const q = getQuiz(req.params.id); assertAllowed(q, req.user, true); if (db.prepare('SELECT 1 FROM attempts WHERE quiz_id=? LIMIT 1').get(q.id))
    bad(409, 'Quiz có lịch sử làm bài; hãy giữ lại để bảo toàn kết quả.'); db.prepare('DELETE FROM quizzes WHERE id=?').run(q.id); res.json({ ok: true }); }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
api.post('/ai/extract', auth, aiLimiter, upload.single('file'), wrap(async (req, res) => {
    const file = req.file;
    if (!file)
        bad(400, 'Vui lòng chọn file PDF, DOCX, TXT hoặc ảnh.');
    const ext = (file.originalname || '').toLowerCase().split('.').pop();
    let text = '', method = 'local';
    if (ext === 'txt') {
        text = file.buffer.toString('utf8').replace(/^\uFEFF/, '');
    }
    else if (ext === 'docx') {
        if (file.buffer.subarray(0, 2).toString() !== 'PK')
            bad(400, 'File DOCX không hợp lệ.');
        const out = await mammoth.extractRawText({ buffer: file.buffer });
        text = out.value;
    }
    else if (ext === 'pdf') {
        if (file.buffer.subarray(0, 5).toString() !== '%PDF-')
            bad(400, 'File PDF không hợp lệ.');
        try {
            const parser = new PDFParse({ data: file.buffer });
            try {
                const out = await parser.getText({ first: 10 });
                text = out.text || '';
            }
            finally {
                await parser.destroy();
            }
        }
        catch (e) {
            console.warn('PDF text extraction failed, trying Vision:', e.message);
        }
        if (text.trim().length < 40) {
            if (aiProvider() === 'groq') bad(422, 'PDF quét không có lớp chữ. Với Groq miễn phí, hãy chuyển trang PDF thành ảnh PNG/JPG rồi tải ảnh lên. PDF có văn bản vẫn được hỗ trợ.');
            if (isAiConfigured()) takeAiCredit(req.user.id);
            text = await imageToText(file.buffer, 'application/pdf');
            method = aiProvider() === 'groq' ? 'groq-vision' : 'gemini-vision';
        }
    }
    else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        const valid = ext === 'png' ? file.buffer.subarray(1, 4).toString() === 'PNG' : ext === 'webp' ? file.buffer.subarray(8, 12).toString() === 'WEBP' : file.buffer[0] === 0xff && file.buffer[1] === 0xd8;
        if (!valid)
            bad(400, 'File ảnh không hợp lệ.');
        const mime = ext === 'jpg' ? 'image/jpeg' : ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
        if (isAiConfigured()) takeAiCredit(req.user.id);
        text = await imageToText(file.buffer, mime);
        method = aiProvider() === 'groq' ? 'groq-vision' : 'gemini-vision';
    }
    else
        bad(400, 'Định dạng không được hỗ trợ. Chỉ nhận PDF, DOCX, TXT, JPG, PNG, WEBP.');
    text = text.trim().slice(0, 20000);
    if (text.length < 30)
        bad(422, 'Tài liệu quá ngắn hoặc không đọc được. Hãy nhập văn bản thủ công.');
    res.json({ text, method, fileName: file.originalname, length: text.length });
}));
api.post('/ai/generate', auth, aiLimiter, wrap(async (req, res) => {
    const d = z.object({ text: z.string().trim().min(40).max(20000), count: z.coerce.number().int().min(3).max(15), difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'), demo: z.boolean().optional() }).parse(req.body);
    if (d.demo) {
        return res.json({ questions: demoGenerate(d.count), provider: 'demo' });
    }
    if (isAiConfigured()) takeAiCredit(req.user.id);
    const data = await generateQuestions({ sourceText: d.text, count: d.count, difficulty: d.difficulty });
    res.json(data);
}));
api.post('/quizzes/:id/start', auth, limiter, wrap((req, res) => {
    const d = z.object({ mode: z.enum(modes) }).parse(req.body);
    const q = getQuiz(req.params.id);
    assertAllowed(q, req.user);
    if (q.config.maxAttempts) {
        const count = db.prepare('SELECT COUNT(*) AS n FROM attempts WHERE user_id=? AND quiz_id=?').get(req.user.id, q.id).n;
        if (count >= q.config.maxAttempts)
            bad(409, 'Bạn đã hết số lượt làm bài cho phép.');
    }
    const now = new Date();
    const duration = d.mode === 'race' ? 60 : Number(q.config.timeLimit || 0);
    const deadline = duration ? new Date(now.getTime() + duration * 1000).toISOString() : null;
    const ids = d.mode === 'millionaire'
        ? [...q.questions].sort((a,b)=>({easy:0,medium:1,hard:2}[a.difficulty]??1)-({easy:0,medium:1,hard:2}[b.difficulty]??1)).map(q=>q.id)
        : (q.config.shuffle ? shuffledIds(q.questions.map(x => x.id)) : q.questions.map(x => x.id));
    const options = {};
    for (const question of q.questions) {
        options[question.id] = q.config.shuffle ? shuffledIds(question.options.map(o => o.id)) : question.options.map(o => o.id);
    }
    const id = uid();
    db.prepare('INSERT INTO attempts (id,user_id,quiz_id,mode,question_order,option_order,started_at,deadline_at) VALUES (?,?,?,?,?,?,?,?)').run(id, req.user.id, q.id, d.mode, JSON.stringify(ids), JSON.stringify(options), now.toISOString(), deadline);
    res.status(201).json({ attempt: attemptView(getAttempt(id, req.user.id), q) });
}));
api.get('/attempts/:id', auth, wrap((req, res) => { let a = getAttempt(req.params.id, req.user.id); const q = getQuiz(a.quiz_id); a = finaliseIfNeeded(a, q); res.json({ attempt: attemptView(a, q) }); }));
api.post('/attempts/:id/hint', auth, wrap((req, res) => {
    const d = z.object({ questionId: z.string() }).parse(req.body);
    const a = getAttempt(req.params.id, req.user.id);
    const q = getQuiz(a.quiz_id);
    if (finaliseIfNeeded(a, q).status !== 'in_progress')
        bad(409, 'Lượt chơi đã kết thúc.');
    if (!a.question_order.includes(d.questionId))
        bad(400, 'Câu hỏi không thuộc phiên này.');
    if (a.answers[d.questionId])
        bad(409, 'Câu hỏi đã trả lời.');
    const question = q.questions.find(x => x.id === d.questionId);
    if (!question)
        bad(404, 'Không tìm thấy câu hỏi.');
    const next = [...new Set([...a.hint_ids, d.questionId])];
    db.prepare('UPDATE attempts SET hint_ids=? WHERE id=?').run(JSON.stringify(next), a.id);
    res.json({ hint: question.hint || 'Hãy đọc kỹ nội dung tài liệu.', hintIds: next });
}));
api.post('/attempts/:id/help', auth, wrap((req, res) => {
    const d = z.object({ questionId: z.string(), type: z.enum(['fifty', 'audience']) }).parse(req.body);
    const a = getAttempt(req.params.id, req.user.id), q = getQuiz(a.quiz_id);
    if (a.mode !== 'millionaire')
        bad(400, 'Quyền trợ giúp này chỉ dành cho Ai là triệu phú.');
    if (finaliseIfNeeded(a, q).status !== 'in_progress')
        bad(409, 'Lượt chơi đã kết thúc.');
    const question = q.questions.find(x => x.id === d.questionId);
    if (!question || a.answers[d.questionId])
        bad(400, 'Câu hỏi không hợp lệ.');
    const key = `${d.type}:${d.questionId}`;
    if (a.hint_ids.some(value => value.startsWith(d.type + ':')))
        bad(409, 'Quyền trợ giúp này đã được dùng trong lượt chơi.');
    const next = [...a.hint_ids, key];
    db.prepare('UPDATE attempts SET hint_ids=? WHERE id=?').run(JSON.stringify(next), a.id);
    const wrong = question.options.filter(o => o.id !== question.correctOptionId).map(o => o.id);
    const result = d.type === 'fifty' ? { hiddenIds: wrong.slice(0, 2) } : { votes: Object.fromEntries(question.options.map(o => [o.id, o.id === question.correctOptionId ? 72 : Math.round(28 / 3)])) };
    res.json({ ...result, hintIds: next });
}));
api.post('/attempts/:id/answer', auth, wrap((req, res) => {
    const d = z.object({ questionId: z.string(), optionId: z.string().max(12) }).parse(req.body);
    const result = db.transaction(() => {
        let a = getAttempt(req.params.id, req.user.id);
        const q = getQuiz(a.quiz_id);
        a = finaliseIfNeeded(a, q);
        if (a.status !== 'in_progress')
            bad(409, 'Lượt chơi đã kết thúc hoặc hết thời gian.');
        if (!a.question_order.includes(d.questionId))
            bad(400, 'Câu hỏi không thuộc lượt chơi.');
        if (Object.hasOwn(a.answers, d.questionId))
            bad(409, 'Câu này đã được chấm điểm.');
        const question = q.questions.find(x => x.id === d.questionId);
        if (!question.options.some(o => o.id === d.optionId))
            bad(400, 'Đáp án không hợp lệ.');
        const prevTime = Object.values(a.answers).map(x => Date.parse(x.answeredAt)).sort((x, y) => y - x)[0] || Date.parse(a.started_at);
        const elapsedSeconds = Math.max(0, (Date.now() - prevTime) / 1000);
        const correct = d.optionId === question.correctOptionId;
        const hinted = a.hint_ids.includes(d.questionId);
        const calc = calculateAnswerScore({ correct, elapsedSeconds, streak: a.streak, hinted, config: q.config });
        const answer = { optionId: d.optionId, correct, correctOptionId: question.correctOptionId, explanation: question.explanation, points: calc.points, answeredAt: new Date().toISOString() };
        const answers = { ...a.answers, [d.questionId]: answer };
        const score = Math.max(0, a.score + calc.points);
        db.prepare('UPDATE attempts SET answers=?,score=?,correct_count=?,streak=? WHERE id=?').run(JSON.stringify(answers), score, a.correct_count + (correct ? 1 : 0), calc.newStreak, a.id);
        a = finaliseIfNeeded(getAttempt(a.id, req.user.id), q);
        return { answer, score, correctCount: a.correct_count, status: a.status, answeredCount: Object.keys(answers).length, total: a.question_order.length };
    })();
    res.json(result);
}));
api.post('/attempts/:id/finish', auth, wrap((req, res) => { const a = getAttempt(req.params.id, req.user.id); const q = getQuiz(a.quiz_id); const finished = finaliseIfNeeded(a, q, true); res.json({ attempt: attemptView(finished, q) }); }));
api.get('/attempts', auth, (req, res) => { const rows = db.prepare('SELECT a.*,q.title FROM attempts a JOIN quizzes q ON a.quiz_id=q.id WHERE a.user_id=? ORDER BY a.started_at DESC LIMIT 100').all(req.user.id); res.json({ attempts: rows.map(a => ({ id: a.id, quizId: a.quiz_id, title: a.title, mode: a.mode, status: a.status, score: a.score, correctCount: a.correct_count, answeredCount: Object.keys(JSON.parse(a.answers)).length, total: JSON.parse(a.question_order).length, startedAt: a.started_at, finishedAt: a.finished_at })) }); });
api.get('/stats', auth, (req, res) => { const rows = db.prepare("SELECT score,correct_count,answers,question_order,started_at,status FROM attempts WHERE user_id=? AND status='completed'").all(req.user.id); const total = rows.reduce((n, r) => n + Object.keys(JSON.parse(r.answers)).length, 0), correct = rows.reduce((n, r) => n + r.correct_count, 0); res.json({ completed: rows.length, correct, total, accuracy: total ? Math.round(correct / total * 100) : 0, bestScore: Math.max(0, ...rows.map(r => r.score)), series: rows.slice(-7).map(r => ({ date: r.started_at.slice(0, 10), score: r.score })) }); });
api.get('/wrong-questions', auth, (req, res) => { const rows = db.prepare("SELECT a.answers, q.questions FROM attempts a JOIN quizzes q ON a.quiz_id=q.id WHERE a.user_id=? AND a.status='completed' ORDER BY a.started_at DESC LIMIT 100").all(req.user.id); const seen = new Map(); for (const row of rows) {
    const answers = JSON.parse(row.answers), questions = JSON.parse(row.questions);
    for (const [id, a] of Object.entries(answers)) {
        if (!a.correct) {
            const q = questions.find(x => x.id === id);
            if (q && !seen.has(q.text))
                seen.set(q.text, q);
        }
    }
} res.json({ questions: [...seen.values()].slice(0, 50) }); });
api.get('/quizzes/:id/leaderboard', auth, wrap((req, res) => { const q = getQuiz(req.params.id); assertAllowed(q, req.user); const mode = modes.includes(req.query.mode) ? req.query.mode : 'classic'; const rows = db.prepare("SELECT name,score,correctCount FROM (SELECT u.name,a.score,a.correct_count AS correctCount,ROW_NUMBER() OVER(PARTITION BY a.user_id ORDER BY a.score DESC,a.correct_count DESC) rn FROM attempts a JOIN users u ON u.id=a.user_id WHERE a.quiz_id=? AND a.mode=? AND a.status='completed') WHERE rn=1 ORDER BY score DESC,correctCount DESC LIMIT 20").all(q.id, mode); res.json({ leaderboard: rows, mode }); }));
api.use((err, req, res, next) => { if (err instanceof ZodError)
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ: ' + err.issues.map(i => i.path.join('.') + ' ' + i.message).slice(0, 3).join('; ') }); if (err instanceof multer.MulterError)
    return res.status(413).json({ error: 'File vượt 5MB hoặc upload không hợp lệ.' }); if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE' || (err?.code === 'ERR_SQLITE_ERROR' && /UNIQUE constraint failed/i.test(err?.message || '')))
    return res.status(409).json({ error: 'Dữ liệu bị trùng.' }); console.error('[API]', String(err.message || 'Unknown error').replaceAll(process.env.GEMINI_API_KEY?.trim() || '__NO_GEMINI_KEY__', '[REDACTED]').replaceAll(process.env.GROQ_API_KEY?.trim() || '__NO_GROQ_KEY__', '[REDACTED]')); res.status(err.status || 500).json({ error: err.status ? err.message : 'Lỗi máy chủ. Hãy kiểm tra terminal backend.' }); });
export default app;
