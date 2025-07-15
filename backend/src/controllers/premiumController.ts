import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

// Create custom question set with LLM integration
export const createCustomQuestionSet = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check if user has premium access
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user || (user.accountType === 'FREE' && (!user.premiumExpiresAt || user.premiumExpiresAt < new Date()))) {
      res.status(403).json({ error: 'Premium subscription required' });
      return;
    }

    const { name, description, category, difficulty, topic, questionCount = 10 } = req.body;

    if (!name || !topic) {
      res.status(400).json({ error: 'Name and topic are required' });
      return;
    }

    // Create question set
    const questionSet = await prisma.questionSet.create({
      data: {
        name,
        description: description || `Custom questions about ${topic}`,
        category: category || 'CUSTOM',
        difficulty: difficulty || 'MEDIUM',
        isPremium: true,
        isPublic: false,
        ownerId: req.user.id
      }
    });

    // Generate questions using mock LLM (in real implementation, integrate with OpenAI/Claude)
    const generatedQuestions = await generateQuestionsWithLLM(topic, questionCount, difficulty);

    // Create questions in database
    const questions = await Promise.all(
      generatedQuestions.map((q, index) =>
        prisma.question.create({
          data: {
            questionSetId: questionSet.id,
            text: q.question,
            options: q.options, // Already an array of strings
            correctAnswer: q.correctAnswer, // Now an index
            explanation: q.explanation,
            difficulty: difficulty || 'MEDIUM',
            category: category || 'CUSTOM',
          }
        })
      )
    );

    res.status(201).json({
      message: 'Custom question set created successfully',
      questionSet: {
        ...questionSet,
        questionsCount: questions.length
      }
    });
  } catch (error) {
    console.error('Create custom question set error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mock LLM question generation (replace with real LLM API)
async function generateQuestionsWithLLM(topic: string, count: number, difficulty: string) {
  // Mock implementation - in real app, call OpenAI/Claude API
  const difficultyLevel = difficulty === 'EASY' ? 'basic' : difficulty === 'HARD' ? 'advanced' : 'intermediate';
  
  const mockQuestions = [];
  for (let i = 0; i < count; i++) {
    const options = [
      `Option A about ${topic}`,
      `Option B about ${topic}`,
      `Option C about ${topic}`,
      `Option D about ${topic}`
    ];
    mockQuestions.push({
      question: `What is a ${difficultyLevel} concept related to ${topic}? (Question ${i + 1})`,
      options: options,
      correctAnswer: Math.floor(Math.random() * options.length), // Return a random index
      explanation: `This is the correct answer because it accurately describes ${topic} at ${difficultyLevel} level.`
    });
  }
  
  return mockQuestions;
}

// Get user's LLM configurations
export const getLLMConfigs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const configs = await prisma.lLMConfig.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        provider: true,
        endpoint: true,
        model: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json({ configs });
  } catch (error) {
    console.error('Get LLM configs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Save LLM configuration
export const saveLLMConfig = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { provider, apiKey, endpoint, model } = req.body;

    if (!provider || !apiKey) {
      res.status(400).json({ error: 'Provider and API key are required' });
      return;
    }

    // Encrypt API key (basic implementation - use proper encryption in production)
    const encryptedApiKey = Buffer.from(apiKey).toString('base64');

    // Deactivate existing configs of same provider
    await prisma.lLMConfig.updateMany({
      where: {
        userId: req.user.id,
        provider
      },
      data: { isActive: false }
    });

    // Create new config
    const config = await prisma.lLMConfig.create({
      data: {
        userId: req.user.id,
        provider,
        apiKey: encryptedApiKey,
        endpoint,
        model,
        isActive: true
      },
      select: {
        id: true,
        provider: true,
        endpoint: true,
        model: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'LLM configuration saved successfully',
      config
    });
  } catch (error) {
    console.error('Save LLM config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create premium game with custom settings
export const createPremiumGame = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check if user has premium access
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user || (user.accountType === 'FREE' && (!user.premiumExpiresAt || user.premiumExpiresAt < new Date()))) {
      res.status(403).json({ error: 'Premium subscription required' });
      return;
    }

    const {
      questionSetId,
      maxPlayers = 8,
      totalQuestions = 10,
      timePerQuestion = 30,
      isPrivate = false,
      customRules
    } = req.body;

    if (!questionSetId) {
      res.status(400).json({ error: 'Question set ID is required' });
      return;
    }

    // Verify question set exists and user has access
    const questionSet = await prisma.questionSet.findFirst({
      where: {
        id: questionSetId,
        OR: [
          { isPublic: true },
          { ownerId: req.user.id },
          { isPremium: false }
        ]
      }
    });

    if (!questionSet) {
      res.status(404).json({ error: 'Question set not found or access denied' });
      return;
    }

    // Generate unique game code
    let gameCode;
    do {
      gameCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    } while (await prisma.game.findUnique({ where: { code: gameCode } }));

    // Create premium game
    const game = await prisma.game.create({
      data: {
        code: gameCode,
        questionSetId,
        creatorId: req.user.id,
        maxPlayers,
        totalQuestions,
        timePerQuestion,
        isPrivate,
        isP2P: true,
        currentHostId: req.user.id,
        inviteCode: isPrivate ? Math.random().toString(36).substr(2, 8).toUpperCase() : undefined
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
        userId: req.user.id,
        isHost: true,
        isReady: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Premium game created successfully',
      game: {
        id: game.id,
        code: game.code,
        inviteCode: game.inviteCode,
        questionSet: game.questionSet,
        creator: game.creator,
        maxPlayers: game.maxPlayers,
        totalQuestions: game.totalQuestions,
        timePerQuestion: game.timePerQuestion,
        isPrivate: game.isPrivate,
        isP2P: game.isP2P,
        state: game.state,
        createdAt: game.createdAt
      }
    });
  } catch (error) {
    console.error('Create premium game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get premium features status
export const getPremiumStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        accountType: true,
        premiumExpiresAt: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isPremium = user.accountType === 'PREMIUM' || 
                     (user.premiumExpiresAt && user.premiumExpiresAt > new Date());

    res.json({
      isPremium,
      accountType: user.accountType,
      premiumExpiresAt: user.premiumExpiresAt,
      features: {
        customQuestionSets: isPremium,
        llmIntegration: isPremium,
        privateGames: isPremium,
        advancedAnalytics: isPremium,
        noAds: isPremium
      }
    });
  } catch (error) {
    console.error('Get premium status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 