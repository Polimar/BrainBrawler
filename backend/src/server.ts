import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { prisma } from './config/database';
import { WebSocketService } from './services/websocketService';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import gameRoutes from './routes/games';
import questionRoutes from './routes/questions';

const app = express();
const server = createServer(app);

// Socket.IO setup with CORS
const io = new SocketServer(server, {
  cors: {
    origin: [
      "http://localhost:3001",
      "http://10.40.10.180:3001",
      "http://10.40.10.180",
      "https://www.brainbrawler.com",
      // Mobile app origins
      "http://10.0.2.2:3001",
      "http://localhost:19006",
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Initialize WebSocket service
const wsService = new WebSocketService(io);

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false // Needed for WebRTC
}));

app.use(cors({
  origin: [
    "http://localhost:3001",
    "http://10.40.10.180:3001", 
    "http://10.40.10.180",
    "https://www.brainbrawler.com",
    // Mobile app origins
    "http://10.0.2.2:3001",
    "http://localhost:19006",
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      websocket: 'running',
      webrtc: 'enabled'
    }
  });
});

// Serve WebRTC test page
app.get('/test', (req, res) => {
  res.sendFile('test-webrtc.html', { root: __dirname + '/..' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'BrainBrawler Backend',
    version: '1.0.0',
    features: ['WebRTC P2P', 'Real-time Gaming', 'Host Election'],
    endpoints: {
      health: '/health',
      test: '/test',
      api: '/api/*'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/friends', require('./routes/friends').default);
app.use('/api/premium', require('./routes/premium').default);
app.use('/api/shop', require('./routes/shop').default);

// WebRTC Signaling endpoints
app.post('/api/webrtc/create-room', async (req, res) => {
  try {
    const { gameId, hostUserId } = req.body;
    
    // Verify game exists and user is participant
    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
        participants: {
          some: {
            userId: hostUserId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found or unauthorized' });
    }

    res.json({
      success: true,
      roomId: gameId,
      participants: game.participants.map((p: any) => ({
        id: p.userId,
        username: p.user.username,
        isHost: p.userId === hostUserId
      }))
    });
  } catch (error) {
    console.error('Error creating WebRTC room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

app.get('/api/webrtc/ice-servers', (req, res) => {
  // Return STUN/TURN servers for WebRTC connections
  res.json({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      // Add TURN servers if available
      // {
      //   urls: 'turn:your-turn-server.com:3478',
      //   username: 'your-username',
      //   credential: 'your-password'
      // }
    ]
  });
});

// Game statistics sync endpoint
app.post('/api/games/:gameId/sync-stats', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { finalStats, participants } = req.body;

    // Verify game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update game completion status
    await prisma.game.update({
      where: { id: gameId },
      data: {
        state: 'COMPLETED',
        endedAt: new Date(),
        finalStats: finalStats
      }
    });

    // Update participant scores and rankings
    for (const participant of participants) {
      await prisma.gameParticipant.update({
        where: {
          gameId_userId: {
            gameId,
            userId: participant.userId
          }
        },
        data: {
          score: participant.finalScore,
          rank: participant.rank,
          completedAt: new Date()
        }
      });

      // Update user overall statistics
      const isWinner = participant.rank === 1;
      await prisma.user.update({
        where: { id: participant.userId },
        data: {
          totalGamesPlayed: { increment: 1 },
          totalGamesWon: isWinner ? { increment: 1 } : undefined,
          totalScore: { increment: participant.finalScore },
          averageScore: {
            // Recalculate average score
            set: await calculateAverageScore(participant.userId)
          }
        }
      });
    }

    res.json({ 
      success: true, 
      message: 'Game statistics synchronized successfully' 
    });
  } catch (error) {
    console.error('Error syncing game stats:', error);
    res.status(500).json({ error: 'Failed to sync game statistics' });
  }
});

// Helper function to calculate average score
async function calculateAverageScore(userId: string): Promise<number> {
  const userStats = await prisma.gameParticipant.aggregate({
    where: { userId },
    _avg: { score: true },
    _count: { score: true }
  });

  return userStats._avg.score || 0;
}

// P2P Connection status endpoint
app.get('/api/games/:gameId/p2p-status', (req, res) => {
  const { gameId } = req.params;
  const room = wsService.getGameRoom(gameId);
  
  if (!room) {
    return res.status(404).json({ error: 'Game room not found' });
  }

  const connectedPlayers = wsService.getConnectedPlayers(gameId);
  const isActive = wsService.isGameActive(gameId);

  res.json({
    gameId,
    isActive,
    hostId: room.host,
    totalPlayers: room.players.size,
    connectedPlayers: connectedPlayers.length,
    players: connectedPlayers.map(p => ({
      id: p.id,
      username: p.username,
      isHost: p.isHost,
      isConnected: p.isConnected,
      lastSeen: p.lastHeartbeat
    }))
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Close Socket.IO connections
  io.close();
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close database connections
    prisma.$disconnect().then(() => {
      console.log('Database connections closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  
  io.close();
  server.close(() => {
    prisma.$disconnect().then(() => {
      process.exit(0);
    });
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 BrainBrawler Backend Server running on port ${PORT}`);
  console.log(`📡 WebSocket server enabled for real-time communication`);
  console.log(`🔗 WebRTC P2P support enabled for distributed gaming`);
  console.log(`💾 Database connected: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, server, io }; 