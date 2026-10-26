import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
const rnd = Math.random().toString(36).slice(2);
describe('API', () => {
    it('health endpoint', async () => { const res = await request(app).get('/api/health'); expect(res.status).toBe(200); expect(res.body.ok).toBe(true); });
    it('private endpoint requires auth', async () => { const res = await request(app).get('/api/quizzes'); expect(res.status).toBe(401); });
    it('register, create demo quiz and play', async () => {
        const reg = await request(app).post('/api/auth/register').send({ name: 'Test Student', email: `test-${rnd}@example.com`, password: 'password123' });
        expect(reg.status).toBe(201);
        const token = reg.body.token;
        const list = await request(app).get('/api/discover').set('Authorization', `Bearer ${token}`);
        expect(list.body.quizzes.length).toBeGreaterThan(0);
        const started = await request(app).post('/api/quizzes/demo-quiz-react-web-101/start').set('Authorization', `Bearer ${token}`).send({ mode: 'classic' });
        expect(started.status).toBe(201);
        const at = started.body.attempt;
        expect(at.questions[0].correctOptionId).toBeUndefined();
        const answer = await request(app).post(`/api/attempts/${at.id}/answer`).set('Authorization', `Bearer ${token}`).send({ questionId: at.questions[0].id, optionId: at.questions[0].options[0].id });
        expect(answer.status).toBe(200);
        const duplicate = await request(app).post(`/api/attempts/${at.id}/answer`).set('Authorization', `Bearer ${token}`).send({ questionId: at.questions[0].id, optionId: at.questions[0].options[0].id });
        expect(duplicate.status).toBe(409);
        const finish = await request(app).post(`/api/attempts/${at.id}/finish`).set('Authorization', `Bearer ${token}`);
        expect(finish.body.attempt.status).toBe('completed');
    });
});

describe('AI demo route', () => {
 it('requires authentication before using generator',async()=>{
  const res=await request(app).post('/api/ai/generate').send({text:'test',count:5,difficulty:'easy',demo:true});
  expect(res.status).toBe(401);
 });
 it('rejects invalid source text even in demo',async()=>{
  const email=`demo-${Math.random().toString(36).slice(2)}@example.com`;
  const reg=await request(app).post('/api/auth/register').send({name:'Demo QA',email,password:'password123'});
  const res=await request(app).post('/api/ai/generate').set('Authorization',`Bearer ${reg.body.token}`).send({text:'too short',count:5,difficulty:'easy',demo:true});
  expect(res.status).toBe(400);
 });
});
