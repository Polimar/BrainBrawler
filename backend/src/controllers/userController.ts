import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

interface UpdateProfileRequest {
  email?: string;
  username?: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Update user profile
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { email, username }: UpdateProfileRequest = req.body;

    // Validation
    if (!email && !username) {
      res.status(400).json({ error: 'At least one field (email or username) is required' });
      return;
    }

    // Check if email is already taken
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          NOT: { id: req.user.id }
        }
      });

      if (existingUser) {
        res.status(400).json({ error: 'Email is already taken' });
        return;
      }
    }

    // Check if username is already taken
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: username.toLowerCase(),
          NOT: { id: req.user.id }
        }
      });

      if (existingUser) {
        res.status(400).json({ error: 'Username is already taken' });
        return;
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (email) updateData.email = email.toLowerCase();
    if (username) updateData.username = username.toLowerCase();

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
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

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Change password
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { currentPassword, newPassword }: ChangePasswordRequest = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long' });
      return;
    }

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });

    // Invalidate all refresh tokens for security
    await prisma.refreshToken.deleteMany({
      where: { userId: req.user.id }
    });

    res.json({ message: 'Password changed successfully. Please log in again.' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload avatar (placeholder for future file upload implementation)
export const uploadAvatar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    res.status(501).json({ 
      error: 'Avatar upload not implemented yet',
      message: 'This feature will be implemented with file upload and cloud storage integration'
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user statistics
export const getUserStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const stats = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        totalGamesPlayed: true,
        totalGamesWon: true,
        totalScore: true,
        averageScore: true,
      }
    });

    if (!stats) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Calculate win rate
    const winRate = stats.totalGamesPlayed > 0 
      ? (stats.totalGamesWon / stats.totalGamesPlayed) * 100 
      : 0;

    const response = {
      ...stats,
      winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
      averageScorePerGame: stats.totalGamesPlayed > 0 
        ? Math.round((stats.totalScore / stats.totalGamesPlayed) * 100) / 100 
        : 0
    };

    res.json({ stats: response });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete account (soft delete)
export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { password }: { password: string } = req.body;

    if (!password) {
      res.status(400).json({ error: 'Password confirmation required' });
      return;
    }

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(400).json({ error: 'Password is incorrect' });
      return;
    }

    // Delete user (hard delete since no isActive field)
    await prisma.user.delete({
      where: { id: req.user.id }
    });

    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 