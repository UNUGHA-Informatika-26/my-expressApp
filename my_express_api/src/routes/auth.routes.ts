import { Router } from 'express';
import { login, register } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate';
import { loginSchema, registerSchema } from '../validators/auth.schemas';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);

export default router;
