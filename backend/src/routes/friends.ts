import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getFriends,
  getFriendRequests,
  getSentRequests,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend
} from '../controllers/friendController';

const router = Router();

// All friend routes require authentication
router.use(authenticateToken);

// Get user's friends
router.get('/', getFriends);

// Get pending friend requests (received)
router.get('/requests', getFriendRequests);

// Get sent friend requests
router.get('/sent-requests', getSentRequests);

// Search for users
router.post('/search', searchUsers);

// Send friend request
router.post('/request', sendFriendRequest);

// Accept friend request
router.post('/accept/:requestId', acceptFriendRequest);

// Reject friend request
router.post('/reject/:requestId', rejectFriendRequest);

// Remove friend
router.delete('/:friendId', removeFriend);

export default router; 