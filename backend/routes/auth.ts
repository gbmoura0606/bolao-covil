import { Router } from 'express';
import { login, changePassword, getMe, listUsersStatus } from '../controllers/authController';
import { requireAuth, requireGerencia } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/change-password', requireAuth, changePassword);
router.get('/me', requireAuth, getMe);
router.get('/users-status', requireAuth, requireGerencia, listUsersStatus);

export default router;
