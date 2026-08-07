import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/error.middleware';
import { emitAdminNotification } from '../socket/socket';

const prisma = new PrismaClient();

/** GET /api/tournaments */
export const getTournaments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page = '1', limit = '10' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = String(status);

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          teams: { include: { team: { select: { id: true, name: true, shortName: true, logo: true } } } },
          _count: { select: { matches: true } },
        },
        orderBy: { startDate: 'desc' },
      }),
      prisma.tournament.count({ where }),
    ]);

    res.json({ success: true, tournaments, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    next(error);
  }
};

/** GET /api/tournaments/:id */
export const getTournament = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: {
        teams: { include: { team: true } },
        matches: {
          include: { teamA: true, teamB: true },
          orderBy: { scheduledAt: 'asc' },
        },
        pointsTable: {
          include: { team: true },
          orderBy: { points: 'desc' },
        },
      },
    });
    if (!tournament) return next(createError('Tournament not found', 404));
    res.json({ success: true, tournament });
  } catch (error) {
    next(error);
  }
};

/** POST /api/admin/tournaments */
export const createTournament = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, shortName, description, startDate, endDate, format, totalTeams, venue, teamIds } = req.body;
    const logo = (req as any).file ? `/uploads/${(req as any).file.filename}` : null;

    if (!name || !startDate || !endDate) {
      return next(createError('Name, start date, and end date are required', 400));
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        shortName,
        description,
        logo,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        format: format || 'T20',
        totalTeams: Number(totalTeams) || 8,
        venue,
      },
    });

    // Add teams and create points table entries
    if (teamIds && Array.isArray(teamIds)) {
      await Promise.all(
        teamIds.map(async (teamId: string) => {
          await prisma.tournamentTeam.create({ data: { tournamentId: tournament.id, teamId } });
          await prisma.pointsTableEntry.create({ data: { tournamentId: tournament.id, teamId } });
        })
      );
    }

    emitAdminNotification({ type: 'TOURNAMENT_CREATED', message: `Tournament "${name}" created`, tournamentId: tournament.id });

    res.status(201).json({ success: true, tournament });
  } catch (error) {
    next(error);
  }
};

/** PUT /api/admin/tournaments/:id */
export const updateTournament = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, shortName, description, startDate, endDate, format, totalTeams, venue, status } = req.body;
    const logo = (req as any).file ? `/uploads/${(req as any).file.filename}` : undefined;

    const tournament = await prisma.tournament.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(shortName !== undefined && { shortName }),
        ...(description !== undefined && { description }),
        ...(logo && { logo }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(format && { format }),
        ...(totalTeams && { totalTeams: Number(totalTeams) }),
        ...(venue !== undefined && { venue }),
        ...(status && { status }),
      },
    });

    res.json({ success: true, tournament });
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/admin/tournaments/:id */
export const deleteTournament = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.tournament.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Tournament deleted' });
  } catch (error) {
    next(error);
  }
};

/** GET /api/tournaments/:id/points-table */
export const getPointsTable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const entries = await prisma.pointsTableEntry.findMany({
      where: { tournamentId: req.params.id },
      include: { team: true },
      orderBy: [{ points: 'desc' }, { nrr: 'desc' }],
    });
    res.json({ success: true, entries });
  } catch (error) {
    next(error);
  }
};
