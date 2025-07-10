import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Middleware to check if user is premium
export const requirePremium = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountType: true, premiumExpiresAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is premium and subscription is active
    if (user.accountType !== 'PREMIUM' && user.accountType !== 'ADMIN') {
      return res.status(403).json({ 
        error: 'Premium subscription required',
        upgradeRequired: true
      });
    }

    // Check if premium subscription has expired
    if (user.premiumExpiresAt && user.premiumExpiresAt < new Date()) {
      // Downgrade to FREE
      await prisma.user.update({
        where: { id: userId },
        data: { accountType: 'FREE', premiumExpiresAt: null }
      });

      return res.status(403).json({ 
        error: 'Premium subscription has expired',
        upgradeRequired: true
      });
    }

    next();
  } catch (error) {
    console.error('Error checking premium status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to check if user can create content (premium feature)
export const requireContentCreator = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountType: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.accountType === 'FREE') {
      return res.status(403).json({ 
        error: 'Only premium users can create custom content',
        feature: 'content_creation',
        upgradeRequired: true
      });
    }

    next();
  } catch (error) {
    console.error('Error checking content creator status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to track ad impressions for FREE users
export const trackAdImpression = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return next(); // Continue without tracking if not authenticated
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountType: true }
    });

    // Only track ads for FREE users
    if (user && user.accountType === 'FREE') {
      const { adType, adUnit } = req.body;
      
      if (adType && adUnit) {
        await prisma.adImpression.create({
          data: {
            userId,
            adType,
            adUnit,
            clicked: false
          }
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error tracking ad impression:', error);
    next(); // Continue even if tracking fails
  }
};

// Middleware to add account type info to response
export const addAccountInfo = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        accountType: true, 
        premiumExpiresAt: true,
        createdAt: true
      }
    });

    if (user) {
      // Add account info to response locals
      res.locals.accountInfo = {
        accountType: user.accountType,
        isPremium: user.accountType === 'PREMIUM' || user.accountType === 'ADMIN',
        premiumExpiresAt: user.premiumExpiresAt,
        showAds: user.accountType === 'FREE',
        canCreateGames: user.accountType !== 'FREE',
        canCreateContent: user.accountType !== 'FREE'
      };
    }

    next();
  } catch (error) {
    console.error('Error adding account info:', error);
    next();
  }
}; 