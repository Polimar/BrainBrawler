import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePremium, addAccountInfo } from '../middleware/accountType';
import { WebSocketService } from '../services/websocketService';
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

export default (wsService: WebSocketService) => {
const router = Router();

// Get available games (any authenticated user can browse)
router.get('/available', authenticateToken, addAccountInfo, getAvailableGames);

// Join a game (any authenticated user can join)
  router.post('/join', authenticateToken, addAccountInfo, (req, res) => joinGame(req, res, wsService));

// Get game details (any participant can view)
router.get('/:gameId', authenticateToken, getGame);

// Create a new game (PREMIUM ONLY - per documentation)
router.post('/create', authenticateToken, requirePremium, createGame);

// Start game (only host can start)
  router.post('/:gameId/start', authenticateToken, (req, res) => startGame(req, res, wsService));

// Update player ready status
  router.post('/:gameId/ready', authenticateToken, (req, res) => updatePlayerReady(req, res, wsService));

// Leave game
  router.post('/:gameId/leave', authenticateToken, (req, res) => leaveGame(req, res, wsService));

// P2P-specific routes
router.post('/:gameId/elect-host', authenticateToken, electNewHost);
router.post('/:gameId/connection-info', authenticateToken, updateConnectionInfo);

  return router;
}; 