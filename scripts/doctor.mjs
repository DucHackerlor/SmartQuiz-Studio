import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import net from 'node:net';

const root = process.cwd();
let errors = 0;
const row = (ok, msg, detail = '') => {
  console.log(`${ok ? '[OK]' : '[!!]'} ${msg}${detail ? ` — ${detail}` : ''}`);
  if (!ok && msg.startsWith('Node.js')) errors++;
};
const [major, minor] = process.versions.node.split('.').map(Number);
row(major > 22 || (major === 22 && minor >= 13), 'Node.js phiên bản hỗ trợ node:sqlite', `hiện tại ${process.version}; cần >= 22.13, khuyến nghị Node 24 LTS`);
const req = createRequire(import.meta.url);
for (const [label, moduleName, rel] of [['Express', 'express', 'apps/api'], ['React', 'react', 'apps/web'], ['Vite', 'vite', 'apps/web'], ['Gemini SDK', '@google/genai', 'apps/api']]) {
  try {req.resolve(moduleName, {paths: [resolve(root, rel)]}); row(true, `${label} đã cài`);}
  catch {row(false, `${label} chưa cài`, 'chạy npm install từ thư mục gốc');}
}
for (const rel of ['apps/api/.env','apps/web/.env']) {
  row(existsSync(resolve(root, rel)), `Cấu hình ${rel}`, existsSync(resolve(root,rel)) ? '' : `sao chép ${rel}.example thành ${rel}`);
}
const path = resolve(root, 'apps/api/.env');
if (existsSync(path)) {
  const content = readFileSync(path, 'utf8');
  const provider = content.match(/^AI_PROVIDER\s*=\s*(.*)$/m)?.[1]?.trim() || 'gemini';
  const keyName = provider === 'groq' ? 'GROQ_API_KEY' : 'GEMINI_API_KEY';
  const match = content.match(new RegExp(`^${keyName}\\s*=\\s*(.*)$`, 'm'));
  const mode = content.match(/^AI_MODE\s*=\s*(.*)$/m)?.[1]?.trim() || 'real';
  row(Boolean(match?.[1]?.trim() && !/YOUR_|PASTE_|YOUR-KEY|^xxx/i.test(match[1].trim())), `${provider.toUpperCase()} API key`, mode === 'demo' ? 'Demo mode: không gửi API thật' : 'AI thật cần key hợp lệ; nếu chưa có, thử quiz mẫu');
}
async function checkPort(port) {
 return new Promise(r => {const s=net.createConnection({host:'127.0.0.1',port});s.setTimeout(900);s.on('connect',()=>{r(true);s.destroy()});s.on('error',()=>r(false));s.on('timeout',()=>{r(false);s.destroy()});});
}
for (const port of [3000,5173]) {
 const used=await checkPort(port);
 console.log(`[INFO] Cổng ${port}: ${used ? 'đang có chương trình chạy (nếu lỗi EADDRINUSE hãy đóng tiến trình cũ)' : 'chưa có server chạy'}`);
}
console.log('\nChạy ứng dụng: npm run dev');
console.log('Kiểm tra API khi server đang chạy: http://localhost:3000/api/health');
if(errors) process.exitCode=1;
