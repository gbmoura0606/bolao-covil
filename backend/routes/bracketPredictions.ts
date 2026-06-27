import { Router } from 'express';
import { getBracketPrediction, upsertBracketPrediction } from '../controllers/bracketPredictionsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getBracketPrediction);
router.put('/', requireAuth, upsertBracketPrediction);

export default router;
