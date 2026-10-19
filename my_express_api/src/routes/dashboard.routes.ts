import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Ringkasan beranda (Fase 6). Data hutang menyusul pada Fase 7.
router.get('/', requireAuth, getDashboard);

export default router;
