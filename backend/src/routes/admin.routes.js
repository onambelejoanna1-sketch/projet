import { Router } from 'express';
import {
  activityCtrl,
  alertsBucketsCtrl,
  statsCtrl,
  topZonesCtrl,
} from '../controllers/admin.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/stats', statsCtrl);
router.get('/activity', activityCtrl);
router.get('/top-zones', topZonesCtrl);
router.get('/alerts/buckets', alertsBucketsCtrl);

export default router;
