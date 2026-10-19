import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profile.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateProfileSchema } from '../validators/auth.schemas';

const router = Router();

// Semua rute profil butuh token.
router.use(requireAuth);

router.get('/', getProfile);
router.put('/', validateBody(updateProfileSchema), updateProfile);

export default router;
