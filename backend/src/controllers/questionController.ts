import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

// ============================================
// Question Set Management
// ============================================

export const createQuestionSet = async (req: AuthenticatedRequest<any, any, any>, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });

  const { name, description, category, difficulty, isPublic, isPremium } = req.body;
  if (!name || !category || !difficulty) {
    return res.status(400).json({ error: 'Name, category, and difficulty are required.' });
  }

  try {
    const questionSet = await prisma.questionSet.create({
      data: {
        name,
        description,
        category,
        difficulty,
        isPublic,
        isPremium,
        ownerId: req.user.id,
      },
    });
    res.status(201).json(questionSet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create question set' });
  }
};

export const getQuestionSets = async (req: AuthenticatedRequest<any, any, any>, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });

  try {
    const questionSets = await prisma.questionSet.findMany({
      where: {
        OR: [
          { isPublic: true },
          { ownerId: req.user.id },
        ],
      },
      include: {
        _count: {
          select: { questions: true },
        },
        owner: {
          select: { username: true }
        }
      },
    });
    res.json(questionSets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve question sets' });
  }
};

export const getQuestionSet = async (req: AuthenticatedRequest<any, any, any>, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });

  const { id } = req.params;
  try {
    const questionSet = await prisma.questionSet.findFirst({
      where: { id, OR: [{ isPublic: true }, { ownerId: req.user.id }] },
      include: {
        questions: true, // No longer ordering by 'order'
        owner: { select: { username: true } }
      },
    });

    if (!questionSet) {
      return res.status(404).json({ error: 'Question set not found or access denied' });
    }
    res.json(questionSet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve question set' });
  }
};

export const updateQuestionSet = async (req: AuthenticatedRequest<any, any, any>, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });

  const { id } = req.params;
  const { name, description, category, difficulty, isPublic } = req.body;

  try {
    const questionSet = await prisma.questionSet.findUnique({
      where: { id },
    });

    if (!questionSet || questionSet.ownerId !== req.user.id) {
      return res.status(404).json({ error: 'Question set not found or you are not the owner' });
    }

    const updatedQuestionSet = await prisma.questionSet.update({
      where: { id },
      data: { name, description, category, difficulty, isPublic },
    });
    res.json(updatedQuestionSet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update question set' });
  }
};

export const deleteQuestionSet = async (req: AuthenticatedRequest<any, any, any>, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  
  const { id } = req.params;
  try {
    const questionSet = await prisma.questionSet.findUnique({
      where: { id },
    });

    if (!questionSet || questionSet.ownerId !== req.user.id) {
      return res.status(404).json({ error: 'Question set not found or you are not the owner' });
    }
    
    await prisma.questionSet.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete question set' });
  }
};


// ============================================
// Question Management within a Set
// ============================================

// Create a new question
export const createQuestion = async (req: AuthenticatedRequest<any, any, any>, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { questionSetId, text, options, correctAnswer, explanation, difficulty, category } = req.body;

    if (!questionSetId || !text || !options || correctAnswer === undefined || !difficulty || !category) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    // Check if question set exists
    const questionSet = await prisma.questionSet.findUnique({
      where: { id: questionSetId }
    });

    if (!questionSet) {
      res.status(404).json({ error: 'Question set not found' });
      return;
    }

    // Create question
    const question = await prisma.question.create({
      data: {
        questionSetId,
        text,
        options,
        correctAnswer: parseInt(correctAnswer, 10),
        explanation,
        difficulty,
        category,
      },
    });

    res.status(201).json({ message: 'Question created successfully', question });

  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get questions with filters and pagination
export const getQuestions = async (req: AuthenticatedRequest<any, any, any>, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { 
      page = 1, 
      limit = 10, 
      questionSetId,
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    if (pageNum < 1 || limitNum < 1 || limitNum > 50) {
      res.status(400).json({ error: 'Invalid pagination parameters' });
      return;
    }

    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (questionSetId) {
      where.questionSetId = questionSetId;
    }

    if (search) {
      where.text = {
        contains: search as string,
        mode: 'insensitive'
      };
    }

    // Get questions and total count
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        select: {
          id: true,
          text: true,
          options: true,
          correctAnswer: true,
          explanation: true,
          difficulty: true,
          category: true,
          questionSet: {
            select: {
              id: true,
              name: true,
              description: true,
            }
          }
        },
        skip,
        take: limitNum,
      }),
      prisma.question.count({ where })
    ]);

    // Parse options for all questions
    const responseQuestions = questions.map((q: any) => ({
      ...q,
      options: JSON.parse(q.options as string),
    }));

    res.json({
      questions: responseQuestions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      }
    });

  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a specific question by ID
export const getQuestion = async (req: AuthenticatedRequest<any, any, any>, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { questionId } = req.params;

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        text: true,
        options: true,
        correctAnswer: true,
        explanation: true,
        difficulty: true,
        category: true,
        questionSet: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        }
      }
    });

    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    // Parse options for response
    const responseQuestion: any = {
      ...question,
      options: JSON.parse(question.options as string),
    };

    res.json({ question: responseQuestion });

  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a question
export const updateQuestion = async (req: AuthenticatedRequest<any, any, any>, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { questionId } = req.params;
    const { 
      text, 
      options, 
      correctAnswer, 
      explanation,
      difficulty,
      category
    } = req.body;

    // Check if question exists
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: { questionSet: true }
    });

    if (!existingQuestion) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    // Prepare update data
    const updateData: any = {};
    if (text !== undefined) updateData.text = text;
    if (options !== undefined) {
      if (!Array.isArray(options) || options.length < 2) {
        res.status(400).json({ error: 'At least 2 options are required' });
        return;
      }
      updateData.options = JSON.stringify(options);
    }
    if (correctAnswer !== undefined) updateData.correctAnswer = parseInt(correctAnswer, 10);
    if (explanation !== undefined) updateData.explanation = explanation;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (category !== undefined) updateData.category = category;

    // Update question
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: updateData,
      select: {
        id: true,
        text: true,
        options: true,
        correctAnswer: true,
        explanation: true,
        difficulty: true,
        category: true,
      }
    });

    // Parse options for response
    const responseQuestion = {
      ...updatedQuestion,
      options: JSON.parse(updatedQuestion.options as string),
    };

    res.json({
      message: 'Question updated successfully',
      question: responseQuestion
    });

  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a question
export const deleteQuestion = async (req: AuthenticatedRequest<any, any, any>, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { questionId } = req.params;

    // Check if question exists
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: { questionSet: true }
    });

    if (!existingQuestion) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    // Delete question
    await prisma.question.delete({
      where: { id: questionId }
    });

    res.json({ message: 'Question deleted successfully' });

  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get random questions (for game creation)
export const getRandomQuestions = async (req: AuthenticatedRequest<any, any, any>, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { questionSetId, count = 10 } = req.query;
    const questionCount = parseInt(count as string);

    if (questionCount < 1 || questionCount > 50) {
      res.status(400).json({ error: 'Question count must be between 1 and 50' });
      return;
    }

    if (!questionSetId) {
      res.status(400).json({ error: 'Question set ID is required' });
      return;
    }

    // Get random questions from the question set
    const questions = await prisma.question.findMany({
      where: { questionSetId: questionSetId as string },
      take: questionCount,
      // orderBy removed, randomness will be handled by shuffling the result array
    });

    // Simple shuffle implementation
    const shuffled = questions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, questionCount);

    // Parse options for all questions
    const responseQuestions = selected.map((q: any) => ({
      ...q,
      options: JSON.parse(q.options as string),
    }));

    res.json({ questions: responseQuestions });

  } catch (error) {
    console.error('Get random questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 

// The uploadQuestionSet function has been removed. 