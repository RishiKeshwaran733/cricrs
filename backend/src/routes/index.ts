import { Router } from 'express';
import authRoutes from './auth.routes';
import teamRoutes from './team.routes';
import playerRoutes from './player.routes';
import tournamentRoutes from './tournament.routes';
import matchRoutes from './match.routes';
import scoringRoutes from './scoring.routes';
import statsRoutes from './stats.routes';
import reportsRoutes from './reports.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/teams', teamRoutes);
router.use('/players', playerRoutes);
router.use('/tournaments', tournamentRoutes);
router.use('/matches', matchRoutes);
router.use('/scoring', scoringRoutes);
router.use('/stats', statsRoutes);

// Admin-prefixed routes (same controllers, protected by auth)
router.use('/admin/teams', teamRoutes);
router.use('/admin/players', playerRoutes);
router.use('/admin/tournaments', tournamentRoutes);
router.use('/admin/matches', matchRoutes);
router.use('/admin/scoring', scoringRoutes);
router.use('/admin/reports', reportsRoutes);
router.use('/reports', reportsRoutes);

export default router;
