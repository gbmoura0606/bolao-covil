import { Router } from 'express';
import { listUserLeagues, createLeague, joinLeague, getLeague } from '../controllers/leaguesController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, listUserLeagues);
router.get('/:id', requireAuth, getLeague);
router.post('/', requireAuth, createLeague);
router.post('/join', requireAuth, joinLeague);

export default router;
