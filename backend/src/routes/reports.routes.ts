import { Router } from 'express';
import { exportPlayersStats, exportMatchScorecard } from '../controllers/reports.controller';

const router = Router();

// GET /api/reports/players?format=pdf|excel|csv
router.get('/players', exportPlayersStats);

// GET /api/reports/match/:id?format=pdf|excel|csv
router.get('/match/:id', exportMatchScorecard);

export default router;
