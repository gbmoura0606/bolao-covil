import { Router } from 'express';
import { listUserLeagues, createLeague, joinLeague, getLeague, updateLeagueScoring } from '../controllers/leaguesController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, listUserLeagues);
router.get('/:id', requireAuth, getLeague);
router.post('/', requireAuth, createLeague);
router.post('/join', requireAuth, joinLeague);
router.patch('/:id/scoring', requireAuth, updateLeagueScoring);

export default router;
