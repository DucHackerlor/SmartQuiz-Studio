/** Cấu hình Gemini, tách khỏi SDK để có thể kiểm thử không cần Internet. */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
export const geminiModel = () => (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();

export function getThinkingConfig(stage = 'generate', modelId = geminiModel()) {
  // Gemini 3/4 dùng thinkingLevel; dùng thinkingBudget ở đây sẽ gây HTTP 400.
  if (/^gemini-(?:3|4)(?:\.|-)/.test(modelId)) {
    const raw = stage === 'ocr' ? 'low' : (process.env.GEMINI_THINKING_LEVEL || 'high').toLowerCase();
    const level = ['low', 'medium', 'high'].includes(raw) ? raw : 'high';
    return { thinkingLevel: level };
  }
  // Giữ khả năng chạy trên Gemini 2.5 nếu chủ dự án chủ động đổi model.
  if (/^gemini-2\.5-pro(?:$|-)/.test(modelId)) return { thinkingBudget: stage === 'ocr' ? 128 : 2048 };
  if (/^gemini-2\.5-flash(?:$|-)/.test(modelId)) return { thinkingBudget: stage === 'ocr' ? 0 : 1024 };
  return undefined;
}
