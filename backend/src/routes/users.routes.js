import { Router } from 'express';
import {
  createByAdmin,
  deleteFcmToken,
  deleteOne,
  getOne,
  listAll,
  patchNotifications,
  patchProfile,
  postFcmToken,
} from '../controllers/users.controller.js';
import { requireAdmin, requireAuth, requireSelfOrAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireAdmin, listAll);
router.post('/', requireAdmin, createByAdmin);
router.get('/:uid', getOne);
router.patch('/:uid', requireSelfOrAdmin('uid'), patchProfile);
router.delete('/:uid', requireAdmin, deleteOne);
router.patch('/:uid/notifications', requireSelfOrAdmin('uid'), patchNotifications);
router.post('/:uid/fcm-tokens', requireSelfOrAdmin('uid'), postFcmToken);
router.delete('/:uid/fcm-tokens', requireSelfOrAdmin('uid'), deleteFcmToken);

export default router;
