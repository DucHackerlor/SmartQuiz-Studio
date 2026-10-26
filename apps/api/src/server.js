import './config.js';
import { app } from './app.js';
import { aiProvider, isAiConfigured } from './ai-provider.js';
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.startsWith('replace-with-') || process.env.JWT_SECRET === 'LOCAL-DEV-ONLY-SECRET-CHANGE-IN-ENV')) {
  throw new Error('Production cần JWT_SECRET ngẫu nhiên từ biến môi trường của hosting.');
}
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => { console.log(`\n  SmartQuiz API: http://localhost:${port}/api/health`); console.log(`  AI ${aiProvider()}: ${isAiConfigured() ? 'API key configured' : 'chua co API key - demo quiz van hoat dong'}\n`); });
