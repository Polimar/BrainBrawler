import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { WebSocketService } from '../services/websocketService';
import { generateGameCode } from '../utils/gameUtils';

export const createGame = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  console.log(`[Game Creation] Attempt by user: ${userId} (${req.user?.username})`);
  console.log('[Game Creation] Received settings:', req.body);

  try {
    const { questionSetId, maxPlayers = 8, totalQuestions = 10, timePerQuestion = 30, isPrivate = false } = req.body;

    const questionSet = await prisma.questionSet.findFirst({
      where: {
        id: questionSetId,
        OR: [
          { isPublic: true },
          { ownerId: userId },
          {
            owner: {
              accountType: { in: ['PREMIUM', 'ADMIN'] },
              OR: [
                { friendships1: { some: { user2Id: userId, status: 'ACCEPTED' } } },
                { friendships2: { some: { user1Id: userId, status: 'ACCEPTED' } } }
              ]
            }
          }
        ]
      },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });

    if (!questionSet) {
      console.error(`[Game Creation] Failed: Question set ${questionSetId} not found or user ${userId} lacks access.`);
      return res.status(404).json({ error: 'Question set not found or you do not have access' });
    }
    
    const availableQuestions = questionSet._count.questions;
    if (availableQuestions < totalQuestions) {
      return res.status(400).json({ 
        error: `Question set has only ${availableQuestions} questions, but ${totalQuestions} were requested.` 
      });
    }

    const gameCode = generateGameCode();

    const game = await prisma.game.create({
      data: {
        code: gameCode,
        creatorId: userId, // Correct field name
        questionSetId,
        maxPlayers,
        totalQuestions,
        timePerQuestion,
        isPrivate,
        state: 'WAITING',
        currentHostId: userId, // Creator is the first host
        participants: {
          create: {
            userId: userId,
            isReady: true,
            isHost: true,
          }
        }
      },
      include: {
        questionSet: { select: { name: true } },
      }
    });

    console.log(`[Game Creation] Successfully created game with id: ${game.id}`);
    res.status(201).json({ success: true, game });

  } catch (error) {
    console.error('[Game Creation] An unexpected error occurred:', error);
    res.status(500).json({ error: 'Failed to create game due to a server error' });
  }
};

// Join an existing game
export const joinGame = async (req: AuthenticatedRequest, res: Response, wsService: WebSocketService) => {
  try {
    const { gameCode } = req.body;
    const userId = req.user!.id;

    // Find the game
    const game = await prisma.game.findFirst({
      where: {
        code: gameCode,
        state: 'WAITING'
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                accountType: true
              }
            }
          }
        },
        questionSet: {
          select: {
            name: true,
            category: true,
            difficulty: true
          }
        }
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found or already started' });
    }

    // Check if game is full
    if (game.participants.length >= game.maxPlayers) {
      return res.status(400).json({ error: 'Game is full' });
    }

    // Check if user is already in the game
    const existingParticipant = game.participants.find((p: any) => p.userId === userId);
    if (existingParticipant) {
      return res.status(200).json({
        success: true,
        message: 'Welcome back to the game',
        game: {
          id: game.id,
          code: game.code,
          questionSet: game.questionSet,
          participants: game.participants.map((p: any) => ({
            id: p.userId,
            username: p.user.username,
            isHost: p.isHost,
            isReady: p.isReady,
            joinedAt: p.joinedAt
          })),
          maxPlayers: game.maxPlayers,
          totalQuestions: game.totalQuestions,
          timePerQuestion: game.timePerQuestion,
          isP2P: game.isP2P,
          currentHostId: game.currentHostId,
          state: game.state
        }
      });
    }

    // Add user to the game
    await prisma.gameParticipant.create({
      data: {
        gameId: game.id,
        userId,
        isHost: false,
        isReady: false
      }
    });

    // Get updated participant list to broadcast
    const updatedGame = await prisma.game.findUnique({
      where: { id: game.id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                accountType: true
              }
            }
          }
        }
      }
    });
    
    // Broadcast player join event
    wsService.broadcastToGame(game.id, 'player-joined', {
      player: {
        id: userId,
        username: req.user!.username,
        isHost: false,
        isReady: false,
      },
      participants: updatedGame!.participants.map((p: any) => ({
        id: p.userId,
        username: p.user.username,
        isHost: p.isHost,
        isReady: p.isReady,
        joinedAt: p.joinedAt
      }))
    });

    res.json({
      success: true,
      message: 'Successfully joined the game',
      game: {
        id: updatedGame!.id,
        code: updatedGame!.code,
        questionSet: game.questionSet,
        participants: updatedGame!.participants.map((p: any) => ({
          id: p.userId,
          username: p.user.username,
          isHost: p.isHost,
          isReady: p.isReady,
          joinedAt: p.joinedAt
        })),
        maxPlayers: updatedGame!.maxPlayers,
        totalQuestions: updatedGame!.totalQuestions,
        timePerQuestion: updatedGame!.timePerQuestion,
        isP2P: updatedGame!.isP2P,
        currentHostId: updatedGame!.currentHostId,
        state: updatedGame!.state
      }
    });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ error: 'Failed to join game' });
  }
};

// Get game details
export const getGame = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { gameId } = req.params;
    const userId = req.user!.id;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                accountType: true
              }
            }
          }
        },
        questionSet: {
          select: {
            name: true,
            category: true,
            difficulty: true
          }
        },
        hostElections: {
          orderBy: { electedAt: 'desc' },
          take: 5 // Last 5 host changes
        }
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if user is participant
    const isParticipant = game.participants.some((p: any) => p.userId === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to view this game' });
    }

    res.json({
      game: {
        id: game.id,
        code: game.code,
        questionSet: game.questionSet,
        participants: game.participants.map((p: any) => ({
          id: p.userId,
          username: p.user.username,
          isHost: p.isHost,
          isReady: p.isReady,
          score: p.score,
          rank: p.rank,
          connectionQuality: p.connectionQuality,
          latency: p.latency,
          joinedAt: p.joinedAt
        })),
        maxPlayers: game.maxPlayers,
        totalQuestions: game.totalQuestions,
        timePerQuestion: game.timePerQuestion,
        currentQuestion: game.currentQuestion,
        isP2P: game.isP2P,
        currentHostId: game.currentHostId,
        state: game.state,
        hostElections: game.hostElections,
        finalStats: game.finalStats,
        createdAt: game.createdAt,
        startedAt: game.startedAt,
        endedAt: game.endedAt
      }
    });
  } catch (error) {
    console.error('Error getting game:', error);
    res.status(500).json({ error: 'Failed to get game' });
  }
};

// Start a game
export const startGame = async (req: AuthenticatedRequest, res: Response, wsService: WebSocketService) => {
  try {
    const { gameId } = req.params;
    const userId = req.user!.id;

    // Verify user is the current host
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        participants: true
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.currentHostId !== userId) {
      return res.status(403).json({ error: 'Only the current host can start the game' });
    }

    if (game.state !== 'WAITING') {
      return res.status(400).json({ error: 'Game cannot be started in current state' });
    }

    // Check if all players are ready
    const allReady = game.participants.every((p: any) => p.isReady);
    if (!allReady) {
      return res.status(400).json({ error: 'Not all players are ready' });
    }

    // Minimum 2 players required
    if (game.participants.length < 2) {
      return res.status(400).json({ error: 'At least 2 players required to start' });
    }

    // Update game state
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        state: 'IN_PROGRESS',
        startedAt: new Date(),
      }
    });

    // Broadcast that the game has started
    wsService.broadcastToGame(gameId, 'game-started', { game: updatedGame });

    res.json({ success: true, message: 'Game started' });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
};

// Update player ready status
export const updatePlayerReady = async (req: AuthenticatedRequest, res: Response, wsService: WebSocketService) => {
  try {
    const { gameId } = req.params;
    const { isReady } = req.body;
    const userId = req.user!.id;

    // Update participant status
    const participant = await prisma.gameParticipant.update({
      where: {
        gameId_userId: {
          gameId,
          userId
        }
      },
      data: { isReady }
    });

    // Broadcast the updated status
    wsService.broadcastToGame(gameId, 'player-ready-update', {
      userId,
      isReady
    });

    res.json({ success: true, message: `Player status updated to ${isReady ? 'ready' : 'not ready'}` });
  } catch (error) {
    console.error('Error updating player ready status:', error);
    res.status(500).json({ error: 'Failed to update player ready status' });
  }
};

// Elect new host (P2P functionality)
export const electNewHost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { gameId } = req.params;
    const { newHostId, reason = 'manual', candidateIds = [] } = req.body;
    const userId = req.user!.id;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        participants: true
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify requester is a participant
    const isParticipant = game.participants.some((p: any) => p.userId === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Verify new host is a participant
    const newHost = game.participants.find((p: any) => p.userId === newHostId);
    if (!newHost) {
      return res.status(400).json({ error: 'New host is not a participant' });
    }

    // Record the host election
    await prisma.hostElection.create({
      data: {
        gameId,
        previousHostId: game.currentHostId,
        newHostId,
        electionReason: reason,
        candidateIds: candidateIds.length > 0 ? candidateIds : [newHostId]
      }
    });

    // Update current host in game
    await prisma.game.update({
      where: { id: gameId },
      data: { currentHostId: newHostId }
    });

    // Update participant host status
    await prisma.gameParticipant.updateMany({
      where: { gameId },
      data: { isHost: false }
    });

    await prisma.gameParticipant.update({
      where: {
        gameId_userId: {
          gameId,
          userId: newHostId
        }
      },
      data: { isHost: true }
    });

    res.json({
      success: true,
      newHostId,
      previousHostId: game.currentHostId,
      reason
    });
  } catch (error) {
    console.error('Error electing new host:', error);
    res.status(500).json({ error: 'Failed to elect new host' });
  }
};

// Update P2P connection info
export const updateConnectionInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { gameId } = req.params;
    const { peerId, connectionQuality, latency } = req.body;
    const userId = req.user!.id;

    await prisma.gameParticipant.update({
      where: {
        gameId_userId: {
          gameId,
          userId
        }
      },
      data: {
        peerId,
        connectionQuality,
        latency
      }
    });

    res.json({
      success: true,
      message: 'Connection info updated'
    });
  } catch (error) {
    console.error('Error updating connection info:', error);
    res.status(500).json({ error: 'Failed to update connection info' });
  }
};

// Leave a game
export const leaveGame = async (req: AuthenticatedRequest, res: Response, wsService: WebSocketService) => {
  try {
    const { gameId } = req.params;
    const userId = req.user!.id;

    // Check if the user is in the game
    const participant = await prisma.gameParticipant.findUnique({
      where: {
        gameId_userId: {
          gameId,
          userId,
        },
      },
    });

    if (!participant) {
      return res.status(404).json({ error: 'You are not in this game' });
    }

    // Remove the participant
    await prisma.gameParticipant.delete({
      where: {
        gameId_userId: {
          gameId,
          userId,
        },
      },
    });

    // Broadcast player leave event
    wsService.broadcastToGame(gameId, 'player-left', { userId });

    res.json({ success: true, message: 'You have left the game' });
  } catch (error) {
    console.error('Error leaving game:', error);
    res.status(500).json({ error: 'Failed to leave game' });
  }
};

// Get all available public games
export const getAvailableGames = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const games = await prisma.game.findMany({
      where: {
        isPrivate: false,
        state: 'WAITING',
      },
      include: {
        creator: { select: { username: true } },
        participants: { select: { userId: true } },
        questionSet: { select: { name: true, category: true, difficulty: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    const gamesWithParticipantCount = games.map((game: any) => ({
      ...game,
      participantCount: game.participants.length,
    }));

    res.json({ games: gamesWithParticipantCount });
  } catch (error) {
    console.error('Error getting available games:', error);
    res.status(500).json({ error: 'Failed to get available games' });
  }
}; 