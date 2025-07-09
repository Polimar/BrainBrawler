import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createCustomQuestionSet,
  getLLMConfigs,
  saveLLMConfig,
  createPremiumGame,
  getPremiumStatus
} from '../controllers/premiumController';

const router = Router();

// All premium routes require authentication
router.use(authenticateToken);

// Premium status
router.get('/status', getPremiumStatus);

// Custom question sets
router.post('/question-sets', createCustomQuestionSet);

// LLM configurations
router.get('/llm-configs', getLLMConfigs);
router.post('/llm-configs', saveLLMConfig);

// Premium games
router.post('/games', createPremiumGame);

export default router; 