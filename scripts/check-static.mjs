import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const root=process.cwd();
const files=['apps/api/src/config.js','apps/api/src/app.js','apps/api/src/db.js','apps/api/src/ai.js','apps/api/src/ai-provider.js','apps/api/src/groq-client.js','apps/api/src/gemini-settings.js','apps/api/src/scoring.js','apps/api/src/server.js','apps/web/vite.config.js','scripts/smoke.mjs','scripts/doctor.mjs'];
let passed=0;
for (const f of files) {
 const abs=path.join(root,f);
 if(!existsSync(abs))throw Error('Missing '+f);
 execFileSync(process.execPath,['--check',abs],{stdio:'pipe'});
 console.log('PASS syntax',f);passed++;
}
const web=readFileSync('apps/web/src/main.jsx','utf8');
const vite=readFileSync('apps/web/vite.config.js','utf8');
const css=readFileSync('apps/web/src/style.css','utf8');
const html=readFileSync('apps/web/index.html','utf8');
if(!web.includes("import.meta.env.DEV ? '/api'")||!vite.includes("'/api'")||!vite.includes('127.0.0.1:3000'))throw Error('Missing same-origin proxy');
console.log('PASS Vite proxy và frontend cùng origin');passed++;
if(!html.includes('<meta charset="UTF-8"')||!css.includes('Segoe UI')||html.includes('fonts.googleapis.com'))throw Error('Font Unicode config not self-contained');
console.log('PASS UTF-8 và font hệ thống không cần Internet');passed++;
console.log(`\nHoàn thành ${passed} phép kiểm tra tĩnh.`);
