import { Router } from 'express';
import {
  addLeadReminder,
  createCapturedLead,
  createLead,
  deleteLead,
  getLead,
  listLeads,
  listUpcomingReminders,
  markReminderCompleted,
  updateLead,
} from './lead.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

router.post('/capture', createCapturedLead);

router.use(requireAuth);
router.get('/reminders/upcoming', listUpcomingReminders);
router.patch('/reminders/:reminderId/complete', markReminderCompleted);
router.get('/', listLeads);
router.get('/:id', getLead);
router.post('/', createLead);
router.patch('/:id', updateLead);
router.delete('/:id', deleteLead);
router.post('/:id/reminders', addLeadReminder);

export default router;
