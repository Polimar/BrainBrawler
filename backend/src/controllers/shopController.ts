import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

// Get all shop items
export const getShopItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category } = req.query;

    const whereClause = {
      ...(category && { category: category as string })
    };

    const items = await prisma.shopItem.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' },
        { price: 'asc' }
      ]
    });

    res.json({ items });
  } catch (error) {
    console.error('Get shop items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's owned items
export const getUserItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const purchases = await prisma.userPurchase.findMany({
      where: { userId: req.user.id },
      include: {
        shopItem: true
      },
      orderBy: { purchasedAt: 'desc' }
    });

    const ownedItems = purchases.map((purchase: any) => ({
      ...purchase.shopItem,
      purchasedAt: purchase.purchasedAt,
      isActive: purchase.isActive
    }));

    res.json({ ownedItems });
  } catch (error) {
    console.error('Get user items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Purchase item
export const purchaseItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { itemId, paymentMethod, receiptData } = req.body;

    if (!itemId) {
      res.status(400).json({ error: 'Item ID is required' });
      return;
    }

    // Get shop item
    const shopItem = await prisma.shopItem.findUnique({
      where: { id: itemId }
    });

    if (!shopItem) {
      res.status(404).json({ error: 'Shop item not found' });
      return;
    }

    // Check if user already owns this item
    const existingPurchase = await prisma.userPurchase.findFirst({
      where: {
        userId: req.user.id,
        shopItemId: itemId
      }
    });

    if (existingPurchase) {
      res.status(400).json({ error: 'Item already owned' });
      return;
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Process payment based on method
    let isPaymentValid = false;

    if (paymentMethod === 'coins') {
      // Check if user has enough coins
      if (user.coins < shopItem.price) {
        res.status(400).json({ error: 'Insufficient coins' });
        return;
      }
      isPaymentValid = true;
    } else if (paymentMethod === 'real_money') {
      // Validate receipt (simplified - implement proper receipt validation)
      isPaymentValid = await validateReceipt(receiptData, shopItem.price);
    }

    if (!isPaymentValid) {
      res.status(400).json({ error: 'Payment validation failed' });
      return;
    }

    // Process purchase in transaction
    const userId = req.user.id;
    const result = await prisma.$transaction(async (tx: any) => {
      // Create purchase record
      const purchase = await tx.userPurchase.create({
        data: {
          userId,
          shopItemId: itemId,
          paymentMethod,
          isActive: true
        },
        include: {
          shopItem: true
        }
      });

      // Deduct coins if payment was with coins
      if (paymentMethod === 'coins') {
        await tx.user.update({
          where: { id: userId },
          data: {
            coins: {
              decrement: shopItem.price
            }
          }
        });
      }

      // If it's an avatar, set it as selected
      if (shopItem.category === 'AVATAR') {
        await tx.user.update({
          where: { id: userId },
          data: {
            selectedAvatarId: shopItem.id
          }
        });
      }

      // If it's premium subscription, extend premium access
      if (shopItem.category === 'PREMIUM') {
        const premiumDays = shopItem.metadata ? JSON.parse(shopItem.metadata).days || 30 : 30;
        const premiumExpiresAt = new Date();
        premiumExpiresAt.setDate(premiumExpiresAt.getDate() + premiumDays);

        await tx.user.update({
          where: { id: userId },
          data: {
            accountType: 'PREMIUM',
            premiumExpiresAt
          }
        });
      }

      return purchase;
    });

    res.status(201).json({
      message: 'Purchase completed successfully',
      purchase: result
    });
  } catch (error) {
    console.error('Purchase item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Activate/deactivate item (for cosmetics)
export const toggleItemActive = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { purchaseId } = req.params;
    const { isActive } = req.body;

    const purchase = await prisma.userPurchase.findFirst({
      where: {
        id: purchaseId,
        userId: req.user.id
      },
      include: {
        shopItem: true
      }
    });

    if (!purchase) {
      res.status(404).json({ error: 'Purchase not found' });
      return;
    }

    // Only cosmetic items can be toggled
    if (!['AVATAR', 'THEME', 'EFFECT'].includes(purchase.shopItem.category)) {
      res.status(400).json({ error: 'This item cannot be toggled' });
      return;
    }

    await prisma.userPurchase.update({
      where: { id: purchaseId },
      data: { isActive }
    });

    // If activating an avatar, update user's selected avatar
    if (isActive && purchase.shopItem.category === 'AVATAR') {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { selectedAvatarId: purchase.shopItem.id }
      });
    }

    res.json({ message: 'Item status updated successfully' });
  } catch (error) {
    console.error('Toggle item active error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Gift coins to user (for rewards, achievements, etc.)
export const giftCoins = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { amount, reason } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Valid amount is required' });
      return;
    }

    // Add coins to user
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        coins: {
          increment: amount
        }
      },
      select: {
        coins: true
      }
    });

    // Create coin transaction record
    await prisma.coinTransaction.create({
      data: {
        userId: req.user.id,
        amount,
        type: 'EARNED',
        reason: reason || 'Gift coins',
        balanceAfter: updatedUser.coins
      }
    });

    res.json({
      message: 'Coins gifted successfully',
      newBalance: updatedUser.coins,
      giftedAmount: amount
    });
  } catch (error) {
    console.error('Gift coins error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's coin transactions
export const getCoinTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const transactions = await prisma.coinTransaction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.coinTransaction.count({
      where: { userId: req.user.id }
    });

    res.json({
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get coin transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Simplified receipt validation (implement proper validation for production)
async function validateReceipt(receiptData: string, expectedPrice: number): Promise<boolean> {
  try {
    // Mock validation - in real implementation:
    // - Validate with Google Play/App Store
    // - Check receipt authenticity
    // - Verify purchase amount
    // - Ensure receipt hasn't been used before
    
    if (!receiptData) {
      return false;
    }

    // Basic format check
    const receipt = JSON.parse(receiptData);
    return receipt.productId && receipt.transactionId && receipt.purchaseTime;
  } catch (error) {
    console.error('Receipt validation error:', error);
    return false;
  }
} 