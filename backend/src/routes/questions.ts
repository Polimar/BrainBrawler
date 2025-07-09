import express from 'express';
import { 
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  getRandomQuestions
} from '../controllers/questionController';
import { authenticateToken, requireAccountType } from '../middleware/auth';

const router = express.Router();

// All question routes require authentication
router.use(authenticateToken);

// Public routes (for authenticated users)
router.get('/', getQuestions);
router.get('/random', getRandomQuestions);
router.get('/:questionId', getQuestion);

// Routes requiring premium or admin access
router.post('/', requireAccountType('PREMIUM', 'ADMIN'), createQuestion);
router.put('/:questionId', updateQuestion); // Permission check is done in controller
router.delete('/:questionId', deleteQuestion); // Permission check is done in controller

export default router; 