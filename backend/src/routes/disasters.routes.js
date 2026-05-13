import { Router } from 'express';
import {
  deleteOne,
  getOne,
  listAll,
  postOne,
  postReject,
  postValidate,
} from '../controllers/disasters.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listAll);
router.post('/', postOne);
router.get('/:id', getOne);
router.post('/:id/validate', requireAdmin, postValidate);
router.post('/:id/reject', requireAdmin, postReject);
router.delete('/:id', requireAdmin, deleteOne);

export default router;
