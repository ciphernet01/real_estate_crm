import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
	addClientInteraction,
	createClient,
	deleteClient,
	getClient,
	linkLeadToClient,
	listClientDeals,
	listClientInteractions,
	listClients,
	unlinkLeadFromClient,
	updateClient,
} from './client.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', listClients);
router.get('/:id', getClient);
router.post('/', createClient);
router.patch('/:id', updateClient);
router.delete('/:id', deleteClient);
router.get('/:id/interactions', listClientInteractions);
router.post('/:id/interactions', addClientInteraction);
router.post('/:id/link-lead', linkLeadToClient);
router.delete('/:id/link-lead/:leadId', unlinkLeadFromClient);
router.get('/:id/deals', listClientDeals);

export default router;
