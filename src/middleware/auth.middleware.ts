import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    apiKey?: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing authorization header',
      });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    // If it's an API key (simple UUID check)
    if (!token.includes('.') && token.length > 20) {
      req.user = {
        id: 'api-key-user',
        email: 'api@onetoall.dev',
        apiKey: token,
      };
      return next();
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};
