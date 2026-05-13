import { Router } from 'express';
import {
  feedCtrl,
  sensorsCtrl,
  statsCtrl,
  tickerCtrl,
} from '../controllers/public.controller.js';

const router = Router();

router.get('/feed', feedCtrl);
router.get('/ticker', tickerCtrl);
router.get('/stats', statsCtrl);
router.get('/sensors', sensorsCtrl);

export default router;
