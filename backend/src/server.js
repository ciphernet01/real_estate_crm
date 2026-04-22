import 'dotenv/config';
import app from './app.js';
import { prisma } from './config/prisma.js';

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

/* ---------- Graceful shutdown ---------- */
const shutdown = async (signal) => {
  console.log(`\n${signal} received — shutting down gracefully`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Database disconnected, exiting');
    process.exit(0);
  });

  // Force exit after 10 s if connections hang
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
