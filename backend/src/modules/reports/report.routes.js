import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { exportOverviewCsv, exportOverviewPdf, getReportsOverview } from './report.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/overview', getReportsOverview);
router.get('/export/overview.csv', requireRole('ADMIN', 'MANAGER'), exportOverviewCsv);
router.get('/export/overview.pdf', requireRole('ADMIN', 'MANAGER'), exportOverviewPdf);

export default router;
