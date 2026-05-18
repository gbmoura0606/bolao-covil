import { Router } from 'express';
import { listMatches, getMatch, createMatch, updateMatchScore } from '../controllers/matchesController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, listMatches);
router.get('/:id', requireAuth, getMatch);
router.post('/', requireAuth, createMatch);
router.patch('/:id/score', requireAuth, updateMatchScore);

export default router;
