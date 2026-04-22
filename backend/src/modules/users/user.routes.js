import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { createUser, deleteUser, listUsers, updateUserRole } from './user.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', requireRole('ADMIN', 'MANAGER'), listUsers);
router.post('/', requireRole('ADMIN'), createUser);
router.patch('/:id/role', requireRole('ADMIN'), updateUserRole);
router.delete('/:id', requireRole('ADMIN'), deleteUser);

export default router;
