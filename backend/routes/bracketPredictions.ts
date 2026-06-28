import { Router } from 'express';
import { getBracketPrediction, getAllBracketPredictions, upsertBracketPrediction } from '../controllers/bracketPredictionsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/all', requireAuth, getAllBracketPredictions);
router.get('/', requireAuth, getBracketPrediction);
router.put('/', requireAuth, upsertBracketPrediction);

export default router;
