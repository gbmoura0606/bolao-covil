import { Router } from 'express';
import { getStandings } from '../controllers/standingsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getStandings);

export default router;
