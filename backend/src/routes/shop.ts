import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getShopItems,
  getUserItems,
  purchaseItem,
  toggleItemActive,
  giftCoins,
  getCoinTransactions
} from '../controllers/shopController';

const router = Router();

// Public routes (no auth required)
router.get('/items', getShopItems);

// Protected routes (require authentication)
router.use(authenticateToken);

// User's purchases and items
router.get('/my-items', getUserItems);
router.put('/purchases/:purchaseId/toggle', toggleItemActive);

// Purchase system
router.post('/purchase', purchaseItem);

// Coin system
router.post('/gift-coins', giftCoins);
router.get('/coin-transactions', getCoinTransactions);

export default router; 