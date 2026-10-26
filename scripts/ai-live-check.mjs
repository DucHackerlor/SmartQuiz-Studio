import '../apps/api/src/config.js';
import { aiProvider, groqModel } from '../apps/api/src/ai-provider.js';
import { geminiModel } from '../apps/api/src/gemini-settings.js';
import { generateQuestions } from '../apps/api/src/ai.js';

const provider = aiProvider();
const key = provider === 'groq' ? process.env.GROQ_API_KEY : process.env.GEMINI_API_KEY;
if (!key || key.trim().length < 20) {
  console.error(`THIẾU ${provider === 'groq' ? 'GROQ_API_KEY' : 'GEMINI_API_KEY'}. Chạy CAI_DAT_GROQ.ps1 hoặc CAI_DAT_GEMINI.ps1 trong thư mục gốc.`);
  process.exit(1);
}
process.env.AI_MODE = 'real';
console.log(`Kiểm tra AI thật qua ${provider}:`, provider === 'groq' ? groqModel() : geminiModel());
console.log('Không in API key.');
try {
  const result = await generateQuestions({
    sourceText: 'React là thư viện JavaScript xây dựng giao diện. Hook useState quản lý state và useEffect thực hiện side effect. REST API giúp frontend trao đổi dữ liệu với backend qua HTTP.',
    count: 3,
    difficulty: 'easy'
  });
  if (result.provider !== provider || result.questions.length !== 3) throw Error('Kết quả AI không hợp lệ');
  console.log(`PASS ${provider.toUpperCase()} trả về đúng 3 câu hỏi JSON.`);
  console.log('Ví dụ câu hỏi:', result.questions[0].text);
} catch(e) {
  console.error('FAIL:', e.message);
  console.error(provider === 'groq' ? 'Kiểm tra https://console.groq.com/keys và https://console.groq.com/settings/limits' : 'Kiểm tra model, kết nối và quyền Google AI Studio.');
  process.exitCode = 1;
}
