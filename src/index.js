const app = require('./server');
const port = process.env.PORT || 8080;

const server = app.listen(port, () => {
  console.log(`catalog-api listening on :${port}`);
});

server.on('error', (err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
