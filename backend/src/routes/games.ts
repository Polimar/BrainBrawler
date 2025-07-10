import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePremium, addAccountInfo } from '../middleware/accountType';
import {
  createGame,
  joinGame,
  getGame,
  startGame,
  updatePlayerReady,
  electNewHost,
  updateConnectionInfo,
  leaveGame,
  getAvailableGames
} from '../controllers/gameController';

const router = Router();

// Get available games (any authenticated user can browse)
router.get('/available', authenticateToken, addAccountInfo, getAvailableGames);

// Join a game (any authenticated user can join)
router.post('/join', authenticateToken, addAccountInfo, joinGame);

// Get game details (any participant can view)
router.get('/:gameId', authenticateToken, getGame);

// Create a new game (PREMIUM ONLY - per documentation)
router.post('/create', authenticateToken, requirePremium, createGame);

// Start game (only host can start)
router.post('/:gameId/start', authenticateToken, startGame);

// Update player ready status
router.post('/:gameId/ready', authenticateToken, updatePlayerReady);

// Leave game
router.post('/:gameId/leave', authenticateToken, leaveGame);

// P2P-specific routes
router.post('/:gameId/elect-host', authenticateToken, electNewHost);
router.post('/:gameId/connection-info', authenticateToken, updateConnectionInfo);

export default router; 