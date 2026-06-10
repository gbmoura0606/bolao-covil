import { Router } from 'express';
import {
  createPrediction,
  updatePrediction,
  getUserPredictions,
  upsertPrediction,
} from '../controllers/predictionsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getUserPredictions);
router.post('/', requireAuth, createPrediction);
router.patch('/:id', requireAuth, updatePrediction);
// Upsert por matchId — endpoint principal do autosave
router.put('/match/:matchId', requireAuth, upsertPrediction);

export default router;
