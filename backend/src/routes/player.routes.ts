import { Router } from 'express';
import {
  getPlayers, getPlayer, createPlayer, updatePlayer, deletePlayer, transferPlayer, updateMyPhoto, renameGuestPlayer
} from '../controllers/player.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/', getPlayers);
router.put('/me/photo', authMiddleware, upload.single('photo'), updateMyPhoto);
router.get('/:id', getPlayer);
router.post('/', authMiddleware, upload.single('photo'), createPlayer);
router.put('/:id', authMiddleware, upload.single('photo'), updatePlayer);
router.delete('/:id', authMiddleware, deletePlayer);
router.put('/:id/transfer', authMiddleware, transferPlayer);
router.put('/:id/rename', authMiddleware, renameGuestPlayer);

export default router;
