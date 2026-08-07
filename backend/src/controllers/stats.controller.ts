import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** GET /api/stats/batting-leaders */
export const getBattingLeaders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stat = 'totalRuns', limit = '10' } = req.query;
    const orderField = String(stat);
    const allowedFields = ['totalRuns', 'totalFours', 'totalSixes', 'highestScore', 'strikeRate', 'battingAvg'];
    const sortField = allowedFields.includes(orderField) ? orderField : 'totalRuns';

    const players = await prisma.player.findMany({ where: { isGuest: false },
      take: Number(limit),
      orderBy: { [sortField]: 'desc' },
      include: { team: { select: { id: true, name: true, shortName: true, logo: true } } },
    });

    res.json({ success: true, players });
  } catch (error) {
    next(error);
  }
};

/** GET /api/stats/bowling-leaders */
export const getBowlingLeaders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = '10' } = req.query;
    const players = await prisma.player.findMany({
      take: Number(limit),
      where: { isGuest: false, totalWickets: { gt: 0 } },
      orderBy: { totalWickets: 'desc' },
      include: { team: { select: { id: true, name: true, shortName: true, logo: true } } },
    });
    res.json({ success: true, players });
  } catch (error) {
    next(error);
  }
};

/** GET /api/stats/dashboard — Admin dashboard stats */
export const getDashboardStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [totalTeams, totalPlayers, liveMatches, completedMatches, upcomingMatches, recentNotifications] =
      await Promise.all([
        prisma.team.count(),
        prisma.player.count(),
        prisma.match.count({ where: { status: 'LIVE' } }),
        prisma.match.count({ where: { status: 'COMPLETED' } }),
        prisma.match.count({ where: { status: 'UPCOMING' } }),
        prisma.notification.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
      ]);

    res.json({
      success: true,
      stats: { totalTeams, totalPlayers, liveMatches, completedMatches, upcomingMatches },
      recentNotifications,
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/stats/search */
export const search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q || String(q).length < 2) {
      res.json({ success: true, results: { teams: [], players: [], matches: [], tournaments: [] } });
      return;
    }
    const query = String(q);
    const contains = { contains: query, mode: 'insensitive' as const };

    const [teams, players, tournaments] = await Promise.all([
      prisma.team.findMany({ where: { isGuest: false, OR: [{ name: contains }, { shortName: contains }] }, take: 5 }),
      prisma.player.findMany({ where: { isGuest: false, name: contains }, take: 5, include: { team: { select: { name: true } } } }),
      prisma.tournament.findMany({ where: { name: contains }, take: 5 }),
    ]);

    res.json({ success: true, results: { teams, players, tournaments } });
  } catch (error) {
    next(error);
  }
};
