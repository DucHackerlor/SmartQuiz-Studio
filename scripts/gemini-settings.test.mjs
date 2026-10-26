import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_GEMINI_MODEL, getThinkingConfig} from '../apps/api/src/gemini-settings.js';

test('Model mặc định Gemini 3.8 Flash', () => assert.equal(DEFAULT_GEMINI_MODEL, 'gemini-3.8-flash'));
test('3.8 generation dùng thinkingLevel high', () => assert.deepEqual(getThinkingConfig('generate','gemini-3.8-flash'), {thinkingLevel:'high'}));
test('3.8 OCR dùng low cho tốc độ', () => assert.deepEqual(getThinkingConfig('ocr','gemini-3.8-flash'), {thinkingLevel:'low'}));
test('3.1 Pro có thể dùng thinkingLevel', () => assert.deepEqual(getThinkingConfig('generate','gemini-3.1-pro-preview'), {thinkingLevel:'high'}));
test('2.5 Pro dùng thinkingBudget hợp lệ', () => assert.deepEqual(getThinkingConfig('generate','gemini-2.5-pro'), {thinkingBudget:2048}));
test('model lạ không gắn thinking config', () => assert.equal(getThinkingConfig('generate','custom'), undefined));
