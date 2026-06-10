import { Router } from 'express';
import { login, changePassword, getMe, listUsersStatus, resetUserPassword } from '../controllers/authController';
import { requireAuth, requireGerencia } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/change-password', requireAuth, changePassword);
router.get('/me', requireAuth, getMe);
router.get('/users-status', requireAuth, requireGerencia, listUsersStatus);
router.post('/users/:id/reset-password', requireAuth, requireGerencia, resetUserPassword);

export default router;
