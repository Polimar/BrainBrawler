import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
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

// All game routes require authentication
router.use(authenticateToken);

// Core game management
router.post('/', createGame);                    // Create new P2P game (premium only)
router.post('/join', joinGame);                  // Join game by code
router.get('/available', getAvailableGames);     // Get list of available public games
router.get('/:gameId', getGame);                 // Get game details
router.post('/:gameId/start', startGame);        // Start game (host only)
router.post('/:gameId/leave', leaveGame);        // Leave game

// Player status management
router.patch('/:gameId/ready', updatePlayerReady); // Update player ready status

// P2P specific endpoints
router.post('/:gameId/elect-host', electNewHost);        // Elect new host
router.patch('/:gameId/connection', updateConnectionInfo); // Update P2P connection info

export default router; 