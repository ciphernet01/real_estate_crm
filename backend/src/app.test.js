import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./config/prisma.js', () => ({
  prisma: {},
}));

import app from './app.js';

describe('API health', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ ok: true, service: 'real-estate-crm-api' });
  });
});
