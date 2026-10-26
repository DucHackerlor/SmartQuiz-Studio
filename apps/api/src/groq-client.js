// Groq Chat Completions client, using built-in fetch (Node >=22); no extra dependency.
import { groqModel } from './ai-provider.js';

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function groqChat({ content, json = false, maxTokens = 4096 }) {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) throw Object.assign(new Error('Chưa cấu hình GROQ_API_KEY trong apps/api/.env.'), { status: 503 });
  const payload = {
    model: groqModel(),
    messages: [{ role: 'user', content }],
    temperature: 0.6,
    max_completion_tokens: maxTokens,
    reasoning_effort: 'none', // Qwen instruct mode: outputs only the answer
    ...(json ? { response_format: { type: 'json_object' } } : {})
  };
  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(110000)
    });
  } catch (e) {
    const timeout = e?.name === 'TimeoutError' || e?.name === 'AbortError';
    throw Object.assign(new Error(timeout ? 'Groq phản hồi quá lâu. Hãy thử tài liệu ngắn hơn.' : 'Không kết nối được Groq. Hãy kiểm tra Internet.'), { status: timeout ? 504 : 502 });
  }
  if (!response.ok) {
    // Do not forward raw provider errors: they can disclose internal details.
    const status = response.status;
    const message = status === 401 ? 'Groq API key không hợp lệ. Hãy tạo key mới.'
      : status === 403 ? 'Groq từ chối quyền truy cập key hoặc model. Hãy kiểm tra tài khoản Free và model.'
      : status === 429 ? 'Groq đã hết hạn mức miễn phí hoặc giới hạn token/phút. Hãy thử lại sau.'
      : status === 404 ? 'Model Groq không tồn tại. Hãy kiểm tra GROQ_MODEL trong .env.'
      : status === 400 ? 'Groq không chấp nhận yêu cầu. Hãy giảm số câu hoặc rút ngắn tài liệu.'
      : 'Groq đang gặp sự cố. Hãy thử lại sau.';
    throw Object.assign(new Error(message), { status: status === 429 ? 429 : 502 });
  }
  let data;
  try { data = await response.json(); }
  catch { throw Object.assign(new Error('Groq trả về dữ liệu không hợp lệ.'), { status: 502 }); }
  const result = data?.choices?.[0]?.message?.content;
  if (typeof result !== 'string' || !result.trim()) {
    throw Object.assign(new Error('Groq chưa trả về nội dung. Hãy thử lại với ít câu hỏi hơn.'), { status: 502 });
  }
  return result.trim();
}

export async function groqReadImage(buffer, mimeType) {
  if (!['image/jpeg','image/png','image/webp'].includes(mimeType))
    throw Object.assign(new Error('Groq Vision chỉ nhận JPG, PNG, WEBP. Với PDF quét, hãy chuyển trang cần đọc thành ảnh PNG/JPG rồi tải lên.'), { status: 422 });
  const content = [
    { type: 'text', text: 'Bạn là công cụ OCR. Chỉ trích xuất chữ trong ảnh, giữ nguyên tiếng Việt và công thức. Không suy diễn, không làm bài quiz. Nếu không đọc được, trả lời KHONG_DOC_DUOC.' },
    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${buffer.toString('base64')}` } }
  ];
  return groqChat({ content, maxTokens: 4500 });
}
