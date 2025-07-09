import { Server as SocketServer, Socket } from 'socket.io';
import { prisma } from '../config/database';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  gameId?: string;
  isHost?: boolean;
}

interface GameRoom {
  id: string;
  host: string;
  players: Map<string, PlayerInfo>;
  gameState: GameState;
  createdAt: Date;
}

interface PlayerInfo {
  id: string;
  userId: string;
  username: string;
  socketId: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  isConnected: boolean;
  lastHeartbeat: Date;
}

interface GameState {
  status: 'WAITING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
  currentQuestionIndex: number;
  currentQuestion?: any;
  timeRemaining: number;
  scores: Map<string, number>;
  answers: Map<string, string>; // playerId -> answer
  roundStartTime?: Date;
}

// In-memory game rooms storage
const gameRooms = new Map<string, GameRoom>();
const playerSockets = new Map<string, string>(); // userId -> socketId

export class WebSocketService {
  private io: SocketServer;

  constructor(io: SocketServer) {
    this.io = io;
    this.setupSocketHandlers();
    this.startHeartbeatCheck();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Authenticate socket connection
      socket.on('authenticate', async (token: string) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          socket.userId = decoded.userId;
          socket.username = decoded.username;
          
          if (socket.userId) {
            playerSockets.set(socket.userId, socket.id);
          }
          
          socket.emit('authenticated', { 
            success: true, 
            userId: socket.userId,
            username: socket.username 
          });

          console.log(`Socket authenticated: ${socket.username} (${socket.userId})`);
        } catch (error) {
          socket.emit('authenticated', { success: false, error: 'Invalid token' });
          socket.disconnect();
        }
      });

      // Join game room
      socket.on('join-game', async (gameId: string) => {
        if (!socket.userId) {
          socket.emit('error', 'Not authenticated');
          return;
        }

        try {
          // Verify player is part of this game
          const participant = await prisma.gameParticipant.findFirst({
            where: {
              gameId,
              userId: socket.userId
            },
            include: {
              game: true,
              user: true
            }
          });

          if (!participant) {
            socket.emit('error', 'Not authorized for this game');
            return;
          }

          socket.gameId = gameId;
          socket.join(`game:${gameId}`);

          // Initialize or update game room
          if (!gameRooms.has(gameId)) {
            const isHost = participant.game.creatorId === socket.userId;
            gameRooms.set(gameId, {
              id: gameId,
              host: socket.userId!,
              players: new Map(),
              gameState: {
                status: 'WAITING',
                currentQuestionIndex: 0,
                timeRemaining: 0,
                scores: new Map(),
                answers: new Map()
              },
              createdAt: new Date()
            });
            socket.isHost = isHost;
          }

          const room = gameRooms.get(gameId)!;
          
          // Add/update player in room
          room.players.set(socket.userId!, {
            id: socket.userId!,
            userId: socket.userId!,
            username: socket.username!,
            socketId: socket.id,
            isHost: socket.userId === room.host,
            isReady: false,
            score: 0,
            isConnected: true,
            lastHeartbeat: new Date()
          });

          // Broadcast updated player list
          this.broadcastToGame(gameId, 'players-updated', {
            players: Array.from(room.players.values())
          });

          socket.emit('joined-game', {
            gameId,
            isHost: socket.userId === room.host,
            players: Array.from(room.players.values()),
            gameState: room.gameState
          });

          console.log(`Player ${socket.username} joined game ${gameId}`);
        } catch (error) {
          console.error('Error joining game:', error);
          socket.emit('error', 'Failed to join game');
        }
      });

      // WebRTC Signaling for P2P connections
      socket.on('webrtc-offer', (data) => {
        socket.to(`game:${socket.gameId}`).emit('webrtc-offer', {
          from: socket.userId,
          offer: data.offer,
          targetId: data.targetId
        });
      });

      socket.on('webrtc-answer', (data) => {
        socket.to(`game:${socket.gameId}`).emit('webrtc-answer', {
          from: socket.userId,
          answer: data.answer,
          targetId: data.targetId
        });
      });

      socket.on('webrtc-ice-candidate', (data) => {
        socket.to(`game:${socket.gameId}`).emit('webrtc-ice-candidate', {
          from: socket.userId,
          candidate: data.candidate,
          targetId: data.targetId
        });
      });

      // P2P Host Election
      socket.on('request-host-election', () => {
        if (!socket.gameId) return;
        
        const room = gameRooms.get(socket.gameId);
        if (!room) return;

        this.electNewHost(socket.gameId, room);
      });

      socket.on('host-election-vote', (data) => {
        if (!socket.gameId) return;
        
        socket.to(`game:${socket.gameId}`).emit('host-election-vote', {
          from: socket.userId,
          vote: data.vote,
          newHostId: data.newHostId
        });
      });

      socket.on('host-elected', (data) => {
        if (!socket.gameId) return;
        
        const room = gameRooms.get(socket.gameId);
        if (room) {
          // Update host in room
          const oldHost = room.players.get(room.host);
          const newHost = room.players.get(data.newHostId);
          
          if (oldHost) oldHost.isHost = false;
          if (newHost) newHost.isHost = true;
          
          room.host = data.newHostId;

          this.broadcastToGame(socket.gameId, 'new-host-elected', {
            newHostId: data.newHostId,
            newHostUsername: newHost?.username
          });

          console.log(`New host elected for game ${socket.gameId}: ${newHost?.username}`);
        }
      });

      // Game State Synchronization
      socket.on('sync-game-state', (gameState) => {
        if (!socket.gameId || !socket.isHost) return;

        const room = gameRooms.get(socket.gameId);
        if (room) {
          room.gameState = { ...room.gameState, ...gameState };
          
          socket.to(`game:${socket.gameId}`).emit('game-state-updated', room.gameState);
        }
      });

      socket.on('player-answer', (data) => {
        if (!socket.gameId || !socket.userId) return;

        const room = gameRooms.get(socket.gameId);
        if (room) {
          room.gameState.answers.set(socket.userId, data.answer);
          
          this.broadcastToGame(socket.gameId, 'player-answered', {
            playerId: socket.userId,
            playerCount: room.players.size,
            answeredCount: room.gameState.answers.size
          });
        }
      });

      socket.on('update-score', (data) => {
        if (!socket.gameId || !socket.userId) return;

        const room = gameRooms.get(socket.gameId);
        if (room) {
          const player = room.players.get(socket.userId);
          if (player) {
            player.score = data.score;
            room.gameState.scores.set(socket.userId, data.score);
          }

          this.broadcastToGame(socket.gameId, 'scores-updated', {
            scores: Object.fromEntries(room.gameState.scores)
          });
        }
      });

      // Player readiness
      socket.on('player-ready', (ready: boolean) => {
        if (!socket.gameId || !socket.userId) return;

        const room = gameRooms.get(socket.gameId);
        if (room) {
          const player = room.players.get(socket.userId);
          if (player) {
            player.isReady = ready;
            
            this.broadcastToGame(socket.gameId, 'players-updated', {
              players: Array.from(room.players.values())
            });
          }
        }
      });

      // Heartbeat for connection monitoring
      socket.on('heartbeat', () => {
        if (!socket.gameId || !socket.userId) return;

        const room = gameRooms.get(socket.gameId);
        if (room) {
          const player = room.players.get(socket.userId);
          if (player) {
            player.lastHeartbeat = new Date();
            player.isConnected = true;
          }
        }
      });

      // Disconnect handling
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        
        if (socket.userId) {
          playerSockets.delete(socket.userId);
          
          if (socket.gameId) {
            this.handlePlayerDisconnect(socket.gameId, socket.userId);
          }
        }
      });

      // Leave game
      socket.on('leave-game', () => {
        if (socket.gameId && socket.userId) {
          this.handlePlayerLeave(socket.gameId, socket.userId);
          socket.leave(`game:${socket.gameId}`);
          socket.gameId = undefined;
        }
      });

      // Game completion and stats sync
      socket.on('game-completed', async (finalStats) => {
        if (!socket.gameId || !socket.isHost) return;

        try {
          await this.syncGameStatsToBackend(socket.gameId, finalStats);
          
          this.broadcastToGame(socket.gameId, 'game-completed', {
            finalStats,
            statssSynced: true
          });

          // Clean up room after delay
          setTimeout(() => {
            gameRooms.delete(socket.gameId!);
          }, 30000); // 30 seconds delay

        } catch (error) {
          console.error('Error syncing game stats:', error);
        }
      });
    });
  }

  private broadcastToGame(gameId: string, event: string, data: any) {
    this.io.to(`game:${gameId}`).emit(event, data);
  }

  private handlePlayerDisconnect(gameId: string, userId: string) {
    const room = gameRooms.get(gameId);
    if (!room) return;

    const player = room.players.get(userId);
    if (player) {
      player.isConnected = false;
      
      // If this was the host, trigger election
      if (player.isHost && room.players.size > 1) {
        this.electNewHost(gameId, room);
      }

      this.broadcastToGame(gameId, 'player-disconnected', {
        playerId: userId,
        username: player.username,
        wasHost: player.isHost
      });
    }
  }

  private handlePlayerLeave(gameId: string, userId: string) {
    const room = gameRooms.get(gameId);
    if (!room) return;

    const player = room.players.get(userId);
    if (player) {
      room.players.delete(userId);
      room.gameState.scores.delete(userId);
      room.gameState.answers.delete(userId);

      // If this was the host and there are still players, elect new host
      if (player.isHost && room.players.size > 0) {
        this.electNewHost(gameId, room);
      }

      this.broadcastToGame(gameId, 'player-left', {
        playerId: userId,
        username: player.username,
        remainingPlayers: Array.from(room.players.values())
      });

      // If no players left, clean up room
      if (room.players.size === 0) {
        gameRooms.delete(gameId);
      }
    }
  }

  private electNewHost(gameId: string, room: GameRoom) {
    // Find the best candidate for new host (connected player with lowest latency/highest score)
    const connectedPlayers = Array.from(room.players.values())
      .filter(p => p.isConnected && p.id !== room.host);

    if (connectedPlayers.length === 0) {
      console.log(`No connected players left in game ${gameId}`);
      return;
    }

    // Simple election: first connected player (can be enhanced with more criteria)
    const newHost = connectedPlayers[0];
    
    // Update room state
    const oldHost = room.players.get(room.host);
    if (oldHost) oldHost.isHost = false;
    
    newHost.isHost = true;
    room.host = newHost.id;

    this.broadcastToGame(gameId, 'host-election-started', {
      candidates: connectedPlayers.map(p => ({
        id: p.id,
        username: p.username,
        score: p.score
      })),
      suggestedHost: newHost.id
    });

    console.log(`Host election started for game ${gameId}, suggested: ${newHost.username}`);
  }

  private async syncGameStatsToBackend(gameId: string, finalStats: any) {
    try {
      const room = gameRooms.get(gameId);
      if (!room) return;

      // Update game status to completed
      await prisma.game.update({
        where: { id: gameId },
        data: {
          state: 'COMPLETED',
          endedAt: new Date()
        }
      });

      // Update player scores and statistics
      for (const [playerId, score] of room.gameState.scores) {
        await prisma.gameParticipant.update({
          where: {
            gameId_userId: {
              gameId,
              userId: playerId
            }
          },
          data: {
            score: score,
            rank: this.calculateRank(room.gameState.scores, playerId)
          }
        });

        // Update user statistics
        const isWinner = this.calculateRank(room.gameState.scores, playerId) === 1;
        await prisma.user.update({
          where: { id: playerId },
          data: {
            totalGamesPlayed: { increment: 1 },
            totalGamesWon: isWinner ? { increment: 1 } : undefined,
            totalScore: { increment: score }
          }
        });
      }

      console.log(`Game stats synced to backend for game ${gameId}`);
    } catch (error) {
      console.error('Error syncing game stats:', error);
      throw error;
    }
  }

  private calculateRank(scores: Map<string, number>, playerId: string): number {
    const playerScore = scores.get(playerId) || 0;
    const sortedScores = Array.from(scores.values()).sort((a, b) => b - a);
    return sortedScores.indexOf(playerScore) + 1;
  }

  private startHeartbeatCheck() {
    setInterval(() => {
      const now = new Date();
      
      for (const [gameId, room] of gameRooms) {
        for (const [playerId, player] of room.players) {
          const timeSinceHeartbeat = now.getTime() - player.lastHeartbeat.getTime();
          
          // Consider player disconnected after 30 seconds without heartbeat
          if (timeSinceHeartbeat > 30000 && player.isConnected) {
            console.log(`Player ${player.username} timed out in game ${gameId}`);
            this.handlePlayerDisconnect(gameId, playerId);
          }
        }
      }
    }, 15000); // Check every 15 seconds
  }

  // Public methods for external use
  public getGameRoom(gameId: string): GameRoom | undefined {
    return gameRooms.get(gameId);
  }

  public getConnectedPlayers(gameId: string): PlayerInfo[] {
    const room = gameRooms.get(gameId);
    return room ? Array.from(room.players.values()) : [];
  }

  public isGameActive(gameId: string): boolean {
    const room = gameRooms.get(gameId);
    return room ? room.gameState.status === 'IN_PROGRESS' : false;
  }
} 