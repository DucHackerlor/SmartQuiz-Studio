import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpen, BrainCircuit, ChartNoAxesCombined, ChevronDown, ChevronLeft, ChevronRight, Check, CheckCircle2, Clock3, CloudUpload, FileText, Flame, Gamepad2, GraduationCap, LayoutDashboard, Library, Lightbulb, LogOut, Menu, Plus, Search, Settings2, ShieldCheck, Sparkles, Target, Trophy, UploadCloud, WandSparkles, X, Zap, ArrowRight, Play, RotateCcw, CalendarDays, Eye, Trash2, Lock, Globe2, Info, FileUp, Copy, Shuffle, Timer, MousePointer2, Star, Heart, ArrowLeft, Save, PartyPopper, AlertCircle } from 'lucide-react';
import './style.css';
// Dev: cùng origin với Vite, không bị CORS giữa localhost và 127.0.0.1.
// Production: đặt VITE_API_URL thành URL backend HTTPS đầy đủ.
const API = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || '/api');
const MODE_META = { classic: { name: 'Quiz thường', sub: 'Tập trung ôn luyện', icon: BookOpen, color: 'purple' }, chicken: { name: 'Bắn gà', sub: 'Nhắm và chọn đáp án', icon: Target, color: 'orange' }, millionaire: { name: 'Ai là triệu phú', sub: 'Chinh phục các mốc', icon: Trophy, color: 'gold' }, race: { name: 'Đua 60 giây', sub: 'Nhanh tay, nhanh trí', icon: Zap, color: 'blue' }, matching: { name: 'Ghép thẻ', sub: 'Tìm cặp kiến thức', icon: LayoutDashboard, color: 'pink' } };
const PREVIEW_TEXT = `React là thư viện JavaScript được phát triển để xây dựng giao diện người dùng theo mô hình component. Function Component sử dụng React Hooks như useState để quản lý trạng thái và useEffect để xử lý side effects. REST API cho phép client gửi yêu cầu tới server qua các phương thức HTTP. GET thường lấy dữ liệu, POST thường tạo dữ liệu mới, PUT cập nhật và DELETE xóa tài nguyên. HTTP 200 biểu thị yêu cầu thành công, 404 là không tìm thấy tài nguyên. JWT thường được dùng để xác thực yêu cầu API.`;
const fmtDate = value => value ? new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = seconds => `${String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, '0')}:${String(Math.floor(Math.max(0, seconds) % 60)).padStart(2, '0')}`;
const cx = (...a) => a.filter(Boolean).join(' ');
function BIcon({ icon: Icon, size = 18, ...p }) { return <Icon size={size} strokeWidth={2.05} {...p}/>; }
async function req(path, { token, body, method = 'GET', file } = {}) {
    const headers = {};
    if (token)
        headers.Authorization = `Bearer ${token}`;
    if (body && !file)
        headers['Content-Type'] = 'application/json';
    let res;
    try {
        res = await fetch(API + path, { method, headers, body: file ? file : body ? JSON.stringify(body) : undefined });
    }
    catch {
        throw new Error('Không liên lạc được với máy chủ API. Kiểm tra terminal chạy Express và truy cập http://127.0.0.1:3000/api/health.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
        throw new Error(data.error || (res.status >= 500 ? 'Backend chưa sẵn sàng hoặc proxy không kết nối được (HTTP ' + res.status + '). Kiểm tra Terminal API.' : `Lỗi HTTP ${res.status}`));
    return data;
}
function Brand({ small = false }) { return <div className="brand"><span className="brand-glyph"><BrainCircuit size={small ? 21 : 25}/></span>{!small && <div className="brand-words">quiz<span>ora</span><span className="brand-dot">.</span></div>}</div>; }
function Toast({ text, onClear }) { useEffect(() => { if (!text)
    return; const t = setTimeout(onClear, 4600); return () => clearTimeout(t); }, [text, onClear]); if (!text)
    return null; return <div className="toast"><Info size={17}/>{text}<button onClick={onClear}><X size={15}/></button></div>; }
function AuthScreen({ onAuth }) {
    const [register, setRegister] = useState(false), [form, setForm] = useState({ name: '', email: '', password: '' }), [loading, setLoading] = useState(false), [error, setError] = useState('');
    const [apiHealth, setApiHealth] = useState('checking');
    const [healthAttempt, setHealthAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        fetch(API + '/health', { cache: 'no-store', signal: controller.signal })
          .then(async r => { if (!r.ok || !(await r.json()).ok) throw new Error('unhealthy'); if (active) setApiHealth('online'); })
          .catch(() => { if (active) setApiHealth('offline'); })
          .finally(() => clearTimeout(timeoutId));
        return () => { active = false; controller.abort(); clearTimeout(timeoutId); };
    }, [healthAttempt]);
    async function submit(e) { e.preventDefault(); setError(''); setLoading(true); try {
        const d = await req('/auth/' + (register ? 'register' : 'login'), { method: 'POST', body: register ? form : { email: form.email, password: form.password } });
        onAuth(d);
    }
    catch (err) {
        setError(err.message);
    }
    finally {
        setLoading(false);
    } }
    return <main className="auth-root"><div className="auth-illustration"><div className="auth-top"><Brand /><span className="auth-flag">AI Study Platform</span></div><div className="auth-art"><div className="orbit orbit1"/><div className="orbit orbit2"/><div className="art-glass"><span className="art-kicker">YOUR LEARNING SUPERPOWER</span><div className="art-title">Học thông minh.<br /><i>Chơi thật vui.</i></div><p>Biến tài liệu thành câu hỏi với AI, chinh phục kiến thức qua những trò chơi bạn yêu thích.</p><div className="art-stats"><span><strong>5</strong> Chế độ học</span><span><strong>AI</strong> Tạo quiz</span><span><strong>∞</strong> Kiến thức</span></div></div><div className="floating-star star1">✦</div><div className="floating-star star2">✧</div><div className="floating-star star3">✹</div></div><div className="auth-footer">DESIGNED FOR CURIOUS MINDS ✦ 2026</div></div><div className="auth-panel"><div className="auth-mobile-brand"><Brand /></div><span className="pill"><Sparkles size={14}/> Chào mừng đến với Quizora</span><h1>{register ? 'Bắt đầu hành trình học tập' : 'Chào mừng trở lại!'}</h1><p className="muted auth-desc">{register ? 'Tạo tài khoản để lưu trữ những bộ quiz của riêng bạn.' : 'Đăng nhập để tiếp tục khám phá kiến thức mới.'}</p><div className={'api-health ' + apiHealth}><span className="api-health-dot"/>{apiHealth === 'online' ? 'Máy chủ API đã kết nối' : apiHealth === 'checking' ? 'Đang kiểm tra máy chủ API...' : <>Không kết nối được API. <button type="button" onClick={() => { setApiHealth('checking'); setHealthAttempt(x => x + 1); }}>Thử lại</button></>}</div><form onSubmit={submit}>{register && <label>Họ và tên<input required minLength={2} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nguyễn Văn A"/></label>}<label>Email<input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ban@example.com"/></label><label>Mật khẩu<input type="password" minLength={register ? 8 : 1} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={register ? 'Ít nhất 8 ký tự' : 'Nhập mật khẩu của bạn'}/></label>{error && <div className="inline-error"><AlertCircle size={17}/>{error}</div>}<button className="btn btn-primary auth-submit" disabled={loading}>{loading ? 'Đang xử lý...' : register ? 'Tạo tài khoản' : 'Đăng nhập'}<ArrowRight size={18}/></button></form><p className="auth-toggle">{register ? 'Bạn đã có tài khoản?' : 'Bạn chưa có tài khoản?'} <button onClick={() => { setRegister(!register); setError(''); }}>{register ? 'Đăng nhập' : 'Đăng ký miễn phí'}</button></p><div className="auth-note"><ShieldCheck size={16}/> Dữ liệu của bạn được lưu trên máy chủ ứng dụng</div></div></main>;
}
function Sidebar({ screen, setScreen, user, onLogout, mobileOpen, setMobileOpen }) { const nav = [['dashboard', 'Tổng quan', LayoutDashboard], ['create', 'Tạo quiz với AI', WandSparkles], ['library', 'Bộ quiz của tôi', Library], ['explore', 'Khám phá', Search], ['history', 'Lịch sử học', Clock3], ['flashcards', 'Ôn câu sai', GraduationCap]]; return <><div className={cx('side-scrim', mobileOpen && 'show')} onClick={() => setMobileOpen(false)}/><aside className={cx('sidebar', mobileOpen && 'open')}><div className="sidebar-head"><Brand /><button className="sidebar-close" onClick={() => setMobileOpen(false)}><X size={20}/></button></div><div className="sidebar-caption">WORKSPACE</div><nav>{nav.map(([key, label, Icon]) => <button key={key} onClick={() => { setScreen(key); setMobileOpen(false); }} className={cx('nav-item', screen === key && 'active')}><Icon size={19}/><span>{label}</span>{key === 'create' && <span className="nav-ai">AI</span>}</button>)}</nav><div className="sidebar-bottom"><div className="sidebar-tip"><span className="tip-light"><Sparkles size={20}/></span><strong>Mẹo học hiệu quả</strong><p>Ôn lại các câu sai giúp bạn nhớ kiến thức lâu hơn.</p><button onClick={() => { setScreen('flashcards'); setMobileOpen(false); }}>Ôn tập ngay <ArrowRight size={15}/></button></div><div className="profile-mini"><span className="avatar">{user?.name?.trim()?.charAt(0)?.toUpperCase() || 'Q'}</span><div className="profile-data"><strong>{user?.name}</strong><small>Học viên Quizora</small></div><button title="Đăng xuất" onClick={onLogout}><LogOut size={19}/></button></div></div></aside></>; }
function Header({ screen, setScreen, username, onMenu }) { const titles = { dashboard: 'Tổng quan', create: 'Tạo Quiz với AI', library: 'Thư viện của tôi', explore: 'Khám phá quiz', history: 'Lịch sử học tập', flashcards: 'Ôn tập câu sai', detail: 'Chi tiết bộ quiz', play: 'Đang học', result: 'Kết quả học tập', edit: 'Chỉnh sửa quiz' }; return <header className="topbar"><button className="mobile-menu" onClick={onMenu}><Menu size={23}/></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14}/><strong>{titles[screen] || 'Quizora'}</strong></div><div className="top-actions"><span className="top-date"><CalendarDays size={16}/>{new Date().toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span><button className="btn btn-primary btn-top" onClick={() => setScreen('create')}><Plus size={17}/> Tạo quiz mới</button><span className="avatar top-avatar">{username?.charAt(0)?.toUpperCase() || 'Q'}</span></div></header>; }
function SectionTitle({ eyebrow, title, desc, action }) { return <div className="section-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2>{title}</h2>{desc && <p className="muted">{desc}</p>}</div>{action}</div>; }
function StatCard({ icon: Icon, label, value, sub, tint }) { return <div className="stat-card"><span className={cx('stat-icon', tint)}><Icon size={21}/></span><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="stat-sub">{sub}</div></div>; }
function QuizCard({ quiz, onOpen, onPlay, tag }) { return <div className="quiz-card"><div className="quiz-thumb"><div className="quiz-thumb-decor">✦</div><span className="quiz-thumb-icon"><BookOpen size={27}/></span><span className="quiz-flag">{tag || 'QUIZ SET'}</span></div><div className="quiz-card-content"><div className="quiz-meta"><span><BookOpen size={14}/>{quiz.questionCount} câu hỏi</span><span><Clock3 size={14}/> Linh hoạt</span></div><h3>{quiz.title}</h3><p>{quiz.description || 'Bộ câu hỏi giúp bạn củng cố kiến thức một cách hiệu quả.'}</p><div className="quiz-card-foot"><span className="quiz-privacy">{quiz.public ? <><Globe2 size={13}/> Công khai</> : <><Lock size={13}/> Riêng tư</>}</span><button className="small-play" onClick={() => onPlay?.(quiz.id)} title="Bắt đầu ôn tập"><Play size={17} fill="currentColor"/></button><button className="text-link" onClick={() => onOpen(quiz.id)}>Xem chi tiết <ArrowRight size={15}/></button></div></div></div>; }
function Dashboard({ user, stats, quizzes, discover, attempts, onScreen, onOpen, onPlay }) { const all = [...quizzes, ...discover.filter(q => !quizzes.some(x => x.id === q.id))].slice(0, 3); return <><section className="welcome"><div className="welcome-copy"><div className="welcome-eyebrow"><Sparkles size={15}/> POWERED BY AI · PERSONAL STUDY</div><h1>Hôm nay học gì,<br /><span>{user.name.split(' ').at(-1)} ơi? ✨</span></h1><p>Mỗi ngày một chút tiến bộ. Biến kiến thức thành trò chơi và việc ôn tập thành niềm vui!</p><button className="btn btn-white" onClick={() => onScreen('create')}><WandSparkles size={18}/> Tạo quiz bằng AI <ArrowRight size={16}/></button></div><div className="hero-graphic"><span className="hero-orb o1"/><span className="hero-orb o2"/><div className="hero-card hero-card-back">✦</div><div className="hero-card hero-card-front"><BrainCircuit size={72}/><span>LEVEL UP</span></div><span className="hero-sparkle one">✧</span><span className="hero-sparkle two">✳</span></div></section><div className="stats-grid"><StatCard icon={Library} label="Bộ quiz của tôi" value={quizzes.length} sub="Bộ đề đã tạo" tint="purple"/><StatCard icon={Target} label="Độ chính xác" value={`${stats.accuracy || 0}%`} sub="Tỷ lệ trả lời đúng" tint="mint"/><StatCard icon={Trophy} label="Điểm cao nhất" value={(stats.bestScore || 0).toLocaleString('vi-VN')} sub="Kỷ lục của bạn" tint="orange"/><StatCard icon={Flame} label="Lượt học xong" value={stats.completed || 0} sub="Bài đã hoàn thành" tint="pink"/></div><div className="section-heading dashboard-section"><div><div className="eyebrow">PICK UP & LEARN</div><h2>Gợi ý cho bạn <span className="title-star">✦</span></h2><p className="muted">Khởi động trí não với những bộ quiz thú vị.</p></div><button className="link-button" onClick={() => onScreen('explore')}>Xem tất cả <ArrowRight size={17}/></button></div><div className="quiz-grid">{all.map((q, i) => <QuizCard key={q.id} quiz={q} tag={i === 0 ? 'POPULAR' : 'STUDY PACK'} onOpen={onOpen} onPlay={onPlay}/>)}</div><div className="bottom-panels"><div className="panel"><div className="panel-header"><h3>Hoạt động gần đây</h3><button onClick={() => onScreen('history')}>Xem lịch sử <ArrowRight size={15}/></button></div>{attempts.length ? attempts.slice(0, 3).map(at => <div key={at.id} className="activity-row"><span className="activity-icon"><BookOpen size={18}/></span><div><strong>{at.title}</strong><small>{fmtDate(at.startedAt)} · {MODE_META[at.mode]?.name || 'Quiz'}</small></div><b>{at.score} điểm</b></div>) : <div className="empty-mini"><Clock3 size={26}/> Chưa có lượt học. Bắt đầu một bài quiz nhé!</div>}</div><div className="challenge-panel"><div className="challenge-icon"><Zap size={28}/></div><div className="challenge-tag">QUICK CHALLENGE</div><h3>Đã sẵn sàng cho<br />60 giây thử thách?</h3><p>Chọn một bộ quiz và chinh phục chế độ đua thời gian!</p><button onClick={() => onScreen('explore')}>Chọn quiz <ArrowRight size={17}/></button></div></div></>; }
function CreateQuiz({ token, onSaved, notify, aiStatus }) {
    const [step, setStep] = useState(1), [file, setFile] = useState(null), [source, setSource] = useState(''), [fileInfo, setFileInfo] = useState(''), [count, setCount] = useState(8), [difficulty, setDifficulty] = useState('medium'), [title, setTitle] = useState(''), [description, setDescription] = useState(''), [questions, setQuestions] = useState([]), [publicQuiz, setPublicQuiz] = useState(false), [config, setConfig] = useState({ timeLimit: 0, basePoints: 100, wrongPenalty: 0, hintPenalty: 15, shuffle: true, maxAttempts: 0 }), [working, setWorking] = useState(''), [demoUsed, setDemoUsed] = useState(false);
    async function extract() { if (!file) {
        if (source.trim().length < 40) {
            notify('Hãy nhập ít nhất 40 ký tự nội dung học tập.');
            return;
        }
        setStep(2);
        return;
    } setWorking('Đang trích xuất văn bản...'); try {
        const form = new FormData();
        form.append('file', file);
        const d = await req('/ai/extract', { method: 'POST', token, file: form });
        setSource(d.text);
        setFileInfo(`${d.fileName} · ${d.method === 'local' ? 'Đọc cục bộ' : (d.method === 'groq-vision' ? 'Groq Vision' : 'Gemini Vision')}`);
        setStep(2);
    }
    catch (e) {
        notify(e.message);
    }
    finally {
        setWorking('');
    } }
    async function generate(demo = false) { if (source.trim().length < 40) {
        notify('Văn bản cần có ít nhất 40 ký tự để tạo câu hỏi.');
        return;
    } setWorking(demo ? 'Đang chuẩn bị quiz mẫu...' : 'AI đang phân tích và tạo bộ câu hỏi...'); try {
        const d = await req('/ai/generate', { method: 'POST', token, body: { text: source, count, difficulty, demo } });
        setQuestions(d.questions);
        setDemoUsed(d.provider === 'demo');
        setStep(3);
        if (!title)
            setTitle(file?.name?.replace(/\.[^.]+$/, '') || 'Bộ quiz ôn tập của tôi');
        notify(d.provider === 'demo' ? 'Đã tạo quiz DEMO. Đây là dữ liệu mẫu, không phải nội dung AI.' : `AI đã tạo ${d.questions.length} câu hỏi. Hãy kiểm tra trước khi lưu.`);
    }
    catch (e) {
        notify(e.message);
    }
    finally {
        setWorking('');
    } }
    function updateQuestion(i, updater) { setQuestions(old => old.map((q, j) => j === i ? updater(q) : q)); }
    async function save() { if (title.trim().length < 3) {
        notify('Tên bộ quiz phải có ít nhất 3 ký tự.');
        return;
    } setWorking('Đang lưu bộ quiz...'); try {
        const payload = { title: title.trim(), description, questions, config: { ...config, timeLimit: Number(config.timeLimit), basePoints: Number(config.basePoints), wrongPenalty: Number(config.wrongPenalty), hintPenalty: Number(config.hintPenalty), maxAttempts: Number(config.maxAttempts) }, public: publicQuiz };
        const d = await req('/quizzes', { method: 'POST', token, body: payload });
        notify('Đã lưu bộ quiz thành công!');
        onSaved(d.id);
    }
    catch (e) {
        notify(e.message);
    }
    finally {
        setWorking('');
    } }
    return <div className="create-page"><SectionTitle eyebrow="CREATE SOMETHING AMAZING" title="Tạo Quiz thông minh ✨" desc="Từ một trang tài liệu tới bộ câu hỏi sinh động, chỉ trong vài bước."/><div className="wizard-steps">{[['1', 'Nguồn tài liệu'], ['2', 'Cấu hình AI'], ['3', 'Biên tập & lưu']].map(([num, name], i) => <div key={num} className={cx('wizard-step', step === i + 1 && 'current', step > i + 1 && 'done')}><span>{step > i + 1 ? <Check size={16}/> : num}</span><b>{name}</b>{i < 2 && <div className="wizard-line"/>}</div>)}</div>{step === 1 ? <div className="create-layout"><div className="surface create-primary"><div className="input-heading"><span className="box-icon purple"><FileUp size={22}/></span><div><h3>Thêm nguồn học tập</h3><p className="muted">Tải file lên hoặc dán trực tiếp nội dung của bạn.</p></div></div><label className="drop-zone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}><input type="file" accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp" onChange={e => setFile(e.target.files[0] || null)}/><span className="drop-icon"><CloudUpload size={30}/></span><b>{file ? file.name : 'Kéo thả tài liệu hoặc bấm để chọn'}</b><p>PDF · DOCX · TXT · JPG · PNG · WEBP</p><span className="file-hint">Tối đa 5 MB / file</span></label><div className="or-separator"><span>HOẶC DÁN VĂN BẢN</span></div><textarea className="source-textarea" placeholder="Nhập hoặc dán nội dung bài học vào đây..." value={source} onChange={e => setSource(e.target.value)} rows={9}/><div className="form-foot"><span>{source.length.toLocaleString('vi-VN')} / 20.000 ký tự</span><button className="btn btn-primary" onClick={extract} disabled={!!working}>{working || 'Tiếp tục'} <ArrowRight size={17}/></button></div></div><div className="side-help"><div className="help-illustration"><BrainCircuit size={54}/><span>✦</span></div><h3>Quiz hay bắt đầu từ tài liệu tốt!</h3><p>Hãy sử dụng nội dung rõ ràng, đầy đủ ý chính và kiểm tra văn bản OCR trước khi tạo câu hỏi.</p><div className="divider-line"/><div className="help-line"><CheckCircle2 size={18}/> AI hỗ trợ văn bản tiếng Việt</div><div className="help-line"><CheckCircle2 size={18}/> Ảnh được đọc qua AI Vision</div><div className="help-line"><CheckCircle2 size={18}/> Chỉnh sửa trước khi lưu</div><button className="plain-example" onClick={() => { setFile(null); setSource(PREVIEW_TEXT); notify('Đã điền văn bản mẫu React & REST API.'); }}><Sparkles size={16}/> Dùng văn bản mẫu thử ngay</button></div></div> : null}
 {step === 2 ? <div className="create-layout"><div className="surface create-primary"><div className="input-heading"><span className="box-icon purple"><Settings2 size={22}/></span><div><h3>Tùy chỉnh bộ Quiz</h3><p className="muted">Đọc lại nội dung và chọn số câu, độ khó.</p></div></div>{fileInfo && <div className="source-banner"><FileText size={16}/>{fileInfo}</div>}<label className="field-label">Văn bản trích xuất <span className="muted">(có thể sửa)</span></label><textarea className="source-textarea big" value={source} onChange={e => setSource(e.target.value)} rows={11} maxLength={20000}/><div className="two-fields"><label>Số câu hỏi<select value={count} onChange={e => setCount(Number(e.target.value))}>{[3, 5, 8, 10, 12, 15].map(n => <option key={n} value={n}>{n} câu</option>)}</select></label><label>Độ khó<select value={difficulty} onChange={e => setDifficulty(e.target.value)}><option value="easy">Dễ · Cơ bản</option><option value="medium">Trung bình · Vừa sức</option><option value="hard">Khó · Nâng cao</option></select></label></div><div className="form-foot"><button className="btn btn-soft" onClick={() => setStep(1)}><ChevronLeft size={17}/> Quay lại</button><div className="flex-actions"><button className="btn btn-outline" disabled={!!working} onClick={() => generate(true)}>Thử bản demo</button><button className="btn btn-primary" disabled={!!working} onClick={() => generate(false)}><WandSparkles size={18}/>{working || 'Tạo Quiz với AI'}</button></div></div></div><div className="side-help ai-side"><div className="ai-glow">✦</div><h3>Trợ lý AI thông minh</h3><p>AI tạo câu hỏi 4 lựa chọn, đáp án đúng, giải thích và gợi ý cho từng câu.</p><div className="ai-provider-status"><span className={cx('online-dot', aiStatus?.aiConfigured && 'on')}/>{aiStatus?.aiConfigured ? 'Trợ lý AI dùng chung đang sẵn sàng' : 'Trợ lý AI đang tạm ngừng'}</div><p className="aside-small">AI do máy chủ quản lý. Bạn không cần nhập hoặc chia sẻ API key. Có hạn mức dùng chung mỗi ngày; nút demo sử dụng dữ liệu mẫu, không phải AI thật.</p></div></div> : null}
 {step === 3 ? <div className="edit-layout"><div className="surface edit-info"><div className="input-heading"><span className="box-icon purple"><BookOpen size={22}/></span><div><h3>Hoàn thiện bộ quiz</h3><p className="muted">Kiểm tra câu hỏi AI trước khi xuất bản.</p></div></div>{demoUsed && <div className="demo-warning"><Info size={17}/> Đây là bộ câu hỏi DEMO, không sinh theo nội dung tài liệu. Sử dụng AI thật để tạo quiz theo file.</div>}<div className="two-fields"><label>Tên bộ quiz<input value={title} onChange={e => setTitle(e.target.value)} placeholder="Tên bộ quiz"/></label><label>Thời gian toàn bài<select value={config.timeLimit} onChange={e => setConfig({ ...config, timeLimit: Number(e.target.value) })}><option value={0}>Không giới hạn</option><option value={60}>1 phút</option><option value={300}>5 phút</option><option value={600}>10 phút</option><option value={900}>15 phút</option><option value={1200}>20 phút</option></select></label></div><label className="wide-field">Mô tả<input value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả ngắn về bộ câu hỏi"/></label><div className="two-fields"><label>Điểm đúng<input type="number" min={10} max={1000} value={config.basePoints} onChange={e => setConfig({ ...config, basePoints: e.target.value })}/></label><label>Trừ điểm khi sai<input type="number" min={0} max={100} value={config.wrongPenalty} onChange={e => setConfig({ ...config, wrongPenalty: e.target.value })}/></label><label>Trừ điểm khi dùng gợi ý<input type="number" min={0} max={100} value={config.hintPenalty} onChange={e => setConfig({ ...config, hintPenalty: e.target.value })}/></label><label>Số lượt làm tối đa <small>(0 = không giới hạn)</small><input type="number" min={0} max={100} value={config.maxAttempts} onChange={e => setConfig({ ...config, maxAttempts: e.target.value })}/></label></div><div className="toggle-row"><label><input type="checkbox" checked={config.shuffle} onChange={e => setConfig({ ...config, shuffle: e.target.checked })}/> Xáo trộn câu và đáp án</label><label><input type="checkbox" checked={publicQuiz} onChange={e => setPublicQuiz(e.target.checked)}/> Công khai để chia sẻ</label></div><div className="form-foot"><button className="btn btn-soft" onClick={() => setStep(2)}><ChevronLeft size={17}/> Quay lại</button><button className="btn btn-primary" onClick={save} disabled={!!working}><Save size={17}/>{working || `Lưu bộ Quiz (${questions.length} câu)`}</button></div></div><div className="questions-editor"><div className="question-editor-header"><h3>Câu hỏi đã tạo <span>{questions.length}</span></h3><p>Chạm vào từng ô để sửa câu hỏi và các lựa chọn.</p></div>{questions.map((q, i) => <div className="question-editor-card" key={q.id || i}><div className="question-index"><span>CÂU {String(i + 1).padStart(2, '0')}</span><span className="diff-badge">{q.difficulty}</span></div><textarea rows={2} className="question-edit-title" value={q.text} onChange={e => updateQuestion(i, o => ({ ...o, text: e.target.value }))}/><div className="option-edit-grid">{q.options.map((opt, j) => <div className={cx('option-edit', q.correctOptionId === opt.id && 'correct')} key={opt.id}><button title="Chọn đáp án đúng" onClick={() => updateQuestion(i, o => ({ ...o, correctOptionId: opt.id }))}>{q.correctOptionId === opt.id ? <Check size={14}/> : opt.id.toUpperCase()}</button><input value={opt.text} onChange={e => updateQuestion(i, o => ({ ...o, options: o.options.map(p => p.id === opt.id ? { ...p, text: e.target.value } : p) }))}/></div>)}</div><label className="editor-sub-label">Giải thích<input value={q.explanation} onChange={e => updateQuestion(i, o => ({ ...o, explanation: e.target.value }))}/></label><label className="editor-sub-label">Gợi ý<input value={q.hint} onChange={e => updateQuestion(i, o => ({ ...o, hint: e.target.value }))}/></label></div>)}</div></div> : null}</div>;
}
function LibraryPage({ quizzes, open, play, onCreate, header = 'Bộ quiz của tôi', desc = 'Quản lý, chỉnh sửa và luyện tập với các bộ câu hỏi đã lưu.' }) { return <><SectionTitle eyebrow="YOUR STUDY COLLECTION" title={header} desc={desc} action={<button className="btn btn-primary" onClick={onCreate}><Plus size={17}/> Tạo quiz mới</button>}/>{quizzes.length ? <div className="quiz-grid full-grid">{quizzes.map((q, i) => <QuizCard key={q.id} quiz={q} onOpen={open} onPlay={play} tag={i === 0 ? 'FEATURED' : 'QUIZ COLLECTION'}/>)}</div> : <div className="empty-state"><div className="empty-art"><BookOpen size={46}/></div><h3>Chưa có bộ Quiz nào</h3><p>Tạo một bộ quiz từ tài liệu của bạn hoặc khám phá bộ quiz mẫu.</p><button className="btn btn-primary" onClick={onCreate}>Tạo quiz đầu tiên <ArrowRight size={17}/></button></div>}</>; }
function DetailPage({ quiz, onBack, onStart, onEdit, onDelete, onLeaderboard, notify }) { const [mode, setMode] = useState('classic'); if (!quiz)
    return <Loader text="Đang tải bộ quiz..."/>; const isOwner = quiz.isOwner; return <><div className="page-back"><button onClick={onBack}><ArrowLeft size={18}/> Quay lại thư viện</button></div><div className="detail-hero"><div className="detail-hero-pattern">✳ ✦ ✳</div><div className="detail-hero-left"><span className="hero-mini-label"><BookOpen size={15}/> SMART QUIZ COLLECTION</span><h1>{quiz.title}</h1><p>{quiz.description || 'Sẵn sàng khám phá kiến thức mới qua một trải nghiệm học thật thú vị!'}</p><div className="detail-meta"><span><BookOpen size={16}/>{quiz.questionCount} câu hỏi</span><span><Clock3 size={16}/>{quiz.config?.timeLimit ? `${quiz.config.timeLimit / 60} phút` : 'Không giới hạn giờ'}</span><span>{quiz.public ? <Globe2 size={16}/> : <Lock size={16}/>} {quiz.public ? 'Công khai' : 'Riêng tư'}</span></div></div><div className="detail-mascot"><BrainCircuit size={94}/><span>LET'S PLAY!</span></div></div><SectionTitle eyebrow="SELECT YOUR ADVENTURE" title="Chọn cách bạn muốn học" desc="Cùng một bộ câu hỏi, năm trải nghiệm khác nhau."/><div className="modes-grid">{Object.entries(MODE_META).map(([key, item]) => <button className={cx('mode-card', mode === key && 'selected')} key={key} onClick={() => setMode(key)}><span className={cx('mode-icon', item.color)}><item.icon size={26}/></span><b>{item.name}</b><small>{item.sub}</small><span className="mode-check">{mode === key ? <Check size={16}/> : null}</span></button>)}</div><div className="detail-bottom"><div className="surface detail-rule"><div className="detail-rule-icon"><Lightbulb size={25}/></div><div><strong>Mỗi câu trả lời đều là một bước tiến</strong><p>Trả lời nhanh nhận điểm thưởng, đúng liên tiếp nhận thêm điểm streak. Gợi ý có thể làm giảm điểm.</p></div></div><div className="detail-actions">{isOwner && <button className="btn btn-outline" onClick={onEdit}><Settings2 size={17}/> Chỉnh sửa</button>}{isOwner && <button className="btn btn-outline btn-delete" onClick={onDelete}><Trash2 size={17}/></button>}{quiz.public && <button className="btn btn-outline" onClick={() => { navigator.clipboard?.writeText(location.origin + '/?quiz=' + quiz.id); notify('Đã sao chép đường dẫn Quiz!'); }}><Copy size={16}/> Chia sẻ</button>}<button className="btn btn-primary btn-start" onClick={() => onStart(quiz.id, mode)}><Play size={17} fill="currentColor"/> Bắt đầu chơi <ArrowRight size={18}/></button></div></div><div className="leaderboard"><SectionTitle eyebrow="HALL OF FAME" title="Bảng xếp hạng"/><Leaderboard key={quiz.id + mode} quizId={quiz.id} mode={mode} onLoad={onLeaderboard}/></div></>; }
function Leaderboard({ quizId, mode, onLoad }) { const [entries, setEntries] = useState([]); useEffect(() => { onLoad(quizId, mode).then(d => setEntries(d.leaderboard)).catch(() => setEntries([])); }, [quizId, mode, onLoad]); return <div className="surface leaderboard-inner">{entries.length ? entries.map((u, i) => <div className="rank-row" key={i}><span className={cx('rank-number', i < 3 && 'podium')}>{i + 1}</span><span className="avatar small">{u.name[0]?.toUpperCase()}</span><strong>{u.name}</strong><span className="muted">{u.correctCount} câu đúng</span><b>{u.score.toLocaleString('vi-VN')} XP</b></div>) : <p className="muted">Chưa có kết quả ở chế độ này. Hãy trở thành người đầu tiên!</p>}</div>; }
function Loader({ text = 'Đang tải...' }) { return <div className="loader-wrapper"><span className="loader-spinner"/><p>{text}</p></div>; }
function GameScreen({ attempt: initial, token, onResult, onExit, notify }) {
    const [attempt, setAttempt] = useState(initial), [feedback, setFeedback] = useState(null), [loading, setLoading] = useState(false), [hint, setHint] = useState(''), [hidden, setHidden] = useState([]), [votes, setVotes] = useState(null), [time, setTime] = useState(() => initial.deadlineAt ? Math.max(0, Math.ceil((Date.parse(initial.deadlineAt) - Date.now()) / 1000)) : 0);
    const idx = attempt.questions.findIndex(q => !attempt.answeredIds.includes(q.id));
    const question = idx >= 0 ? attempt.questions[idx] : null;
    const mode = attempt.mode, meta = MODE_META[mode] || MODE_META.classic;
    const completed = attempt.status === 'completed';
    useEffect(() => { const update = () => { if (attempt.deadlineAt)
        setTime(Math.max(0, Math.ceil((Date.parse(attempt.deadlineAt) - Date.now()) / 1000))); }; update(); const interval = setInterval(update, 250); return () => clearInterval(interval); }, [attempt.deadlineAt]);
    useEffect(() => { if (!attempt.deadlineAt || Date.now() < Date.parse(attempt.deadlineAt) || completed || loading)
        return; let alive = true; (async () => { try {
        const d = await req(`/attempts/${attempt.id}/finish`, { method: 'POST', token });
        if (alive) {
            setAttempt(d.attempt);
            setFeedback({ timeout: true });
        }
    }
    catch (e) {
        if (alive)
            notify(e.message);
    } })(); return () => { alive = false; }; }, [time, attempt.deadlineAt, completed, loading, attempt.id, token, notify]);
    async function answer(optionId) { if (!question || loading || feedback)
        return; setLoading(true); try {
        const d = await req(`/attempts/${attempt.id}/answer`, { method: 'POST', token, body: { questionId: question.id, optionId } });
        const next = { ...attempt, answeredIds: [...attempt.answeredIds, question.id], score: d.score, correctCount: d.correctCount, status: d.status };
        setAttempt(next);
        setFeedback({ ...d.answer, correctText: question.options.find(o => o.id === d.answer.correctOptionId)?.text, last: d.status === 'completed' });
    }
    catch (e) {
        notify(e.message);
    }
    finally {
        setLoading(false);
    } }
    async function getHint() { if (!question || loading)
        return; try {
        const d = await req(`/attempts/${attempt.id}/hint`, { method: 'POST', token, body: { questionId: question.id } });
        setHint(d.hint);
        setAttempt(prev => ({ ...prev, hintIds: d.hintIds }));
    }
    catch (e) {
        notify(e.message);
    } }
    async function getHelp(type) { try {
        const d = await req(`/attempts/${attempt.id}/help`, { method: 'POST', token, body: { questionId: question.id, type } });
        if (type === 'fifty')
            setHidden(d.hiddenIds || []);
        else
            setVotes(d.votes);
        setAttempt(p => ({ ...p, hintIds: d.hintIds }));
    }
    catch (e) {
        notify(e.message);
    } }
    async function finish() { try {
        setLoading(true);
        const d = await req(`/attempts/${attempt.id}/finish`, { method: 'POST', token });
        onResult(d.attempt);
    }
    catch (e) {
        notify(e.message);
    }
    finally {
        setLoading(false);
    } }
    function next() { setFeedback(null); setHint(''); setHidden([]); setVotes(null); if (completed || !question) {
        onResult(attempt);
    } }
    const progress = attempt.total ? attempt.answeredIds.length / attempt.total * 100 : 0;
    return <div className="play-page"><div className="game-top"><button onClick={onExit} className="quit-btn"><ArrowLeft size={18}/> Thoát</button><div className="game-top-middle"><span className={cx('game-mode-chip', meta.color)}><meta.icon size={16}/>{meta.name}</span><strong>{attempt.title}</strong></div><div className="game-top-score"><Star size={18} fill="#f9bc44" color="#f9bc44"/> {attempt.score} XP</div></div><div className="game-progress-caption"><span>TIẾN ĐỘ HỌC TẬP</span><b>{attempt.answeredIds.length} / {attempt.total} CÂU</b></div><div className="progress-track"><span style={{ width: `${progress}%` }}/></div>{mode === 'millionaire' && <div className="milestone-label"><Trophy size={15}/> Chinh phục cột mốc {Math.min(attempt.answeredIds.length+1,attempt.total)} / {attempt.total} · Độ khó tăng dần</div>}{attempt.deadlineAt && <div className={cx('timer-display', time < 15 && 'urgent')}><Timer size={19}/> {fmtTime(time)} <small>còn lại</small></div>}
 {feedback?.timeout ? <div className="surface feedback-box"><Clock3 size={36}/><h2>Đã hết giờ!</h2><p>Thời gian làm bài kết thúc. Cùng xem bạn đã đạt bao nhiêu điểm nhé.</p><button className="btn btn-primary" onClick={() => onResult(attempt)}>Xem kết quả <ArrowRight size={17}/></button></div> :
            feedback ? <div className="surface feedback-box"><span className={cx('feedback-emblem', feedback.correct ? 'yay' : 'nope')}>{feedback.correct ? <CheckCircle2 size={35}/> : <Info size={35}/>}</span><h2>{feedback.correct ? 'Chính xác! Giỏi quá 🎉' : 'Chưa đúng rồi!'}</h2><div className={cx('feedback-score', feedback.points >= 0 ? 'plus' : 'minus')}>{feedback.points >= 0 ? '+' : ''}{feedback.points} XP</div><p>{feedback.explanation}</p>{!feedback.correct && <p className="right-answer">Đáp án đúng: <b>{feedback.correctText || 'Xem lại sau'}</b></p>}<button className="btn btn-primary" onClick={next}>{feedback.last ? 'Xem kết quả' : 'Câu tiếp theo'} <ArrowRight size={18}/></button></div> :
                question ? <div className="game-main"><div className="question-header"><span className="question-no">CÂU HỎI {String(idx + 1).padStart(2, '0')}</span><span className="difficulty-label">{question.difficulty === 'easy' ? 'DỄ' : question.difficulty === 'hard' ? 'KHÓ' : 'TRUNG BÌNH'}</span></div><h1 className="playing-question">{question.text}</h1><div className="answer-instruction"><MousePointer2 size={15}/> {mode === 'chicken' ? 'Bắn vào con gà mang đáp án đúng' : mode === 'matching' ? 'Ghép câu hỏi với một thẻ trả lời' : 'Chọn một đáp án đúng nhất'}</div>
 {mode === 'chicken' ? <div className="chicken-world"><div className="cloud cloud1">☁</div><div className="cloud cloud2">☁</div>{question.options.map((o, i) => <button key={o.id} disabled={loading} style={{ '--i': i }} className="flying-chicken" onClick={() => answer(o.id)}><span className="chicken-emoji">🐔</span><span className="chicken-answer">{o.text}</span></button>)}<div className="grass">🌱 🌿 🌱 🌿 🌱 🌿 🌱</div></div> :
                        mode === 'matching' ? <div className="matching-game"><div className="match-prompt" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData('option-id');if(id)answer(id);}}><span>?</span><div>{question.text}<small className="match-drop-help">Kéo thẻ đáp án vào đây, hoặc chạm thẻ để ghép.</small></div></div><div className="answers-grid">{question.options.map((o, i) => <button disabled={loading} draggable={!loading} onDragStart={e=>e.dataTransfer.setData('option-id',o.id)} onClick={() => answer(o.id)} className="match-card" key={o.id}><span>{String.fromCharCode(65 + i)}</span>{o.text}</button>)}</div></div> :
                            <div className={cx('answers-grid', mode === 'millionaire' && 'millionaire-options')}>{question.options.map((o, i) => <button className={cx('answer-option', hidden.includes(o.id) && 'hidden-option')} disabled={loading || hidden.includes(o.id)} key={o.id} onClick={() => answer(o.id)}><span className="answer-letter">{o.id.toUpperCase()}</span><span>{o.text}</span><ChevronRight size={17}/>{votes && <span className="audience-votes">{votes[o.id]}%</span>}</button>)}</div>}
 <div className="lifelines"><div className="lifelines-start"><Lightbulb size={17}/> {hint ? <span>{hint}</span> : <span>Đang bí? Sử dụng gợi ý để học tốt hơn</span>}</div><div className="lifelines-actions"><button className="btn btn-soft" onClick={getHint} disabled={!!hint || loading}><Lightbulb size={16}/>{hint ? 'Đã dùng' : 'Gợi ý'}</button>{mode === 'millionaire' && <><button className="btn btn-soft" disabled={attempt.hintIds.some(x => x.startsWith('fifty:')) || loading} onClick={() => getHelp('fifty')}>50 : 50</button><button className="btn btn-soft" disabled={attempt.hintIds.some(x => x.startsWith('audience:')) || loading} onClick={() => getHelp('audience')}>👥 Khán giả (mô phỏng)</button></>}</div></div></div> :
                    <div className="surface feedback-box"><PartyPopper size={40}/><h2>Hoàn thành rồi!</h2><p>Bạn đã đi qua tất cả câu hỏi trong bộ Quiz.</p><button className="btn btn-primary" onClick={() => onResult(attempt)}>Xem kết quả <ArrowRight size={17}/></button></div>}
 <div className="game-footer"><span><ShieldCheck size={15}/> Kết quả được ghi nhận bởi backend</span><button onClick={finish} disabled={loading}>Kết thúc bài <ArrowRight size={16}/></button></div></div>;
}
function ResultPage({ attempt, onBack, onAgain }) { if (!attempt)
    return <Loader />; const answerEntries = Object.entries(attempt.answers || {}); const accuracy = attempt.total ? Math.round(attempt.correctCount / attempt.total * 100) : 0; return <div className="result-page"><div className="result-hero"><div className="confetti c1">✦</div><div className="confetti c2">✳</div><div className="confetti c3">✧</div><span className="result-trophy"><Trophy size={49}/></span><span className="result-kicker">QUIZ COMPLETE ✨</span><h1>Tuyệt vời! Bạn đã hoàn thành 🎉</h1><p>{attempt.title} · {MODE_META[attempt.mode]?.name || 'Quiz thường'}</p><div className="result-score"><b>{attempt.score.toLocaleString('vi-VN')}</b><span>ĐIỂM KINH NGHIỆM · XP</span></div></div><div className="result-stats"><div><CheckCircle2 size={24}/><strong>{attempt.correctCount}/{attempt.total}</strong><span>Số câu đúng</span></div><div><Target size={24}/><strong>{accuracy}%</strong><span>Độ chính xác</span></div><div><Star size={24}/><strong>{answerEntries.length}</strong><span>Câu đã trả lời</span></div></div><div className="result-actions"><button className="btn btn-soft" onClick={onBack}><ArrowLeft size={17}/> Về thư viện</button><button className="btn btn-primary" onClick={() => onAgain(attempt.quizId, attempt.mode)}><RotateCcw size={17}/> Chơi lại</button></div><SectionTitle eyebrow="LEARN FROM EVERY ANSWER" title="Xem lại bài làm" desc="Đọc lời giải để hiểu rõ hơn những kiến thức vừa học."/><div className="review-list">{attempt.questions.map((q, i) => { const ans = attempt.answers?.[q.id]; return <div key={q.id} className="review-item"><span className={cx('review-number', !ans ? 'none' : ans.correct ? 'yes' : 'no')}>{ans ? (ans.correct ? <Check size={18}/> : <X size={18}/>) : <Clock3 size={18}/>}</span><div className="review-content"><small>CÂU {i + 1}</small><h3>{q.text}</h3><p>{ans ? `Bạn chọn: ${q.options.find(o => o.id === ans.optionId)?.text || ans.optionId}` : 'Chưa trả lời'}</p>{ans && <div className="review-explain"><Lightbulb size={17}/>{ans.explanation}</div>}</div>{ans && <span className={cx('review-points', ans.points >= 0 ? 'green' : 'red')}>{ans.points >= 0 ? '+' : ''}{ans.points} XP</span>}</div>; })}</div></div>; }
function HistoryPage({ attempts, onReview }) { return <><SectionTitle eyebrow="YOUR LEARNING JOURNEY" title="Lịch sử học tập" desc="Nhìn lại những chặng đường bạn đã chinh phục."/><div className="surface history-table"><div className="history-head"><span>Bộ quiz</span><span>Chế độ</span><span>Thời gian</span><span>Điểm</span><span>Trạng thái</span></div>{attempts.length ? attempts.map(a => <button className="history-row" key={a.id} onClick={() => a.status === 'completed' && onReview(a.id)}><span className="history-title"><BookOpen size={17}/><b>{a.title}</b></span><span>{MODE_META[a.mode]?.name}</span><span>{fmtDate(a.startedAt)}</span><span className="history-score">{a.score} XP</span><span className={cx('status-pill', a.status === 'completed' ? 'complete' : 'progress')}>{a.status === 'completed' ? 'Đã xong' : 'Dở dang'}</span></button>) : <div className="empty-mini">Bạn chưa hoàn thành bài quiz nào.</div>}</div></>; }
function FlashcardsPage({ questions }) { const [idx, setIdx] = useState(0), [flip, setFlip] = useState(false); useEffect(() => { setIdx(0); setFlip(false); }, [questions]); return <><SectionTitle eyebrow="STUDY SMARTER" title="Ôn tập câu sai" desc="Biến sai lầm thành kiến thức vững chắc cùng flashcards."/>{questions.length ? <div className="flash-area"><div className="flash-progress">THẺ {idx + 1} / {questions.length}</div><button className={cx('flash-card', flip && 'flipped')} onClick={() => setFlip(!flip)}><div className="flash-front"><span>{flip ? 'ĐÁP ÁN & GIẢI THÍCH' : 'CÂU HỎI'}</span><h2>{flip ? questions[idx].options.find(o => o.id === questions[idx].correctOptionId)?.text : questions[idx].text}</h2>{flip && <p>{questions[idx].explanation}</p>}<small><RotateCcw size={14}/> Nhấn để lật thẻ</small></div></button><div className="flash-controls"><button className="btn btn-soft" disabled={idx === 0} onClick={() => { setIdx(i => i - 1); setFlip(false); }}><ChevronLeft size={17}/> Trước</button><button className="btn btn-primary" onClick={() => { setIdx(i => (i + 1) % questions.length); setFlip(false); }}>Câu tiếp <ChevronRight size={17}/></button></div></div> : <div className="empty-state"><span className="empty-art"><GraduationCap size={44}/></span><h3>Chưa có câu sai để ôn tập!</h3><p>Hãy làm một vài bộ quiz để tạo flashcards từ những câu bạn chưa trả lời đúng.</p></div>}</>; }
function EditQuiz({ token, quiz, onBack, onSaved, notify }) { const [title, setTitle] = useState(quiz.title), [description, setDescription] = useState(quiz.description), [questions, setQuestions] = useState(quiz.questions), [config, setConfig] = useState(quiz.config), [publicQuiz, setPublicQuiz] = useState(quiz.public), [working, setWorking] = useState(false); if (!questions?.[0]?.correctOptionId)
    return <div className="surface empty-state"><h3>Không thể chỉnh sửa</h3><p>Hãy trở lại thư viện để mở bộ quiz do bạn sở hữu.</p><button onClick={onBack} className="btn btn-primary">Quay lại</button></div>; async function save() { setWorking(true); try {
    const d = await req(`/quizzes/${quiz.id}`, { token, method: 'PATCH', body: { title, description, questions, config, public: publicQuiz } });
    notify('Đã lưu thay đổi.');
    onSaved();
}
catch (e) {
    notify(e.message);
}
finally {
    setWorking(false);
} } return <><SectionTitle title="Chỉnh sửa bộ quiz" desc="Chỉ có thể sửa nội dung nếu chưa có ai bắt đầu làm bộ đề này."/><div className="surface edit-info"><label className="wide-field">Tên quiz<input value={title} onChange={e => setTitle(e.target.value)}/></label><label className="wide-field">Mô tả<input value={description} onChange={e => setDescription(e.target.value)}/></label><label className="toggle-row"><input type="checkbox" checked={publicQuiz} onChange={e => setPublicQuiz(e.target.checked)}/> Cho phép chia sẻ công khai</label><div className="question-editor-header"><h3>{questions.length} câu hỏi</h3></div>{questions.map((q, i) => <div key={q.id} className="question-editor-card"><div className="question-index">CÂU {i + 1}</div><textarea rows="2" className="question-edit-title" value={q.text} onChange={e => setQuestions(old => old.map((v, j) => j === i ? { ...v, text: e.target.value } : v))}/><div className="option-edit-grid">{q.options.map(o => <div key={o.id} className={cx('option-edit', q.correctOptionId === o.id && 'correct')}><button onClick={() => setQuestions(old => old.map((v, j) => j === i ? { ...v, correctOptionId: o.id } : v))}>{q.correctOptionId === o.id ? <Check size={14}/> : o.id.toUpperCase()}</button><input value={o.text} onChange={e => setQuestions(old => old.map((v, j) => j === i ? { ...v, options: v.options.map(x => x.id === o.id ? { ...x, text: e.target.value } : x) } : v))}/></div>)}</div><label className="editor-sub-label">Giải thích<input value={q.explanation} onChange={e => setQuestions(old => old.map((v, j) => j === i ? { ...v, explanation: e.target.value } : v))}/></label><label className="editor-sub-label">Gợi ý<input value={q.hint} onChange={e => setQuestions(old => old.map((v, j) => j === i ? { ...v, hint: e.target.value } : v))}/></label></div>)}<div className="form-foot"><button className="btn btn-soft" onClick={onBack}>Hủy</button><button className="btn btn-primary" disabled={working} onClick={save}><Save size={16}/>{working ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div></div></>; }
function App() {
    const [token, setToken] = useState(() => localStorage.getItem('quizora_token') || ''), [user, setUser] = useState(() => { try {
        return JSON.parse(localStorage.getItem('quizora_user') || 'null');
    }
    catch {
        return null;
    } }), [screen, setScreen] = useState('dashboard'), [mobileOpen, setMobileOpen] = useState(false), [toast, setToast] = useState(''), [quizzes, setQuizzes] = useState([]), [discover, setDiscover] = useState([]), [attempts, setAttempts] = useState([]), [stats, setStats] = useState({}), [wrongQuestions, setWrongQuestions] = useState([]), [selected, setSelected] = useState(null), [attempt, setAttempt] = useState(null), [busy, setBusy] = useState(false), [aiStatus, setAiStatus] = useState(null);
    const notify = useMemo(() => (message) => setToast(message), []);
    async function refresh(t = token) { if (!t)
        return; const results = await Promise.allSettled([req('/quizzes', { token: t }), req('/discover', { token: t }), req('/attempts', { token: t }), req('/stats', { token: t }), req('/wrong-questions', { token: t }), req('/health')]); const [q, d, a, s, w, h] = results; if (q.status === 'fulfilled')
        setQuizzes(q.value.quizzes); if (d.status === 'fulfilled')
        setDiscover(d.value.quizzes); if (a.status === 'fulfilled')
        setAttempts(a.value.attempts); if (s.status === 'fulfilled')
        setStats(s.value); if (w.status === 'fulfilled')
        setWrongQuestions(w.value.questions); if (h.status === 'fulfilled')
        setAiStatus(h.value); }
    useEffect(() => { if (token)
        refresh(token).catch(e => notify(e.message)); }, [token]);
    useEffect(() => { if (token && location.search.startsWith('?quiz=')) {
        const id = new URLSearchParams(location.search).get('quiz');
        history.replaceState({}, '', location.pathname);
        if (id)
            openQuiz(id);
    } }, [token]);
    function onAuth(data) { localStorage.setItem('quizora_token', data.token); localStorage.setItem('quizora_user', JSON.stringify(data.user)); setToken(data.token); setUser(data.user); setScreen('dashboard'); }
    function logout() { localStorage.removeItem('quizora_token'); localStorage.removeItem('quizora_user'); setToken(''); setUser(null); setScreen('dashboard'); }
    function navigate(s) { setScreen(s); if (['dashboard', 'history', 'library', 'explore', 'flashcards'].includes(s))
        refresh().catch(() => { }); }
    async function openQuiz(id) { setBusy(true); try {
        const d = await req('/quizzes/' + id, { token });
        setSelected(d.quiz);
        setScreen('detail');
    }
    catch (e) {
        notify(e.message);
    }
    finally {
        setBusy(false);
    } }
    async function startGame(id, mode) { setBusy(true); try {
        const d = await req(`/quizzes/${id}/start`, { token, method: 'POST', body: { mode } });
        setAttempt(d.attempt);
        setScreen('play');
    }
    catch (e) {
        notify(e.message);
    }
    finally {
        setBusy(false);
    } }
    async function openResult(id) { setBusy(true); try {
        const d = await req('/attempts/' + id, { token });
        setAttempt(d.attempt);
        setScreen('result');
        refresh().catch(() => { });
    }
    catch (e) {
        notify(e.message);
    }
    finally {
        setBusy(false);
    } }
    async function deleteQuiz() { if (!selected || !confirm('Bạn có chắc muốn xóa bộ quiz?'))
        return; try {
        await req('/quizzes/' + selected.id, { token, method: 'DELETE' });
        notify('Đã xóa bộ quiz');
        setScreen('library');
        refresh();
    }
    catch (e) {
        notify(e.message);
    } }
    if (!token)
        return <><AuthScreen onAuth={onAuth}/><Toast text={toast} onClear={() => setToast('')}/></>;
    return <div className="app-shell"><Sidebar screen={screen} setScreen={navigate} user={user} onLogout={logout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/><div className="app-main"><Header screen={screen} setScreen={navigate} username={user?.name} onMenu={() => setMobileOpen(true)}/><main className={cx('main-content', screen === 'play' && 'game-content')}>{busy ? <Loader text="Đang kết nối với hệ thống..."/> : screen === 'dashboard' ? <Dashboard user={user} stats={stats} quizzes={quizzes} discover={discover} attempts={attempts} onScreen={navigate} onOpen={openQuiz} onPlay={id => startGame(id, 'classic')}/> : screen === 'create' ? <CreateQuiz key={screen + String(user?.id)} token={token} aiStatus={aiStatus} notify={notify} onSaved={async (id) => { await refresh(); openQuiz(id); }}/> : screen === 'library' ? <LibraryPage quizzes={quizzes} open={openQuiz} play={id => startGame(id, 'classic')} onCreate={() => navigate('create')}/> : screen === 'explore' ? <LibraryPage header="Khám phá quiz" desc="Những bộ câu hỏi công khai để cùng học và chinh phục." quizzes={discover} open={openQuiz} play={id => startGame(id, 'classic')} onCreate={() => navigate('create')}/> : screen === 'detail' ? <DetailPage quiz={selected} onBack={() => navigate('library')} onStart={startGame} onEdit={() => setScreen('edit')} onDelete={deleteQuiz} onLeaderboard={(id, mode) => req(`/quizzes/${id}/leaderboard?mode=${mode}`, { token })} notify={notify}/> : screen === 'edit' ? <EditQuiz key={selected?.id} quiz={selected} token={token} notify={notify} onBack={() => setScreen('detail')} onSaved={() => openQuiz(selected.id)}/> : screen === 'play' ? <GameScreen key={attempt?.id} token={token} attempt={attempt} onExit={() => navigate('library')} onResult={a => openResult(a.id)} notify={notify}/> : screen === 'result' ? <ResultPage attempt={attempt} onBack={() => navigate('library')} onAgain={startGame}/> : screen === 'history' ? <HistoryPage attempts={attempts} onReview={openResult}/> : screen === 'flashcards' ? <FlashcardsPage questions={wrongQuestions}/> : null}</main><footer className="main-footer"><span>© 2026 Quizora Studio · Made to make learning fun ✨</span><span>React + Express + Groq AI</span></footer></div><Toast text={toast} onClear={() => setToast('')}/></div>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
