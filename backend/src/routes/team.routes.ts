import { Router } from 'express';
import { getTeams, getTeam, createTeam, updateTeam, deleteTeam } from '../controllers/team.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Public
router.get('/', getTeams);
router.get('/:id', getTeam);

// Admin protected
router.post('/', authMiddleware, upload.single('logo'), createTeam);
router.put('/:id', authMiddleware, upload.single('logo'), updateTeam);
router.delete('/:id', authMiddleware, deleteTeam);

export default router;
