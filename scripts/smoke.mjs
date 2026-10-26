import assert from 'node:assert/strict';
const direct = 'http://127.0.0.1:3000/api';
const proxied = 'http://127.0.0.1:5173/api';
let pass = 0;
async function api(base, path, { method='GET', body, token }={}) {
 const controller = new AbortController();
 const timeout = setTimeout(() => controller.abort(), 8000);
 try {
   const r = await fetch(base + path, {method, signal: controller.signal, headers:{...(body?{'Content-Type':'application/json'}:{}), ...(token?{Authorization:`Bearer ${token}`}:{})}, body: body?JSON.stringify(body):undefined});
   const json = await r.json().catch(()=>({}));
   return {status:r.status,body:json};
 } finally {clearTimeout(timeout);}
}
function ok(cond,label) { assert.ok(cond,label); console.log('PASS',label);pass++;}
try {
 const d=await api(direct,'/health');ok(d.status===200 && d.body.ok===true,'Backend /api/health trực tiếp');
 const p=await api(proxied,'/health');ok(p.status===200 && p.body.ok===true,'Frontend → Vite proxy → Backend');
 const rnd=`smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
 const user={name:'Kiểm tra tích hợp',email:`${rnd}@example.test`,password:'Password_123456'};
 const reg=await api(proxied,'/auth/register',{method:'POST',body:user});ok(reg.status===201 && !!reg.body.token && reg.body.user.name===user.name,'Đăng ký tài khoản bằng tiếng Việt');
 const token=reg.body.token;
 const login=await api(proxied,'/auth/login',{method:'POST',body:{email:user.email,password:user.password}});ok(login.status===200 && !!login.body.token,'Đăng nhập thành công');
 const discover=await api(proxied,'/discover',{token});ok(discover.status===200 && discover.body.quizzes.some(x=>x.id==='demo-quiz-react-web-101'),'Lấy bộ quiz mẫu');
 const start=await api(proxied,'/quizzes/demo-quiz-react-web-101/start',{method:'POST',token,body:{mode:'classic'}});ok(start.status===201 && start.body.attempt.questions.length>0,'Bắt đầu lượt Quiz thường');
 const at=start.body.attempt;const first=at.questions[0];
 const a=await api(proxied,`/attempts/${at.id}/answer`,{method:'POST',token,body:{questionId:first.id,optionId:first.options[0].id}});ok(a.status===200 && typeof a.body.score==='number','Gửi đáp án & backend chấm điểm');
 const dup=await api(proxied,`/attempts/${at.id}/answer`,{method:'POST',token,body:{questionId:first.id,optionId:first.options[0].id}});ok(dup.status===409,'Không cho chấm trùng một câu');
 const end=await api(proxied,`/attempts/${at.id}/finish`,{method:'POST',token});ok(end.status===200 && end.body.attempt.status==='completed','Kết thúc lượt và lưu kết quả');
 const history=await api(proxied,'/attempts',{token});ok(history.status===200 && history.body.attempts.some(x=>x.id===at.id),'Lịch sử có lượt vừa chơi');
 const generated=await api(proxied,'/ai/generate',{method:'POST',token,body:{text:'React Hooks giúp ứng dụng quản lý state. REST API sử dụng HTTP để trao đổi dữ liệu giữa client và server.',count:3,difficulty:'easy',demo:true}});ok(generated.status===200&&generated.body.provider==='demo'&&generated.body.questions.length===3,'Chế độ AI DEMO (không gọi Gemini)');
 console.log(`\n✅ ${pass} bài smoke test đã đạt. Chưa kiểm tra API Gemini thật.`);
} catch(e) {
 console.error('\n❌ SMOKE TEST FAILED:',e.message);
 console.error('Hãy chạy npm run dev ở terminal thứ nhất, kiểm tra cả 2 địa chỉ, rồi npm run smoke ở terminal thứ hai.');
 process.exitCode=1;
}
