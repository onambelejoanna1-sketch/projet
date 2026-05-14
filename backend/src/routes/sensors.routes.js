import { Router } from 'express';
import {
  deleteOne,
  getOne,
  ingestReading,
  listAll,
  listReadings,
  patchOne,
  postOne,
} from '../controllers/sensors.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { requireSensorApiKey } from '../middleware/sensorAuth.js';
import { sensorIngestLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Endpoint ingestion : auth par x-api-key (pas JWT). Doit être déclaré AVANT le
// `router.use(requireAuth)` pour ne pas être rattrapé par l'auth JWT.
router.post('/:deviceId/readings', sensorIngestLimiter, requireSensorApiKey, ingestReading);

router.use(requireAuth);

router.get('/', listAll);
router.get('/:id', getOne);
router.post('/', requireAdmin, postOne);
router.patch('/:id', requireAdmin, patchOne);
router.delete('/:id', requireAdmin, deleteOne);
router.get('/:id/readings', listReadings);

export default router;
