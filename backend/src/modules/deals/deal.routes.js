import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
	createDeal,
	deleteDeal,
	getDeal,
	getDealSummaryReport,
	listDeals,
	updateDeal,
	uploadDealDocument,
} from './deal.controller.js';
import { dealDocumentUpload } from '../../middleware/upload.js';

const router = Router();

router.use(requireAuth);
router.get('/reports/summary', getDealSummaryReport);
router.get('/', listDeals);
router.get('/:id', getDeal);
router.post('/', createDeal);
router.post('/:id/documents', dealDocumentUpload.single('document'), uploadDealDocument);
router.patch('/:id', updateDeal);
router.delete('/:id', deleteDeal);

export default router;
