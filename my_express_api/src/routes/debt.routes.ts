import { Router } from 'express';
import { createDebt, getDebt, listDebts, payDebt } from '../controllers/debt.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createDebtSchema, createPaymentSchema } from '../validators/debt.schemas';

const router = Router();

router.use(requireAuth);

router.get('/', listDebts);
router.post('/', validateBody(createDebtSchema), createDebt);
router.get('/:id', getDebt);
router.post('/:id/payments', validateBody(createPaymentSchema), payDebt);

export default router;
