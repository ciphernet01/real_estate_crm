import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { errorHandler, notFound } from './middleware/error.js';
import authRoutes from './modules/auth/auth.routes.js';
import leadRoutes from './modules/leads/lead.routes.js';
import propertyRoutes from './modules/properties/property.routes.js';
import clientRoutes from './modules/clients/client.routes.js';
import dealRoutes from './modules/deals/deal.routes.js';
import communicationRoutes from './modules/communications/communication.routes.js';
import userRoutes from './modules/users/user.routes.js';
import agentRoutes from './modules/agents/agent.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import integrationRoutes from './modules/integrations/integration.routes.js';
import { prisma } from './config/prisma.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('trust proxy', 1);

/* ---------- Security & parsing ---------- */
app.use(helmet());

const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (configuredOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow all .onrender.com subdomains for easier deployment
    if (/\.onrender\.com$/i.test(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked for origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/* ---------- Request ID ---------- */
app.use((req, res, next) => {
  const id = crypto.randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
});

/* ---------- Rate limiting ---------- */
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later' },
});
app.use('/api/auth/login', authLimiter);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});
app.use('/api', apiLimiter);

/* ---------- Static uploads ---------- */
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

/* ---------- Health ---------- */
app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'real-estate-crm-api',
    message: 'API is running. Use /api/* endpoints.',
    docs: ['/api/health', '/api/health/deep', '/api/auth/login'],
  });
});

app.get('/api', (_req, res) => {
  res.json({
    ok: true,
    service: 'real-estate-crm-api',
    message: 'API base path is active',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'real-estate-crm-api' });
});

app.get('/api/health/deep', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, service: 'real-estate-crm-api', database: 'ok' });
  } catch {
    res.status(503).json({ ok: false, service: 'real-estate-crm-api', database: 'down' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/integrations', integrationRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
