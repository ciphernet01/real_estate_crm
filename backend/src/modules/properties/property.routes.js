import { Router } from 'express';
import {
  createProperty,
  deleteProperty,
  getProperty,
  listProperties,
  uploadPropertyImage,
  updateProperty,
} from './property.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { propertyImageUpload } from '../../middleware/upload.js';

const router = Router();

router.use(requireAuth);
router.get('/', listProperties);
router.get('/:id', getProperty);
router.post('/', createProperty);
router.post('/upload', propertyImageUpload.single('image'), uploadPropertyImage);
router.patch('/:id', updateProperty);
router.delete('/:id', deleteProperty);

export default router;
