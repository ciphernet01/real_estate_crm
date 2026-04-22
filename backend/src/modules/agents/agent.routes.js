import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { assignTaskToAgent, getAgentPerformance, listAgentTasks } from './agent.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/performance', requireRole('ADMIN', 'MANAGER'), getAgentPerformance);
router.get('/tasks', listAgentTasks);
router.post('/tasks/assign', requireRole('ADMIN', 'MANAGER'), assignTaskToAgent);

export default router;
