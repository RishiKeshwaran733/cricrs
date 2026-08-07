import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/error.middleware';
import { emitAdminNotification } from '../socket/socket';

const prisma = new PrismaClient();

/** GET /api/teams */
export const getTeams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = search
      ? {
          isGuest: false,
          OR: [
            { name: { contains: String(search), mode: 'insensitive' as const } },
            { shortName: { contains: String(search), mode: 'insensitive' as const } },
          ],
        }
      : { isGuest: false };

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          captain: { select: { id: true, name: true, photo: true } },
          _count: { select: { players: true, homeMatches: true, awayMatches: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.team.count({ where }),
    ]);

    res.json({ success: true, teams, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    next(error);
  }
};

/** GET /api/teams/:id */
export const getTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.params.id },
      include: {
        players: { orderBy: { name: 'asc' } },
        captain: true,
      },
    });
    if (!team) return next(createError('Team not found', 404));
    res.json({ success: true, team });
  } catch (error) {
    next(error);
  }
};

/** POST /api/admin/teams */
export const createTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, shortName, primaryColor, secondaryColor, country, city, foundedYear, homeGround } = req.body;
    const logo = (req as any).file ? `/uploads/${(req as any).file.filename}` : null;

    if (!name || !shortName) return next(createError('Name and short name are required', 400));

    const team = await prisma.team.create({
      data: { name, shortName, logo, primaryColor, secondaryColor, country, city, foundedYear: foundedYear ? Number(foundedYear) : null, homeGround },
    });

    emitAdminNotification({ type: 'TEAM_CREATED', message: `Team "${name}" created`, teamId: team.id });

    res.status(201).json({ success: true, team });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return next(createError('Team name or short name already exists', 400));
    }
    next(error);
  }
};

/** PUT /api/admin/teams/:id */
export const updateTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, shortName, primaryColor, secondaryColor, country, city, foundedYear, homeGround, captainId } = req.body;
    const logo = (req as any).file ? `/uploads/${(req as any).file.filename}` : undefined;

    const team = await prisma.team.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(shortName && { shortName }),
        ...(logo && { logo }),
        ...(primaryColor && { primaryColor }),
        ...(secondaryColor && { secondaryColor }),
        ...(country !== undefined && { country }),
        ...(city !== undefined && { city }),
        ...(foundedYear && { foundedYear: Number(foundedYear) }),
        ...(homeGround !== undefined && { homeGround }),
        ...(captainId !== undefined && { captainId }),
      },
    });

    res.json({ success: true, team });
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/admin/teams/:id */
export const deleteTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.team.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Team deleted' });
  } catch (error) {
    next(error);
  }
};
