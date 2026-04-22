import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  dispatchPendingNotifications,
  getPendingNotifications,
  getTimeline,
  logActivity,
  scheduleFollowup,
} from './communication.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/timeline', getTimeline);
router.post('/activity', logActivity);
router.post('/followups/schedule', scheduleFollowup);
router.get('/notifications/pending', getPendingNotifications);
router.post('/notifications/dispatch', dispatchPendingNotifications);

export default router;
