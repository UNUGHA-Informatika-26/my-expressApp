import { Router } from 'express';
import { createDistributor, listDistributors } from '../controllers/distributor.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createDistributorSchema } from '../validators/debt.schemas';

const router = Router();

router.use(requireAuth);

router.get('/', listDistributors);
router.post('/', validateBody(createDistributorSchema), createDistributor);

export default router;
