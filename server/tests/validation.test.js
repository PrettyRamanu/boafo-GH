/**
 * Tests for input validation middleware
 * These run without a real database — testing the validation layer only.
 */

const request = require('supertest');
const app     = require('../app');

// Mock the database pool so no real DB connection is needed
jest.mock('../config/db', () => ({
  query: jest.fn(),
  on: jest.fn(),
}));

// Mock mailer to avoid SMTP calls
jest.mock('../utils/mailer', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

// Mock ML client
jest.mock('../utils/mlClient', () => ({
  getRecommendations:  jest.fn().mockResolvedValue({ recommendations: [], total_scored: 0 }),
  getSentiment:        jest.fn().mockResolvedValue({ polarity: 0, label: 'neutral', score: 50 }),
  getBatchSentiment:   jest.fn().mockResolvedValue({ avg_score: 50, label: 'neutral', individual: [] }),
}));

describe('Health Check', () => {
  test('GET /api/health returns 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// AUTH VALIDATION
// ─────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/artisan/register — validation', () => {
  test('rejects empty body with 422', async () => {
    const res = await request(app)
      .post('/api/auth/artisan/register')
      .send({});
    expect(res.statusCode).toBe(422);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'name' }),
      expect.objectContaining({ field: 'email' }),
      expect.objectContaining({ field: 'password' }),
    ]));
  });

  test('rejects name shorter than 2 characters', async () => {
    const res = await request(app)
      .post('/api/auth/artisan/register')
      .send({ name: 'K', email: 'k@test.com', password: 'secret123' });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].field).toBe('name');
  });

  test('rejects invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/artisan/register')
      .send({ name: 'Kwame', email: 'notanemail', password: 'secret123' });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].field).toBe('email');
    expect(res.body.errors[0].message).toContain('valid email');
  });

  test('rejects password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/artisan/register')
      .send({ name: 'Kwame', email: 'kwame@test.com', password: '123' });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].field).toBe('password');
    expect(res.body.errors[0].message).toContain('6 characters');
  });

  test('accepts valid registration payload (passes validation)', async () => {
    const pool = require('../config/db');
    // Simulate email not taken, then successful insert
    pool.query
      .mockResolvedValueOnce({ rows: [] })            // SELECT check
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Kwame Asante', email: 'kwame@test.com', is_verified: false }] }); // INSERT

    const res = await request(app)
      .post('/api/auth/artisan/register')
      .send({ name: 'Kwame Asante', email: 'kwame@test.com', password: 'secret123', phone: '0244000001' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.artisan.email).toBe('kwame@test.com');
  });
});

describe('POST /api/auth/customer/register — validation', () => {
  test('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/customer/register')
      .send({ name: 'Ama' });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'email' }),
      expect.objectContaining({ field: 'password' }),
    ]));
  });

  test('rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/customer/register')
      .send({ name: 'Ama Sarpong', email: 'ama@', password: 'password123' });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].field).toBe('email');
  });

  test('accepts valid customer registration (passes validation)', async () => {
    const pool = require('../config/db');
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 2, name: 'Ama Sarpong', email: 'ama@test.com' }] });

    const res = await request(app)
      .post('/api/auth/customer/register')
      .send({ name: 'Ama Sarpong', email: 'ama@test.com', password: 'password123' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });
});

describe('POST /api/auth/admin/login — validation', () => {
  test('rejects empty email and password', async () => {
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({});
    expect(res.statusCode).toBe(422);
  });

  test('rejects malformed email', async () => {
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({ email: 'admin', password: 'adminpass' });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].field).toBe('email');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// JOB VALIDATION
// ─────────────────────────────────────────────────────────────────────────
describe('POST /api/jobs — validation', () => {
  let token;

  beforeAll(async () => {
    const pool = require('../config/db');
    pool.query.mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 3, name: 'Test Customer', email: 'cust@test.com' }] });
    const res = await request(app)
      .post('/api/auth/customer/register')
      .send({ name: 'Test Customer', email: 'cust@test.com', password: 'testpass1' });
    token = res.body.token;
  });

  test('rejects job with no title', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Fix wiring' });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].field).toBe('title');
  });

  test('rejects title shorter than 5 characters', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Fix' });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].message).toContain('5 characters');
  });

  test('rejects invalid job status', async () => {
    const res = await request(app)
      .put('/api/jobs/1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'invalid_status' });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].field).toBe('status');
    expect(res.body.errors[0].message).toContain('one of:');
  });

  test('accepts valid job status values', async () => {
    const pool = require('../config/db');
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'cancelled', customer_id: 3 }] });
    const res = await request(app)
      .put('/api/jobs/1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'cancelled' });
    // Should pass validation (200 or other non-422)
    expect(res.statusCode).not.toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// REVIEW VALIDATION
// ─────────────────────────────────────────────────────────────────────────
describe('POST /api/reviews — validation', () => {
  let token;

  beforeAll(async () => {
    const pool = require('../config/db');
    pool.query.mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 4, name: 'Review Customer', email: 'rev@test.com' }] });
    const res = await request(app)
      .post('/api/auth/customer/register')
      .send({ name: 'Review Customer', email: 'rev@test.com', password: 'testpass2' });
    token = res.body.token;
  });

  test('rejects review with no artisan_id', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4 });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].field).toBe('artisan_id');
  });

  test('rejects rating below 1', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ artisan_id: 1, rating: 0 });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].field).toBe('rating');
  });

  test('rejects rating above 5', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ artisan_id: 1, rating: 6 });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].field).toBe('rating');
  });

  test('accepts valid review payload', async () => {
    const pool = require('../config/db');
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 10, artisan_id: 1, rating: 4 }] })
      .mockResolvedValueOnce({ rows: [] }); // update avg
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ artisan_id: 1, rating: 4, comment: 'Great work!' });
    expect(res.statusCode).not.toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// MESSAGE VALIDATION
// ─────────────────────────────────────────────────────────────────────────
describe('POST /api/jobs/:id/messages — validation', () => {
  let token;

  beforeAll(async () => {
    const pool = require('../config/db');
    pool.query.mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 5, name: 'Msg Customer', email: 'msg@test.com' }] });
    const res = await request(app)
      .post('/api/auth/customer/register')
      .send({ name: 'Msg Customer', email: 'msg@test.com', password: 'testpass3' });
    token = res.body.token;
  });

  test('rejects empty message content', async () => {
    const res = await request(app)
      .post('/api/jobs/1/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '' });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].field).toBe('content');
  });

  test('accepts valid message', async () => {
    const pool = require('../config/db');
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, job_id: 1, content: 'Hello!' }] });
    const res = await request(app)
      .post('/api/jobs/1/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello, is this job still available?' });
    expect(res.statusCode).not.toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 404 & AUTH GUARDS
// ─────────────────────────────────────────────────────────────────────────
describe('404 & Auth Guards', () => {
  test('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/doesnotexist');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toContain('not found');
  });

  test('returns 401 when no token provided on protected route', async () => {
    const res = await request(app).get('/api/jobs/my');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('No token provided');
  });

  test('returns 401 when invalid token provided', async () => {
    const res = await request(app)
      .get('/api/jobs/my')
      .set('Authorization', 'Bearer invalidtoken123');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Invalid or expired token');
  });

  test('returns 403 when wrong role accesses admin route', async () => {
    const pool = require('../config/db');
    pool.query.mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 6, name: 'Customer User', email: 'cu@test.com' }] });
    const loginRes = await request(app)
      .post('/api/auth/customer/register')
      .send({ name: 'Customer User', email: 'cu@test.com', password: 'testpass4' });
    const customerToken = loginRes.body.token;

    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// WHITESPACE TRIMMING
// ─────────────────────────────────────────────────────────────────────────
describe('Input sanitisation — whitespace trimming', () => {
  test('trims leading/trailing spaces from email before validation', async () => {
    const res = await request(app)
      .post('/api/auth/customer/register')
      .send({ name: 'Ama', email: '  notanemail  ', password: 'password123' });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].field).toBe('email'); // caught after trim
  });

  test('trims password whitespace (still checked for length)', async () => {
    const res = await request(app)
      .post('/api/auth/customer/register')
      .send({ name: 'Ama Sarpong', email: 'ama2@test.com', password: '  12  ' });
    // "  12  " trimmed to "12" — length 2, below minimum of 6
    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].field).toBe('password');
  });
});
