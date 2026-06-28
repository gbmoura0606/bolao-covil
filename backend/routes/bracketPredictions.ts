import { Router } from 'express';
import {
  getBracketPrediction,
  getAllBracketPredictions,
  getBracketRanking,
  getBracketAdminStatus,
  upsertBracketPrediction,
} from '../controllers/bracketPredictionsController';
import { requireAuth, requireGerencia } from '../middleware/auth';

const router = Router();

router.get('/all', requireAuth, getAllBracketPredictions);
router.get('/ranking', requireAuth, getBracketRanking);
router.get('/admin/status', requireAuth, requireGerencia, getBracketAdminStatus);
router.get('/', requireAuth, getBracketPrediction);
router.put('/', requireAuth, upsertBracketPrediction);

export default router;
