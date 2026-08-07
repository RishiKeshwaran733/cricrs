import { Router } from 'express';
import {
  getTournaments, getTournament, createTournament, updateTournament,
  deleteTournament, getPointsTable
} from '../controllers/tournament.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/', getTournaments);
router.get('/:id', getTournament);
router.get('/:id/points-table', getPointsTable);
router.post('/', authMiddleware, upload.single('logo'), createTournament);
router.put('/:id', authMiddleware, upload.single('logo'), updateTournament);
router.delete('/:id', authMiddleware, deleteTournament);

export default router;
