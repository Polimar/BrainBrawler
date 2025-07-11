import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { trackAdImpression } from '../middleware/accountType';
import { prisma } from '../config/database';

const router = Router();

interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Track ad impression (for FREE users only)
router.post('/impression', authenticateToken, trackAdImpression, async (req: any, res) => {
  try {
    const { adType, adUnit, placement } = req.body;
    const userId = req.userId;

    if (!adType || !adUnit) {
      return res.status(400).json({ error: 'adType and adUnit are required' });
    }

    // Verify user is FREE (ads only shown to FREE users)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountType: true }
    });

    if (!user || user.accountType !== 'FREE') {
      return res.status(400).json({ error: 'Ads are only tracked for FREE users' });
    }

    res.json({
      success: true,
      message: 'Ad impression tracked',
      showUpgradePrompt: Math.random() < 0.1 // 10% chance to show upgrade prompt
    });

  } catch (error) {
    console.error('Error tracking ad impression:', error);
    res.status(500).json({ error: 'Failed to track ad impression' });
  }
});

// Track ad click (for FREE users only)
router.post('/click', authenticateToken, async (req: any, res) => {
  try {
    const { adImpressionId, adType, adUnit } = req.body;
    const userId = req.userId;

    // Update the impression to mark as clicked
    if (adImpressionId) {
      await prisma.adImpression.update({
        where: { 
          id: adImpressionId,
          userId: userId 
        },
        data: { clicked: true }
      });
    } else {
      // Create new impression record with click
      await prisma.adImpression.create({
        data: {
          userId,
          adType: adType || 'BANNER',
          adUnit: adUnit || 'unknown',
          clicked: true
        }
      });
    }

    res.json({
      success: true,
      message: 'Ad click tracked',
      earnedCoins: 5, // Reward for viewing ads
      showUpgradePrompt: Math.random() < 0.15 // 15% chance after clicking
    });

    // Give user some coins for clicking ads
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { coins: { increment: 5 } }
    });

    // Track coin transaction
    await prisma.coinTransaction.create({
      data: {
        userId,
        amount: 5,
        type: 'AD_REWARD',
        reason: 'Reward for viewing advertisement',
        balanceAfter: updatedUser.coins
      }
    });

  } catch (error) {
    console.error('Error tracking ad click:', error);
    res.status(500).json({ error: 'Failed to track ad click' });
  }
});

// Get ad configuration for FREE users
router.get('/config', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountType: true }
    });

    if (!user || user.accountType !== 'FREE') {
      return res.json({
        showAds: false,
        adConfig: null
      });
    }

    // Return ad configuration for FREE users
    res.json({
      showAds: true,
      adConfig: {
        bannerFrequency: 'always', // Show banner ads always
        interstitialFrequency: 3, // Show interstitial every 3 questions
        rewardedAvailable: true,
        adUnits: {
          banner: 'brainbrawler_banner',
          interstitial: 'brainbrawler_interstitial', 
          rewarded: 'brainbrawler_rewarded'
        },
        sdkConfig: {
          appId: 'ca-app-pub-8145977851051737~8523227896',
          nativeAdUnitId: 'ca-app-pub-8145977851051737/1115511164'
        },
        placement: {
          lobby: ['banner'],
          game: ['banner', 'interstitial'],
          results: ['interstitial', 'rewarded']
        }
      }
    });

  } catch (error) {
    console.error('Error getting ad config:', error);
    res.status(500).json({ error: 'Failed to get ad configuration' });
  }
});

// Get user's ad statistics
router.get('/stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;

    const [totalImpressions, totalClicks, earnedFromAds] = await Promise.all([
      prisma.adImpression.count({
        where: { userId }
      }),
      prisma.adImpression.count({
        where: { userId, clicked: true }
      }),
      prisma.coinTransaction.aggregate({
        where: { 
          userId,
          type: 'AD_REWARD'
        },
        _sum: { amount: true }
      })
    ]);

    res.json({
      totalImpressions,
      totalClicks,
      clickRate: totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(1) : 0,
      earnedFromAds: earnedFromAds._sum?.amount || 0
    });

  } catch (error) {
    console.error('Error getting ad stats:', error);
    res.status(500).json({ error: 'Failed to get ad statistics' });
  }
});

export default router; 