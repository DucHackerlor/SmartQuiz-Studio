// Provider switch. Secrets stay on the backend only.
export const aiProvider = () => (process.env.AI_PROVIDER || 'gemini').trim().toLowerCase();
export const groqModel = () => (process.env.GROQ_MODEL || 'qwen/qwen3.8-27b').trim();
export const isAiConfigured = () => {
  if (process.env.AI_MODE === 'demo') return false;
  return aiProvider() === 'groq' ? Boolean(process.env.GROQ_API_KEY?.trim()) : Boolean(process.env.GEMINI_API_KEY?.trim());
};
