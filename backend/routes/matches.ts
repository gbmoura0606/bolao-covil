import { Router } from 'express';
import { listMatches, getMatch, createMatch, updateMatchScore, resetMatch } from '../controllers/matchesController';
import { requireAuth, requireGerencia } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, listMatches);
router.get('/:id', requireAuth, getMatch);
router.post('/', requireAuth, requireGerencia, createMatch);
router.patch('/:id/score', requireAuth, requireGerencia, updateMatchScore);
router.post('/:id/reset', requireAuth, requireGerencia, resetMatch);

export default router;
