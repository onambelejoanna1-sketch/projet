import { Router } from 'express';
import {
  login,
  logout,
  me,
  postPasswordResetConfirm,
  postPasswordResetRequest,
  register,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/password-reset/request', authLimiter, postPasswordResetRequest);
router.post('/password-reset/confirm', authLimiter, postPasswordResetConfirm);
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);

export default router;
