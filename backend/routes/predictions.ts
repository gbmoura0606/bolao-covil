import { Router } from 'express';
import { createPrediction, updatePrediction, getUserPredictions } from '../controllers/predictionsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getUserPredictions);
router.post('/', requireAuth, createPrediction);
router.patch('/:id', requireAuth, updatePrediction);

export default router;
