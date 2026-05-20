import { Router } from 'express';
import { getGlobalRanking, getLeagueRanking } from '../controllers/rankingController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getGlobalRanking);
router.get('/league/:leagueId', requireAuth, getLeagueRanking);

export default router;
