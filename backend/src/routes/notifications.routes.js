import { Router } from 'express';
import {
  getList,
  getStream,
  getUnreadCount,
  getVapidPublicKey,
  postMarkAllRead,
  postMarkRead,
  postSubscribe,
  postUnsubscribe,
} from '../controllers/notifications.controller.js';
import { requireAuth, requireAuthFromQuery } from '../middleware/auth.js';

const router = Router();

// SSE doit accepter le token en query (EventSource n'envoie pas de header
// Authorization). Déclaré AVANT le requireAuth pour ne pas être rattrapé.
router.get('/stream', requireAuthFromQuery, getStream);

// Clé publique VAPID — exposée sans auth, c'est par design (elle sert juste à
// chiffrer le payload côté client avant de l'envoyer au push service).
router.get('/vapid-public-key', getVapidPublicKey);

router.use(requireAuth);

router.get('/', getList);
router.get('/unread-count', getUnreadCount);
router.post('/:id/read', postMarkRead);
router.post('/read-all', postMarkAllRead);
router.post('/subscribe', postSubscribe);
router.post('/unsubscribe', postUnsubscribe);

export default router;
