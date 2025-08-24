const express = require('express');
const app = express();
app.disable('x-powered-by');
app.use(express.json());

const products = [
  { id: 1, name: 'Laptop Pro 14', price: 1299.00, currency: 'USD' },
  { id: 2, name: 'Noise-cancelling Headphones', price: 299.00, currency: 'USD' },
  { id: 3, name: 'Mechanical Keyboard', price: 189.00, currency: 'USD' }
];

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/', (req, res) => res.status(200).json({ service: 'catalog-api', version: '1.0.0' }));
app.get('/products', (req, res) => res.status(200).json({ items: products, count: products.length }));
app.get('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const found = products.find(p => p.id === id);
  if (!found) return res.status(404).json({ error: 'not_found' });
  res.status(200).json(found);
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`catalog-api listening on :${port}`));
}
