import { Router } from 'express';
import { bootstrapAdmin, listAssignableUsers, login, me } from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/bootstrap-admin', bootstrapAdmin);
router.get('/me', requireAuth, me);
router.get('/agents', requireAuth, listAssignableUsers);

export default router;
