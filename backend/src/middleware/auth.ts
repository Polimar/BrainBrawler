import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

// Define types locally to avoid import issues
export interface JWTPayload {
  userId: string;
  // Add other properties from the JWT payload if they exist
}

export interface AuthenticatedRequest<B = any, P = any, Q = any> extends Request<P, any, B, Q> {
  user?: {
    id: string;
    email: string;
    username: string;
    accountType: string;
  };
}


export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Authenticating request for:', req.path);
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    console.log('Received token:', token ? 'Token present' : 'No token');

    if (!token) {
      console.log('Authentication failed: No token provided.');
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    console.log('Token decoded for userId:', decoded.userId);
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        accountType: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      console.log('Authentication failed: User not found for id', decoded.userId);
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    console.log('Token verified successfully for user:', user.username);
    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      accountType: user.accountType,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    
    res.status(500).json({ error: 'Authentication error' });
  }
};

export const requireEmailVerification = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // This middleware should be used after authenticateToken
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // For now, we'll check this in the route handlers
  // since we need to query the database for emailVerified status
  next();
};

export const requireAccountType = (...allowedTypes: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedTypes.includes(req.user.accountType)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}; 