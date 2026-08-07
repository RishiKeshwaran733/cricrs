import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: string;
    };

    if (decoded.role === 'PLAYER') {
      const player = await prisma.player.findUnique({ where: { id: decoded.id } });
      if (!player) {
        res.status(401).json({ message: 'Player not found' });
        return;
      }
      req.user = { id: player.id, email: player.mobileNumber || '', role: 'PLAYER' };
    } else {
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        res.status(401).json({ message: 'User not found' });
        return;
      }
      req.user = { id: user.id, email: user.email, role: user.role };
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
