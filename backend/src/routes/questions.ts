import express from 'express';
import { 
  createQuestionSet,
  getQuestionSets,
  getQuestionSet,
  updateQuestionSet,
  deleteQuestionSet,
  createQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  getRandomQuestions
} from '../controllers/questionController';
import { authenticateToken, requireAccountType } from '../middleware/auth';

const router = express.Router();

// All question routes require authentication
router.use(authenticateToken);

// Question Set Routes
router.post('/sets', requireAccountType('PREMIUM', 'ADMIN'), createQuestionSet);
router.get('/sets', getQuestionSets);
router.get('/sets/:id', getQuestionSet);
router.put('/sets/:id', updateQuestionSet); // Permission check is done in controller
router.delete('/sets/:id', deleteQuestionSet); // Permission check is done in controller

// Question Routes
router.post('/', createQuestion); // Permission check is done in controller
router.get('/', getQuestions);
router.get('/:questionId', getQuestions);
router.put('/:questionId', updateQuestion); // Permission check is done in controller
router.delete('/:questionId', deleteQuestion); // Permission check is done in controller

export default router; 