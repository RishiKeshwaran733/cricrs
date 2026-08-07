import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/error.middleware';
import { emitAdminNotification } from '../socket/socket';

const prisma = new PrismaClient();

/** GET /api/players */
export const getPlayers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, teamId, role, page = '1', limit = '20', includeGuests } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (includeGuests !== 'true') {
      where.isGuest = false;
    }
    if (search) {
      where.name = { contains: String(search), mode: 'insensitive' };
    }
    if (teamId) where.teamId = String(teamId);
    if (role) where.role = String(role);

    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        skip,
        take: Number(limit),
        include: { team: { select: { id: true, name: true, shortName: true, logo: true, primaryColor: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.player.count({ where }),
    ]);

    res.json({ success: true, players, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    next(error);
  }
};

/** GET /api/players/:id */
export const getPlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const player = await prisma.player.findUnique({
      where: { id: req.params.id },
      include: {
        team: true,
        battingCards: {
          include: { innings: { include: { match: { include: { teamA: true, teamB: true } } } } },
          take: 10,
          orderBy: { innings: { createdAt: 'desc' } },
        },
        bowlingCards: {
          include: { innings: { include: { match: { include: { teamA: true, teamB: true } } } } },
          take: 10,
          orderBy: { innings: { createdAt: 'desc' } },
        },
      },
    });
    if (!player) return next(createError('Player not found', 404));
    res.json({ success: true, player });
  } catch (error) {
    next(error);
  }
};

/** POST /api/admin/players */
export const createPlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name, mobileNumber, jerseyNumber, dateOfBirth, nationality, battingStyle, bowlingStyle,
      role, teamId, bio,
    } = req.body;
    const photo = (req as any).file ? `/uploads/${(req as any).file.filename}` : null;

    if (!name) return next(createError('Player name is required', 400));
    if (!mobileNumber || !/^\d{10}$/.test(mobileNumber)) return next(createError('Mobile Number must be exactly 10 digits', 400));

    const existingPlayer = await prisma.player.findUnique({ where: { mobileNumber } });
    if (existingPlayer) return next(createError('A player with this mobile number already exists', 400));

    const player = await prisma.player.create({
      data: {
        name,
        mobileNumber,
        photo,
        jerseyNumber: jerseyNumber ? Number(jerseyNumber) : null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        nationality,
        battingStyle: battingStyle || 'RIGHT_HANDED',
        bowlingStyle: bowlingStyle || 'NONE',
        role: role || 'BATSMAN',
        teamId: teamId || null,
        bio,
      },
    });

    emitAdminNotification({ type: 'PLAYER_ADDED', message: `Player "${name}" added`, playerId: player.id });

    res.status(201).json({ success: true, player });
  } catch (error) {
    next(error);
  }
};

/** PUT /api/players/me/photo */
export const updateMyPhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const playerId = (req as any).user?.id;
    if (!playerId || (req as any).user?.role !== 'PLAYER') {
      return next(createError('Unauthorized to update player photo', 403));
    }

    let photo: string | undefined;
    if (req.file) {
      photo = `/uploads/${req.file.filename}`;
    }

    if (!photo) {
      return next(createError('No photo provided', 400));
    }

    const player = await prisma.player.update({
      where: { id: playerId },
      data: { photo },
    });

    res.json({ success: true, player });
  } catch (error) {
    next(error);
  }
};

/** PUT /api/admin/players/:id */
export const updatePlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name, mobileNumber, jerseyNumber, dateOfBirth, nationality, battingStyle, bowlingStyle,
      role, teamId, bio, isActive,
    } = req.body;
    const photo = (req as any).file ? `/uploads/${(req as any).file.filename}` : undefined;

    if (mobileNumber) {
      if (!/^\d{10}$/.test(mobileNumber)) return next(createError('Mobile Number must be exactly 10 digits', 400));
      const existingPlayer = await prisma.player.findUnique({ where: { mobileNumber } });
      if (existingPlayer && existingPlayer.id !== req.params.id) {
        return next(createError('A player with this mobile number already exists', 400));
      }
    }

    const player = await prisma.player.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(mobileNumber && { mobileNumber }),
        ...(photo && { photo }),
        ...(jerseyNumber !== undefined && { jerseyNumber: Number(jerseyNumber) }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(nationality !== undefined && { nationality }),
        ...(battingStyle && { battingStyle }),
        ...(bowlingStyle && { bowlingStyle }),
        ...(role && { role }),
        ...(teamId !== undefined && { teamId }),
        ...(bio !== undefined && { bio }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    res.json({ success: true, player });
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/admin/players/:id */
export const deletePlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.player.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Player deleted' });
  } catch (error) {
    next(error);
  }
};

/** PUT /api/admin/players/:id/transfer — Transfer player to another team */
export const transferPlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { teamId } = req.body;
    const player = await prisma.player.update({
      where: { id: req.params.id },
      data: { teamId: teamId || null },
      include: { team: true },
    });
    res.json({ success: true, player });
  } catch (error) {
    next(error);
  }
};

/** PUT /api/admin/players/:id/rename — Rename a guest player during scoring */
export const renameGuestPlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) return next(createError('Player name is required', 400));
    
    const player = await prisma.player.findUnique({ where: { id: req.params.id } });
    if (!player || !player.isGuest) {
      return next(createError('Only guest players can be renamed this way', 400));
    }
    
    const updated = await prisma.player.update({
      where: { id: req.params.id },
      data: { name }
    });
    
    res.json({ success: true, player: updated });
  } catch (error) {
    next(error);
  }
};
