import { PrismaClient, Difficulty, AccountType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean up existing data
  console.log('🧹 Cleaning up database...');
  await prisma.friendRequest.deleteMany();
  await prisma.gameParticipant.deleteMany();
  await prisma.game.deleteMany();
  await prisma.question.deleteMany();
  await prisma.questionSet.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Database cleaned');

  // 2. Create Users
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@brainbrawler.com',
      username: 'admin',
      password: hashedPassword,
      accountType: AccountType.ADMIN,
      isEmailVerified: true,
      totalGamesPlayed: 50,
      totalGamesWon: 35,
      totalScore: 8500,
      averageScore: 170,
      coins: 1000,
    },
  });

  const premiumUser = await prisma.user.create({
    data: {
      email: 'premium@brainbrawler.com',
      username: 'premiumuser',
      password: hashedPassword,
      accountType: AccountType.PREMIUM,
      isEmailVerified: true,
      totalGamesPlayed: 25,
      totalGamesWon: 18,
      totalScore: 4200,
      averageScore: 168,
      coins: 500,
      premiumExpiresAt: new Date(new Date().setDate(new Date().getDate() + 30)),
    },
  });
  
  const freeUser1 = await prisma.user.create({
    data: {
      email: 'player1@brainbrawler.com',
      username: 'player1',
      password: hashedPassword,
      accountType: AccountType.FREE,
      isEmailVerified: true,
      totalGamesPlayed: 10,
      totalGamesWon: 6,
      totalScore: 1200,
      averageScore: 120,
      coins: 100,
    },
  });

  const freeUser2 = await prisma.user.create({
    data: {
      email: 'player2@brainbrawler.com',
      username: 'player2',
      password: hashedPassword,
      accountType: AccountType.FREE,
      isEmailVerified: true,
      totalGamesPlayed: 15,
      totalGamesWon: 7,
      totalScore: 1800,
      averageScore: 120,
      coins: 150,
    },
  });

  console.log(`✅ Created 4 users`);

  // 3. Create Question Sets
  console.log('📚 Creating question sets...');
  const scienceSet = await prisma.questionSet.create({
    data: {
      name: 'Amazing Science',
      description: 'Test your knowledge of the natural world!',
      category: 'SCIENCE',
      difficulty: Difficulty.MEDIUM,
      isPublic: true,
      ownerId: adminUser.id,
    },
  });

  const historySet = await prisma.questionSet.create({
    data: {
      name: 'Historical Facts',
      description: 'How well do you know the past?',
      category: 'HISTORY',
      difficulty: Difficulty.EASY,
      isPublic: true,
    },
  });

  const geographySet = await prisma.questionSet.create({
    data: {
      name: 'World Geography',
      description: 'Explore the world from your screen.',
      category: 'GEOGRAPHY',
      difficulty: Difficulty.MEDIUM,
      isPublic: true,
    },
  });
  
  console.log(`✅ Created 3 question sets`);

  // 4. Create Questions for each set
  console.log('❓ Creating questions...');
  await prisma.question.createMany({
    data: [
      // Science Questions
      { questionSetId: scienceSet.id, text: 'What is the chemical symbol for water?', options: { "answers": ['H2O', 'CO2', 'NaCl', 'CH4'] }, correctAnswer: 'H2O', explanation: 'Water is composed of two hydrogen atoms and one oxygen atom.', points: 100, timeLimit: 20, order: 1 },
      { questionSetId: scienceSet.id, text: 'What is the speed of light in vacuum?', options: { "answers": ['299,792,458 m/s', '300,000,000 m/s', '186,282 miles/s'] }, correctAnswer: '299,792,458 m/s', explanation: 'The exact speed of light in vacuum is 299,792,458 meters per second.', points: 150, timeLimit: 25, order: 2 },
      
      // History Questions
      { questionSetId: historySet.id, text: 'In which year did World War II end?', options: { "answers": ['1944', '1945', '1946', '1947'] }, correctAnswer: '1945', explanation: 'World War II ended in 1945 with the surrender of Japan.', points: 100, timeLimit: 20, order: 1 },
      { questionSetId: historySet.id, text: 'Who was the first Roman Emperor?', options: { "answers": ['Julius Caesar', 'Augustus', 'Nero', 'Trajan'] }, correctAnswer: 'Augustus', explanation: 'Augustus (originally Octavian) was the first Roman Emperor.', points: 150, timeLimit: 25, order: 2 },

      // Geography Questions
      { questionSetId: geographySet.id, text: 'What is the capital of Australia?', options: { "answers": ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'] }, correctAnswer: 'Canberra', explanation: 'Canberra is the capital city of Australia.', points: 120, timeLimit: 20, order: 1 },
      { questionSetId: geographySet.id, text: 'Which is the longest river in the world?', options: { "answers": ['Amazon', 'Nile', 'Mississippi', 'Yangtze'] }, correctAnswer: 'Nile', explanation: 'The Nile River is the longest river in the world.', points: 100, timeLimit: 20, order: 2 },
    ]
  });
  console.log('✅ Created 6 questions');

  // 5. Create a Sample Game
  console.log('🎮 Creating a sample game...');
  const game = await prisma.game.create({
    data: {
      code: 'DEMO01',
      creatorId: adminUser.id,
      questionSetId: historySet.id,
      maxPlayers: 4,
      totalQuestions: 2,
      timePerQuestion: 25,
      isPrivate: false,
      participants: {
        create: [
          { userId: adminUser.id, isHost: true },
          { userId: premiumUser.id }
        ]
      }
    },
  });
  console.log(`✅ Created sample game with code: ${game.code}`);
  
  // 6. Create Friend Requests
  console.log('💌 Creating friend requests...');
  await prisma.friendRequest.create({
    data: {
      senderId: freeUser1.id,
      receiverId: freeUser2.id,
    },
  });

  await prisma.friendRequest.create({
    data: {
      senderId: adminUser.id,
      receiverId: premiumUser.id,
      status: 'ACCEPTED'
    }
  });

  // Create the corresponding friendship for the accepted request
  await prisma.friendship.create({
    data: {
      user1Id: adminUser.id,
      user2Id: premiumUser.id,
    }
  });

  console.log('✅ Created 2 friend requests (1 pending, 1 accepted)');

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