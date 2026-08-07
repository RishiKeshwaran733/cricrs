import { Router } from 'express';
import { getBattingLeaders, getBowlingLeaders, getDashboardStats, search } from '../controllers/stats.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/batting-leaders', getBattingLeaders);
router.get('/bowling-leaders', getBowlingLeaders);
router.get('/search', search);
router.get('/dashboard', authMiddleware, getDashboardStats);

export default router;
