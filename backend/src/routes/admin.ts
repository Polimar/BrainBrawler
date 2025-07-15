import { Router } from 'express';
import { authenticateToken, requireAccountType } from '../middleware/auth';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getSystemStats,
} from '../controllers/adminController';

const router = Router();

// All admin routes require authentication and ADMIN account type
router.use(authenticateToken, requireAccountType('ADMIN'));

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// System statistics
router.get('/stats', getSystemStats);

export default router; 