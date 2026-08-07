import { Router } from 'express';
import { addBall, undoBall, getInningsScorecard, setCurrentPlayers } from '../controllers/scoring.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public scorecard view
router.get('/innings/:id/scorecard', getInningsScorecard);

// Admin protected
router.post('/ball', authMiddleware, addBall);
router.delete('/ball/:id', authMiddleware, undoBall);
router.patch('/innings/:id/set-players', authMiddleware, setCurrentPlayers);

export default router;
