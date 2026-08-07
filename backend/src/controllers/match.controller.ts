import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/error.middleware';
import { emitAdminNotification, emitMatchStatus } from '../socket/socket';
import { calculateStrikeRate, calculateEconomy, ballsToOvers } from '../utils/scoring.engine';

const prisma = new PrismaClient();

const MATCH_INCLUDE = {
  teamA: true,
  teamB: true,
  tournament: { select: { id: true, name: true, logo: true } },
  tossWinner: { select: { id: true, name: true, shortName: true } },
  innings: {
    include: {
      battingTeam: { select: { id: true, name: true, shortName: true, logo: true, primaryColor: true } },
      bowlingTeam: { select: { id: true, name: true, shortName: true, logo: true, primaryColor: true } },
    },
    orderBy: { inningsNumber: 'asc' as const },
  },
};

/** GET /api/matches */
export const getMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, tournamentId, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = String(status);
    if (tournamentId) where.tournamentId = String(tournamentId);

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        skip,
        take: Number(limit),
        include: MATCH_INCLUDE,
        orderBy: { scheduledAt: 'desc' },
      }),
      prisma.match.count({ where }),
    ]);

    res.json({ success: true, matches, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    next(error);
  }
};

/** GET /api/matches/:id */
export const getMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: {
        ...MATCH_INCLUDE,
        innings: {
          include: {
            battingTeam: true,
            bowlingTeam: true,
            battingCards: { include: { player: true } },
            bowlingCards: { include: { player: true } },
            fallOfWickets: true,
            partnerships: true,
            balls: { where: { isDeleted: false }, orderBy: [{ overNumber: 'asc' }, { ballNumber: 'asc' }] },
          },
          orderBy: { inningsNumber: 'asc' as const },
        },
      },
    });
    if (!match) return next(createError('Match not found', 404));

    // Enrich scorecards
    const enrichedInnings = match.innings.map(inning => ({
      ...inning,
      battingCards: inning.battingCards.map(card => ({
        ...card,
        strikeRate: calculateStrikeRate(card.runs, card.balls),
      })),
      bowlingCards: inning.bowlingCards.map(card => ({
        ...card,
        economy: calculateEconomy(card.runs, card.balls),
        overs: ballsToOvers(card.balls),
      })),
    }));

    res.json({ success: true, match: { ...match, innings: enrichedInnings } });
  } catch (error) {
    next(error);
  }
};

/** GET /api/matches/live */
export const getLiveMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const matches = await prisma.match.findMany({
      where: { status: 'LIVE' },
      include: MATCH_INCLUDE,
    });
    res.json({ success: true, matches });
  } catch (error) {
    next(error);
  }
};

/** POST /api/admin/matches */
export const createMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      title, teamAId, teamBId, venue, scheduledAt, format, totalOvers,
      tournamentId, umpire1, umpire2, thirdUmpire, matchReferee, scorer,
      isTeamBGuest, guestTeamBName
    } = req.body;

    if (!teamAId || (!teamBId && !isTeamBGuest) || !scheduledAt) {
      return next(createError('Teams and match date are required', 400));
    }

    let finalTeamBId = teamBId;

    if (isTeamBGuest) {
      const guestTeamName = guestTeamBName || `Guest Team - ${new Date().getTime()}`;
      const newGuestTeam = await prisma.team.create({
        data: {
          name: guestTeamName,
          shortName: guestTeamName.substring(0, 3).toUpperCase() + new Date().getTime().toString().slice(-4),
          isGuest: true,
          players: {
            create: Array.from({ length: 11 }).map((_, i) => ({
              name: `Guest Player ${i + 1}`,
              isGuest: true,
            }))
          }
        }
      });
      finalTeamBId = newGuestTeam.id;
    }

    const match = await prisma.match.create({
      data: {
        title,
        teamAId,
        teamBId: finalTeamBId,
        venue,
        scheduledAt: new Date(scheduledAt),
        format: format || 'T20',
        totalOvers: Number(totalOvers) || 20,
        tournamentId: tournamentId || null,
        umpire1, umpire2, thirdUmpire, matchReferee, scorer,
      },
      include: MATCH_INCLUDE,
    });

    if (isTeamBGuest) {
      await prisma.team.update({
        where: { id: finalTeamBId },
        data: { guestMatchId: match.id }
      });
      await prisma.player.updateMany({
        where: { teamId: finalTeamBId },
        data: { guestMatchId: match.id }
      });
    }

    res.status(201).json({ success: true, match });
  } catch (error) {
    next(error);
  }
};

/** PUT /api/admin/matches/:id */
export const updateMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, venue, scheduledAt, tossWinnerId, tossDecision, umpire1, umpire2, thirdUmpire, matchReferee, scorer } = req.body;

    const match = await prisma.match.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(venue !== undefined && { venue }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(tossWinnerId && { tossWinnerId }),
        ...(tossDecision && { tossDecision }),
        ...(umpire1 !== undefined && { umpire1 }),
        ...(umpire2 !== undefined && { umpire2 }),
        ...(thirdUmpire !== undefined && { thirdUmpire }),
        ...(matchReferee !== undefined && { matchReferee }),
        ...(scorer !== undefined && { scorer }),
      },
      include: MATCH_INCLUDE,
    });

    res.json({ success: true, match });
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/admin/matches/:id */
export const deleteMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.match.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Match deleted' });
  } catch (error) {
    next(error);
  }
};

/** POST /api/admin/matches/:id/start */
export const startMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { tossWinnerId, tossDecision, battingTeamId, bowlingTeamId } = req.body;

    const match = await prisma.match.update({
      where: { id },
      data: { status: 'LIVE', tossWinnerId, tossDecision },
    });

    // Create first innings
    const innings = await prisma.innings.create({
      data: {
        matchId: id,
        inningsNumber: 1,
        battingTeamId,
        bowlingTeamId,
      },
    });

    emitMatchStatus(id, 'LIVE');
    emitAdminNotification({ type: 'MATCH_STARTED', message: `Match started`, matchId: id });

    res.json({ success: true, match, innings });
  } catch (error) {
    next(error);
  }
};

/** POST /api/admin/matches/:id/end-innings */
export const endInnings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { inningsId, battingTeamId, bowlingTeamId } = req.body;

    const currentInnings = await prisma.innings.findUnique({ where: { id: inningsId } });
    const match = await prisma.match.findUnique({ where: { id } });

    if (!currentInnings || !match) {
      return next(createError('Innings or Match not found', 404));
    }

    const nextInningsNumber = currentInnings.inningsNumber + 1;

    if (match.format !== 'TEST' && nextInningsNumber > 2) {
      return next(createError('Cannot create more than 2 innings for this format. Please end the match.', 400));
    }

    // Complete current innings
    await prisma.innings.update({
      where: { id: inningsId },
      data: { status: 'COMPLETED' },
    });

    const target = (currentInnings.totalRuns ?? 0) + 1;

    // Create next innings
    const newInnings = await prisma.innings.create({
      data: {
        matchId: id,
        inningsNumber: nextInningsNumber,
        battingTeamId,
        bowlingTeamId,
        target,
      },
    });

    res.json({ success: true, innings: newInnings });
  } catch (error) {
    next(error);
  }
};

/** POST /api/admin/matches/:id/end-match */
export const endMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { resultText, winnerId } = req.body;

    const match = await prisma.match.update({
      where: { id },
      data: { status: 'COMPLETED', resultText, winnerId },
    });

    // Complete all innings
    await prisma.innings.updateMany({
      where: { matchId: id, status: 'IN_PROGRESS' },
      data: { status: 'COMPLETED' },
    });

    emitMatchStatus(id, 'COMPLETED');
    emitAdminNotification({ type: 'MATCH_ENDED', message: `Match completed. ${resultText}`, matchId: id });

    res.json({ success: true, match });
  } catch (error) {
    next(error);
  }
};

/** POST /api/admin/matches/:id/pause */
export const pauseMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.match.update({ where: { id: req.params.id }, data: { status: 'PAUSED' } });
    emitMatchStatus(req.params.id, 'PAUSED');
    res.json({ success: true, message: 'Match paused' });
  } catch (error) {
    next(error);
  }
};

/** POST /api/admin/matches/:id/resume */
export const resumeMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.match.update({ where: { id: req.params.id }, data: { status: 'LIVE' } });
    emitMatchStatus(req.params.id, 'LIVE');
    res.json({ success: true, message: 'Match resumed' });
  } catch (error) {
    next(error);
  }
};
