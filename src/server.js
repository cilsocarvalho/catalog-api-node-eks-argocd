const express = require('express');
const app = express();
app.disable('x-powered-by');
app.use(express.json());

const products = [
  { id: 1, name: 'Laptop Pro 14', price: 1299.00, currency: 'USD' },
  { id: 2, name: 'Noise-cancelling Headphones', price: 299.00, currency: 'USD' },
  { id: 3, name: 'Mechanical Keyboard', price: 189.00, currency: 'USD' }
];

// Basic auth middleware for protected routes
const basicAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
};

// Validation middleware
const validateId = (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'invalid_id' });
  }
  req.validId = id;
  next();
};

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/', (req, res) => res.status(200).json({ service: 'catalog-api', version: '1.0.0' }));
app.get('/products', basicAuth, (req, res) => res.status(200).json({ items: products, count: products.length }));
app.get('/products/:id', basicAuth, validateId, (req, res) => {
  const found = products.find(p => p.id === req.validId);
  if (!found) return res.status(404).json({ error: 'not_found' });
  res.status(200).json(found);
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`catalog-api listening on :${port}`));
}
