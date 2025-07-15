import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { Prisma } from '@prisma/client';

// Get a paginated and searchable list of all users
export const getUsers = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  try {
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { email: { contains: search as string, mode: 'insensitive' } },
            { username: { contains: search as string, mode: 'insensitive' } },
          ],
        }
      : {};

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
};

// Get a single user by ID
export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        gameParticipants: {
          take: 5,
          orderBy: { joinedAt: 'desc' },
          include: { game: true },
        },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
};

// Update a user's details
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: req.body,
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete a user
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get system-wide statistics
export const getSystemStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalGames,
      totalQuestionSets,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.game.count(),
      prisma.questionSet.count(),
    ]);
    res.json({
      totalUsers,
      totalGames,
      totalQuestionSets,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve system stats' });
  }
}; 