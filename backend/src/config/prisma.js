import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
};

// In production (e.g., on Render), database connections must use SSL.
// The 'rejectUnauthorized: false' option is often required for cloud platforms
// because their internal networks are considered secure.
if (process.env.NODE_ENV === 'production') {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
