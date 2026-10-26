import test from 'node:test';
import assert from 'node:assert/strict';
import { groqChat, groqReadImage } from '../apps/api/src/groq-client.js';
import { aiProvider, groqModel, isAiConfigured } from '../apps/api/src/ai-provider.js';
const originalFetch = globalThis.fetch;
const originalEnv = { AI_PROVIDER: process.env.AI_PROVIDER, GROQ_API_KEY: process.env.GROQ_API_KEY, AI_MODE: process.env.AI_MODE, GROQ_MODEL: process.env.GROQ_MODEL };

test('Groq request sends expected JSON, does not put key in request body', async () => {
  process.env.GROQ_API_KEY = 'gsk_fake_mock_key_for_test_only';
  process.env.GROQ_MODEL = 'qwen/qwen3.8-27b';
  process.env.AI_PROVIDER = 'groq'; process.env.AI_MODE = 'real';
  globalThis.fetch = async (url, init) => {
    assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
    assert.equal(init.headers.Authorization, 'Bearer gsk_fake_mock_key_for_test_only');
    const body = JSON.parse(init.body);
    assert.equal(body.model, 'qwen/qwen3.8-27b');
    assert.equal(body.response_format.type, 'json_object');
    assert.equal(body.reasoning_effort, 'none');
    assert.ok(!init.body.includes('gsk_fake_mock_key_for_test_only'));
    return { ok: true, json: async () => ({ choices: [{ message: { content: '{"questions":[]}' } }] }) };
  };
  assert.equal(aiProvider(), 'groq'); assert.equal(groqModel(), 'qwen/qwen3.8-27b'); assert.equal(isAiConfigured(), true);
  const out = await groqChat({ content: 'JSON questions', json: true });
  assert.equal(out, '{"questions":[]}');
});

test('Groq maps 429 into safe text', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 429 });
  await assert.rejects(groqChat({ content: 'hi' }), err => err.status === 429 && err.message.includes('hạn mức'));
});

test('Groq image OCR uses a data URI and refuses PDF scan', async () => {
  globalThis.fetch = async (_url, init) => {
    const content = JSON.parse(init.body).messages[0].content;
    assert.equal(content[1].type, 'image_url');
    assert.match(content[1].image_url.url, /^data:image\/png;base64,/);
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'Chữ trên ảnh' } }] }) };
  };
  const out = await groqReadImage(Buffer.from('fakePNG'), 'image/png');
  assert.equal(out, 'Chữ trên ảnh');
  await assert.rejects(groqReadImage(Buffer.from('%PDF'), 'application/pdf'), err => err.status === 422);
});

test('Demo mode marks live AI as not configured', () => {
  process.env.AI_MODE = 'demo';
  assert.equal(isAiConfigured(), false);
});

test('restore globals', () => {
  globalThis.fetch = originalFetch;
  for (const [key,val] of Object.entries(originalEnv)) { if (val === undefined) delete process.env[key]; else process.env[key] = val; }
});
