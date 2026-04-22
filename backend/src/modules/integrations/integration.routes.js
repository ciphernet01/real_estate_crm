import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { getIntegrationStatus, receiveLeadWebhook, syncPropertyToPortal } from './integration.controller.js';

const router = Router();

router.get('/status', requireAuth, requireRole('ADMIN', 'MANAGER'), getIntegrationStatus);
router.post('/webhooks/lead', receiveLeadWebhook);
router.post('/portal-sync/property', requireAuth, requireRole('ADMIN', 'MANAGER'), syncPropertyToPortal);

export default router;
