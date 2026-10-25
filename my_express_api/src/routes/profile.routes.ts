import { Router } from 'express';
import {
  deleteProfile,
  getProfile,
  updateProfile,
} from '../controllers/profile.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { deleteProfileSchema, updateProfileSchema } from '../validators/auth.schemas';

const router = Router();

// Semua rute profil butuh token.
router.use(requireAuth);

router.get('/', getProfile);
router.put('/', validateBody(updateProfileSchema), updateProfile);
// Ditaruh paling bawah: paling berbahaya, jadi tidak boleh tercampur dengan
// rute biasa. Verifikasi kata sandi dilakukan controller, bukan middleware.
router.delete('/', validateBody(deleteProfileSchema), deleteProfile);

export default router;
