const request = require('supertest');
const { app } = require('../server/server');
const User = require('../server/models/User');

describe('Auth', () => {
  it('registers a seeker', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Origin', 'http://localhost:5000')
      .send({ name: 'Test User', email: 'test@example.com', password: 'Test1234', role: 'seeker' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('seeker');
  });

  it('rejects admin role on register', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Origin', 'http://localhost:5000')
      .send({ name: 'Hacker', email: 'hack@example.com', password: 'Test1234', role: 'admin' });
    expect(res.status).toBe(201);
    const user = await User.findOne({ email: 'hack@example.com' });
    expect(user.role).toBe('seeker'); // forced
  });

  it('login works', async () => {
    await User.create({ name: 'Login Test', email: 'login@example.com', password: 'Test1234', role: 'seeker' });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Origin', 'http://localhost:5000')
      .send({ email: 'login@example.com', password: 'Test1234' });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
  });
});
