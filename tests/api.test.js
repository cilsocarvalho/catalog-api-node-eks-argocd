const request = require('supertest');

process.env.API_USER = 'tester';
process.env.API_PASSWORD = 'secret-for-tests';
const app = require('../src/server');

const auth = 'Basic ' + Buffer.from('tester:secret-for-tests').toString('base64');
const wrong = 'Basic ' + Buffer.from('tester:wrong').toString('base64');

describe('Catalog API', () => {
  it('GET / returns service metadata', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.service).toBe('catalog-api');
  });

  it('GET /health is public', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /products without credentials is rejected', async () => {
    const res = await request(app).get('/products');
    expect(res.statusCode).toBe(401);
  });

  it('GET /products with a wrong password is rejected', async () => {
    const res = await request(app).get('/products').set('Authorization', wrong);
    expect(res.statusCode).toBe(401);
  });

  it('GET /products with valid credentials lists products', async () => {
    const res = await request(app).get('/products').set('Authorization', auth);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('GET /products/1 returns one product', async () => {
    const res = await request(app).get('/products/1').set('Authorization', auth);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
  });

  it('GET /products/999 returns 404', async () => {
    const res = await request(app).get('/products/999').set('Authorization', auth);
    expect(res.statusCode).toBe(404);
  });

  it('GET /products/abc returns 400', async () => {
    const res = await request(app).get('/products/abc').set('Authorization', auth);
    expect(res.statusCode).toBe(400);
  });
});
