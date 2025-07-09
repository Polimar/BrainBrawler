import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { generateGameCode } from '../utils/gameUtils';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Create a new P2P game
export const createGame = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { questionSetId, maxPlayers = 8, totalQuestions = 10, timePerQuestion = 30, isPrivate = false } = req.body;
    const userId = req.userId!;

    // Verify user can create games (premium check)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only premium users can create games (per documentation)
    if (user.accountType === 'FREE') {
      return res.status(403).json({ error: 'Only premium users can create games' });
    }

    // Verify question set exists and user has access
    const questionSet = await prisma.questionSet.findFirst({
      where: {
        id: questionSetId,
        OR: [
          { isPublic: true },
          { ownerId: userId },
          // User can access friend's premium question sets
          {
            owner: {
              OR: [
                {
                  friendships1: {
                    some: { user2Id: userId }
                  }
                },
                {
                  friendships2: {
                    some: { user1Id: userId }
                  }
                }
              ]
            }
          }
        ]
      },
      include: {
        questions: true
      }
    });

    if (!questionSet) {
      return res.status(404).json({ error: 'Question set not found or not accessible' });
    }

    if (questionSet.questions.length < totalQuestions) {
      return res.status(400).json({ 
        error: `Question set has only ${questionSet.questions.length} questions, but ${totalQuestions} requested` 
      });
    }

    // Generate unique game code
    const gameCode = await generateGameCode();

    // Create the game
    const game = await prisma.game.create({
      data: {
        code: gameCode,
        questionSetId,
        creatorId: userId,
        maxPlayers,
        totalQuestions,
        timePerQuestion,
        isPrivate,
        isP2P: true,
        currentHostId: userId, // Creator starts as host
        inviteCode: isPrivate ? gameCode : undefined
      },
      include: {
        questionSet: {
          select: {
            name: true,
            description: true
          }
        },
        creator: {
          select: {
            username: true,
            accountType: true
          }
        }
      }
    });

    // Add creator as first participant and host
    await prisma.gameParticipant.create({
      data: {
        gameId: game.id,
        userId,
        isHost: true,
        isReady: true
      }
    });

    res.status(201).json({
      success: true,
      game: {
        id: game.id,
        code: game.code,
        questionSet: game.questionSet,
        creator: game.creator,
        maxPlayers: game.maxPlayers,
        totalQuestions: game.totalQuestions,
        timePerQuestion: game.timePerQuestion,
        isPrivate: game.isPrivate,
        isP2P: game.isP2P,
        currentHostId: game.currentHostId,
        state: game.state,
        createdAt: game.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
};

// Join an existing game
export const joinGame = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { gameCode } = req.body;
    const userId = req.userId!;

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
    const existingParticipant = game.participants.find(p => p.userId === userId);
    if (existingParticipant) {
      return res.status(200).json({
        success: true,
        message: 'Welcome back to the game',
        game: {
          id: game.id,
          code: game.code,
          questionSet: game.questionSet,
          participants: game.participants.map(p => ({
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

    // Get updated participant list
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

    res.json({
      success: true,
      message: 'Successfully joined the game',
      game: {
        id: updatedGame!.id,
        code: updatedGame!.code,
        questionSet: game.questionSet,
        participants: updatedGame!.participants.map(p => ({
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
    const userId = req.userId!;

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
    const isParticipant = game.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to view this game' });
    }

    res.json({
      game: {
        id: game.id,
        code: game.code,
        questionSet: game.questionSet,
        participants: game.participants.map(p => ({
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

// Start game (host only)
export const startGame = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { gameId } = req.params;
    const userId = req.userId!;

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
    const allReady = game.participants.every(p => p.isReady);
    if (!allReady) {
      return res.status(400).json({ error: 'Not all players are ready' });
    }

    // Minimum 2 players required
    if (game.participants.length < 2) {
      return res.status(400).json({ error: 'At least 2 players required to start' });
    }

    // Update game state
    await prisma.game.update({
      where: { id: gameId },
      data: {
        state: 'STARTING',
        startedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Game started successfully',
      startedAt: new Date()
    });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
};

// Update player readiness
export const updatePlayerReady = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { gameId } = req.params;
    const { isReady } = req.body;
    const userId = req.userId!;

    const participant = await prisma.gameParticipant.findUnique({
      where: {
        gameId_userId: {
          gameId,
          userId
        }
      }
    });

    if (!participant) {
      return res.status(404).json({ error: 'Not a participant in this game' });
    }

    await prisma.gameParticipant.update({
      where: {
        gameId_userId: {
          gameId,
          userId
        }
      },
      data: { isReady }
    });

    res.json({
      success: true,
      isReady
    });
  } catch (error) {
    console.error('Error updating player ready status:', error);
    res.status(500).json({ error: 'Failed to update ready status' });
  }
};

// Elect new host (P2P functionality)
export const electNewHost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { gameId } = req.params;
    const { newHostId, reason = 'manual', candidateIds = [] } = req.body;
    const userId = req.userId!;

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
    const isParticipant = game.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Verify new host is a participant
    const newHost = game.participants.find(p => p.userId === newHostId);
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
    const userId = req.userId!;

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

// Leave game
export const leaveGame = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { gameId } = req.params;
    const userId = req.userId!;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        participants: true
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const participant = game.participants.find(p => p.userId === userId);
    if (!participant) {
      return res.status(404).json({ error: 'Not a participant in this game' });
    }

    // If this is the host and there are other players, we need to elect a new host
    const wasHost = participant.isHost;
    const otherParticipants = game.participants.filter(p => p.userId !== userId);

    if (wasHost && otherParticipants.length > 0) {
      // Elect first remaining participant as new host
      const newHostId = otherParticipants[0].userId;
      
      await prisma.hostElection.create({
        data: {
          gameId,
          previousHostId: userId,
          newHostId,
          electionReason: 'host_left',
          candidateIds: [newHostId]
        }
      });

      await prisma.game.update({
        where: { id: gameId },
        data: { currentHostId: newHostId }
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
    }

    // Remove participant
    await prisma.gameParticipant.delete({
      where: {
        gameId_userId: {
          gameId,
          userId
        }
      }
    });

    // If no participants left, mark game as cancelled
    if (otherParticipants.length === 0) {
      await prisma.game.update({
        where: { id: gameId },
        data: { 
          state: 'CANCELLED',
          endedAt: new Date()
        }
      });
    }

    res.json({
      success: true,
      message: 'Left game successfully',
      newHostId: wasHost && otherParticipants.length > 0 ? otherParticipants[0].userId : undefined
    });
  } catch (error) {
    console.error('Error leaving game:', error);
    res.status(500).json({ error: 'Failed to leave game' });
  }
};

// Get available games to join
export const getAvailableGames = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const games = await prisma.game.findMany({
      where: {
        state: 'WAITING',
        isPrivate: false
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
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
        creator: {
          select: {
            username: true,
            accountType: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to recent 20 games
    });

    const availableGames = games
      .filter(game => game.participants.length < game.maxPlayers)
      .map(game => ({
        id: game.id,
        code: game.code,
        creator: game.creator,
        questionSet: game.questionSet,
        currentPlayers: game.participants.length,
        maxPlayers: game.maxPlayers,
        totalQuestions: game.totalQuestions,
        timePerQuestion: game.timePerQuestion,
        isP2P: game.isP2P,
        createdAt: game.createdAt,
        participants: game.participants.map(p => ({
          username: p.user.username,
          isHost: p.isHost,
          isReady: p.isReady
        }))
      }));

    res.json({
      games: availableGames,
      total: availableGames.length
    });
  } catch (error) {
    console.error('Error getting available games:', error);
    res.status(500).json({ error: 'Failed to get available games' });
  }
}; 