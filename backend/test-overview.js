import { prisma } from './src/config/prisma.js';
import { getReportsOverview } from './src/modules/reports/report.controller.js';

async function test() {
  try {
    const req = {};
    const res = {
      json: (data) => console.log('SUCCESS:', data)
    };
    const next = (err) => console.error('ERROR IN NEXT:', err);
    
    await getReportsOverview(req, res, next);
  } catch (err) {
    console.error('CAUGHT ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
