import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Import enums directly from Prisma (these will be available after generate)
const { AccountType, GameDifficulty, QuestionCategory } = {
  AccountType: { FREE: 'FREE', PREMIUM: 'PREMIUM', ADMIN: 'ADMIN' } as const,
  GameDifficulty: { EASY: 'EASY', MEDIUM: 'MEDIUM', HARD: 'HARD', EXPERT: 'EXPERT' } as const,
  QuestionCategory: { 
    GENERAL_KNOWLEDGE: 'GENERAL_KNOWLEDGE', 
    SCIENCE: 'SCIENCE', 
    HISTORY: 'HISTORY', 
    GEOGRAPHY: 'GEOGRAPHY', 
    SPORTS: 'SPORTS', 
    ENTERTAINMENT: 'ENTERTAINMENT', 
    LITERATURE: 'LITERATURE', 
    MATHEMATICS: 'MATHEMATICS', 
    TECHNOLOGY: 'TECHNOLOGY', 
    CUSTOM: 'CUSTOM' 
  } as const,
};

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash password for test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@brainbrawler.com',
        username: 'admin',
        displayName: 'Admin User',
        password: hashedPassword,
        accountType: AccountType.ADMIN,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        totalGamesPlayed: 50,
        totalGamesWon: 35,
        totalScore: 8500,
        longestWinStreak: 12,
        currentWinStreak: 3,
        averageResponseTime: 2.5,
      },
    }),
    prisma.user.create({
      data: {
        email: 'premium@brainbrawler.com',
        username: 'premiumuser',
        displayName: 'Premium Player',
        password: hashedPassword,
        accountType: AccountType.PREMIUM,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        totalGamesPlayed: 25,
        totalGamesWon: 18,
        totalScore: 4200,
        longestWinStreak: 8,
        currentWinStreak: 2,
        averageResponseTime: 3.1,
      },
    }),
    prisma.user.create({
      data: {
        email: 'player1@brainbrawler.com',
        username: 'player1',
        displayName: 'Player One',
        password: hashedPassword,
        accountType: AccountType.FREE,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        totalGamesPlayed: 10,
        totalGamesWon: 6,
        totalScore: 1200,
        longestWinStreak: 4,
        currentWinStreak: 1,
        averageResponseTime: 4.2,
      },
    }),
    prisma.user.create({
      data: {
        email: 'player2@brainbrawler.com',
        username: 'player2',
        displayName: 'Player Two',
        password: hashedPassword,
        accountType: AccountType.FREE,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        totalGamesPlayed: 15,
        totalGamesWon: 7,
        totalScore: 1800,
        longestWinStreak: 3,
        currentWinStreak: 0,
        averageResponseTime: 3.8,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} test users`);

  // Create sample questions
  const questions = await Promise.all([
    // Science Questions
    prisma.question.create({
      data: {
        text: 'What is the chemical symbol for water?',
        category: QuestionCategory.SCIENCE,
        difficulty: GameDifficulty.EASY,
        options: ['H2O', 'CO2', 'NaCl', 'CH4'],
        correctAnswer: 'H2O',
        explanation: 'Water is composed of two hydrogen atoms and one oxygen atom.',
      },
    }),
    prisma.question.create({
      data: {
        text: 'What is the speed of light in vacuum?',
        category: QuestionCategory.SCIENCE,
        difficulty: GameDifficulty.MEDIUM,
        options: ['299,792,458 m/s', '300,000,000 m/s', '186,282 miles/s', 'All of the above'],
        correctAnswer: '299,792,458 m/s',
        explanation: 'The exact speed of light in vacuum is 299,792,458 meters per second.',
      },
    }),
    
    // History Questions
    prisma.question.create({
      data: {
        text: 'In which year did World War II end?',
        category: QuestionCategory.HISTORY,
        difficulty: GameDifficulty.EASY,
        options: ['1944', '1945', '1946', '1947'],
        correctAnswer: '1945',
        explanation: 'World War II ended in 1945 with the surrender of Japan.',
      },
    }),
    prisma.question.create({
      data: {
        text: 'Who was the first Roman Emperor?',
        category: QuestionCategory.HISTORY,
        difficulty: GameDifficulty.MEDIUM,
        options: ['Julius Caesar', 'Augustus', 'Nero', 'Trajan'],
        correctAnswer: 'Augustus',
        explanation: 'Augustus (originally Octavian) was the first Roman Emperor, ruling from 27 BC to 14 AD.',
      },
    }),

    // Geography Questions
    prisma.question.create({
      data: {
        text: 'What is the capital of Australia?',
        category: QuestionCategory.GEOGRAPHY,
        difficulty: GameDifficulty.MEDIUM,
        options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
        correctAnswer: 'Canberra',
        explanation: 'Canberra is the capital city of Australia, not Sydney or Melbourne as commonly thought.',
      },
    }),
    prisma.question.create({
      data: {
        text: 'Which is the longest river in the world?',
        category: QuestionCategory.GEOGRAPHY,
        difficulty: GameDifficulty.EASY,
        options: ['Amazon', 'Nile', 'Mississippi', 'Yangtze'],
        correctAnswer: 'Nile',
        explanation: 'The Nile River is approximately 6,650 km long, making it the longest river in the world.',
      },
    }),

    // Mathematics Questions
    prisma.question.create({
      data: {
        text: 'What is the value of π (pi) to 3 decimal places?',
        category: QuestionCategory.MATHEMATICS,
        difficulty: GameDifficulty.EASY,
        options: ['3.141', '3.142', '3.143', '3.144'],
        correctAnswer: '3.142',
        explanation: 'π (pi) is approximately 3.14159, which rounds to 3.142 to 3 decimal places.',
      },
    }),
    prisma.question.create({
      data: {
        text: 'What is the derivative of x²?',
        category: QuestionCategory.MATHEMATICS,
        difficulty: GameDifficulty.HARD,
        options: ['x', '2x', 'x²', '2x²'],
        correctAnswer: '2x',
        explanation: 'Using the power rule: d/dx(x²) = 2x¹ = 2x',
      },
    }),

    // Technology Questions
    prisma.question.create({
      data: {
        text: 'What does "HTTP" stand for?',
        category: QuestionCategory.TECHNOLOGY,
        difficulty: GameDifficulty.EASY,
        options: ['HyperText Transfer Protocol', 'High Tech Transfer Process', 'Host Transfer Text Protocol', 'Hyperlink Text Transfer Program'],
        correctAnswer: 'HyperText Transfer Protocol',
        explanation: 'HTTP stands for HyperText Transfer Protocol, the foundation of data communication on the web.',
      },
    }),
    prisma.question.create({
      data: {
        text: 'Which programming language was created by Guido van Rossum?',
        category: QuestionCategory.TECHNOLOGY,
        difficulty: GameDifficulty.MEDIUM,
        options: ['Java', 'Python', 'JavaScript', 'C++'],
        correctAnswer: 'Python',
        explanation: 'Python was created by Guido van Rossum and first released in 1991.',
      },
    }),
  ]);

  console.log(`✅ Created ${questions.length} sample questions`);

  // Create a sample game
  const game = await prisma.game.create({
    data: {
      roomCode: 'DEMO01',
      title: 'Demo Game',
      description: 'A sample game for testing',
      creatorId: users[0].id,
      maxPlayers: 4,
      difficulty: GameDifficulty.MEDIUM,
      category: QuestionCategory.GENERAL_KNOWLEDGE,
      questionsCount: 5,
      timePerQuestion: 30,
      isPrivate: false,
    },
  });

  console.log(`✅ Created sample game: ${game.title}`);

  // Add participants to the game
  await Promise.all([
    prisma.gameParticipant.create({
      data: {
        gameId: game.id,
        userId: users[0].id,
        score: 0,
      },
    }),
    prisma.gameParticipant.create({
      data: {
        gameId: game.id,
        userId: users[1].id,
        score: 0,
      },
    }),
  ]);

  console.log('✅ Added participants to sample game');

  // Create friend requests
  await prisma.friendRequest.create({
    data: {
      requesterId: users[2].id,
      receiverId: users[3].id,
      message: 'Let\'s play together!',
    },
  });

  console.log('✅ Created sample friend request');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 