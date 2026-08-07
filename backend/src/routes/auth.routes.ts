import { Router } from 'express';
import { login, playerLogin, getMe, changePassword } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/login', authRateLimiter, login);
router.post('/player-login', authRateLimiter, playerLogin);
router.get('/me', authMiddleware, getMe);
router.put('/change-password', authMiddleware, changePassword);

export default router;
