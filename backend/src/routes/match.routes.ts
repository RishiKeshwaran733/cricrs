import { Router } from 'express';
import {
  getMatches, getMatch, getLiveMatches, createMatch, updateMatch, deleteMatch,
  startMatch, endInnings, endMatch, pauseMatch, resumeMatch
} from '../controllers/match.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public
router.get('/', getMatches);
router.get('/live', getLiveMatches);
router.get('/:id', getMatch);

// Admin protected
router.post('/', authMiddleware, createMatch);
router.put('/:id', authMiddleware, updateMatch);
router.delete('/:id', authMiddleware, deleteMatch);
router.post('/:id/start', authMiddleware, startMatch);
router.post('/:id/end-innings', authMiddleware, endInnings);
router.post('/:id/end-match', authMiddleware, endMatch);
router.post('/:id/pause', authMiddleware, pauseMatch);
router.post('/:id/resume', authMiddleware, resumeMatch);

export default router;
