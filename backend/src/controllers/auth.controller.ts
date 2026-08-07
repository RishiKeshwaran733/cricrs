import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt.utils';
import { createError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

/**
 * POST /api/auth/login
 * Admin login with email + password → JWT token
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createError('Email and password are required', 400));
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return next(createError('Invalid credentials', 401));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(createError('Invalid credentials', 401));
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/player-login
 * Player login with mobile number → JWT token
 */
export const playerLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber || !/^\d{10}$/.test(mobileNumber)) {
      return next(createError('A valid 10-digit mobile number is required', 400));
    }

    const player = await prisma.player.findUnique({ where: { mobileNumber } });
    
    if (!player) {
      return next(createError('Player not found with this mobile number', 404));
    }

    if (!player.isActive) {
      return next(createError('Player account is disabled', 403));
    }

    // Use PLAYER role for the JWT token
    const token = generateToken({ id: player.id, email: player.mobileNumber!, role: 'PLAYER' as any });

    res.json({
      success: true,
      token,
      player: { id: player.id, name: player.name, mobileNumber: player.mobileNumber, role: 'PLAYER' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated admin profile
 */
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, avatar: true, createdAt: true },
    });

    if (!user) {
      return next(createError('User not found', 404));
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/change-password
 */
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return next(createError('User not found', 404));

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return next(createError('Current password is incorrect', 400));

    if (newPassword.length < 8) {
      return next(createError('New password must be at least 8 characters', 400));
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
