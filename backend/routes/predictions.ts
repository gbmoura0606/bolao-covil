import { Router } from 'express';
import {
  createPrediction,
  updatePrediction,
  getUserPredictions,
  upsertPrediction,
  listMatchPredictions,
} from '../controllers/predictionsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getUserPredictions);
router.post('/', requireAuth, createPrediction);
router.patch('/:id', requireAuth, updatePrediction);
router.put('/match/:matchId', requireAuth, upsertPrediction);
// Palpites de todos os usuários — liberados após o fechamento da partida
router.get('/match/:matchId', requireAuth, listMatchPredictions);

export default router;
