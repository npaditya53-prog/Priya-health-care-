import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AdminUserRepository, AdminUser } from './repositories.js';

const AUTH_SECRET = process.env.AUTH_SECRET || 'priya-health-care-secure-jwt-key-change-in-production-2026';
const TOKEN_EXPIRY = '7d';

export interface AuthPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export const Auth = {
  hashPassword(password: string): string {
    const salt = bcrypt.genSaltSync(12);
    return bcrypt.hashSync(password, salt);
  },

  comparePassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  },

  generateToken(user: AdminUser): string {
    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return jwt.sign(payload, AUTH_SECRET, { expiresIn: TOKEN_EXPIRY });
  },

  verifyToken(token: string): AuthPayload | null {
    try {
      return jwt.verify(token, AUTH_SECRET) as AuthPayload;
    } catch {
      return null;
    }
  },
};

/**
 * Express middleware to enforce authentication on protected endpoints
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check authorization header first, then auth cookie
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required to access this resource.',
      },
    });
  }

  const payload = Auth.verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Session expired or invalid token. Please log in again.',
      },
    });
  }

  req.user = payload;
  next();
}

/**
 * Role-based authorization middleware
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient administrative privileges.',
        },
      });
    }
    next();
  };
}

/**
 * In-memory sliding rate limiter for endpoints (Login, Booking, Contact)
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export function createRateLimiter(options: { windowMs: number; max: number; message: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    const record = rateLimitMap.get(key);
    if (!record || now > record.resetTime) {
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      return next();
    }

    if (record.count >= options.max) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: options.message,
        },
      });
    }

    record.count += 1;
    next();
  };
}
