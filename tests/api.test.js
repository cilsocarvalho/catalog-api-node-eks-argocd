const request = require('supertest');
const app = require('../src/server');

describe('Catalog API', () => {
  it('GET /', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.service).toBe('catalog-api');
  });
  it('GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
  it('GET /products', async () => {
    const res = await request(app).get('/products');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });
  it('GET /products/1', async () => {
    const res = await request(app).get('/products/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
  });
  it('GET /products/999', async () => {
    const res = await request(app).get('/products/999');
    expect(res.statusCode).toBe(404);
  });
});
