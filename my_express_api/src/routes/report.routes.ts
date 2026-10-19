import { Router } from 'express';
import { reportStock, reportTransactions } from '../controllers/report.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/transactions', reportTransactions);
router.get('/stock', reportStock);

export default router;
