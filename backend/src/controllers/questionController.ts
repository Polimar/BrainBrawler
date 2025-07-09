import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

interface CreateQuestionRequest {
  questionSetId: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  timeLimit?: number;
  points?: number;
  order?: number;
}

interface UpdateQuestionRequest {
  text?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  timeLimit?: number;
  points?: number;
  order?: number;
}

// Create a new question
export const createQuestion = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { 
      questionSetId,
      text, 
      options, 
      correctAnswer, 
      explanation,
      timeLimit = 30,
      points = 100,
      order = 1
    }: CreateQuestionRequest = req.body;

    // Validation
    if (!questionSetId || !text || !options || !correctAnswer) {
      res.status(400).json({ error: 'QuestionSetId, text, options, and correctAnswer are required' });
      return;
    }

    if (!Array.isArray(options) || options.length < 2) {
      res.status(400).json({ error: 'At least 2 options are required' });
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
        options: JSON.stringify(options),
        correctAnswer,
        explanation,
        timeLimit,
        points,
        order,
      },
      select: {
        id: true,
        text: true,
        options: true,
        correctAnswer: true,
        explanation: true,
        timeLimit: true,
        points: true,
        order: true,
      }
    });

    // Parse options for response
    const responseQuestion = {
      ...question,
      options: JSON.parse(question.options as string),
    };

    res.status(201).json({
      message: 'Question created successfully',
      question: responseQuestion
    });

  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get questions with filters and pagination
export const getQuestions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
          timeLimit: true,
          points: true,
          order: true,
          questionSet: {
            select: {
              id: true,
              name: true,
              description: true,
            }
          }
        },
        orderBy: { order: 'asc' },
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
export const getQuestion = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        timeLimit: true,
        points: true,
        order: true,
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
export const updateQuestion = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      timeLimit,
      points,
      order
    }: UpdateQuestionRequest = req.body;

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
    if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer;
    if (explanation !== undefined) updateData.explanation = explanation;
    if (timeLimit !== undefined) updateData.timeLimit = timeLimit;
    if (points !== undefined) updateData.points = points;
    if (order !== undefined) updateData.order = order;

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
        timeLimit: true,
        points: true,
        order: true,
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
export const deleteQuestion = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
export const getRandomQuestions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      orderBy: { order: 'asc' },
      select: {
        id: true,
        text: true,
        options: true,
        correctAnswer: true,
        explanation: true,
        timeLimit: true,
        points: true,
        order: true,
      }
    });

    // Parse options for all questions
    const responseQuestions = questions.map((q: any) => ({
      ...q,
      options: JSON.parse(q.options as string),
    }));

    res.json({ questions: responseQuestions });

  } catch (error) {
    console.error('Get random questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 