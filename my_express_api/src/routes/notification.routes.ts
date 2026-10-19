import { Router } from 'express';
import { listNotifications } from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', listNotifications);

export default router;
