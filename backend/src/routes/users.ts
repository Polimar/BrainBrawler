import express from 'express';
import { 
  updateProfile, 
  changePassword, 
  uploadAvatar, 
  getUserStats, 
  deleteAccount 
} from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// User profile management
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/upload-avatar', uploadAvatar);
router.get('/stats', getUserStats);
router.delete('/account', deleteAccount);

export default router; 