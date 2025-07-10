import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

// Get user's friends
export const getFriends = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: req.user.id },
          { user2Id: req.user.id }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            selectedAvatarId: true,
            isOnline: true,
            lastSeen: true
          }
        },
        user2: {
          select: {
            id: true,
            username: true,
            selectedAvatarId: true,
            isOnline: true,
            lastSeen: true
          }
        }
      }
    });

    const friends = friendships.map(friendship => {
      const friend = friendship.user1Id === req.user!.id ? friendship.user2 : friendship.user1;
      return {
        ...friend,
        friendshipCreatedAt: friendship.createdAt
      };
    });

    res.json({ friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get pending friend requests (received)
export const getFriendRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const requests = await prisma.friendRequest.findMany({
      where: {
        receiverId: req.user.id,
        status: 'PENDING'
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            selectedAvatarId: true,
            isOnline: true,
            lastSeen: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ requests });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get sent friend requests
export const getSentRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const requests = await prisma.friendRequest.findMany({
      where: {
        senderId: req.user.id
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            selectedAvatarId: true,
            isOnline: true,
            lastSeen: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ requests });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search for users to add as friends
export const searchUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { query } = req.body;

    if (!query || query.length < 2) {
      res.status(400).json({ error: 'Search query must be at least 2 characters' });
      return;
    }

    // Find users matching the search query
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: req.user.id } }, // Exclude current user
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        username: true,
        selectedAvatarId: true,
        isOnline: true,
        lastSeen: true
      },
      take: 20 // Limit results
    });

    // Check friendship status for each user
    const userIds = users.map(user => user.id);
    const [existingFriendships, pendingRequests] = await Promise.all([
      prisma.friendship.findMany({
        where: {
          OR: [
            { user1Id: req.user.id, user2Id: { in: userIds } },
            { user2Id: req.user.id, user1Id: { in: userIds } }
          ]
        }
      }),
      prisma.friendRequest.findMany({
        where: {
          OR: [
            { senderId: req.user.id, receiverId: { in: userIds } },
            { receiverId: req.user.id, senderId: { in: userIds } }
          ],
          status: { in: ['PENDING'] }
        }
      })
    ]);

    const friendIds = new Set();
    const pendingRequestIds = new Set();

    existingFriendships.forEach(friendship => {
      const friendId = friendship.user1Id === req.user!.id ? friendship.user2Id : friendship.user1Id;
      friendIds.add(friendId);
    });

    pendingRequests.forEach(request => {
      const targetId = request.senderId === req.user!.id ? request.receiverId : request.senderId;
      pendingRequestIds.add(targetId);
    });

    const usersWithStatus = users.map(user => ({
      ...user,
      relationshipStatus: friendIds.has(user.id) ? 'friend' : 
                         pendingRequestIds.has(user.id) ? 'pending' : 'none'
    }));

    res.json({ users: usersWithStatus });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Send friend request
export const sendFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    if (userId === req.user.id) {
      res.status(400).json({ error: 'Cannot send friend request to yourself' });
      return;
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if already friends
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: req.user.id, user2Id: userId },
          { user1Id: userId, user2Id: req.user.id }
        ]
      }
    });

    if (existingFriendship) {
      res.status(400).json({ error: 'Already friends with this user' });
      return;
    }

    // Check if request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: userId },
          { senderId: userId, receiverId: req.user.id }
        ],
        status: 'PENDING'
      }
    });

    if (existingRequest) {
      res.status(400).json({ error: 'Friend request already exists' });
      return;
    }

    // Create friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: req.user.id,
        receiverId: userId,
        status: 'PENDING'
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            selectedAvatarId: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            selectedAvatarId: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Friend request sent successfully',
      request: friendRequest
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { requestId } = req.params;

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            selectedAvatarId: true
          }
        }
      }
    });

    if (!friendRequest) {
      res.status(404).json({ error: 'Friend request not found' });
      return;
    }

    if (friendRequest.receiverId !== req.user.id) {
      res.status(403).json({ error: 'Not authorized to accept this request' });
      return;
    }

    if (friendRequest.status !== 'PENDING') {
      res.status(400).json({ error: 'Friend request is not pending' });
      return;
    }

    // Create friendship and update request status
    await prisma.$transaction([
      prisma.friendship.create({
        data: {
          user1Id: friendRequest.senderId,
          user2Id: friendRequest.receiverId
        }
      }),
      prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' }
      })
    ]);

    res.json({
      message: 'Friend request accepted successfully',
      friend: friendRequest.sender
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reject friend request
export const rejectFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { requestId } = req.params;

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId }
    });

    if (!friendRequest) {
      res.status(404).json({ error: 'Friend request not found' });
      return;
    }

    if (friendRequest.receiverId !== req.user.id) {
      res.status(403).json({ error: 'Not authorized to reject this request' });
      return;
    }

    if (friendRequest.status !== 'PENDING') {
      res.status(400).json({ error: 'Friend request is not pending' });
      return;
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' }
    });

    res.json({ message: 'Friend request rejected successfully' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove friend
export const removeFriend = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { friendId } = req.params;

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: req.user.id, user2Id: friendId },
          { user1Id: friendId, user2Id: req.user.id }
        ]
      }
    });

    if (!friendship) {
      res.status(404).json({ error: 'Friendship not found' });
      return;
    }

    await prisma.friendship.delete({
      where: { id: friendship.id }
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 