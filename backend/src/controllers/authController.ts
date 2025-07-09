import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import crypto from 'crypto';

interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

// Generate JWT tokens
const generateTokens = (user: { id: string; email: string; username: string; accountType: string }) => {
  const jwtSecret = process.env.JWT_SECRET!;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';
  const refreshExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

  const payload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    accountType: user.accountType,
  };

  const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn } as jwt.SignOptions);
  const refreshToken = crypto.randomBytes(64).toString('hex');

  return { accessToken, refreshToken };
};

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password }: RegisterRequest = req.body;

    // Validation
    if (!email || !username || !password) {
      res.status(400).json({ error: 'Email, username, and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Username validation (alphanumeric + underscore, 3-20 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      res.status(400).json({ error: 'Username must be 3-20 characters, alphanumeric and underscore only' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      res.status(409).json({ 
        error: existingUser.email === email.toLowerCase() 
          ? 'Email already registered' 
          : 'Username already taken' 
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification code
    const verificationCode = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password: hashedPassword,
        accountType: 'FREE',
      },
      select: {
        id: true,
        email: true,
        username: true,
        accountType: true,
        isEmailVerified: true,
        createdAt: true,
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      }
    });

    res.status(201).json({
      message: 'User registered successfully',
      user,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { emailOrUsername, password }: LoginRequest = req.body;

    if (!emailOrUsername || !password) {
      res.status(400).json({ error: 'Email/username and password are required' });
      return;
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername.toLowerCase() },
          { username: emailOrUsername.toLowerCase() }
        ],
      }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Update last seen
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date(), isOnline: true }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      }
    });

    // Return user data without password
    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      accountType: user.accountType,
      isEmailVerified: user.isEmailVerified,
      totalGamesPlayed: user.totalGamesPlayed,
      totalGamesWon: user.totalGamesWon,
      totalScore: user.totalScore,
      averageScore: user.averageScore,
      selectedAvatarId: user.selectedAvatarId,
    };

    res.json({
      message: 'Login successful',
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Refresh access token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken }: RefreshTokenRequest = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    // Find refresh token
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    // Check if user is available (removed isActive check since field doesn't exist)

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(tokenRecord.user);

    // Update refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        token: newRefreshToken,
        expiresAt,
      }
    });

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Logout user
export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken }: RefreshTokenRequest = req.body;

    if (refreshToken) {
      // Remove refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    }

    res.json({ message: 'Logout successful' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user profile
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        accountType: true,
        isEmailVerified: true,
        totalGamesPlayed: true,
        totalGamesWon: true,
        totalScore: true,
        averageScore: true,
        selectedAvatarId: true,
        createdAt: true,
        lastSeen: true,
        isOnline: true,
        premiumExpiresAt: true,
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Email verification (placeholder for future implementation)
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    // Email verification not implemented in current schema
    res.status(501).json({ error: 'Email verification not implemented' });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 